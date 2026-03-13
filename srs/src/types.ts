/**
 * Persistent state stored per card between review sessions.
 *
 * Persist this object (localStorage, DB, etc.) and pass it back into
 * `calcNextReview` each time the user reviews the card.
 */
export interface SRSCardState {
    /** SM-2 easiness factor. Starts at 2.5; floored at 1.3. */
    easeFactor: number
    /** Number of times the card has been reviewed. */
    reviewCount: number
    /** Consecutive correct-answer streak (resets to 0 on failure). */
    streak: number
    /**
     * Timestamp (ms since epoch) of the next scheduled review.
     * `0` means the card has never been reviewed and is immediately due.
     */
    nextReviewAt: number
    /** Interval in days between last review and the next scheduled one. */
    intervalDays: number
}

/**
 * How well the user recalled the card, on a 0–5 scale (SM-2 convention).
 *
 * | Value | Meaning                                        |
 * |-------|------------------------------------------------|
 * | 0     | Complete blackout — no recall at all           |
 * | 1     | Wrong answer; correct felt familiar on reveal  |
 * | 2     | Wrong answer; correct was easy to recall after |
 * | 3     | Correct but required significant effort        |
 * | 4     | Correct with minor hesitation                  |
 * | 5     | Perfect, immediate recall                      |
 *
 * Grades 0–2 reset the card's streak (it goes back into short-interval repetition).
 * Grades 3–5 advance the interval according to the easiness factor.
 */
export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Result returned by `calcNextReview`.
 */
export interface SRSResult {
    /** Updated card state — persist this to storage. */
    nextState: SRSCardState
    /** Human-readable label for when the card is next due. */
    nextLabel: string
}
