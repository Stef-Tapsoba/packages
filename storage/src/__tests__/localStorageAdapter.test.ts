import { describe, it, expect, beforeEach, vi } from "vitest"
import { LocalStorageAdapter } from "../localStorageAdapter"
import { SessionStorageAdapter } from "../sessionStorageAdapter"
import { MemoryStorageAdapter } from "../memoryStorageAdapter"

// ---------------------------------------------------------------------------
// jsdom provides localStorage and sessionStorage — we reset between tests
// via a simple in-memory implementation installed in beforeEach.
// ---------------------------------------------------------------------------

class InMemoryStorage implements Storage {
    private store: Record<string, string> = {}

    get length(): number {
        return Object.keys(this.store).length
    }

    key(index: number): string | null {
        return Object.keys(this.store)[index] ?? null
    }

    getItem(key: string): string | null {
        return Object.prototype.hasOwnProperty.call(this.store, key)
            ? this.store[key]
            : null
    }

    setItem(key: string, value: string): void {
        this.store[key] = String(value)
    }

    removeItem(key: string): void {
        delete this.store[key]
    }

    clear(): void {
        this.store = {}
    }
}

beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
        value: new InMemoryStorage(),
        writable: true,
        configurable: true,
    })
    Object.defineProperty(globalThis, "sessionStorage", {
        value: new InMemoryStorage(),
        writable: true,
        configurable: true,
    })
})

// ---------------------------------------------------------------------------
// LocalStorageAdapter
// ---------------------------------------------------------------------------

describe("LocalStorageAdapter", () => {
    describe("get()", () => {
        it("returns null for a key that does not exist", async () => {
            const adapter = new LocalStorageAdapter()
            expect(await adapter.get("missing")).toBeNull()
        })

        it("returns the stored string value", async () => {
            const adapter = new LocalStorageAdapter()
            await adapter.set("key", "hello")
            expect(await adapter.get("key")).toBe("hello")
        })

        it("does not leak between different namespaces", async () => {
            const a = new LocalStorageAdapter("ns-a")
            const b = new LocalStorageAdapter("ns-b")
            await a.set("key", "from-a")
            expect(await b.get("key")).toBeNull()
        })
    })

    describe("set()", () => {
        it("stores a value that can be retrieved", async () => {
            const adapter = new LocalStorageAdapter()
            await adapter.set("token", "abc123")
            expect(await adapter.get("token")).toBe("abc123")
        })

        it("overwrites an existing value", async () => {
            const adapter = new LocalStorageAdapter()
            await adapter.set("token", "first")
            await adapter.set("token", "second")
            expect(await adapter.get("token")).toBe("second")
        })

        it("stores JSON-serialised objects as strings", async () => {
            const adapter = new LocalStorageAdapter()
            const obj = { userId: "u1", accessToken: "tok" }
            await adapter.set("session", JSON.stringify(obj))
            const raw = await adapter.get("session")
            expect(JSON.parse(raw!)).toEqual(obj)
        })

        it("throws a friendly error on QuotaExceededError", async () => {
            const adapter = new LocalStorageAdapter()
            const quota = new DOMException("QuotaExceededError")
            Object.defineProperty(quota, "name", { value: "QuotaExceededError" })
            vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => { throw quota })

            await expect(adapter.set("big", "x".repeat(100))).rejects.toThrow(
                /Storage quota exceeded/,
            )
        })

        it("rethrows non-quota errors as-is", async () => {
            const adapter = new LocalStorageAdapter()
            const err = new TypeError("unexpected")
            vi.spyOn(localStorage, "setItem").mockImplementationOnce(() => { throw err })

            await expect(adapter.set("key", "value")).rejects.toThrow(TypeError)
        })
    })

    describe("remove()", () => {
        it("deletes a stored key", async () => {
            const adapter = new LocalStorageAdapter()
            await adapter.set("token", "abc")
            await adapter.remove("token")
            expect(await adapter.get("token")).toBeNull()
        })

        it("does not throw when removing a non-existent key", async () => {
            const adapter = new LocalStorageAdapter()
            await expect(adapter.remove("no-such-key")).resolves.toBeUndefined()
        })
    })

    describe("namespacing", () => {
        it("uses default namespace 'myorg'", async () => {
            const adapter = new LocalStorageAdapter()
            await adapter.set("session", "x")
            expect(localStorage.getItem("myorg:session")).toBe("x")
        })

        it("uses a custom namespace when provided", async () => {
            const adapter = new LocalStorageAdapter("app")
            await adapter.set("session", "x")
            expect(localStorage.getItem("app:session")).toBe("x")
        })
    })

    describe("round-trip values", () => {
        const adapter = new LocalStorageAdapter("rt")

        it.each([
            ["string", "hello world"],
            ["number as string", "42"],
            ["boolean string", "true"],
            ["JSON object", JSON.stringify({ a: 1, b: [2, 3] })],
            ["empty string", ""],
        ])("round-trips %s correctly", async (_label, value) => {
            await adapter.set("v", value)
            expect(await adapter.get("v")).toBe(value)
        })
    })
})

// ---------------------------------------------------------------------------
// SessionStorageAdapter
// ---------------------------------------------------------------------------

describe("SessionStorageAdapter", () => {
    it("get() returns null for missing key", async () => {
        const adapter = new SessionStorageAdapter()
        expect(await adapter.get("missing")).toBeNull()
    })

    it("set() and get() round-trip correctly", async () => {
        const adapter = new SessionStorageAdapter()
        await adapter.set("key", "value")
        expect(await adapter.get("key")).toBe("value")
    })

    it("remove() deletes the key", async () => {
        const adapter = new SessionStorageAdapter()
        await adapter.set("key", "value")
        await adapter.remove("key")
        expect(await adapter.get("key")).toBeNull()
    })

    it("uses default namespace 'myorg'", async () => {
        const adapter = new SessionStorageAdapter()
        await adapter.set("session", "x")
        expect(sessionStorage.getItem("myorg:session")).toBe("x")
    })

    it("uses a custom namespace when provided", async () => {
        const adapter = new SessionStorageAdapter("beta")
        await adapter.set("session", "x")
        expect(sessionStorage.getItem("beta:session")).toBe("x")
    })

    it("throws a friendly error on QuotaExceededError", async () => {
        const adapter = new SessionStorageAdapter()
        const quota = new DOMException("QuotaExceededError")
        Object.defineProperty(quota, "name", { value: "QuotaExceededError" })
        vi.spyOn(sessionStorage, "setItem").mockImplementationOnce(() => { throw quota })

        await expect(adapter.set("big", "x")).rejects.toThrow(/Storage quota exceeded/)
    })

    it("does not share data with LocalStorageAdapter", async () => {
        const local = new LocalStorageAdapter()
        const session = new SessionStorageAdapter()
        await local.set("key", "from-local")
        expect(await session.get("key")).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// MemoryStorageAdapter
// ---------------------------------------------------------------------------

describe("MemoryStorageAdapter", () => {
    it("get() returns null for missing key", async () => {
        const adapter = new MemoryStorageAdapter()
        expect(await adapter.get("missing")).toBeNull()
    })

    it("set() and get() round-trip correctly", async () => {
        const adapter = new MemoryStorageAdapter()
        await adapter.set("key", "hello")
        expect(await adapter.get("key")).toBe("hello")
    })

    it("remove() deletes the key", async () => {
        const adapter = new MemoryStorageAdapter()
        await adapter.set("key", "hello")
        await adapter.remove("key")
        expect(await adapter.get("key")).toBeNull()
    })

    it("clear() removes all stored entries", async () => {
        const adapter = new MemoryStorageAdapter()
        await adapter.set("a", "1")
        await adapter.set("b", "2")
        adapter.clear()
        expect(await adapter.get("a")).toBeNull()
        expect(await adapter.get("b")).toBeNull()
    })

    it("different instances do not share state", async () => {
        const a = new MemoryStorageAdapter()
        const b = new MemoryStorageAdapter()
        await a.set("key", "from-a")
        expect(await b.get("key")).toBeNull()
    })

    it("does not require browser globals (no localStorage dependency)", async () => {
        // MemoryStorageAdapter should work fine even if localStorage is removed
        const saved = (globalThis as any).localStorage
        delete (globalThis as any).localStorage
        try {
            const adapter = new MemoryStorageAdapter()
            await adapter.set("x", "y")
            expect(await adapter.get("x")).toBe("y")
        } finally {
            Object.defineProperty(globalThis, "localStorage", {
                value: saved,
                writable: true,
                configurable: true,
            })
        }
    })

    it("remove() on a non-existent key does not throw", async () => {
        const adapter = new MemoryStorageAdapter()
        await expect(adapter.remove("ghost")).resolves.toBeUndefined()
    })

    describe("round-trip values", () => {
        it.each([
            ["arbitrary string", "hello"],
            ["JSON", JSON.stringify({ id: 1 })],
            ["empty string", ""],
            ["numeric string", "3.14"],
        ])("stores and retrieves %s", async (_label, value) => {
            const adapter = new MemoryStorageAdapter()
            await adapter.set("k", value)
            expect(await adapter.get("k")).toBe(value)
        })
    })
})
