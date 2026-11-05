import type { Rubric, Grade } from '../lib/types'

export function maxLevelScore(c: { levels: { score: number }[] }): number {
  return c.levels.reduce((m, l) => Math.max(m, l.score), 0)
}

export function computeTotal(rubric: Rubric, selections: Record<string, number>): number {
  let num = 0
  let den = 0
  for (const c of rubric.criteria) {
    const idx = selections[c.id]
    const level = idx !== undefined ? c.levels[idx] : undefined
    const selScore = level ? level.score : 0
    const maxScore = maxLevelScore(c)
    num += c.weight * selScore
    den += c.weight * maxScore
  }
  if (den === 0) return 0
  return Math.round((num / den) * 1000) / 10
}

export function generateFeedback(rubric: Rubric, selections: Record<string, number>): string {
  const parts: string[] = []
  for (const c of rubric.criteria) {
    const idx = selections[c.id]
    if (idx === undefined) continue
    const level = c.levels[idx]
    if (level?.feedback) parts.push(`${c.name}: ${level.feedback}`)
  }
  return parts.join('\n')
}

export function gradeComplete(rubric: Rubric, selections: Record<string, number>): boolean {
  return rubric.criteria.every((c) => selections[c.id] !== undefined)
}

export type { Grade }
