// __tests__/schemas.test.ts
import { describe, it, expect } from "vitest"
import { validateLogin } from "../schemas/login"
import { validateProfile } from "../schemas/profile"

// ---------------------------------------------------------------------------
// validateLogin
// ---------------------------------------------------------------------------
describe("validateLogin", () => {
    it("returns valid for correct credentials", () => {
        const result = validateLogin({
            email: "user@example.com",
            password: "Secure123"
        })
        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.value.email).toBe("user@example.com")
        }
    })

    it("returns invalid with errors for bad email", () => {
        const result = validateLogin({ email: "bad", password: "Secure123" })
        expect(result.valid).toBe(false)
        if (!result.valid) {
            const fields = result.errors.map(e => e.field)
            expect(fields).toContain("email")
        }
    })

    it("accepts any non-empty password (no complexity rules at login)", () => {
        // Existing users may have passwords that predate the 8-char/uppercase
        // registration requirement — login must not block them.
        const result = validateLogin({ email: "user@example.com", password: "weak" })
        expect(result.valid).toBe(true)
    })

    it("returns invalid for empty password", () => {
        const result = validateLogin({ email: "user@example.com", password: "" })
        expect(result.valid).toBe(false)
        if (!result.valid) {
            const fields = result.errors.map(e => e.field)
            expect(fields).toContain("password")
        }
    })

    it("collects errors from both fields simultaneously", () => {
        const result = validateLogin({ email: "", password: "" })
        expect(result.valid).toBe(false)
        if (!result.valid) {
            const fields = result.errors.map(e => e.field)
            expect(fields).toContain("email")
            expect(fields).toContain("password")
        }
    })
})

// ---------------------------------------------------------------------------
// validateProfile
// ---------------------------------------------------------------------------
describe("validateProfile", () => {
    it("returns valid for a correct profile without password", () => {
        const result = validateProfile({
            username: "alice",
            email: "alice@example.com"
        })
        expect(result.valid).toBe(true)
    })

    it("returns valid for a correct profile with a strong password", () => {
        const result = validateProfile({
            username: "alice",
            email: "alice@example.com",
            password: "StrongPass1"
        })
        expect(result.valid).toBe(true)
    })

    it("validates password when provided", () => {
        const result = validateProfile({
            username: "alice",
            email: "alice@example.com",
            password: "weak"
        })
        expect(result.valid).toBe(false)
        if (!result.valid) {
            const fields = result.errors.map(e => e.field)
            expect(fields).toContain("password")
        }
    })

    it("skips password validation when not provided", () => {
        const result = validateProfile({
            username: "alice",
            email: "alice@example.com"
        })
        expect(result.valid).toBe(true)
    })
})
