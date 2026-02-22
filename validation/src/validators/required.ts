// validators/required.ts
import { ValidationError } from "../types"

export function validateRequired(
    value: unknown,
    field: string
): ValidationError[] {
    if (value === null || value === undefined || value === "") {
        return [{
            field,
            code: "REQUIRED",
            message: `${field} is required`
        }]
    }
    return []
}