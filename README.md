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
| `quiz-engine` | Generic React MCQ drill hook (`useDrill`) — question progression, scoring, missed-answer tracking, keyboard shortcuts. |
| `tts` | Web Speech API wrapper — `speak`, `speakAsync`, `cancel`, `isSpeaking`. Zero dependencies. |
| `srs` | Pure SM-2 spaced-repetition algorithm — `calcNextReview`, `getDueCards`. No storage, no framework. |

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

### `quiz-engine`

A generic React hook for multiple-choice drills. Handles question progression, answer selection, scoring, missed-answer tracking, and keyboard shortcuts (1–4 to select, Enter/Space to advance).

Requires React ≥ 18 as a peer dependency. Framework-agnostic types — bring your own question shape.

```typescript
import { useDrill } from "@myorg/quiz-engine"
import type { DrillQuestion } from "@myorg/quiz-engine"

// ── Minimum question shape ──
interface GrammarQ extends DrillQuestion {
    prompt: string
    explanation: string
}

const drill = useDrill<GrammarQ>(questions)

// drill.index       — current question index
// drill.selected    — chosen option string, or null
// drill.revealed    — true once an answer is locked in
// drill.score       — correct answers so far
// drill.done        — true after the last question
// drill.missed      — MissedEntry<GrammarQ>[] for review screen
// drill.handleSelect(opt) — lock in an answer
// drill.handleNext()      — advance (or finalise)
// drill.restart()         — reset to beginning
```

**Other use cases:** compliance training LMS, trivia / pub quiz, medical exam prep, product knowledge training, onboarding assessments.

---

### `tts`

A thin, stateless wrapper around the browser's `SpeechSynthesis` API.
No framework, no dependencies. The caller provides a BCP-47 language tag directly.

```typescript
import { speak, speakAsync, cancel, isSpeaking } from "@myorg/tts"

// Speak a word in Japanese
speak("ありがとう", "ja-JP")

// Slower rate for learners
speak("Bonjour tout le monde", "fr-FR", 0.75)

// Toggle: if already speaking, stop; otherwise start
function handleButton(text: string, lang: string) {
    if (isSpeaking()) { cancel(); return }
    speak(text, lang)
}

// Sequence multiple utterances (e.g. read an article paragraph by paragraph)
for (const paragraph of article.paragraphs) {
    await speakAsync(paragraph, "en-US")
}
```

**BCP-47 quick reference:** `"en-US"`, `"es-ES"`, `"fr-FR"`, `"it-IT"`, `"ja-JP"`, `"ko-KR"`, `"de-DE"`, `"zh-CN"`

**Other use cases:** accessibility / screen reader augmentation, e-commerce product descriptions, news reader apps, e-learning platforms.

---

### `srs`

A pure implementation of the SM-2 spaced-repetition algorithm. No storage layer, no React, no side effects — bring your own persistence.

```typescript
import { calcNextReview, getDueCards, INITIAL_STATE } from "@myorg/srs"
import type { SRSCardState, SRSQuality } from "@myorg/srs"

// Review a card and get the updated schedule
const state: SRSCardState = loadState(cardId) ?? INITIAL_STATE
const quality: SRSQuality = 4  // 0=blackout … 5=perfect
const { nextState, nextLabel } = calcNextReview(state, quality)
saveState(cardId, nextState)
console.log(nextLabel)  // e.g. "in 6 days"

// Find which cards are due today (max 20 new cards per session)
const allStates = loadAllStates()    // Record<string, SRSCardState>
const dueIds = getDueCards(allStates, deck.map(c => c.id), 20)
startSession(dueIds)
```

**Quality grades:**

| Grade | Meaning |
|---|---|
| 0 | Complete blackout |
| 1 | Wrong — correct felt familiar |
| 2 | Wrong — easy after reveal |
| 3 | Correct but effortful |
| 4 | Correct with minor hesitation |
| 5 | Perfect, instant recall |

**Other use cases:** vocabulary trainers, medical/certification exam prep, employee onboarding, language learning apps, trivia games with difficulty scaling.

---

## Development

### Folder Structure

```
packages/
├─ auth-core/
├─ api-client/
├─ event-bus/
├─ quiz-engine/
├─ srs/
├─ storage/
├─ theme-tokens/
│  └─ scripts/
│     └─ generate-css.ts
├─ tts/
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