import { describe, it, expect, vi, beforeEach } from "vitest"
import { AuthService } from "../authService"
import { SessionEmitter } from "../sessionEmitter"
import { SessionExpiredError } from "../errors"
import type { AuthApi } from "../types"
import type { AuthStorage } from "../storage"
import type { Session } from "../session"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<Session> = {}): Session {
    return {
        accessToken: "access-token-abc",
        refreshToken: "refresh-token-xyz",
        userId: "user-123",
        expiresAt: Date.now() + 3_600_000, // 1 hour from now
        ...overrides,
    }
}

function makeMockApi(): { api: AuthApi; login: ReturnType<typeof vi.fn>; refresh: ReturnType<typeof vi.fn> } {
    const login = vi.fn()
    const refresh = vi.fn()
    const api: AuthApi = { login, refresh }
    return { api, login, refresh }
}

function makeMockStorage(): {
    storage: AuthStorage
    get: ReturnType<typeof vi.fn>
    set: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
} {
    const store = new Map<string, string>()
    const get = vi.fn(async (key: string) => store.get(key) ?? null)
    const set = vi.fn(async (key: string, value: string) => { store.set(key, value) })
    const remove = vi.fn(async (key: string) => { store.delete(key) })
    return { storage: { get, set, remove }, get, set, remove }
}

// ---------------------------------------------------------------------------
// Instantiation
// ---------------------------------------------------------------------------

describe("AuthService — instantiation", () => {
    it("constructs without error given a mock api and storage", () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()
        expect(() => new AuthService(api, storage)).not.toThrow()
    })

    it("creates its own SessionEmitter when none is provided", () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()
        const service = new AuthService(api, storage)
        expect(service.events).toBeInstanceOf(SessionEmitter)
    })

    it("uses the provided SessionEmitter if supplied", () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()
        const emitter = new SessionEmitter()
        const service = new AuthService(api, storage, emitter)
        expect(service.events).toBe(emitter)
    })
})

// ---------------------------------------------------------------------------
// login()
// ---------------------------------------------------------------------------

describe("AuthService — login()", () => {
    it("calls api.login() with email and password", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        const session = makeSession()
        login.mockResolvedValueOnce(session)

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        expect(login).toHaveBeenCalledOnce()
        expect(login).toHaveBeenCalledWith("user@example.com", "secret")
    })

    it("stores the session in storage", async () => {
        const { api, login } = makeMockApi()
        const { storage, set } = makeMockStorage()
        const session = makeSession()
        login.mockResolvedValueOnce(session)

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        expect(set).toHaveBeenCalledOnce()
        expect(set).toHaveBeenCalledWith("session", JSON.stringify(session))
    })

    it("returns the session from the api", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        const session = makeSession()
        login.mockResolvedValueOnce(session)

        const service = new AuthService(api, storage)
        const result = await service.login("user@example.com", "secret")

        expect(result).toEqual(session)
    })

    it("emits 'login' event after successful login", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        login.mockResolvedValueOnce(makeSession())

        const service = new AuthService(api, storage)
        const listener = vi.fn()
        service.events.on("login", listener)

        await service.login("user@example.com", "secret")

        expect(listener).toHaveBeenCalledOnce()
    })

    it("propagates errors thrown by api.login()", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        login.mockRejectedValueOnce(new Error("invalid credentials"))

        const service = new AuthService(api, storage)
        await expect(service.login("bad@example.com", "wrong")).rejects.toThrow("invalid credentials")
    })

    it("does not store session if api.login() throws", async () => {
        const { api, login } = makeMockApi()
        const { storage, set } = makeMockStorage()
        login.mockRejectedValueOnce(new Error("network error"))

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "pass").catch(() => {})

        expect(set).not.toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// logout()
// ---------------------------------------------------------------------------

describe("AuthService — logout()", () => {
    it("removes the session from storage", async () => {
        const { api, login } = makeMockApi()
        const { storage, remove } = makeMockStorage()
        login.mockResolvedValueOnce(makeSession())

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")
        await service.logout()

        expect(remove).toHaveBeenCalledWith("session")
    })

    it("emits 'logout' event", async () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()

        const service = new AuthService(api, storage)
        const listener = vi.fn()
        service.events.on("logout", listener)

        await service.logout()

        expect(listener).toHaveBeenCalledOnce()
    })

    it("session is null after logout", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        login.mockResolvedValueOnce(makeSession())

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")
        await service.logout()

        const session = await service.getSession()
        expect(session).toBeNull()
    })
})

// ---------------------------------------------------------------------------
// getSession()
// ---------------------------------------------------------------------------

describe("AuthService — getSession()", () => {
    it("returns null when not logged in", async () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()

        const service = new AuthService(api, storage)
        const session = await service.getSession()

        expect(session).toBeNull()
    })

    it("returns the current session after login", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        const expectedSession = makeSession()
        login.mockResolvedValueOnce(expectedSession)

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        const session = await service.getSession()
        expect(session).toEqual(expectedSession)
    })
})

// ---------------------------------------------------------------------------
// isAuthenticated()
// ---------------------------------------------------------------------------

describe("AuthService — isAuthenticated()", () => {
    it("returns false when not logged in", async () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()

        const service = new AuthService(api, storage)
        expect(await service.isAuthenticated()).toBe(false)
    })

    it("returns true when session is valid (not expired)", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        login.mockResolvedValueOnce(makeSession({ expiresAt: Date.now() + 3_600_000 }))

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        expect(await service.isAuthenticated()).toBe(true)
    })

    it("returns false when session is expired", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        login.mockResolvedValueOnce(makeSession({ expiresAt: Date.now() - 1000 }))

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        expect(await service.isAuthenticated()).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// getAccessToken()
// ---------------------------------------------------------------------------

describe("AuthService — getAccessToken()", () => {
    it("returns access token when session is valid", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()
        const session = makeSession({ accessToken: "valid-token", expiresAt: Date.now() + 3_600_000 })
        login.mockResolvedValueOnce(session)

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        const token = await service.getAccessToken()
        expect(token).toBe("valid-token")
    })

    it("throws SessionExpiredError when there is no session", async () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()

        const service = new AuthService(api, storage)
        await expect(service.getAccessToken()).rejects.toThrow(SessionExpiredError)
    })

    it("emits 'expired' when there is no session", async () => {
        const { api } = makeMockApi()
        const { storage } = makeMockStorage()

        const service = new AuthService(api, storage)
        const listener = vi.fn()
        service.events.on("expired", listener)

        await service.getAccessToken().catch(() => {})
        expect(listener).toHaveBeenCalledOnce()
    })

    it("refreshes the token when session is within the refresh buffer", async () => {
        const { api, login, refresh } = makeMockApi()
        const { storage } = makeMockStorage()

        // Set session expiry to 30 seconds from now (inside 60-second buffer)
        const nearExpiry = makeSession({ expiresAt: Date.now() + 30_000, refreshToken: "refresh-tok" })
        login.mockResolvedValueOnce(nearExpiry)

        const newSession = makeSession({ accessToken: "fresh-token", expiresAt: Date.now() + 3_600_000 })
        refresh.mockResolvedValueOnce(newSession)

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        const token = await service.getAccessToken()

        expect(refresh).toHaveBeenCalledOnce()
        expect(refresh).toHaveBeenCalledWith("refresh-tok")
        expect(token).toBe("fresh-token")
    })

    it("emits 'refreshed' after auto-refresh", async () => {
        const { api, login, refresh } = makeMockApi()
        const { storage } = makeMockStorage()

        const nearExpiry = makeSession({ expiresAt: Date.now() + 30_000, refreshToken: "refresh-tok" })
        login.mockResolvedValueOnce(nearExpiry)

        const newSession = makeSession({ accessToken: "fresh-token", expiresAt: Date.now() + 3_600_000 })
        refresh.mockResolvedValueOnce(newSession)

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        const listener = vi.fn()
        service.events.on("refreshed", listener)

        await service.getAccessToken()
        expect(listener).toHaveBeenCalledOnce()
    })

    it("throws SessionExpiredError and emits 'expired' when session is near expiry and has no refreshToken", async () => {
        const { api, login } = makeMockApi()
        const { storage } = makeMockStorage()

        // Near expiry with no refresh token
        const nearExpiry = makeSession({ expiresAt: Date.now() + 30_000, refreshToken: undefined })
        login.mockResolvedValueOnce(nearExpiry)

        const service = new AuthService(api, storage)
        await service.login("user@example.com", "secret")

        const listener = vi.fn()
        service.events.on("expired", listener)

        await expect(service.getAccessToken()).rejects.toThrow(SessionExpiredError)
        expect(listener).toHaveBeenCalledOnce()
    })
})

// ---------------------------------------------------------------------------
// SessionEmitter (standalone)
// ---------------------------------------------------------------------------

describe("SessionEmitter", () => {
    it("on() registers a listener and emit() calls it", () => {
        const emitter = new SessionEmitter()
        const fn = vi.fn()
        emitter.on("login", fn)
        emitter.emit("login")
        expect(fn).toHaveBeenCalledOnce()
    })

    it("off() removes a registered listener", () => {
        const emitter = new SessionEmitter()
        const fn = vi.fn()
        emitter.on("logout", fn)
        emitter.off("logout", fn)
        emitter.emit("logout")
        expect(fn).not.toHaveBeenCalled()
    })

    it("on() returns an unsubscribe function", () => {
        const emitter = new SessionEmitter()
        const fn = vi.fn()
        const unsub = emitter.on("expired", fn)
        unsub()
        emitter.emit("expired")
        expect(fn).not.toHaveBeenCalled()
    })

    it("emitting an event with no listeners does not throw", () => {
        const emitter = new SessionEmitter()
        expect(() => emitter.emit("refreshed")).not.toThrow()
    })

    it("multiple listeners for the same event are all called", () => {
        const emitter = new SessionEmitter()
        const a = vi.fn()
        const b = vi.fn()
        emitter.on("login", a)
        emitter.on("login", b)
        emitter.emit("login")
        expect(a).toHaveBeenCalledOnce()
        expect(b).toHaveBeenCalledOnce()
    })
})
