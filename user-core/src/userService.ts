// userService.ts
import { UserRepository } from "./userRepository"

export class UserService {
    constructor(private repo: UserRepository) { }

    async getCurrentUser() {
        return this.repo.getMe()
    }

    async updateDisplayName(name: string) {
        if (name.length < 2) {
            throw new Error("Display name too short")
        }

        return this.repo.updateProfile({ displayName: name })
    }
}