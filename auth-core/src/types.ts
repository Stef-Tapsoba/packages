// types.ts

import { Session } from "./session"

export interface AuthApi {
    login(email: string, password: string): Promise<Session>
    refresh(refreshToken: string): Promise<Session>
}