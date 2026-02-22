// validators/email.ts
import { ValidationError } from "../types"

export function validateEmail(
    value: string,
    field = "email"
): ValidationError[] {
    if (!value) {
        return [{
            field,
            code: "REQUIRED",
            message: "Email is required"
        }]
    }

    const isValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

    return isValid
        ? []
        : [{
            field,
            code: "INVALID_FORMAT",
            message: "Invalid email address"
        }]
}