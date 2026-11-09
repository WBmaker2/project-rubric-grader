import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../db'
import type { Rubric, Student, Grade } from '../lib/types'
import { computeTotal, generateFeedback, gradeComplete } from '../utils/scoring'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ChevronLeft, ChevronRight, Save, Home } from 'lucide-react'
import { toast } from 'sonner'

function uid() { return crypto.randomUUID() }

export default function Grading() {
  const { rubricId } = useParams()
  const navigate = useNavigate()
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!rubricId) return
    db.rubrics.get(rubricId).then((r) => setRubric(r ?? null))
    db.students.orderBy('number').toArray().then(setStudents)
    db.grades.where('rubricId').equals(rubricId).toArray().then((gs) => {
      const m: Record<string, Grade> = {}
      for (const g of gs) m[g.studentId] = g
      setGrades(m)
    })
  }, [rubricId])

  const student = students[index]

  useEffect(() => {
    if (!student) return
    const g = grades[student.id]
    if (g) { setSelections({ ...g.selections }); setComment(g.comment) }
    else { setSelections({}); setComment('') }
  }, [student, grades])

  const saveGrade = useCallback(async (sel: Record<string, number>, cmt: string) => {
    if (!rubric || !student) return
    const total = computeTotal(rubric, sel)
    const auto = generateFeedback(rubric, sel)
    const finalComment = cmt || auto
    const existing = grades[student.id]
    const grade: Grade = {
      id: existing?.id ?? uid(),
      rubricId: rubric.id,
      studentId: student.id,
      selections: sel,
      total,
      comment: finalComment,
      gradedAt: Date.now(),
    }
    if (existing) await db.grades.put(grade)
    else await db.grades.add(grade)
    setGrades((prev) => ({ ...prev, [student.id]: grade }))
  }, [rubric, student, grades])

  function selectLevel(criterionId: string, levelIndex: number) {
    const next = { ...selections, [criterionId]: levelIndex }
    setSelections(next)
    const auto = generateFeedback(rubric!, next)
    setComment((prev) => (prev.trim() === '' ? auto : prev))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveGrade(next, (comment.trim() === '' ? auto : comment))
    }, 300)
  }

  if (!rubric) return <div className="p-6">로딩...</div>

  const total = computeTotal(rubric, selections)
  const complete = gradeComplete(rubric, selections)

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{rubric.title}</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <Home className="mr-1 h-4 w-4" /> 홈
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/export/${rubric.id}`)}>
          내보내기
        </Button>
      </div>

      {students.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          학생이 없습니다. 학생 관리에서 추가하세요.
        </CardContent></Card>
      )}

      {student && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{student.number} {student.name}</CardTitle>
              <Badge variant={complete ? 'default' : 'secondary'}>{complete ? '완료' : '미완료'}</Badge>
            </CardHeader>
            <CardContent className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">{index + 1} / {students.length}</span>
              <Button variant="outline" size="sm" disabled={index === students.length - 1} onClick={() => setIndex((i) => i + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-auto text-lg font-bold">총점: {total}</span>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {rubric.criteria.map((c) => (
              <Card key={c.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{c.name}</span>
                    <span className="text-sm font-normal text-muted-foreground">가중치 {c.weight}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {c.levels.map((l, li) => {
                      const selected = selections[c.id] === li
                      return (
                        <button
                          key={li}
                          aria-pressed={selected}
                          aria-label={`${c.name} ${l.score}점`}
                          onClick={() => selectLevel(c.id, li)}
                          className={`rounded border p-3 text-left text-sm transition ${selected ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                        >
                          <div className="font-bold">{l.score}점</div>
                          <div className="mt-1">{l.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">코멘트</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5} />
              <Button size="sm" onClick={() => { saveGrade(selections, comment); toast.success('저장됨') }}>
                <Save className="mr-1 h-4 w-4" /> 저장
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
