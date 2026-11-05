import { describe, it, expect } from 'vitest'
import { computeTotal, generateFeedback } from '../utils/scoring'
import type { Rubric } from '../lib/types'

const rubric: Rubric = {
  id: 'r1',
  title: 't',
  criteria: [
    { id: 'c1', name: 'A', weight: 1, levels: [
      { score: 1, description: '', feedback: '부족' },
      { score: 2, description: '', feedback: '보통' },
      { score: 3, description: '', feedback: '우수' },
      { score: 4, description: '', feedback: '탁월' },
    ] },
  ],
  createdAt: 0,
  updatedAt: 0,
}

describe('scoring', () => {
  it('computes 100 when max level selected', () => {
    expect(computeTotal(rubric, { c1: 3 })).toBe(100)
  })
  it('computes 50 when mid', () => {
    expect(computeTotal(rubric, { c1: 1 })).toBe(50)
  })
  it('generates feedback', () => {
    expect(generateFeedback(rubric, { c1: 3 })).toContain('탁월')
  })
})
