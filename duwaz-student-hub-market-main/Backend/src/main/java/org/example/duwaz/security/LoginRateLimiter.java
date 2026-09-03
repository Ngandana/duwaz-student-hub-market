package org.example.duwaz.security;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory fixed-window rate limiter for login attempts.
 *
 * This is intentionally lightweight (single JVM instance, no Redis) — fine for this
 * app's current scale. If this ever runs behind multiple instances, swap for a shared
 * store (Redis/Bucket4j) since each instance would otherwise track attempts separately.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MILLIS = 5 * 60 * 1000; // 5 minutes

    private static class Window {
        volatile long windowStart = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(0);
    }

    private final ConcurrentHashMap<String, Window> attempts = new ConcurrentHashMap<>();

    /** Returns true if the given key (e.g. "ip:email") is still within the allowed rate. */
    public boolean allow(String key) {
        Window w = attempts.computeIfAbsent(key, k -> new Window());
        synchronized (w) {
            long now = System.currentTimeMillis();
            if (now - w.windowStart > WINDOW_MILLIS) {
                w.windowStart = now;
                w.count.set(0);
            }
            return w.count.incrementAndGet() <= MAX_ATTEMPTS;
        }
    }

    /** Call on a successful login to forgive prior failed attempts for this key. */
    public void reset(String key) {
        attempts.remove(key);
    }
}
