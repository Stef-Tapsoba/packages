// userService.ts
import { UserRepository } from "./userRepository"
import { InvalidProfileError } from "./errors"

export class UserService {
    constructor(private readonly repo: UserRepository) { }

    async getCurrentUser() {
        return this.repo.getMe()
    }

    async updateDisplayName(name: string) {
        if (name.length < 2) {
            throw new InvalidProfileError("Display name too short")
        }

        return this.repo.updateProfile({ displayName: name })
    }
}