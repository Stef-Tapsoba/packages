// mappers.ts
import { User } from "./models"
import { UserApiResponse } from "./types"

export function mapUser(api: UserApiResponse): User {
    return {
        id: api.id,
        email: api.email_address,
        displayName: api.display_name,
        avatarUrl: api.avatar_url,
        createdAt: Date.parse(api.created_at)
    }
}