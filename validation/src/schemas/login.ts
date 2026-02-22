// schemas/login.ts
import { validateEmail } from "../validators/email"
import { validatePassword } from "../validators/password"
import { ValidationResult } from "../types"

export interface LoginInput {
    email: string
    password: string
}

export function validateLogin(
    input: LoginInput
): ValidationResult<LoginInput> {
    const errors = [
        ...validateEmail(input.email),
        ...validatePassword(input.password)
    ]

    return errors.length
        ? { valid: false, errors }
        : { valid: true, value: input }
}