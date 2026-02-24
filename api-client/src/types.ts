// types.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiClientConfig {
    baseUrl: string
    getAccessToken?: () => Promise<string | null>
    onUnauthorized?: () => void
}

/** Scalar values that can be serialised as URL query parameters. */
export type QueryParamValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryParamValue | QueryParamValue[]>

/** Per-request options passed to ApiClient.request() and the verb helpers. */
export interface RequestOptions {
    /** Additional headers merged on top of the default Content-Type / Authorization headers. */
    headers?: Record<string, string>
    /** Query string parameters appended to the URL. Arrays are repeated: ?tag=a&tag=b */
    params?: QueryParams
    /** AbortSignal for cancelling the request (e.g. from an AbortController). */
    signal?: AbortSignal
}

/** @internal — kept for backwards compatibility with direct request() calls. */
export interface ApiRequestOptions {
    method: HttpMethod
    path: string
    body?: unknown
    headers?: Record<string, string>
}
