/**
 * Login Rate Limiting Middleware (Sliding Window / Token Bucket)
 * Mitigates OWASP A07:2021 – Identification and Authentication Failures (Brute-force / Credential Stuffing)
 */

interface RateLimitRecord {
    attempts: number;
    firstAttemptTime: number;
    lockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

// Clean up stale rate-limiting entries periodically every 10 minutes
if (typeof setInterval !== "undefined") {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of loginAttempts.entries()) {
            if (record.lockedUntil && record.lockedUntil < now) {
                loginAttempts.delete(key);
            } else if (!record.lockedUntil && now - record.firstAttemptTime > 15 * 60 * 1000) {
                loginAttempts.delete(key);
            }
        }
    }, 10 * 60 * 1000);
}

/**
 * Checks if a specific key (e.g. IP + email) has exceeded rate limits.
 * Default: Max 5 failed attempts per 15-minute window.
 */
export function checkLoginRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000, lockoutMs = 15 * 60 * 1000): {
    isAllowed: boolean;
    remainingAttempts: number;
    retryAfterSeconds?: number;
} {
    const now = Date.now();
    const record = loginAttempts.get(key);

    if (!record) {
        return { isAllowed: true, remainingAttempts: maxAttempts };
    }

    if (record.lockedUntil && record.lockedUntil > now) {
        const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return { isAllowed: false, remainingAttempts: 0, retryAfterSeconds };
    }

    // Reset window if expired
    if (now - record.firstAttemptTime > windowMs) {
        loginAttempts.delete(key);
        return { isAllowed: true, remainingAttempts: maxAttempts };
    }

    const remainingAttempts = Math.max(0, maxAttempts - record.attempts);
    if (remainingAttempts === 0) {
        record.lockedUntil = now + lockoutMs;
        return { isAllowed: false, remainingAttempts: 0, retryAfterSeconds: Math.ceil(lockoutMs / 1000) };
    }

    return { isAllowed: true, remainingAttempts };
}

/**
 * Record a failed login attempt for a specific key.
 */
export function recordFailedLogin(key: string, lockoutMs = 15 * 60 * 1000): void {
    const now = Date.now();
    const record = loginAttempts.get(key);

    if (!record) {
        loginAttempts.set(key, {
            attempts: 1,
            firstAttemptTime: now,
        });
        return;
    }

    record.attempts += 1;
    if (record.attempts >= 5) {
        record.lockedUntil = now + lockoutMs;
    }
}

/**
 * Clear attempts on successful authentication.
 */
export function resetLoginRateLimit(key: string): void {
    loginAttempts.delete(key);
}
