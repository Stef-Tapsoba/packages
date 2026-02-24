// authService.ts

import { AuthApi } from "./types"
import { AuthStorage } from "./storage"
import { Session } from "./session"
import { SessionExpiredError } from "./errors"
import { SessionEmitter } from "./sessionEmitter"

// Refresh the token this many milliseconds before it actually expires
const REFRESH_BUFFER_MS = 60_000

export class AuthService {
    readonly events: SessionEmitter

    constructor(
        private api: AuthApi,
        private storage: AuthStorage,
        emitter?: SessionEmitter
    ) {
        this.events = emitter ?? new SessionEmitter()
    }

    async login(email: string, password: string): Promise<Session> {
        const session = await this.api.login(email, password)
        await this.storage.set("session", JSON.stringify(session))
        this.events.emit("login")
        return session
    }

    async logout() {
        await this.storage.remove("session")
        this.events.emit("logout")
    }

    async getSession(): Promise<Session | null> {
        const raw = await this.storage.get("session")
        return raw ? JSON.parse(raw) : null
    }

    async isAuthenticated(): Promise<boolean> {
        const session = await this.getSession()
        return !!session && session.expiresAt > Date.now()
    }

    /**
     * Returns a valid access token, automatically refreshing if the session
     * is within REFRESH_BUFFER_MS of expiry. Throws SessionExpiredError if
     * no refresh token is available and the session has expired.
     *
     * Pass this as the `getAccessToken` option of ApiClient:
     *   new ApiClient({ getAccessToken: () => authService.getAccessToken() })
     */
    async getAccessToken(): Promise<string> {
        const session = await this.getSession()

        if (!session) {
            this.events.emit("expired")
            throw new SessionExpiredError("No active session")
        }

        const needsRefresh = session.expiresAt - Date.now() < REFRESH_BUFFER_MS

        if (!needsRefresh) {
            return session.accessToken
        }

        if (!session.refreshToken) {
            await this.storage.remove("session")
            this.events.emit("expired")
            throw new SessionExpiredError("Session expired and no refresh token available")
        }

        const refreshed = await this.api.refresh(session.refreshToken)
        await this.storage.set("session", JSON.stringify(refreshed))
        this.events.emit("refreshed")
        return refreshed.accessToken
    }
}
