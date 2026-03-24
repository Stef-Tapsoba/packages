import { useState, useEffect } from "react"
import type { DrillQuestion, DrillState, MissedEntry } from "./types"

/**
 * `useDrill` — generic multiple-choice quiz state machine.
 *
 * Manages the full lifecycle of a timed or untimed MCQ drill:
 * question progression, answer selection, scoring, missed-answer tracking,
 * and keyboard shortcuts (1–4 to select, Enter/Space to advance).
 *
 * @typeParam Q - Your question type; must have `correct: string` and
 *   `options: string[]`. Add any extra fields you like (prompt, id, image…).
 *
 * @param questions - Array of questions to drill through.
 *
 * @example
 * // ── Language learning (current use case) ──
 * const drill = useDrill(grammarQuestions)
 *
 * @example
 * // ── Employee onboarding / compliance training ──
 * interface PolicyQuestion extends DrillQuestion {
 *   policy: string
 *   explanation: string
 * }
 * const drill = useDrill<PolicyQuestion>(complianceQuestions)
 * // On done: submit drill.score to an LMS or HR system
 *
 * @example
 * // ── Trivia / pub quiz app ──
 * interface TriviaQ extends DrillQuestion {
 *   category: "history" | "science" | "sport"
 *   difficulty: 1 | 2 | 3
 * }
 * const drill = useDrill<TriviaQ>(triviaRound)
 * // Show drill.missed at round end for "You got these wrong" screen
 *
 * @example
 * // ── Medical / certification exam prep ──
 * interface ExamQuestion extends DrillQuestion {
 *   explanation: string    // shown after reveal
 *   reference: string      // textbook citation
 * }
 * const drill = useDrill<ExamQuestion>(practiceExam)
 * // After done: export missed questions as a "weak areas" study list
 *
 * @example
 * // ── Product knowledge quiz (e-commerce staff training) ──
 * const drill = useDrill(productQuestions)
 * // Score threshold check: if (drill.score / questions.length < 0.8) requireRetake()
 */
export function useDrill<Q extends DrillQuestion>(questions: Q[]): DrillState<Q> {
    const [index, setIndex] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const [revealed, setRevealed] = useState(false)
    const [score, setScore] = useState(0)
    const [done, setDone] = useState(false)
    const [missed, setMissed] = useState<MissedEntry<Q>[]>([])

    function handleSelect(opt: string) {
        if (revealed) return
        setSelected(opt)
        setRevealed(true)
    }

    function advance(currentScore: number, currentIndex: number, currentSelected: string | null) {
        const q = questions[currentIndex]
        if (!q) return
        const isCorrect = currentSelected === q.correct
        const newScore = currentScore + (isCorrect ? 1 : 0)
        if (!isCorrect && currentSelected !== null) {
            setMissed(prev => [...prev, { question: q, yourAnswer: currentSelected }])
        }
        if (currentIndex + 1 >= questions.length) {
            setScore(newScore)
            setDone(true)
        } else {
            setScore(newScore)
            setIndex(i => i + 1)
            setSelected(null)
            setRevealed(false)
        }
    }

    function handleNext() {
        advance(score, index, selected)
    }

    function restart() {
        setIndex(0)
        setSelected(null)
        setRevealed(false)
        setScore(0)
        setDone(false)
        setMissed([])
    }

    // Keyboard shortcuts: 1–4 to select an option, Enter/Space to advance
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (done) return
            const q = questions[index]
            if (!q) return
            const digit = parseInt(e.key)
            if (digit >= 1 && digit <= 4 && !revealed) {
                const opt = q.options[digit - 1]
                if (opt !== undefined) { setSelected(opt); setRevealed(true) }
            } else if ((e.key === "Enter" || e.key === " ") && revealed) {
                e.preventDefault()
                advance(score, index, selected)
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [index, revealed, done, score, selected, questions])

    return { index, selected, revealed, score, done, missed, handleSelect, handleNext, restart }
}
