package com.codigomorsa.orders;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.codigomorsa.orders.dto.OrderPayload;
import com.google.gson.Gson;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sfn.SfnClient;
import software.amazon.awssdk.services.sfn.model.SfnException;
import software.amazon.awssdk.services.sfn.model.StartExecutionRequest;

import java.util.Collections;

public class Order implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private static final Gson gson = new Gson();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        OrderPayload order = getParams(input.getBody());

        System.out.println("The products: " + order.products.toString());
        System.out.println("The price: " + order.price);

        String sfnExecutionArn;

        try {
            sfnExecutionArn = executeStateMachine(order);
        } catch (SfnException e) {
            System.out.println("Sfn failed");
            System.out.println(e.getMessage());

            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(500)
                    .withHeaders(Collections.emptyMap())
                    .withBody("Something failed, try again later.");
        }

        return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withHeaders(Collections.emptyMap())
                .withBody("received: " + sfnExecutionArn);
    }

    private OrderPayload getParams(String body) {
        return gson.fromJson(body, OrderPayload.class);
    }

    private String executeStateMachine(OrderPayload order) throws SfnException {
        SfnClient sfnClient = SfnClient.builder()
                .region(Region.US_EAST_1)
                .build();

        var executionRequest = StartExecutionRequest.builder()
                .input(gson.toJson(order))
                .stateMachineArn(System.getenv("SFN_ARN"))
                .build();

        var response = sfnClient.startExecution(executionRequest);
        return response.executionArn();
    }
}
