import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import type { Rubric, Criterion, Level } from '../lib/types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

function uid() { return crypto.randomUUID() }

function newLevel(score: number): Level {
  return { score, description: '', feedback: '' }
}

function newCriterion(): Criterion {
  return { id: uid(), name: '', weight: 1, levels: [1,2,3,4].map(newLevel) }
}

export default function RubricEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [criteria, setCriteria] = useState<Criterion[]>([newCriterion()])

  useEffect(() => {
    if (!id) return
    db.rubrics.get(id).then((r) => {
      if (!r) return
      setTitle(r.title)
      setDescription(r.description ?? '')
      setCriteria(r.criteria)
    })
  }, [id])

  function updateCriterion(i: number, patch: Partial<Criterion>) {
    setCriteria((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }
  function updateLevel(ci: number, li: number, patch: Partial<Level>) {
    setCriteria((cs) => cs.map((c, idx) => idx === ci ? {
      ...c, levels: c.levels.map((l, j) => (j === li ? { ...l, ...patch } : l))
    } : c))
  }
  function removeCriterion(i: number) {
    setCriteria((cs) => cs.filter((_, idx) => idx !== i))
  }
  function addCriterion() { setCriteria((cs) => [...cs, newCriterion()]) }
  function addLevel(ci: number) {
    setCriteria((cs) => cs.map((c, idx) => idx === ci ? { ...c, levels: [...c.levels, newLevel(c.levels.length + 1)] } : c))
  }
  function removeLevel(ci: number, li: number) {
    setCriteria((cs) => cs.map((c, idx) => idx === ci ? { ...c, levels: c.levels.filter((_, j) => j !== li) } : c))
  }

  async function save() {
    if (!title.trim()) { toast.error('제목을 입력하세요'); return }
    if (criteria.length === 0) { toast.error('항목을 추가하세요'); return }
    const now = Date.now()
    const rubric: Rubric = {
      id: id ?? uid(),
      title: title.trim(),
      description: description.trim(),
      criteria,
      createdAt: now,
      updatedAt: now,
    }
    if (id) {
      const existing = await db.rubrics.get(id)
      if (existing) rubric.createdAt = existing.createdAt
      await db.rubrics.put(rubric)
    } else {
      await db.rubrics.add(rubric)
    }
    toast.success('저장되었습니다')
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{id ? '루브릭 편집' : '새 루브릭'}</h1>
        <Button onClick={save}><Save className="mr-2 h-4 w-4" /> 저장</Button>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="space-y-1">
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="평가 제목" />
          </div>
          <div className="space-y-1">
            <Label>설명 (선택)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {criteria.map((c, ci) => (
        <Card key={c.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">항목 {ci + 1}</CardTitle>
            <Button variant="ghost" size="sm" aria-label="항목 삭제" onClick={() => removeCriterion(ci)}><Trash2 className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>항목명</Label>
                <Input value={c.name} onChange={(e) => updateCriterion(ci, { name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>가중치</Label>
                <Input type="number" step="0.1" value={c.weight} onChange={(e) => updateCriterion(ci, { weight: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>수준</Label>
              {c.levels.map((l, li) => (
                <div key={li} className="grid gap-2 rounded border p-2 sm:grid-cols-4">
                  <Input type="number" value={l.score} onChange={(e) => updateLevel(ci, li, { score: Number(e.target.value) })} placeholder="점수" />
                  <Input value={l.description} onChange={(e) => updateLevel(ci, li, { description: e.target.value })} placeholder="수준 설명" />
                  <Input value={l.feedback} onChange={(e) => updateLevel(ci, li, { feedback: e.target.value })} placeholder="피드백" />
                  <Button variant="ghost" size="sm" aria-label="수준 삭제" onClick={() => removeLevel(ci, li)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addLevel(ci)}><Plus className="mr-1 h-3 w-3" /> 수준 추가</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addCriterion}><Plus className="mr-2 h-4 w-4" /> 항목 추가</Button>
    </div>
  )
}
