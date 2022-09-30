package com.codigomorsa.orders;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.codigomorsa.orders.dto.OrderPayload;
import com.google.gson.Gson;

import java.util.Collections;

public class Order implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private static final Gson gson = new Gson();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        OrderPayload order = getParams(input.getBody());

        System.out.println("The products: " + order.products.toString());
        System.out.println("The price: " + order.price);

        return new APIGatewayProxyResponseEvent()
                .withStatusCode(200)
                .withHeaders(Collections.emptyMap())
                .withBody("received");
    }

    private OrderPayload getParams(String body) {
        return gson.fromJson(body, OrderPayload.class);
    }
}
