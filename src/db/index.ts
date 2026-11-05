import Dexie, { type Table } from 'dexie'
import type { Rubric, Student, Grade } from '../lib/types'

export class AppDB extends Dexie {
  rubrics!: Table<Rubric, string>
  students!: Table<Student, string>
  grades!: Table<Grade, string>

  constructor() {
    super('rubric-grader')
    this.version(1).stores({
      rubrics: 'id, title, updatedAt',
      students: 'id, number, name',
      grades: 'id, rubricId, studentId, [rubricId+studentId]',
    })
  }
}

export const db = new AppDB()
