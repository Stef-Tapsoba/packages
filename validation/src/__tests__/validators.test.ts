// __tests__/validators.test.ts
import { describe, it, expect } from "vitest"
import { validateEmail } from "../validators/email"
import { validatePassword } from "../validators/password"
import { validateUsername } from "../validators/username"
import { validateRequired } from "../validators/required"

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------
describe("validateEmail", () => {
    it("returns no errors for a valid email", () => {
        expect(validateEmail("user@example.com")).toEqual([])
    })

    it("returns REQUIRED when value is empty", () => {
        const errors = validateEmail("")
        expect(errors).toHaveLength(1)
        expect(errors[0].code).toBe("REQUIRED")
    })

    it("returns INVALID_FORMAT for email without @", () => {
        const errors = validateEmail("notanemail")
        expect(errors[0].code).toBe("INVALID_FORMAT")
    })

    it("returns INVALID_FORMAT for email without domain", () => {
        const errors = validateEmail("user@")
        expect(errors[0].code).toBe("INVALID_FORMAT")
    })

    it("uses the provided field name in errors", () => {
        const errors = validateEmail("", "work_email")
        expect(errors[0].field).toBe("work_email")
    })
})

// ---------------------------------------------------------------------------
// validatePassword
// ---------------------------------------------------------------------------
describe("validatePassword", () => {
    it("returns no errors for a valid password", () => {
        expect(validatePassword("Secure123")).toEqual([])
    })

    it("returns REQUIRED when value is empty", () => {
        const errors = validatePassword("")
        expect(errors).toHaveLength(1)
        expect(errors[0].code).toBe("REQUIRED")
    })

    it("returns TOO_SHORT for password under 8 characters", () => {
        const codes = validatePassword("Ab1").map(e => e.code)
        expect(codes).toContain("TOO_SHORT")
    })

    it("returns WEAK_PASSWORD when no uppercase letter", () => {
        const codes = validatePassword("alllowercase1").map(e => e.code)
        expect(codes).toContain("WEAK_PASSWORD")
    })

    it("can return multiple errors at once", () => {
        // Short AND no uppercase
        const errors = validatePassword("abc")
        expect(errors.length).toBeGreaterThan(1)
    })
})

// ---------------------------------------------------------------------------
// validateUsername
// ---------------------------------------------------------------------------
describe("validateUsername", () => {
    it("returns no errors for a valid username", () => {
        expect(validateUsername("alice")).toEqual([])
    })

    it("returns REQUIRED when value is empty", () => {
        const errors = validateUsername("")
        expect(errors[0].code).toBe("REQUIRED")
    })

    it("returns TOO_SHORT for username under 3 characters", () => {
        const errors = validateUsername("ab")
        expect(errors[0].code).toBe("TOO_SHORT")
    })

    it("returns TOO_LONG for username over 20 characters", () => {
        const errors = validateUsername("a".repeat(21))
        expect(errors[0].code).toBe("TOO_LONG")
    })

    it("accepts a username exactly 3 characters long", () => {
        expect(validateUsername("abc")).toEqual([])
    })

    it("accepts a username exactly 20 characters long", () => {
        expect(validateUsername("a".repeat(20))).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// validateRequired
// ---------------------------------------------------------------------------
describe("validateRequired", () => {
    it("returns no errors for a non-empty string", () => {
        expect(validateRequired("hello", "field")).toEqual([])
    })

    it("returns REQUIRED for an empty string", () => {
        const errors = validateRequired("", "field")
        expect(errors[0].code).toBe("REQUIRED")
    })

    it("returns REQUIRED for null", () => {
        const errors = validateRequired(null, "field")
        expect(errors[0].code).toBe("REQUIRED")
    })

    it("returns REQUIRED for undefined", () => {
        const errors = validateRequired(undefined, "field")
        expect(errors[0].code).toBe("REQUIRED")
    })

    it("does not error for 0 or false (only empty/null/undefined)", () => {
        expect(validateRequired(0, "field")).toEqual([])
        expect(validateRequired(false, "field")).toEqual([])
    })
})