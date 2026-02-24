# Packages Monorepo

A collection of reusable TypeScript packages for web and app development.
Each package is modular, composable, and fully type-safe.

---

## Packages

| Package | Description |
|---|---|
| `auth-core` | Authentication: login, session management, auto token refresh, storage abstraction, session events. |
| `api-client` | HTTP client with auth token injection, typed errors, query params, and request cancellation. |
| `user-core` | User management via repository pattern — fetching, mapping, and updating user data. |
| `validation` | Field validators, schema validators, async validation, and cross-field matching. |
| `theme-tokens` | Design system tokens (colors, spacing, typography, shadows, animation, z-index, breakpoints) with generated CSS custom properties. |
| `storage` | Concrete `AuthStorage` implementations: `LocalStorageAdapter`, `SessionStorageAdapter`, `MemoryStorageAdapter`. |
| `event-bus` | Generic typed event bus for cross-package communication. |

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Build All Packages

TypeScript project references enforce the correct build order automatically.

```bash
tsc -b
```

### 3. Using Packages

```typescript
import { AuthService, LocalStorageAdapter } from "@myorg/auth-core"
import { LocalStorageAdapter } from "@myorg/storage"
import { ApiClient } from "@myorg/api-client"
import { validateLogin } from "@myorg/validation"
```

> Internal packages use scoped `@myorg/...` imports resolved via `tsconfig` path aliases.

---

## Package Details

### `auth-core`

Handles session lifecycle. The `AuthStorage` interface is platform-agnostic — swap in any adapter.

```typescript
import { AuthService } from "@myorg/auth-core"
import { LocalStorageAdapter } from "@myorg/storage"

const auth = new AuthService(myAuthApi, new LocalStorageAdapter())

// Auto-refreshes the token if within 60s of expiry.
// Throws SessionExpiredError if refresh is not possible.
const token = await auth.getAccessToken()

// React to session lifecycle events anywhere in your app.
auth.events.on("expired", () => router.push("/login"))
auth.events.on("logout", () => queryCache.clear())
auth.events.on("refreshed", () => console.log("token refreshed"))
```

**`AuthApi` interface** — implement this to connect to your backend:
```typescript
interface AuthApi {
    login(email: string, password: string): Promise<Session>
    refresh(refreshToken: string): Promise<Session>
}
```

**Session events:** `login` | `logout` | `refreshed` | `expired`

---

### `api-client`

Fetch-based HTTP client. Wire `AuthService.getAccessToken` in for automatic token injection and refresh.

```typescript
import { ApiClient } from "@myorg/api-client"

const client = new ApiClient({
    baseUrl: "https://api.example.com",
    getAccessToken: () => auth.getAccessToken(),
    onUnauthorized: () => auth.logout()
})

// Query params — arrays are repeated: ?tag=a&tag=b
const users = await client.get("/users", {
    params: { page: 2, role: "admin", tag: ["active", "verified"] }
})

// Request cancellation via AbortController
const controller = new AbortController()
const data = await client.get("/slow", { signal: controller.signal })
controller.abort() // cancels the request
```

**Methods:** `get`, `post`, `put`, `patch`, `delete`

**Typed errors:**

| Status | Error class |
|---|---|
| 400 | `BadRequestError` |
| 401 | `UnauthorizedError` |
| 403 | `ForbiddenError` |
| 404 | `NotFoundError` |
| 5xx | `ServerError` |

---

### `validation`

Synchronous and async field/schema validation with typed error codes.

```typescript
import { validateLogin, validateAsync, validateMatch } from "@myorg/validation"

// Schema validation (sync)
const result = validateLogin({ email: "user@example.com", password: "Secure1" })
if (result.valid) { /* result.value is typed */ }
else { /* result.errors: ValidationError[] */ }

// Async validation — run all rules in parallel
const result = await validateAsync(input, [
    () => validateEmail(input.email),
    () => validateMatch(input.password, input.confirmPassword, "confirmPassword"),
    async () => {
        const taken = await api.checkUsername(input.username)
        return taken
            ? [{ field: "username", code: "MISMATCH", message: "Username already taken" }]
            : []
    }
])
```

**Validators:** `validateEmail`, `validatePassword`, `validateUsername`, `validateRequired`, `validateMatch`

**Schemas:** `validateLogin`, `validateProfile`

**Error codes:** `REQUIRED` | `INVALID_FORMAT` | `TOO_SHORT` | `TOO_LONG` | `WEAK_PASSWORD` | `MISMATCH` | `OUT_OF_RANGE` | `PATTERN_MISMATCH`

---

### `theme-tokens`

Design system tokens as TypeScript constants and generated CSS custom properties.

```typescript
import { spacing, lightTheme, darkTheme, duration, zIndex, breakpoints } from "@myorg/theme-tokens"

// Use in JS/TS (e.g. React Native, CSS-in-JS)
const styles = { padding: spacing.md, borderRadius: radii.lg }

// Responsive logic
window.matchMedia(`(min-width: ${breakpoints.md}px)`)
```

**Token groups:**

| Group | Example values |
|---|---|
| `colors` | `primary`, `secondary`, `danger`, `success`, `background`, `surface` |
| `spacing` | `xs` (4px) → `xl` (32px) |
| `radii` | `sm` (4px) → `full` (9999px) |
| `typography` | `fontFamily.body`, `fontSize.md` |
| `shadows` | `sm`, `md`, `lg`, `xl`, `inner`, `none` |
| `duration` | `fast` (100ms) → `slower` (500ms) |
| `easing` | `default`, `in`, `out`, `linear`, `spring` |
| `zIndex` | `base` → `tooltip` (named layers, no magic numbers) |
| `breakpoints` | `sm` (480px) → `2xl` (1536px) |

**Themes:** `lightTheme`, `darkTheme`

**CSS custom properties** are auto-generated from the TypeScript tokens — never edit the CSS files by hand:

```bash
npm run generate-css   # writes src/css/base.css, light.css, dark.css
```

Import the CSS in your app:
```css
@import "@myorg/theme-tokens/css/base.css";
@import "@myorg/theme-tokens/css/light.css";  /* default theme */
```

Apply dark theme by setting `data-theme="dark"` on any ancestor element:
```html
<html data-theme="dark">
```

---

### `storage`

Ready-made implementations of the `AuthStorage` interface from `auth-core`.

```typescript
import { LocalStorageAdapter } from "@myorg/storage"   // browser, persists across sessions
import { SessionStorageAdapter } from "@myorg/storage" // browser, clears on tab close
import { MemoryStorageAdapter } from "@myorg/storage"  // in-memory, for Node/SSR/tests
```

All adapters namespace keys (default prefix: `myorg`) to avoid collisions with other libraries.

---

### `event-bus`

A generic, type-safe event bus for decoupled cross-package communication.

```typescript
import { EventBus } from "@myorg/event-bus"

// Define your app's events as an interface — the bus is fully type-checked.
interface AppEvents {
    "user:logout":  void
    "cart:updated": { itemCount: number }
    "toast:show":   { message: string; level: "info" | "error" }
}

const bus = new EventBus<AppEvents>()

// on() returns an unsubscribe function.
const unsub = bus.on("cart:updated", ({ itemCount }) => updateBadge(itemCount))

// once() fires exactly once then removes itself.
bus.once("toast:show", ({ message, level }) => showToast(message, level))

bus.emit("cart:updated", { itemCount: 3 })
unsub() // remove the listener
```

---

## Development

### Folder Structure

```
packages/
├─ auth-core/
├─ api-client/
├─ event-bus/
├─ storage/
├─ theme-tokens/
│  └─ scripts/
│     └─ generate-css.ts
├─ user-core/
├─ validation/
└─ tsconfig.json          ← root project references
```

Inside each package:
```
src/
├─ index.ts               ← public API exports
├─ __tests__/             ← Vitest test files
└─ <package-specific files>
package.json
tsconfig.json
```

### Running Tests

```bash
# Inside any package with tests
npm test

# Watch mode
npm run test:watch
```

Packages with tests: `api-client`, `event-bus`, `validation`

### tsconfig conventions

- All packages use `"module": "ESNext"` + `"moduleResolution": "bundler"` (TypeScript 5).
- All packages set `"composite": true` to support project references.
- Cross-package imports are resolved via `paths` aliases in each package's `tsconfig.json`.

---

## Adding a New Package

1. Create a folder under `packages/` with `src/`, `package.json`, and `tsconfig.json`.
2. Copy the `tsconfig.json` from an existing package; update `paths` and `references` if it depends on other packages.
3. Add `"composite": true` — required for project references.
4. Add the package to the root `packages/tsconfig.json` references array.
5. Export your public API from `src/index.ts`.
6. Add a `__tests__/` folder with Vitest tests.

---

## Full Wiring Example

```typescript
import { AuthService } from "@myorg/auth-core"
import { LocalStorageAdapter } from "@myorg/storage"
import { ApiClient } from "@myorg/api-client"
import { EventBus } from "@myorg/event-bus"
import { UserService, UserRepository } from "@myorg/user-core"
import { validateLogin } from "@myorg/validation"

interface AppEvents {
    "auth:expired": void
    "auth:logout":  void
}

const bus    = new EventBus<AppEvents>()
const store  = new LocalStorageAdapter()
const auth   = new AuthService(myAuthApi, store)
const client = new ApiClient({
    baseUrl: "https://api.example.com",
    getAccessToken: () => auth.getAccessToken(),
    onUnauthorized: () => auth.logout()
})
const users  = new UserService(new UserRepository(client))

auth.events.on("expired", () => bus.emit("auth:expired"))
auth.events.on("logout",  () => bus.emit("auth:logout"))
bus.on("auth:expired", () => router.push("/login"))

// Login flow
const result = validateLogin({ email, password })
if (result.valid) {
    await auth.login(result.value.email, result.value.password)
    const me = await users.getCurrentUser()
}
```