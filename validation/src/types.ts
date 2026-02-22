// types.ts
export type ValidationErrorCode =
    | "REQUIRED"
    | "INVALID_FORMAT"
    | "TOO_SHORT"
    | "TOO_LONG"
    | "WEAK_PASSWORD"

export interface ValidationError {
    field: string
    code: ValidationErrorCode
    message: string
}

export type ValidationResult<T> =
    | { valid: true; value: T }
    | { valid: false; errors: ValidationError[] }