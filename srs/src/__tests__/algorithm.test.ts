import { describe, it, expect } from "vitest"
import { calcNextReview, getDueCards, INITIAL_STATE } from "../algorithm"
import type { SRSCardState } from "../types"

const DAY_MS = 24 * 60 * 60 * 1000

// Helper: build a card state from partial overrides on top of INITIAL_STATE
function makeState(overrides: Partial<SRSCardState> = {}): SRSCardState {
    return { ...INITIAL_STATE, ...overrides }
}

describe("INITIAL_STATE", () => {
    it("has the expected shape and default values", () => {
        expect(INITIAL_STATE).toEqual({
            easeFactor: 2.5,
            reviewCount: 0,
            streak: 0,
            nextReviewAt: 0,
            intervalDays: 0,
        })
    })

    it("easeFactor starts at 2.5", () => {
        expect(INITIAL_STATE.easeFactor).toBe(2.5)
    })

    it("nextReviewAt is 0 (card is immediately due)", () => {
        expect(INITIAL_STATE.nextReviewAt).toBe(0)
    })
})

describe("calcNextReview() — ease factor adjustments", () => {
    const NOW = 1_000_000_000_000

    it.each([0, 1, 2, 3, 4, 5] as const)(
        "quality %i produces correct EF (SM-2 formula, floor 1.3)",
        (q) => {
            const state = makeState({ easeFactor: 2.5 })
            const { nextState } = calcNextReview(state, q, NOW)
            const expected = Math.max(1.3, 2.5 + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
            expect(nextState.easeFactor).toBeCloseTo(expected, 10)
        },
    )

    it("EF never drops below 1.3 — quality 0 from already-low EF", () => {
        const state = makeState({ easeFactor: 1.3 })
        const { nextState } = calcNextReview(state, 0, NOW)
        expect(nextState.easeFactor).toBe(1.3)
    })

    it("EF never drops below 1.3 — repeated quality 0 from default EF", () => {
        let state = makeState()
        for (let i = 0; i < 10; i++) {
            ;({ nextState: state } = calcNextReview(state, 0, NOW))
        }
        expect(state.easeFactor).toBeGreaterThanOrEqual(1.3)
    })

    it("quality 5 increases EF above 2.5", () => {
        const state = makeState({ easeFactor: 2.5 })
        const { nextState } = calcNextReview(state, 5, NOW)
        expect(nextState.easeFactor).toBeGreaterThan(2.5)
    })
})

describe("calcNextReview() — streak and interval progression", () => {
    const NOW = 1_000_000_000_000

    it("first correct answer (streak 0→1) sets interval to 1 day", () => {
        const state = makeState({ streak: 0, intervalDays: 0 })
        const { nextState } = calcNextReview(state, 4, NOW)
        expect(nextState.streak).toBe(1)
        expect(nextState.intervalDays).toBe(1)
    })

    it("second correct answer (streak 1→2) sets interval to 6 days", () => {
        const state = makeState({ streak: 1, intervalDays: 1 })
        const { nextState } = calcNextReview(state, 4, NOW)
        expect(nextState.streak).toBe(2)
        expect(nextState.intervalDays).toBe(6)
    })

    it("third correct answer (streak 2→3) uses round(prevInterval * EF)", () => {
        const state = makeState({ streak: 2, intervalDays: 6, easeFactor: 2.5 })
        const { nextState } = calcNextReview(state, 4, NOW)
        expect(nextState.streak).toBe(3)
        const expectedEF = Math.max(1.3, 2.5 + 0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))
        expect(nextState.intervalDays).toBe(Math.round(6 * expectedEF))
    })

    it("fourth+ correct answer continues multiplying by EF", () => {
        const state = makeState({ streak: 3, intervalDays: 15, easeFactor: 2.5 })
        const { nextState } = calcNextReview(state, 4, NOW)
        const expectedEF = Math.max(1.3, 2.5 + 0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))
        expect(nextState.intervalDays).toBe(Math.round(15 * expectedEF))
    })
})

describe("calcNextReview() — failure resets", () => {
    const NOW = 1_000_000_000_000

    it.each([0, 1, 2] as const)(
        "quality %i (failure) resets streak to 0 and interval to 1",
        (q) => {
            const state = makeState({ streak: 5, intervalDays: 30 })
            const { nextState } = calcNextReview(state, q, NOW)
            expect(nextState.streak).toBe(0)
            expect(nextState.intervalDays).toBe(1)
        },
    )

    it("quality 3 (pass boundary) does not reset streak", () => {
        const state = makeState({ streak: 3, intervalDays: 10 })
        const { nextState } = calcNextReview(state, 3, NOW)
        expect(nextState.streak).toBe(4)
    })
})

describe("calcNextReview() — nextReviewAt timestamp", () => {
    const NOW = 1_000_000_000_000

    it("nextReviewAt = now + intervalDays * DAY_MS", () => {
        const state = makeState({ streak: 0, intervalDays: 0 })
        const { nextState } = calcNextReview(state, 4, NOW)
        expect(nextState.nextReviewAt).toBe(NOW + nextState.intervalDays * DAY_MS)
    })

    it("custom `now` parameter shifts nextReviewAt accordingly", () => {
        const CUSTOM_NOW = 2_000_000_000_000
        const state = makeState({ streak: 0, intervalDays: 0 })
        const { nextState } = calcNextReview(state, 4, CUSTOM_NOW)
        expect(nextState.nextReviewAt).toBe(CUSTOM_NOW + nextState.intervalDays * DAY_MS)
    })

    it("default now parameter uses a real timestamp", () => {
        const before = Date.now()
        const state = makeState({ streak: 0 })
        const { nextState } = calcNextReview(state, 4)
        const after = Date.now()
        expect(nextState.nextReviewAt).toBeGreaterThanOrEqual(before + DAY_MS)
        expect(nextState.nextReviewAt).toBeLessThanOrEqual(after + nextState.intervalDays * DAY_MS)
    })
})

describe("calcNextReview() — reviewCount increments", () => {
    const NOW = 1_000_000_000_000

    it("reviewCount increments by 1 on every call", () => {
        const state = makeState({ reviewCount: 7 })
        const { nextState } = calcNextReview(state, 4, NOW)
        expect(nextState.reviewCount).toBe(8)
    })

    it("reviewCount increments even on failure", () => {
        const state = makeState({ reviewCount: 3 })
        const { nextState } = calcNextReview(state, 0, NOW)
        expect(nextState.reviewCount).toBe(4)
    })
})

describe("calcNextReview() — 1000 consecutive passes", () => {
    it("streak reaches 1000 after 1000 quality-5 passes", () => {
        let state = makeState()
        const NOW = 1_000_000_000_000
        for (let i = 0; i < 1000; i++) {
            ;({ nextState: state } = calcNextReview(state, 5, NOW))
        }
        expect(state.streak).toBe(1000)
        // reviewCount tracks every review
        expect(state.reviewCount).toBe(1000)
    })

    it("intervalDays is capped at 365 days after many passes — never overflows to Infinity", () => {
        let state = makeState()
        const NOW = 1_000_000_000_000
        for (let i = 0; i < 1000; i++) {
            ;({ nextState: state } = calcNextReview(state, 5, NOW))
        }
        expect(state.intervalDays).toBe(365)
        expect(Number.isFinite(state.intervalDays)).toBe(true)
    })
})

describe("calcNextReview() — nextLabel", () => {
    const NOW = 1_000_000_000_000

    it("returns 'tomorrow' after first correct answer (interval = 1)", () => {
        const state = makeState({ streak: 0 })
        const { nextLabel } = calcNextReview(state, 4, NOW)
        expect(nextLabel).toBe("tomorrow")
    })

    it("returns 'in N days' for interval 2–6", () => {
        const state = makeState({ streak: 1, intervalDays: 1 })
        const { nextLabel } = calcNextReview(state, 4, NOW)
        // streak 1→2 gives interval 6
        expect(nextLabel).toBe("in 6 days")
    })
})

// ─── getDueCards ─────────────────────────────────────────────────────────────

describe("getDueCards()", () => {
    const NOW = 1_000_000_000_000

    it("returns empty array when allIds is empty", () => {
        expect(getDueCards({}, [], undefined, NOW)).toEqual([])
    })

    it("includes cards with nextReviewAt === 0 (never reviewed) as new cards", () => {
        const states = { a: makeState({ nextReviewAt: 0 }) }
        expect(getDueCards(states, ["a"], undefined, NOW)).toContain("a")
    })

    it("includes cards with no state entry as new cards", () => {
        expect(getDueCards({}, ["a", "b"], undefined, NOW)).toEqual(["a", "b"])
    })

    it("includes overdue cards (nextReviewAt <= now)", () => {
        const states = { a: makeState({ nextReviewAt: NOW - 1, streak: 1, intervalDays: 1 }) }
        expect(getDueCards(states, ["a"], undefined, NOW)).toContain("a")
    })

    it("includes card at exact boundary (nextReviewAt === now)", () => {
        const states = { a: makeState({ nextReviewAt: NOW, streak: 1, intervalDays: 1 }) }
        expect(getDueCards(states, ["a"], undefined, NOW)).toContain("a")
    })

    it("excludes card one millisecond in the future (nextReviewAt === now + 1)", () => {
        const states = { a: makeState({ nextReviewAt: NOW + 1, streak: 1, intervalDays: 1 }) }
        expect(getDueCards(states, ["a"], undefined, NOW)).not.toContain("a")
    })

    it("excludes future cards entirely", () => {
        const states = {
            a: makeState({ nextReviewAt: NOW + DAY_MS, streak: 2, intervalDays: 6 }),
        }
        expect(getDueCards(states, ["a"], undefined, NOW)).toEqual([])
    })

    it("maxNew=0 returns only overdue cards, no new cards", () => {
        const states = {
            overdue: makeState({ nextReviewAt: NOW - 1000, streak: 1, intervalDays: 1 }),
        }
        const allIds = ["overdue", "new1", "new2"]
        const result = getDueCards(states, allIds, 0, NOW)
        expect(result).toContain("overdue")
        expect(result).not.toContain("new1")
        expect(result).not.toContain("new2")
    })

    it("maxNew caps the number of new cards returned", () => {
        const allIds = ["n1", "n2", "n3", "n4", "n5"]
        const result = getDueCards({}, allIds, 2, NOW)
        expect(result).toHaveLength(2)
    })

    it("overdue cards appear before new cards in the result", () => {
        const states = {
            overdue: makeState({ nextReviewAt: NOW - 1000, streak: 1, intervalDays: 1 }),
        }
        const allIds = ["new1", "overdue"]
        const result = getDueCards(states, allIds, undefined, NOW)
        expect(result.indexOf("overdue")).toBeLessThan(result.indexOf("new1"))
    })

    it("returns overdue + capped new cards together", () => {
        const states = {
            overdue1: makeState({ nextReviewAt: NOW - 5000, streak: 1, intervalDays: 1 }),
            overdue2: makeState({ nextReviewAt: NOW - 1000, streak: 1, intervalDays: 1 }),
        }
        const allIds = ["overdue1", "overdue2", "new1", "new2", "new3"]
        const result = getDueCards(states, allIds, 1, NOW)
        expect(result).toContain("overdue1")
        expect(result).toContain("overdue2")
        // only 1 new card allowed
        const newInResult = result.filter(id => id.startsWith("new"))
        expect(newInResult).toHaveLength(1)
    })

    it("when maxNew is undefined, all new cards are returned", () => {
        const allIds = ["n1", "n2", "n3", "n4"]
        const result = getDueCards({}, allIds, undefined, NOW)
        expect(result).toHaveLength(4)
        expect(result).toEqual(allIds)
    })

    it("does not include future card even when mixed with due cards", () => {
        const states = {
            future: makeState({ nextReviewAt: NOW + DAY_MS, streak: 2, intervalDays: 6 }),
            due: makeState({ nextReviewAt: NOW - 100, streak: 1, intervalDays: 1 }),
        }
        const result = getDueCards(states, ["future", "due"], undefined, NOW)
        expect(result).toContain("due")
        expect(result).not.toContain("future")
    })
})
