// request.ts

import {
    ApiError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ServerError
} from "./errors"

export async function parseResponse(res: Response) {
    let payload: unknown = null

    try {
        payload = await res.json()
    } catch {
        // No JSON body
    }

    if (res.ok) return payload

    const message =
        (payload as any)?.message || res.statusText

    switch (res.status) {
        case 400:
            throw new BadRequestError(message, 400, payload)
        case 401:
            throw new UnauthorizedError(message, 401, payload)
        case 403:
            throw new ForbiddenError(message, 403, payload)
        case 404:
            throw new NotFoundError(message, 404, payload)
        default:
            throw new ServerError(message, res.status, payload)
    }
}