// validators/match.ts
import { ValidationError } from "../types"

/**
 * Cross-field validator: checks that two values are identical.
 * Commonly used for "confirm password" fields.
 *
 * Example:
 *   validateMatch(input.password, input.confirmPassword, "confirmPassword")
 */
export function validateMatch(
    value: unknown,
    other: unknown,
    field: string,
    message?: string
): ValidationError[] {
    if (value !== other) {
        return [{
            field,
            code: "MISMATCH",
            message: message ?? `${field} does not match`
        }]
    }
    return []
}
