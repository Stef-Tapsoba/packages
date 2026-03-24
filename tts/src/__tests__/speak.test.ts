import { describe, it, expect, vi, beforeEach } from "vitest"
import { speak, speakAsync, cancel, isSpeaking } from "../speak"

// ---------------------------------------------------------------------------
// Mock SpeechSynthesisUtterance
// jsdom does not provide SpeechSynthesisUtterance, so we install a minimal
// mock on globalThis before each test.
// ---------------------------------------------------------------------------

class MockSpeechSynthesisUtterance {
    text: string
    lang = ""
    rate = 1
    onend: (() => void) | null = null
    onerror: ((e: unknown) => void) | null = null

    constructor(text: string) {
        this.text = text
    }
}

// ---------------------------------------------------------------------------
// Mock speechSynthesis
// ---------------------------------------------------------------------------

function makeMockSpeechSynthesis(speaking = false) {
    return {
        speaking,
        cancel: vi.fn(),
        speak: vi.fn(),
    }
}

let mockSS: ReturnType<typeof makeMockSpeechSynthesis>

beforeEach(() => {
    mockSS = makeMockSpeechSynthesis()

    // Install mocks on globalThis / window
    ;(globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance
    ;(globalThis as any).window = globalThis
    Object.defineProperty(globalThis, "speechSynthesis", {
        value: mockSS,
        writable: true,
        configurable: true,
    })
})

// ---------------------------------------------------------------------------
// speak()
// ---------------------------------------------------------------------------

describe("speak()", () => {
    it("calls cancel() before speaking", () => {
        speak("hello", "en-US")
        expect(mockSS.cancel).toHaveBeenCalledOnce()
    })

    it("calls speechSynthesis.speak() with an utterance", () => {
        speak("hello", "en-US")
        expect(mockSS.speak).toHaveBeenCalledOnce()
    })

    it("creates utterance with correct text", () => {
        speak("bonjour", "fr-FR")
        const utt = mockSS.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance
        expect(utt.text).toBe("bonjour")
    })

    it("creates utterance with correct lang", () => {
        speak("bonjour", "fr-FR")
        const utt = mockSS.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance
        expect(utt.lang).toBe("fr-FR")
    })

    it("creates utterance with default rate of 1", () => {
        speak("hello", "en-US")
        const utt = mockSS.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance
        expect(utt.rate).toBe(1)
    })

    it("creates utterance with custom rate", () => {
        speak("hello", "en-US", 0.7)
        const utt = mockSS.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance
        expect(utt.rate).toBe(0.7)
    })

    it("returns silently when speechSynthesis is unavailable", () => {
        Object.defineProperty(globalThis, "speechSynthesis", {
            value: undefined,
            writable: true,
            configurable: true,
        })
        expect(() => speak("hello", "en-US")).not.toThrow()
    })
})

// ---------------------------------------------------------------------------
// speakAsync()
// ---------------------------------------------------------------------------

describe("speakAsync()", () => {
    it("returns a Promise", () => {
        const result = speakAsync("hello", "en-US")
        expect(result).toBeInstanceOf(Promise)
        // Prevent unhandled rejection warnings
        result.catch(() => {})
    })

    it("calls cancel() and speechSynthesis.speak()", async () => {
        // Resolve immediately by triggering onend
        mockSS.speak.mockImplementation((utt: MockSpeechSynthesisUtterance) => {
            Promise.resolve().then(() => utt.onend?.())
        })

        await speakAsync("hello", "en-US")

        expect(mockSS.cancel).toHaveBeenCalledOnce()
        expect(mockSS.speak).toHaveBeenCalledOnce()
    })

    it("resolves when onend fires", async () => {
        mockSS.speak.mockImplementation((utt: MockSpeechSynthesisUtterance) => {
            Promise.resolve().then(() => utt.onend?.())
        })

        await expect(speakAsync("hello", "en-US")).resolves.toBeUndefined()
    })

    it("rejects when onerror fires", async () => {
        const fakeError = new Event("error")
        mockSS.speak.mockImplementation((utt: MockSpeechSynthesisUtterance) => {
            Promise.resolve().then(() => utt.onerror?.(fakeError))
        })

        await expect(speakAsync("hello", "en-US")).rejects.toBe(fakeError)
    })

    it("resolves silently when speechSynthesis is unavailable", async () => {
        Object.defineProperty(globalThis, "speechSynthesis", {
            value: undefined,
            writable: true,
            configurable: true,
        })

        await expect(speakAsync("hello", "en-US")).resolves.toBeUndefined()
    })

    it("sets correct text, lang, rate on utterance", async () => {
        mockSS.speak.mockImplementation((utt: MockSpeechSynthesisUtterance) => {
            Promise.resolve().then(() => utt.onend?.())
        })

        await speakAsync("nihongo", "ja-JP", 0.8)

        const utt = mockSS.speak.mock.calls[0][0] as MockSpeechSynthesisUtterance
        expect(utt.text).toBe("nihongo")
        expect(utt.lang).toBe("ja-JP")
        expect(utt.rate).toBe(0.8)
    })
})

// ---------------------------------------------------------------------------
// cancel()
// ---------------------------------------------------------------------------

describe("cancel()", () => {
    it("calls speechSynthesis.cancel()", () => {
        cancel()
        expect(mockSS.cancel).toHaveBeenCalledOnce()
    })

    it("does not throw when speechSynthesis is unavailable", () => {
        Object.defineProperty(globalThis, "speechSynthesis", {
            value: undefined,
            writable: true,
            configurable: true,
        })
        expect(() => cancel()).not.toThrow()
    })
})

// ---------------------------------------------------------------------------
// isSpeaking()
// ---------------------------------------------------------------------------

describe("isSpeaking()", () => {
    it("returns true when speechSynthesis.speaking is true", () => {
        Object.defineProperty(globalThis, "speechSynthesis", {
            value: makeMockSpeechSynthesis(true),
            writable: true,
            configurable: true,
        })
        expect(isSpeaking()).toBe(true)
    })

    it("returns false when speechSynthesis.speaking is false", () => {
        Object.defineProperty(globalThis, "speechSynthesis", {
            value: makeMockSpeechSynthesis(false),
            writable: true,
            configurable: true,
        })
        expect(isSpeaking()).toBe(false)
    })

    it("returns false when speechSynthesis is unavailable", () => {
        Object.defineProperty(globalThis, "speechSynthesis", {
            value: undefined,
            writable: true,
            configurable: true,
        })
        expect(isSpeaking()).toBe(false)
    })
})
