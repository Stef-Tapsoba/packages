// authService.ts

import { AuthApi } from "./types"
import { AuthStorage } from "./storage"
import { Session } from "./session"
import { SessionExpiredError } from "./errors"

// Refresh the token this many milliseconds before it actually expires
const REFRESH_BUFFER_MS = 60_000

export class AuthService {
    constructor(
        private api: AuthApi,
        private storage: AuthStorage
    ) {}

    async login(email: string, password: string): Promise<Session> {
        const session = await this.api.login(email, password)
        await this.storage.set("session", JSON.stringify(session))
        return session
    }

    async logout() {
        await this.storage.remove("session")
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
     */
    async getAccessToken(): Promise<string> {
        const session = await this.getSession()

        if (!session) {
            throw new SessionExpiredError("No active session")
        }

        const needsRefresh = session.expiresAt - Date.now() < REFRESH_BUFFER_MS

        if (!needsRefresh) {
            return session.accessToken
        }

        if (!session.refreshToken) {
            await this.logout()
            throw new SessionExpiredError("Session expired and no refresh token available")
        }

        const refreshed = await this.api.refresh(session.refreshToken)
        await this.storage.set("session", JSON.stringify(refreshed))
        return refreshed.accessToken
    }
}
