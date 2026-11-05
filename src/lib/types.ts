export interface Level {
  score: number
  description: string
  feedback: string
}

export interface Criterion {
  id: string
  name: string
  weight: number
  levels: Level[]
}

export interface Rubric {
  id: string
  title: string
  description?: string
  criteria: Criterion[]
  createdAt: number
  updatedAt: number
}

export interface Student {
  id: string
  name: string
  number: string
}

export interface Grade {
  id: string
  rubricId: string
  studentId: string
  selections: Record<string, number>
  total: number
  comment: string
  gradedAt: number
}
