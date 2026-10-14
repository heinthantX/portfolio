import { describe, expect, it } from "vitest";
import { createRateLimiter, DEFAULT_LIMIT, DEFAULT_WINDOW_MS, rateLimiter } from "./rate-limit";

describe("rate-limiter", () => {
  it("allows 3 submissions then blocks on the 4th submission", () => {
    const currentTime = 1000;
    const limiter = createRateLimiter({
      limit: 3,
      windowMs: 600_000,
      now: () => currentTime,
    });

    const ip = "192.168.1.100";

    // 1st request
    const res1 = limiter.check(ip);
    expect(res1.allowed).toBe(true);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);
    expect(res1.retryAfterSec).toBe(0);

    // 2nd request
    const res2 = limiter.check(ip);
    expect(res2.allowed).toBe(true);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    // 3rd request
    const res3 = limiter.check(ip);
    expect(res3.allowed).toBe(true);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th request (limit reached)
    const res4 = limiter.check(ip);
    expect(res4.allowed).toBe(false);
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.retryAfterSec).toBe(600); // 600 seconds remaining
  });

  it("resets after the window has expired", () => {
    let currentTime = 1000;
    const windowMs = 600_000;
    const limiter = createRateLimiter({
      limit: 3,
      windowMs,
      now: () => currentTime,
    });

    const ip = "10.0.0.1";

    // Exhaust 3 submissions
    limiter.check(ip);
    limiter.check(ip);
    limiter.check(ip);

    // Blocked
    const blocked = limiter.check(ip);
    expect(blocked.allowed).toBe(false);

    // Advance time past the 10-minute window
    currentTime += windowMs + 1;

    // Window has reset: request is allowed again
    const resetRes = limiter.check(ip);
    expect(resetRes.allowed).toBe(true);
    expect(resetRes.success).toBe(true);
    expect(resetRes.remaining).toBe(2);
  });

  it("calculates accurate retryAfterSec as time advances within the window", () => {
    let currentTime = 10_000;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 60_000, // 60 seconds
      now: () => currentTime,
    });

    const ip = "172.16.0.5";

    // 1st request allowed
    expect(limiter.check(ip).allowed).toBe(true);

    // Advance 20 seconds (40 seconds remaining)
    currentTime += 20_000;
    const blocked1 = limiter.check(ip);
    expect(blocked1.allowed).toBe(false);
    expect(blocked1.retryAfterSec).toBe(40);

    // Advance another 30 seconds (10 seconds remaining)
    currentTime += 30_000;
    const blocked2 = limiter.check(ip);
    expect(blocked2.allowed).toBe(false);
    expect(blocked2.retryAfterSec).toBe(10);
  });

  it("tracks different IPs independently", () => {
    const currentTime = 1000;
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 600_000,
      now: () => currentTime,
    });

    const ipA = "1.1.1.1";
    const ipB = "2.2.2.2";

    limiter.check(ipA);
    limiter.check(ipA);
    expect(limiter.check(ipA).allowed).toBe(false);

    // ipB has not submitted yet
    const resB1 = limiter.check(ipB);
    expect(resB1.allowed).toBe(true);
    expect(resB1.remaining).toBe(1);
  });

  it("allows manual store reset via reset()", () => {
    const limiter = createRateLimiter({ limit: 1 });
    const ip = "127.0.0.1";

    limiter.check(ip);
    expect(limiter.check(ip).allowed).toBe(false);

    limiter.reset();
    expect(limiter.check(ip).allowed).toBe(true);
  });

  it("exports default constants and instance", () => {
    expect(DEFAULT_LIMIT).toBe(3);
    expect(DEFAULT_WINDOW_MS).toBe(600_000);
    expect(typeof rateLimiter.check).toBe("function");
    expect(typeof rateLimiter.reset).toBe("function");
  });

  it("createRateLimiter allows 3 then blocks and resets after the window", () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({
      limit: 3,
      windowMs: DEFAULT_WINDOW_MS,
      now: () => now,
    });
    const ip = "192.168.1.100";

    expect(limiter.check(ip).allowed).toBe(true);
    now += 1000;
    expect(limiter.check(ip).allowed).toBe(true);
    now += 1000;
    expect(limiter.check(ip).allowed).toBe(true);

    now += 1000;
    const fourth = limiter.check(ip);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);

    now += DEFAULT_WINDOW_MS;
    const afterWindow = limiter.check(ip);
    expect(afterWindow.allowed).toBe(true);
  });

  it("caps the store: sweeps expired entries, then evicts oldest", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 3, now: () => now });
    limiter.check("a");
    limiter.check("b");
    limiter.check("c");
    // Cap reached with all live: oldest ("a") is evicted, so it gets a fresh window.
    limiter.check("d");
    expect(limiter.check("a").allowed).toBe(true);
    // "c" is still tracked (blocked): only the oldest entries were evicted.
    expect(limiter.check("c").allowed).toBe(false);
    // After expiry the sweep clears stale keys instead of evicting live ones.
    now += 2000;
    limiter.check("e");
    expect(limiter.check("e").allowed).toBe(false);
  });
});
