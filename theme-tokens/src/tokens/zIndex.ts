// tokens/zIndex.ts

/**
 * Z-index scale for stacking layers.
 * Using named levels instead of magic numbers prevents z-index wars.
 *
 * Layer order (lowest to highest):
 *   base → raised → dropdown → sticky → overlay → modal → toast → tooltip
 */
export const zIndex = {
    /** Default stacking context — below everything floating. */
    base: 0,
    /** Slightly raised elements (e.g. cards on hover). */
    raised: 10,
    /** Dropdowns, autocomplete menus. */
    dropdown: 100,
    /** Sticky headers / sidebars. */
    sticky: 200,
    /** Background overlays / backdrops. */
    overlay: 300,
    /** Modal dialogs. */
    modal: 400,
    /** Toast notifications (above modals). */
    toast: 500,
    /** Tooltips (always on top). */
    tooltip: 600
} as const
