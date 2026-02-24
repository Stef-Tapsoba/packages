// tokens/animation.ts

/** Duration values in milliseconds for transitions and animations. */
export const duration = {
    instant: 0,
    fast: 100,
    normal: 200,
    slow: 350,
    slower: 500
} as const

/**
 * Named easing curves (CSS cubic-bezier values).
 * Use these instead of bare `ease`, `ease-in`, etc. for consistency.
 */
export const easing = {
    /** Standard: slight ease-in, noticeable ease-out. Good for most UI transitions. */
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    /** Ease-in: slow start, fast end. Good for elements leaving the screen. */
    in: "cubic-bezier(0.4, 0, 1, 1)",
    /** Ease-out: fast start, slow end. Good for elements entering the screen. */
    out: "cubic-bezier(0, 0, 0.2, 1)",
    /** Linear: constant speed. Good for continuous animations (spinners). */
    linear: "linear",
    /** Spring-like: overshoots slightly. Good for interactive feedback. */
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)"
} as const
