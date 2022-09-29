import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfn_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class CdkStepFunctionOrdersStack extends Stack {
  private createOrderLambda: lambda.Function;
  private cancelOrderLambda: lambda.Function;
  private confirmOrderLambda: lambda.Function;

  private sagaLambda: lambda.Function;

  private saga: sfn.StateMachine;

  private lambdaRuntime = lambda.Runtime.JAVA_11;
  private lambdaMemory = 1024;
  private lambdaTimeout = Duration.seconds(10);

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.sagaStepFunction();
    this.backend();
  }

  private sagaStepFunction() {
    const orderFailed = new sfn.Fail(this, "No se pudo crear la orden");
    const orderSucceeded = new sfn.Succeed(this, "Se ha creado la orden");
    const wait = new sfn.Wait(this, "Wait", {
      time: sfn.WaitTime.duration(Duration.minutes(1))
    });

    const cancelOrder = new sfn_tasks.LambdaInvoke(this, 'CancelOrder', {
      lambdaFunction: this.cancelOrderLambda,
      resultPath: '$.CancelOrderResult'
    })
        .addRetry({maxAttempts: 3})
        .next(orderFailed);

    const createOrder = new sfn_tasks.LambdaInvoke(this, 'CreateOrder', {
      lambdaFunction: this.createOrderLambda,
      resultPath: '$.CreateOrderResult'
    }).addCatch(cancelOrder, {
      resultPath: '$.CreateOrderError'
    });

    const confirmOrder = new sfn_tasks.LambdaInvoke(this, 'ConfirmOrder', {
      lambdaFunction: this.confirmOrderLambda,
      resultPath: '$.ConfirmOrderResult'
    }).addRetry({
      maxAttempts: 2,
      interval: Duration.minutes(1)
    }).addCatch(cancelOrder, {
      resultPath: '$.ConfirmOrderError'
    });

    const definition = sfn.Chain
        .start(createOrder)
        .next(wait)
        .next(confirmOrder)
        .next(orderSucceeded);

    this.saga = new sfn.StateMachine(this, 'OrderSaga', {
      definition,
      timeout: Duration.minutes(5)
    });

    this.sagaLambda = new lambda.Function(this, "SagaLambda", {
      runtime: this.lambdaRuntime,
      handler: "com.codigomorsa.app.Order::OnEvent",
      code: lambda.Code.fromAsset('./orders/build/libs/app-1.0-SNAPSHOT-all.jar'),
      memorySize: this.lambdaMemory,
      timeout: this.lambdaTimeout
    });

    this.saga.grantExecution(this.sagaLambda);
  }

  private backend() {
    new apigw.LambdaRestApi(this, "SagaLambdaApi", {
      handler: this.sagaLambda
    });
  }
}
