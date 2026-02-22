// client.ts

import { ApiClientConfig, HttpMethod } from "./types"
import { parseResponse } from "./request"
import { UnauthorizedError } from "./errors"

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
        headers?: Record<string, string>
    ): Promise<T> {
        const res = await fetch(
            `${this.config.baseUrl}${path}`,
            {
                method,
                headers: await this.buildHeaders(headers),
                body: body ? JSON.stringify(body) : undefined
            }
        )

        try {
            return await parseResponse(res) as T
        } catch (e) {
            if (e instanceof UnauthorizedError) {
                this.config.onUnauthorized?.()
            }
            throw e
        }
    }

    get<T>(path: string, headers?: Record<string, string>) {
        return this.request<T>("GET", path, undefined, headers)
    }

    post<T>(path: string, body?: unknown) {
        return this.request<T>("POST", path, body)
    }

    put<T>(path: string, body?: unknown) {
        return this.request<T>("PUT", path, body)
    }

    patch<T>(path: string, body?: unknown) {
        return this.request<T>("PATCH", path, body)
    }

    delete<T>(path: string) {
        return this.request<T>("DELETE", path)
    }
}