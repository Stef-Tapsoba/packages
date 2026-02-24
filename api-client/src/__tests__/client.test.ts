// __tests__/client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ApiClient } from "../client"
import {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ServerError
} from "../errors"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetch(status: number, body: unknown) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        statusText: String(status),
        json: () => Promise.resolve(body)
    } as Response)
}

function makeClient(fetchImpl = makeFetch(200, {})) {
    vi.stubGlobal("fetch", fetchImpl)
    return new ApiClient({ baseUrl: "https://api.example.com" })
}

beforeEach(() => {
    vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Successful requests
// ---------------------------------------------------------------------------

describe("ApiClient — successful requests", () => {
    it("GET sends the correct method and URL", async () => {
        const fetchMock = makeFetch(200, { id: 1 })
        vi.stubGlobal("fetch", fetchMock)
        const client = new ApiClient({ baseUrl: "https://api.example.com" })

        await client.get("/users/1")

        expect(fetchMock).toHaveBeenCalledOnce()
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(url).toBe("https://api.example.com/users/1")
        expect(init.method).toBe("GET")
    })

    it("POST sends body as JSON", async () => {
        const fetchMock = makeFetch(201, { id: 42 })
        vi.stubGlobal("fetch", fetchMock)
        const client = new ApiClient({ baseUrl: "https://api.example.com" })

        await client.post("/users", { name: "Alice" })

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(init.method).toBe("POST")
        expect(init.body).toBe(JSON.stringify({ name: "Alice" }))
    })

    it("returns the parsed JSON response", async () => {
        const fetchMock = makeFetch(200, { id: 7, name: "Bob" })
        vi.stubGlobal("fetch", fetchMock)
        const client = new ApiClient({ baseUrl: "https://api.example.com" })

        const result = await client.get<{ id: number; name: string }>("/users/7")
        expect(result).toEqual({ id: 7, name: "Bob" })
    })

    it("attaches Authorization header when getAccessToken is provided", async () => {
        const fetchMock = makeFetch(200, {})
        vi.stubGlobal("fetch", fetchMock)
        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            getAccessToken: async () => "my-token"
        })

        await client.get("/me")

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-token")
    })

    it("omits Authorization header when getAccessToken returns null", async () => {
        const fetchMock = makeFetch(200, {})
        vi.stubGlobal("fetch", fetchMock)
        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            getAccessToken: async () => null
        })

        await client.get("/public")

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect((init.headers as Record<string, string>)["Authorization"]).toBeUndefined()
    })
})

// ---------------------------------------------------------------------------
// HTTP error mapping
// ---------------------------------------------------------------------------

describe("ApiClient — HTTP error mapping", () => {
    it("throws BadRequestError on 400", async () => {
        makeClient(makeFetch(400, { message: "bad input" }))
        const client = new ApiClient({ baseUrl: "https://api.example.com" })
        vi.stubGlobal("fetch", makeFetch(400, { message: "bad input" }))
        await expect(client.get("/x")).rejects.toBeInstanceOf(BadRequestError)
    })

    it("throws UnauthorizedError on 401", async () => {
        vi.stubGlobal("fetch", makeFetch(401, {}))
        const client = new ApiClient({ baseUrl: "https://api.example.com" })
        await expect(client.get("/x")).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it("throws ForbiddenError on 403", async () => {
        vi.stubGlobal("fetch", makeFetch(403, {}))
        const client = new ApiClient({ baseUrl: "https://api.example.com" })
        await expect(client.get("/x")).rejects.toBeInstanceOf(ForbiddenError)
    })

    it("throws NotFoundError on 404", async () => {
        vi.stubGlobal("fetch", makeFetch(404, {}))
        const client = new ApiClient({ baseUrl: "https://api.example.com" })
        await expect(client.get("/x")).rejects.toBeInstanceOf(NotFoundError)
    })

    it("throws ServerError on 500", async () => {
        vi.stubGlobal("fetch", makeFetch(500, {}))
        const client = new ApiClient({ baseUrl: "https://api.example.com" })
        await expect(client.get("/x")).rejects.toBeInstanceOf(ServerError)
    })

    it("calls onUnauthorized callback on 401", async () => {
        vi.stubGlobal("fetch", makeFetch(401, {}))
        const onUnauthorized = vi.fn()
        const client = new ApiClient({
            baseUrl: "https://api.example.com",
            onUnauthorized
        })

        await expect(client.get("/x")).rejects.toBeInstanceOf(UnauthorizedError)
        expect(onUnauthorized).toHaveBeenCalledOnce()
    })

    it("includes the status code on the error", async () => {
        vi.stubGlobal("fetch", makeFetch(404, { message: "not found" }))
        const client = new ApiClient({ baseUrl: "https://api.example.com" })

        try {
            await client.get("/x")
        } catch (e) {
            expect(e).toBeInstanceOf(NotFoundError)
            expect((e as NotFoundError).status).toBe(404)
        }
    })
})

// ---------------------------------------------------------------------------
// HTTP verb helpers
// ---------------------------------------------------------------------------

describe("ApiClient — verb helpers", () => {
    it.each([
        ["put", "PUT"] as const,
        ["patch", "PATCH"] as const,
        ["delete", "DELETE"] as const
    ])("%s sends method %s", async (method, expected) => {
        const fetchMock = makeFetch(200, {})
        vi.stubGlobal("fetch", fetchMock)
        const client = new ApiClient({ baseUrl: "https://api.example.com" })

        await client[method]("/resource")

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(init.method).toBe(expected)
    })
})