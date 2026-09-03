package org.example.duwaz.config;

import org.example.duwaz.exception.BadRequestException;
import org.example.duwaz.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Central error handling.
 *
 * The full stack trace always goes to the server console (for debugging), but what's
 * sent back to the client is deliberately minimal unless app.expose-error-details=true
 * (leave that off in any environment reachable by real users — it otherwise leaks
 * internal exception types, messages and DB details to anyone who can trigger a 500).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @Value("${app.expose-error-details:false}")
    private boolean exposeErrorDetails;

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(BadRequestException ex) {
        return build(HttpStatus.BAD_REQUEST, ex);
    }

    /**
     * Most "not found" cases in this codebase are raised as a plain RuntimeException
     * with a "... not found ..." message (see the various service classes). Map those
     * to a real 404 instead of a 500 so the frontend can tell "missing" apart from
     * "server broke".
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        String message = ex.getMessage();
        if (message != null && message.toLowerCase().contains("not found")) {
            ex.printStackTrace();
            return build(HttpStatus.NOT_FOUND, ex);
        }
        return handleAll(ex);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", 400);
        body.put("error", "Validation Failed");
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                fieldErrors.put(fe.getField(), fe.getDefaultMessage()));
        body.put("fields", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAll(Exception ex) {
        // Full detail always goes to the server console — this is what you should be
        // debugging from, not the HTTP response.
        ex.printStackTrace();
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ex);
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, Exception ex) {
        Throwable root = ex;
        while (root.getCause() != null) {
            root = root.getCause();
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());

        if (exposeErrorDetails) {
            body.put("exception", ex.getClass().getSimpleName());
            body.put("message", ex.getMessage());
            body.put("rootCause", root.getClass().getSimpleName() + ": " + root.getMessage());
        } else {
            // Still safe to surface for 404/400s — these are "X not found" / "Y is invalid"
            // messages meant for the caller, nothing internal.
            boolean clientFacing = status == HttpStatus.NOT_FOUND || status == HttpStatus.BAD_REQUEST;
            body.put("message", clientFacing ? ex.getMessage() : "Something went wrong. Please try again.");
        }

        return ResponseEntity.status(status).body(body);
    }
}
