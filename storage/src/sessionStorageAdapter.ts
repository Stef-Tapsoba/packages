// sessionStorageAdapter.ts
import { AuthStorage } from "@myorg/auth-core"

/**
 * AuthStorage implementation backed by window.sessionStorage.
 * Data is cleared when the browser tab is closed — useful for
 * "don't remember me" flows.
 * Keys are namespaced to avoid collisions with other libraries.
 */
export class SessionStorageAdapter implements AuthStorage {
    constructor(private readonly namespace = "myorg") {}

    private key(k: string) {
        return `${this.namespace}:${k}`
    }

    async get(key: string): Promise<string | null> {
        return sessionStorage.getItem(this.key(key))
    }

    async set(key: string, value: string): Promise<void> {
        try {
            sessionStorage.setItem(this.key(key), value)
        } catch (e) {
            if (e instanceof DOMException && e.name === "QuotaExceededError") {
                throw new Error(`Storage quota exceeded while writing key "${key}"`)
            }
            throw e
        }
    }

    async remove(key: string): Promise<void> {
        sessionStorage.removeItem(this.key(key))
    }
}