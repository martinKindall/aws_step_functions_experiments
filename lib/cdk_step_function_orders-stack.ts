import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfn_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class CdkStepFunctionOrdersStack extends Stack {
  private createOrderLambda: lambda.Function;
  private cancelOrderLambda: lambda.Function;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.sagaStepFunction();
  }

  private sagaStepFunction() {
    const orderFailed = new sfn.Fail(this, "No se pudo crear la orden");
    const orderSucceeded = new sfn.Succeed(this, "Se ha creado la orden");

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

    const definition = sfn.Chain
        .start(createOrder)
        .next(orderSucceeded);

    const saga = new sfn.StateMachine(this, 'OrderSaga', {
      definition,
      timeout: Duration.minutes(5)
    });
  }
}
