// validate.ts
import { ValidationResult, ValidationError } from "./types"

export function validate<T>(
    value: T,
    rules: (() => ValidationError[])[]
): ValidationResult<T> {
    const errors = rules.flatMap(rule => rule())

    return errors.length
        ? { valid: false, errors }
        : { valid: true, value }
}