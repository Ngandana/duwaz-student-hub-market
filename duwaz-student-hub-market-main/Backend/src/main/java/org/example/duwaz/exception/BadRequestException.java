package org.example.duwaz.exception;

/** A request the client can fix by changing its input — maps to HTTP 400. */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
