// session.ts
export interface Session {
    accessToken: string
    refreshToken?: string
    userId: string
    expiresAt: number
}