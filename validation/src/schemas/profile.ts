// schemas/profile.ts
import { validateUsername } from "../validators/username"
import { validateEmail } from "../validators/email"
import { validatePassword } from "../validators/password"
import { ValidationResult } from "../types"

export interface ProfileInput {
    username: string
    email: string
    password?: string
}

export function validateProfile(
    input: ProfileInput
): ValidationResult<ProfileInput> {
    const errors = [
        ...validateUsername(input.username),
        ...validateEmail(input.email),
        ...(input.password ? validatePassword(input.password) : [])
    ]

    return errors.length
        ? { valid: false, errors }
        : { valid: true, value: input }
}