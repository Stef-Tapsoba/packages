// validators/password.ts
import { ValidationError } from "../types"

export function validatePassword(
    value: string,
    field = "password"
): ValidationError[] {
    const errors: ValidationError[] = []

    if (!value) {
        errors.push({
            field,
            code: "REQUIRED",
            message: "Password is required"
        })
        return errors
    }

    if (value.length < 8) {
        errors.push({
            field,
            code: "TOO_SHORT",
            message: "Password must be at least 8 characters"
        })
    }

    if (!/[A-Z]/.test(value)) {
        errors.push({
            field,
            code: "WEAK_PASSWORD",
            message: "Password must include an uppercase letter"
        })
    }

    return errors
}