// validate.ts
import { ValidationResult, ValidationError, SyncRule, Rule } from "./types"

/**
 * Synchronous validation. Pass an array of rule functions, each returning
 * ValidationError[]. All rules are evaluated and errors are collected.
 */
export function validate<T>(
    value: T,
    rules: SyncRule[]
): ValidationResult<T> {
    const errors = rules.flatMap(rule => rule())

    return errors.length
        ? { valid: false, errors }
        : { valid: true, value }
}

/**
 * Async validation. Accepts both sync and async rules, runs them all in
 * parallel, and collects every error. Use this when any rule needs to
 * call an API (e.g. "is this username already taken?").
 *
 * Example:
 *   const result = await validateAsync(input, [
 *     () => validateEmail(input.email),
 *     async () => {
 *       const taken = await api.checkUsername(input.username)
 *       return taken ? [{ field: "username", code: "MISMATCH", message: "Username taken" }] : []
 *     }
 *   ])
 */
export async function validateAsync<T>(
    value: T,
    rules: Rule[]
): Promise<ValidationResult<T>> {
    const results = await Promise.all(rules.map(rule => rule()))
    const errors: ValidationError[] = results.flat()

    return errors.length
        ? { valid: false, errors }
        : { valid: true, value }
}
