# Packages Monorepo

This repository contains a collection of reusable TypeScript packages for web and app development.  
Each package is designed to be modular, composable, and fully type-safe.  

---

## 📦 Packages

| Package Name       | Description                                                                   |
|--------------------|-------------------------------------------------------------------------------|
| `auth-core`        | Authentication logic and services (login, session management, storage, etc.). |
| `api-client`       | HTTP client and API helpers for communicating with backend services.          |
| `user-core`        | User management logic, including repositories and services for user data.     |
| `validation`       | Form and input validation library with reusable validators and schemas.       |
| `theme-tokens`     | Design system tokens for colors, spacing, typography, and themes.             |

---

## ⚡ Getting Started

### 1. Install Dependencies

```bash
# Root install
npm install
```

### 2. Build All Packages
```bash
# TypeScript project references ensure proper build order
tsc -b auth-core api-client user-core validation theme-tokens
```

### 3. Using Packages

You can import packages in your apps or other packages using the scoped names:

```typescript
import { validateLogin } from "@myorg/validation"
import { AuthService } from "@myorg/auth-core"
import { ApiClient } from "@myorg/api-client"
```

> Tip: Internal packages use scoped imports `(@myorg/...)` plus `tsconfig` path mapping.

---

## 🛠 Development

* Each package has its own `package.json` and `tsconfig.json`.
* Dependencies between packages are managed via project references.
* All packages are pure TypeScript for web and mobile usage.

### Folder Structure
```
packages/
├─ auth-core/
├─ api-client/
├─ user-core/
├─ validation/
└─ theme-tokens/
```

Inside each package:
```
src/
├─ index.ts
├─ <package-specific files>
package.json
tsconfig.json
```

---

## 🔗 Adding a New Package

1. Create a new folder under `packages/`.
2. Add `src/`, `package.json`, and `tsconfig.json`.
3. Set `"composite": true` in `tsconfig.json`.
4. Add project references to other packages if needed.
5. Add exports to `index.ts` for public API.
6. Add the new package to `tsc -b` command for root builds.

---

## Example Usage
```typescript
import { validateLogin } from "@myorg/validation"
import { AuthService } from "@myorg/auth-core"

const loginInput = { email: "test@example.com", password: "Password123" }
const result = validateLogin(loginInput)

if (result.valid) {
    const auth = new AuthService()
    auth.login(result.value)
} else {
    console.log(result.errors)
}
```

---

## 📝 Notes

* All packages are designed to be **reusable across apps and websites**.
* Validation and theme tokens are **UI-agnostic**, so they can work anywhere.
* Follow the existing folder and naming conventions for consistency.
* Extend validators, schemas, and tokens as needed; all packages are meant to be **composable**.
* Use tsc -b for incremental builds to save compile time.
