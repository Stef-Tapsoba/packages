/**
 * Minimum shape a question must satisfy to work with useDrill.
 * Extend this interface in your app to attach extra fields (e.g. id, explanation,
 * difficulty, category) — the hook passes the full question object back to you
 * via `missed[].question` so you can render whatever you need.
 */
export interface DrillQuestion {
    /** The correct answer string — must match exactly one entry in `options`. */
    correct: string
    /** All answer choices shown to the user (2–6 recommended). */
    options: string[]
}

/**
 * A record of one wrong answer made during a drill session.
 *
 * @example
 * // Render a review list after the drill ends:
 * missed.map(m => (
 *   <div>
 *     <span>{m.question.prompt}</span>
 *     <span style={{ color: "red" }}>{m.yourAnswer}</span>
 *     <span style={{ color: "green" }}>{m.question.correct}</span>
 *   </div>
 * ))
 */
export interface MissedEntry<Q extends DrillQuestion> {
    question: Q
    yourAnswer: string
}

/** Return value of the `useDrill` hook. */
export interface DrillState<Q extends DrillQuestion> {
    /** Index of the currently displayed question (0-based). */
    index: number
    /** The answer the user has selected, or null if none yet. */
    selected: string | null
    /** True once the user has made a selection and the answer is shown. */
    revealed: boolean
    /** Number of correct answers so far. */
    score: number
    /** True when all questions have been answered. */
    done: boolean
    /** All questions answered incorrectly this session. */
    missed: MissedEntry<Q>[]
    /** Call with the chosen option string to lock in an answer. */
    handleSelect: (opt: string) => void
    /** Advance to the next question (or finalise if on the last one). */
    handleNext: () => void
    /** Reset the drill to the beginning, clearing score and missed list. */
    restart: () => void
}
