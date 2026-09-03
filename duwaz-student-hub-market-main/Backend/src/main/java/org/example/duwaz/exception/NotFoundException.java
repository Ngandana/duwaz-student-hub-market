package org.example.duwaz.exception;

/** A referenced resource doesn't exist — maps to HTTP 404. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
