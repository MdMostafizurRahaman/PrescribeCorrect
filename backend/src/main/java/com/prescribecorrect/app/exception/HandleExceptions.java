package com.prescribecorrect.app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;

@ControllerAdvice
public class HandleExceptions {
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Response> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new Response(ex.getMessage()));
    }


    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Response> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new Response(ex.getMessage()));
    }

    @ExceptionHandler(SQLException.class)
    public ResponseEntity<Response> handleSQLException(SQLException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new Response(ex.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Response> handleNotFoundException(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new Response(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        return ResponseEntity.badRequest().body("Validation failed: " + ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<String> handleParsingExceptions(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body("JSON parsing failed: " + ex.getMessage());
    }

    @ExceptionHandler(CustomError.class)
    public ResponseEntity<Response> handleCustomException(CustomError ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new Response(ex.getMessage()));
    }
}
