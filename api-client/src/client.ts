// client.ts

import { ApiClientConfig, HttpMethod, QueryParams, RequestOptions } from "./types"
import { parseResponse } from "./request"
import { UnauthorizedError } from "./errors"

function buildUrl(base: string, path: string, params?: QueryParams): string {
    const url = new URL(`${base}${path}`)

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            if (value == null) continue
            const values = Array.isArray(value) ? value : [value]
            for (const v of values) {
                if (v != null) url.searchParams.append(key, String(v))
            }
        }
    }

    return url.toString()
}

export class ApiClient {
    constructor(private config: ApiClientConfig) { }

    private async buildHeaders(extra?: Record<string, string>) {
        const token = this.config.getAccessToken
            ? await this.config.getAccessToken()
            : null

        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...extra
        }
    }

    async request<T>(
        method: HttpMethod,
        path: string,
        body?: unknown,
        options?: RequestOptions
    ): Promise<T> {
        const url = buildUrl(this.config.baseUrl, path, options?.params)

        const res = await fetch(url, {
            method,
            headers: await this.buildHeaders(options?.headers),
            body: body ? JSON.stringify(body) : undefined,
            signal: options?.signal
        })

        try {
            return await parseResponse(res) as T
        } catch (e) {
            if (e instanceof UnauthorizedError) {
                this.config.onUnauthorized?.()
            }
            throw e
        }
    }

    get<T>(path: string, options?: RequestOptions) {
        return this.request<T>("GET", path, undefined, options)
    }

    post<T>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>("POST", path, body, options)
    }

    put<T>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>("PUT", path, body, options)
    }

    patch<T>(path: string, body?: unknown, options?: RequestOptions) {
        return this.request<T>("PATCH", path, body, options)
    }

    delete<T>(path: string, options?: RequestOptions) {
        return this.request<T>("DELETE", path, undefined, options)
    }
}