// tokens/breakpoints.ts

/**
 * Breakpoint values in pixels (min-width).
 * These are the lower bounds of each responsive tier.
 *
 * Usage in CSS:
 *   @media (min-width: 768px) { ... }
 *
 * Usage in JS/TS (e.g. with a matchMedia utility):
 *   window.matchMedia(`(min-width: ${breakpoints.md}px)`)
 */
export const breakpoints = {
    /** Extra-small: default / mobile-first base. */
    xs: 0,
    /** Small: large phones, ≥ 480px. */
    sm: 480,
    /** Medium: tablets, ≥ 768px. */
    md: 768,
    /** Large: small desktops, ≥ 1024px. */
    lg: 1024,
    /** Extra-large: standard desktops, ≥ 1280px. */
    xl: 1280,
    /** 2x: wide desktops, ≥ 1536px. */
    "2xl": 1536
} as const

export type Breakpoint = keyof typeof breakpoints
