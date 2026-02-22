// authService.ts

import { AuthApi } from "./types"
import { AuthStorage } from "./storage"
import { Session } from "./session"

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
}