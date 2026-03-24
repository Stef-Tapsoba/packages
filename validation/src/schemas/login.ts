// schemas/login.ts
import { validateEmail } from "../validators/email"
import { ValidationResult, ValidationError } from "../types"

export interface LoginInput {
    email: string
    password: string
}

export function validateLogin(
    input: LoginInput
): ValidationResult<LoginInput> {
    const errors: ValidationError[] = [
        ...validateEmail(input.email),
        ...(!input.password ? [{ field: "password", code: "REQUIRED", message: "Password is required" }] : [])
    ]

    return errors.length
        ? { valid: false, errors }
        : { valid: true, value: input }
}