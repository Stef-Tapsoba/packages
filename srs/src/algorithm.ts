import type { SRSCardState, SRSQuality, SRSResult } from "./types"

/** Default starting state for a brand-new card. */
export const INITIAL_STATE: SRSCardState = {
    easeFactor: 2.5,
    reviewCount: 0,
    streak: 0,
    nextReviewAt: 0,
    intervalDays: 0,
}

/**
 * `calcNextReview` — pure SM-2 scheduling function.
 *
 * Given a card's current state and the user's quality grade, returns the
 * updated state and next review timestamp. No side effects, no I/O.
 *
 * Based on the SuperMemo SM-2 algorithm (1987).
 * Reference: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
 *
 * @param state   - Current persisted state for this card.
 * @param quality - User's recall quality, 0–5 (see `SRSQuality`).
 * @param now     - Current timestamp in ms. Defaults to `Date.now()`.
 * @returns `{ nextState, nextLabel }` — persist `nextState` to storage.
 *
 * @example
 * // ── Flashcard / vocabulary trainer ──
 * const state = loadCardState(card.id) ?? INITIAL_STATE
 * const { nextState, nextLabel } = calcNextReview(state, userGrade)
 * saveCardState(card.id, nextState)
 * showToast(`Next review: ${nextLabel}`)
 *
 * @example
 * // ── Medical terminology / certification exam prep ──
 * // Grade automatically from typed answer match
 * function gradeTyped(userInput: string, correct: string): SRSQuality {
 *   const norm = (s: string) => s.trim().toLowerCase()
 *   return norm(userInput) === norm(correct) ? 4 : 1
 * }
 * const { nextState } = calcNextReview(cardState, gradeTyped(input, card.answer))
 *
 * @example
 * // ── Language learning app with multiple quality levels ──
 * // Map UI buttons to SRS quality grades
 * const GRADE_MAP = { "Again": 1, "Hard": 2, "Good": 4, "Easy": 5 } as const
 * const grade = GRADE_MAP[buttonLabel]
 * const { nextState } = calcNextReview(state, grade)
 *
 * @example
 * // ── Employee compliance / onboarding training ──
 * // Track mastery: only mark a policy as "learned" once interval > 21 days
 * const { nextState } = calcNextReview(state, quality)
 * if (nextState.intervalDays >= 21) markPolicyMastered(policy.id)
 *
 * @example
 * // ── Trivia / quiz game with streak bonuses ──
 * // Reward players with points proportional to the SRS interval
 * const { nextState } = calcNextReview(state, quality)
 * const points = Math.round(nextState.intervalDays * 10)
 * addScore(user.id, points)
 */
export function calcNextReview(
    state: SRSCardState,
    quality: SRSQuality,
    now = Date.now(),
): SRSResult {
    const passed = quality >= 3

    // Update ease factor (SM-2 formula; floored at 1.3)
    const newEF = Math.max(
        1.3,
        state.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    )

    let newInterval: number
    let newStreak: number

    if (!passed) {
        // Failed — reset streak and restart short intervals
        newStreak = 0
        newInterval = 1
    } else {
        newStreak = state.streak + 1
        if (newStreak === 1) {
            newInterval = 1
        } else if (newStreak === 2) {
            newInterval = 6
        } else {
            newInterval = Math.min(365, Math.round(state.intervalDays * newEF))
        }
    }

    const nextReviewAt = now + newInterval * 24 * 60 * 60 * 1000

    const nextState: SRSCardState = {
        easeFactor: newEF,
        reviewCount: state.reviewCount + 1,
        streak: newStreak,
        nextReviewAt,
        intervalDays: newInterval,
    }

    return { nextState, nextLabel: formatLabel(newInterval) }
}

/**
 * `getDueCards` — filter a set of card states down to those due for review.
 *
 * Cards with `nextReviewAt === 0` (never reviewed) are always included.
 * New-card quota is applied after overdue cards: if `maxNew` is set, at most
 * that many never-reviewed cards are returned per call.
 *
 * @param states  - Map of card ID → `SRSCardState` (from your storage layer).
 * @param allIds  - All card IDs in the current deck/set.
 * @param maxNew  - Cap on new (never-reviewed) cards returned. Default: unlimited.
 * @param now     - Current timestamp in ms. Defaults to `Date.now()`.
 * @returns Ordered array of due card IDs: overdue first, then new cards.
 *
 * @example
 * // ── Daily review session ──
 * const states = loadAllStates()     // Record<string, SRSCardState>
 * const deck = loadDeck()            // { id: string; ... }[]
 * const due = getDueCards(states, deck.map(c => c.id), 20)
 * startSession(due.map(id => deck.find(c => c.id === id)!))
 *
 * @example
 * // ── Review count badge on dashboard ──
 * const dueCount = getDueCards(loadAllStates(), allIds).length
 * setBadge(dueCount > 0 ? String(dueCount) : "")
 */
export function getDueCards(
    states: Record<string, SRSCardState>,
    allIds: string[],
    maxNew?: number,
    now = Date.now(),
): string[] {
    const overdue: string[] = []
    const newCards: string[] = []

    for (const id of allIds) {
        const s = states[id]
        if (!s || s.nextReviewAt === 0) {
            newCards.push(id)
        } else if (s.nextReviewAt <= now) {
            overdue.push(id)
        }
    }

    const cappedNew = maxNew !== undefined ? newCards.slice(0, maxNew) : newCards
    return [...overdue, ...cappedNew]
}

// ── Internal helper ──────────────────────────────────────────────────────────

function formatLabel(intervalDays: number): string {
    if (intervalDays < 1) return "in a few minutes"
    if (intervalDays === 1) return "tomorrow"
    if (intervalDays < 7) return `in ${intervalDays} days`
    if (intervalDays < 14) return "in 1 week"
    if (intervalDays < 30) return `in ${Math.round(intervalDays / 7)} weeks`
    if (intervalDays < 60) return "in 1 month"
    return `in ${Math.round(intervalDays / 30)} months`
}
