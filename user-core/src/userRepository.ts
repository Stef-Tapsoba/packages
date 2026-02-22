// userRepository.ts
import { ApiClient } from "@myorg/api-client"
import { User } from "./models"
import { mapUser } from "./mappers"
import { UserApiResponse } from "./types"

export class UserRepository {
    constructor(private api: ApiClient) { }

    async getMe(): Promise<User> {
        const res = await this.api.get<UserApiResponse>("/me")
        return mapUser(res)
    }

    async updateProfile(
        data: Partial<Pick<User, "displayName" | "avatarUrl">>
    ): Promise<User> {
        const res = await this.api.put<UserApiResponse>(
            "/me",
            data
        )
        return mapUser(res)
    }
}