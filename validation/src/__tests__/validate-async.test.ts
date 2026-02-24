// __tests__/validate-async.test.ts
import { describe, it, expect, vi } from "vitest"
import { validateAsync } from "../validate"
import { validateMatch } from "../validators/match"
import { ValidationError } from "../types"

// ---------------------------------------------------------------------------
// validateAsync
// ---------------------------------------------------------------------------
describe("validateAsync", () => {
    it("resolves valid when all async rules pass", async () => {
        const result = await validateAsync("value", [
            async () => [],
            async () => []
        ])
        expect(result.valid).toBe(true)
    })

    it("resolves invalid when an async rule returns errors", async () => {
        const error: ValidationError = { field: "email", code: "INVALID_FORMAT", message: "bad" }
        const result = await validateAsync("value", [
            async () => [error]
        ])
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errors).toContainEqual(error)
        }
    })

    it("runs all rules in parallel and collects all errors", async () => {
        const e1: ValidationError = { field: "a", code: "REQUIRED", message: "a required" }
        const e2: ValidationError = { field: "b", code: "TOO_SHORT", message: "b short" }

        const result = await validateAsync("value", [
            async () => [e1],
            async () => [e2]
        ])

        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errors).toHaveLength(2)
        }
    })

    it("accepts sync rules alongside async rules", async () => {
        const syncError: ValidationError = { field: "x", code: "REQUIRED", message: "x" }
        const result = await validateAsync("value", [
            () => [syncError],       // sync rule
            async () => []           // async rule
        ])
        expect(result.valid).toBe(false)
    })

    it("simulates an async uniqueness check", async () => {
        const checkUsernameTaken = vi.fn().mockResolvedValue(true)

        const result = await validateAsync({ username: "taken" }, [
            async () => {
                const taken = await checkUsernameTaken("taken")
                return taken
                    ? [{ field: "username", code: "MISMATCH" as const, message: "Username already taken" }]
                    : []
            }
        ])

        expect(result.valid).toBe(false)
        expect(checkUsernameTaken).toHaveBeenCalledOnce()
    })
})

// ---------------------------------------------------------------------------
// validateMatch (cross-field)
// ---------------------------------------------------------------------------
describe("validateMatch", () => {
    it("returns no errors when values match", () => {
        expect(validateMatch("secret", "secret", "confirmPassword")).toEqual([])
    })

    it("returns MISMATCH error when values differ", () => {
        const errors = validateMatch("secret", "different", "confirmPassword")
        expect(errors).toHaveLength(1)
        expect(errors[0].code).toBe("MISMATCH")
        expect(errors[0].field).toBe("confirmPassword")
    })

    it("accepts a custom message", () => {
        const errors = validateMatch("a", "b", "pin", "PINs do not match")
        expect(errors[0].message).toBe("PINs do not match")
    })

    it("uses strict equality (no coercion)", () => {
        // "1" !== 1
        const errors = validateMatch("1", 1, "field")
        expect(errors).toHaveLength(1)
    })
})