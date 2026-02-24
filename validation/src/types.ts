// types.ts
export type ValidationErrorCode =
    | "REQUIRED"
    | "INVALID_FORMAT"
    | "TOO_SHORT"
    | "TOO_LONG"
    | "WEAK_PASSWORD"
    | "MISMATCH"
    | "OUT_OF_RANGE"
    | "PATTERN_MISMATCH"

export interface ValidationError {
    field: string
    code: ValidationErrorCode
    message: string
}

export type ValidationResult<T> =
    | { valid: true; value: T }
    | { valid: false; errors: ValidationError[] }

/** Synchronous rule: returns zero or more errors. */
export type SyncRule = () => ValidationError[]

/** Asynchronous rule: returns a promise of zero or more errors. */
export type AsyncRule = () => Promise<ValidationError[]>

/** A rule can be sync or async. */
export type Rule = SyncRule | AsyncRule