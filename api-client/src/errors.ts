// errors.ts
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public payload?: unknown
    ) {
        super(message)
    }
}

export class BadRequestError extends ApiError { }
export class UnauthorizedError extends ApiError { }
export class ForbiddenError extends ApiError { }
export class NotFoundError extends ApiError { }
export class ServerError extends ApiError { }