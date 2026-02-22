// validators/username.ts
import { ValidationError } from "../types"

export function validateUsername(
    value: string,
    field = "username"
): ValidationError[] {
    const errors: ValidationError[] = []

    if (!value) {
        errors.push({
            field,
            code: "REQUIRED",
            message: "Username is required"
        })
        return errors
    }

    if (value.length < 3) {
        errors.push({
            field,
            code: "TOO_SHORT",
            message: "Username must be at least 3 characters"
        })
    }

    if (value.length > 20) {
        errors.push({
            field,
            code: "TOO_LONG",
            message: "Username must be at most 20 characters"
        })
    }

    return errors
}