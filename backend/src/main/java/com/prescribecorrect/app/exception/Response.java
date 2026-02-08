package com.prescribecorrect.app.exception;


import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class Response {
    private String message;
    private LocalDateTime timestamp;

    public Response(String message) {
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }
}
