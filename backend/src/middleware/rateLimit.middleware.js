// Limits failed login attempts to slow down password-guessing (brute-force) attacks.
// After MAX_FAILURES wrong passwords for the same email from the same IP within WINDOW_MS,
// further attempts are blocked with 429 until the window expires.
// In-memory storage is enough for a single server; a shared store (e.g. Redis) would be
// needed when running several servers.
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const failures = new Map(); // key -> { count, firstAt }

const keyFor = (req) => `${req.ip}|${String(req.body?.email || "").trim().toLowerCase()}`;

function current(key) {
  const entry = failures.get(key);
  if (entry && Date.now() - entry.firstAt > WINDOW_MS) {
    failures.delete(key);
    return null;
  }
  return entry;
}

export function loginRateLimit(req, res, next) {
  const entry = current(keyFor(req));
  if (entry && entry.count >= MAX_FAILURES) {
    const minutes = Math.ceil((WINDOW_MS - (Date.now() - entry.firstAt)) / 60000);
    return res.status(429).json({
      message: `Too many failed login attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    });
  }
  next();
}

export function recordFailedLogin(req) {
  const key = keyFor(req);
  const entry = current(key);
  if (entry) entry.count += 1;
  else failures.set(key, { count: 1, firstAt: Date.now() });
}

export function clearFailedLogins(req) {
  failures.delete(keyFor(req));
}

// Used by automated tests to start each test with a clean state.
export function resetLoginLimiter() {
  failures.clear();
}
