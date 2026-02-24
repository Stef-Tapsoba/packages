// __tests__/eventBus.test.ts
import { describe, it, expect, vi } from "vitest"
import { EventBus } from "../eventBus"

interface TestEvents {
    "ping": void
    "data": { value: number }
    "message": string
}

describe("EventBus", () => {
    it("calls a registered listener when the event is emitted", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        bus.on("ping", handler)
        bus.emit("ping")
        expect(handler).toHaveBeenCalledOnce()
    })

    it("passes the payload to the listener", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        bus.on("data", handler)
        bus.emit("data", { value: 42 })
        expect(handler).toHaveBeenCalledWith({ value: 42 })
    })

    it("calls multiple listeners for the same event", () => {
        const bus = new EventBus<TestEvents>()
        const a = vi.fn()
        const b = vi.fn()
        bus.on("ping", a)
        bus.on("ping", b)
        bus.emit("ping")
        expect(a).toHaveBeenCalledOnce()
        expect(b).toHaveBeenCalledOnce()
    })

    it("does not call listeners for other events", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        bus.on("data", handler)
        bus.emit("ping")
        expect(handler).not.toHaveBeenCalled()
    })

    it("on() returns an unsubscribe function that removes the listener", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        const unsub = bus.on("ping", handler)
        unsub()
        bus.emit("ping")
        expect(handler).not.toHaveBeenCalled()
    })

    it("off() removes a specific listener", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        bus.on("ping", handler)
        bus.off("ping", handler)
        bus.emit("ping")
        expect(handler).not.toHaveBeenCalled()
    })

    it("once() listener fires exactly once", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        bus.once("ping", handler)
        bus.emit("ping")
        bus.emit("ping")
        expect(handler).toHaveBeenCalledOnce()
    })

    it("once() passes the payload on first call", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        bus.once("data", handler)
        bus.emit("data", { value: 99 })
        expect(handler).toHaveBeenCalledWith({ value: 99 })
    })

    it("once() unsubscribe cancels before first call", () => {
        const bus = new EventBus<TestEvents>()
        const handler = vi.fn()
        const unsub = bus.once("ping", handler)
        unsub()
        bus.emit("ping")
        expect(handler).not.toHaveBeenCalled()
    })

    it("clear(event) removes all listeners for that event", () => {
        const bus = new EventBus<TestEvents>()
        const a = vi.fn()
        const b = vi.fn()
        bus.on("ping", a)
        bus.on("ping", b)
        bus.clear("ping")
        bus.emit("ping")
        expect(a).not.toHaveBeenCalled()
        expect(b).not.toHaveBeenCalled()
    })

    it("clear() with no argument removes all listeners", () => {
        const bus = new EventBus<TestEvents>()
        const a = vi.fn()
        const b = vi.fn()
        bus.on("ping", a)
        bus.on("data", b)
        bus.clear()
        bus.emit("ping")
        bus.emit("data", { value: 1 })
        expect(a).not.toHaveBeenCalled()
        expect(b).not.toHaveBeenCalled()
    })

    it("listenerCount() reports the correct count", () => {
        const bus = new EventBus<TestEvents>()
        expect(bus.listenerCount("ping")).toBe(0)
        const unsub = bus.on("ping", vi.fn())
        bus.on("ping", vi.fn())
        expect(bus.listenerCount("ping")).toBe(2)
        unsub()
        expect(bus.listenerCount("ping")).toBe(1)
    })
})