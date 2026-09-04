/**
 * Fixed-window rate limiting, in process memory.
 *
 * The previous route had no limiter at all and slept 1500 ms on every request to
 * simulate "AI thinking", which made a trivial denial-of-service: a few hundred
 * concurrent requests would exhaust the server holding open timers that did no
 * work. The artificial delay is gone and requests are now capped per client.
 *
 * This is deliberately a single-instance limiter. It is correct for one Node
 * process and is the right amount of machinery for the current stage; when the
 * app runs on more than one instance this must move to Redis or Vercel KV, and
 * the interface here is shaped so that swap touches only this file.
 */

interface Window {
  count: number
  resetAt: number
}

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
/** Guards against unbounded growth if the process sees many distinct clients. */
const MAX_TRACKED_CLIENTS = 10_000

const windows = new Map<string, Window>()

function sweep(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  /** Seconds until the current window resets. */
  retryAfter: number
}

export function checkRateLimit(clientKey: string, limit = MAX_REQUESTS_PER_WINDOW): RateLimitResult {
  const now = Date.now()
  if (windows.size > MAX_TRACKED_CLIENTS) sweep(now)

  const existing = windows.get(clientKey)
  if (!existing || existing.resetAt <= now) {
    windows.set(clientKey, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }

  existing.count += 1
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfter }
  }
  return { ok: true, remaining: limit - existing.count, retryAfter }
}

/**
 * Derives a client key from proxy headers.
 *
 * `x-forwarded-for` is client-controlled unless a trusted proxy overwrites it,
 * so this is a fair-use control, not a security boundary. Anything that needs a
 * real identity must use an authenticated account id instead.
 */
export function clientKeyFrom(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}
