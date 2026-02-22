// errors.ts
import { ValidationError } from "./types"

export function fieldRequired(field: string): ValidationError {
    return {
        field,
        code: "REQUIRED",
        message: `${field} is required`
    }
}

export function invalidFormat(field: string, message?: string): ValidationError {
    return {
        field,
        code: "INVALID_FORMAT",
        message: message || `${field} has invalid format`
    }
}