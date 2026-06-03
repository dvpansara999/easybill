import { consoleSyncLogger } from "./workspaceSecurity";
import { createLocalStorageSyncRetryQueue } from "./syncRetryQueue";
export function createSupabaseSyncRepository(repository) {
    return repository;
}
export function createSyncService({ cache, repository, validators = {}, auth, clock = () => Date.now(), logger = consoleSyncLogger, debounceMs = 600, maxRetries = 2, retryQueue = createLocalStorageSyncRetryQueue(), }) {
    const timers = new Map();
    function timerId(userId, key) {
        return `${userId}:${key}`;
    }
    function getRawValue(key, explicitRawValue) {
        if (explicitRawValue != null)
            return explicitRawValue;
        return cache.get(key) || "";
    }
    function validateOrThrow(key, rawValue) {
        const result = validators.validatePush?.(key, rawValue);
        if (result && !result.ok) {
            throw new Error(result.message || `Invalid ${key} payload.`);
        }
    }
    async function runWithRetry(callback, details) {
        let attempt = 0;
        while (true) {
            try {
                await callback();
                return;
            }
            catch (error) {
                attempt += 1;
                if (attempt > maxRetries)
                    throw error;
                logger.warn("Workspace sync retrying", { ...details, attempt, error: String(error), at: clock() });
            }
        }
    }
    function enqueueFailure(params) {
        retryQueue.enqueue({
            userId: params.userId,
            key: params.key,
            operation: params.operation,
            rawValue: params.rawValue,
            lastError: String(params.error),
        });
    }
    function resetTimer(userId, key, operation, rawValue, callback) {
        const id = timerId(userId, key);
        const existing = timers.get(id);
        if (existing)
            clearTimeout(existing);
        timers.set(id, setTimeout(() => {
            timers.delete(id);
            void runWithRetry(callback, { userId, key }).catch((error) => {
                enqueueFailure({ userId, key, operation, rawValue, error });
                logger.error("Workspace sync failed", { key, userId, error: String(error), at: clock() });
            });
        }, debounceMs));
    }
    async function push(userId, key, explicitRawValue) {
        const rawValue = getRawValue(key, explicitRawValue);
        validateOrThrow(key, rawValue);
        await repository.pushKey(userId, key, rawValue);
    }
    async function assertReplayUserMatches(itemUserId) {
        const currentUserId = await auth?.getCurrentUserId?.();
        if (currentUserId && currentUserId !== itemUserId) {
            throw new Error("Queued workspace sync skipped after auth drift.");
        }
    }
    return {
        schedulePush(userId, key, rawValue) {
            resetTimer(userId, key, "push", rawValue, () => push(userId, key, rawValue));
        },
        scheduleDelete(userId, key) {
            resetTimer(userId, key, "delete", undefined, () => repository.deleteKey(userId, key));
        },
        async flushPush(userId, key, rawValue) {
            const latestRawValue = getRawValue(key, rawValue);
            try {
                await runWithRetry(() => {
                    validateOrThrow(key, latestRawValue);
                    return repository.pushKey(userId, key, latestRawValue);
                }, { userId, key });
            }
            catch (error) {
                enqueueFailure({ userId, key, operation: "push", rawValue: latestRawValue, error });
                throw error;
            }
        },
        async flushDelete(userId, key) {
            try {
                await runWithRetry(() => repository.deleteKey(userId, key), { userId, key });
            }
            catch (error) {
                enqueueFailure({ userId, key, operation: "delete", error });
                throw error;
            }
        },
        async replayQueued(userId) {
            const queued = retryQueue.list(userId);
            for (const item of queued) {
                try {
                    await assertReplayUserMatches(item.userId);
                    if (item.operation === "push") {
                        validateOrThrow(item.key, item.rawValue || "");
                        await repository.pushKey(item.userId, item.key, item.rawValue || "");
                    }
                    else {
                        await repository.deleteKey(item.userId, item.key);
                    }
                    retryQueue.remove(item.id);
                }
                catch (error) {
                    retryQueue.markFailed(item.id, String(error));
                    logger.warn("Queued workspace sync retry failed", {
                        key: item.key,
                        userId: item.userId,
                        operation: item.operation,
                        error: String(error),
                        at: clock(),
                    });
                }
            }
        },
    };
}
