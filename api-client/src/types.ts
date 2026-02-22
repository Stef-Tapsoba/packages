// types.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiClientConfig {
    baseUrl: string
    getAccessToken?: () => Promise<string | null>
    onUnauthorized?: () => void
}

export interface ApiRequestOptions {
    method: HttpMethod
    path: string
    body?: unknown
    headers?: Record<string, string>
}