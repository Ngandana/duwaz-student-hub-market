package org.example.duwaz.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Returns the full exception message + root cause in every 500 response.
 * This makes debugging much easier — the real error is visible in the browser console.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception ex) {
        // Walk the cause chain to get the deepest root cause
        Throwable root = ex;
        while (root.getCause() != null) {
            root = root.getCause();
        }

        // Print full stack trace to the Spring Boot console
        ex.printStackTrace();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", 500);
        body.put("error", "Internal Server Error");
        body.put("exception", ex.getClass().getSimpleName());
        body.put("message", ex.getMessage());
        body.put("rootCause", root.getClass().getSimpleName() + ": " + root.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
