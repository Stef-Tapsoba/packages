// memoryStorageAdapter.ts
import { AuthStorage } from "@myorg/auth-core"

/**
 * AuthStorage implementation backed by an in-memory Map.
 * Data is lost on page reload or process restart.
 *
 * Useful for:
 *  - Unit tests (no browser globals required)
 *  - Server-side rendering (SSR) where localStorage is unavailable
 *  - Node.js environments
 */
export class MemoryStorageAdapter implements AuthStorage {
    private store = new Map<string, string>()

    async get(key: string): Promise<string | null> {
        return this.store.get(key) ?? null
    }

    async set(key: string, value: string): Promise<void> {
        this.store.set(key, value)
    }

    async remove(key: string): Promise<void> {
        this.store.delete(key)
    }

    /** Clears all stored data. Useful for resetting state in tests. */
    clear(): void {
        this.store.clear()
    }
}