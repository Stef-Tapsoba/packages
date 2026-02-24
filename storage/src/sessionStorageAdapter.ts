// sessionStorageAdapter.ts
import { AuthStorage } from "@myorg/auth-core"

/**
 * AuthStorage implementation backed by window.sessionStorage.
 * Data is cleared when the browser tab is closed — useful for
 * "don't remember me" flows.
 * Keys are namespaced to avoid collisions with other libraries.
 */
export class SessionStorageAdapter implements AuthStorage {
    constructor(private namespace = "myorg") {}

    private key(k: string) {
        return `${this.namespace}:${k}`
    }

    async get(key: string): Promise<string | null> {
        return sessionStorage.getItem(this.key(key))
    }

    async set(key: string, value: string): Promise<void> {
        sessionStorage.setItem(this.key(key), value)
    }

    async remove(key: string): Promise<void> {
        sessionStorage.removeItem(this.key(key))
    }
}