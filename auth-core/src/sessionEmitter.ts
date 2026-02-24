// sessionEmitter.ts

export type SessionEvent = "login" | "logout" | "refreshed" | "expired"
export type SessionEventListener = () => void

/**
 * Minimal typed event emitter for session lifecycle events.
 *
 * Apps and other packages subscribe here to react to auth state
 * changes (e.g. redirect to login on "expired", clear caches on "logout").
 *
 * Usage:
 *   sessionEmitter.on("logout", () => router.push("/login"))
 *   sessionEmitter.on("expired", () => showToast("Session expired"))
 */
export class SessionEmitter {
    private listeners = new Map<SessionEvent, Set<SessionEventListener>>()

    on(event: SessionEvent, listener: SessionEventListener): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(listener)

        // Return an unsubscribe function
        return () => this.off(event, listener)
    }

    off(event: SessionEvent, listener: SessionEventListener): void {
        this.listeners.get(event)?.delete(listener)
    }

    emit(event: SessionEvent): void {
        this.listeners.get(event)?.forEach(fn => fn())
    }
}