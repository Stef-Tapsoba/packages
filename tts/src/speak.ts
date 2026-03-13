/**
 * speak — thin wrapper around the Web Speech API (SpeechSynthesis).
 *
 * Stateless, side-effect-only functions. No framework required.
 * The caller is responsible for mapping application language codes to BCP-47 tags.
 *
 * @example
 * // ── Language-learning app ──
 * // Map your own lang IDs to BCP-47 before calling
 * const BCP47: Record<string, string> = {
 *   es: "es-ES", fr: "fr-FR", it: "it-IT", ja: "ja-JP", ko: "ko-KR"
 * }
 * speak(flashcard.word, BCP47[selectedLang])
 * // Cancel if the user navigates away mid-utterance
 * cancel()
 *
 * @example
 * // ── Accessibility / screen-reader augmentation ──
 * // Read tooltip content aloud on hover for low-vision users
 * button.addEventListener("mouseenter", () => speak(button.dataset.tooltip ?? "", "en-US"))
 * button.addEventListener("mouseleave", cancel)
 *
 * @example
 * // ── E-commerce product page ──
 * // "Listen to product description" button
 * function handleListen(description: string, userLocale: string) {
 *   if (isSpeaking()) { cancel(); return }
 *   speak(description, userLocale, 0.9)   // slightly slower for clarity
 * }
 *
 * @example
 * // ── News reader / article app ──
 * // Read-aloud with paragraph-by-paragraph progress
 * async function readArticle(paragraphs: string[], lang: string) {
 *   for (const p of paragraphs) {
 *     if (!isSpeaking()) break  // user cancelled
 *     await speakAsync(p, lang)
 *   }
 * }
 *
 * @example
 * // ── E-learning / quiz platform ──
 * // Auto-read each question stem when it appears, cancel on answer selection
 * useEffect(() => {
 *   speak(question.stem, "en-US")
 *   return cancel
 * }, [question.id])
 */

/**
 * Speak `text` using the browser's SpeechSynthesis API.
 *
 * If speech is already in progress, it is cancelled before the new utterance
 * starts so callers don't need to guard manually.
 *
 * @param text   - The string to speak.
 * @param bcp47  - BCP-47 language tag, e.g. `"ja-JP"`, `"fr-FR"`, `"en-US"`.
 * @param rate   - Speech rate multiplier. `1` = normal, `0.7` = slow, `1.5` = fast.
 *                 Defaults to `1`.
 */
export function speak(text: string, bcp47: string, rate = 1): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = bcp47
    utt.rate = rate
    window.speechSynthesis.speak(utt)
}

/**
 * Return a Promise that resolves when the utterance ends (or rejects on error).
 * Useful for sequencing multiple utterances.
 *
 * @param text  - The string to speak.
 * @param bcp47 - BCP-47 language tag.
 * @param rate  - Speech rate multiplier. Defaults to `1`.
 */
export function speakAsync(text: string, bcp47: string, rate = 1): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
            resolve()
            return
        }
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(text)
        utt.lang = bcp47
        utt.rate = rate
        utt.onend = () => resolve()
        utt.onerror = (e) => reject(e)
        window.speechSynthesis.speak(utt)
    })
}

/**
 * Cancel any in-progress speech immediately.
 */
export function cancel(): void {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
}

/**
 * Returns `true` if the browser is currently speaking.
 */
export function isSpeaking(): boolean {
    if (typeof window === "undefined" || !window.speechSynthesis) return false
    return window.speechSynthesis.speaking
}
