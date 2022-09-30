package com.codigomorsa.orders;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;

import java.util.Map;

public class ConfirmOrder implements RequestHandler<Map<String, Object>, Map<String, Object>> {

    @Override
    public Map<String, Object> handleRequest(Map<String, Object> event, Context context) {
        System.out.println("ConfirmOrder");

        if ((boolean) event.get("fail")) {
            throw new IllegalArgumentException("Failing on purpouse");
        }

        return Map.of("status", "ok");
    }
}
