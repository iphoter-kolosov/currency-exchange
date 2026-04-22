/** Per-user serial lock: back-to-back calls for the same user run one at a
 * time. Different users still run in parallel. Lives in memory, so it
 * doesn't survive an isolate restart — which is fine for the use case:
 * within a single isolate's lifetime we never want two answers to the
 * same user racing each other. */
const userLocks = new Map<number, Promise<unknown>>();

export async function withUserLock<T>(userId: number, fn: () => Promise<T>): Promise<T> {
  const prev = userLocks.get(userId) ?? Promise.resolve();
  const current = prev.then(() => fn(), () => fn());
  userLocks.set(userId, current);
  try {
    return await current;
  } finally {
    if (userLocks.get(userId) === current) {
      userLocks.delete(userId);
    }
  }
}

/** Global concurrency cap for outbound LLM calls. Keeps us below the
 * free-tier Pollinations per-IP limit so bursts degrade into queued
 * waits instead of 429s. */
const MAX_LLM_CONCURRENCY = 3;
let activeCalls = 0;
const waiters: Array<() => void> = [];

export async function withLlmSemaphore<T>(fn: () => Promise<T>): Promise<T> {
  while (activeCalls >= MAX_LLM_CONCURRENCY) {
    await new Promise<void>((r) => waiters.push(r));
  }
  activeCalls++;
  try {
    return await fn();
  } finally {
    activeCalls--;
    const next = waiters.shift();
    if (next) next();
  }
}
