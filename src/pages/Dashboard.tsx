import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../db'
import type { Rubric, Grade } from '../lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Home } from 'lucide-react'

export default function Dashboard() {
  const { rubricId } = useParams()
  const navigate = useNavigate()
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])

  useEffect(() => {
    if (!rubricId) return
    db.rubrics.get(rubricId).then((r) => setRubric(r ?? null))
    db.grades.where('rubricId').equals(rubricId).toArray().then(setGrades)
  }, [rubricId])

  if (!rubric) return <div className="p-6">로딩...</div>

  const criterionAvg = rubric.criteria.map((c) => {
    const vals = grades.map((g) => {
      const idx = g.selections[c.id]
      return idx !== undefined ? c.levels[idx]?.score ?? 0 : 0
    }).filter((v) => v > 0 || grades.length === 0)
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const max = c.levels.reduce((m, l) => Math.max(m, l.score), 0)
    return { name: c.name, avg: Math.round(avg * 10) / 10, max }
  })

  // distribution of totals in buckets
  const buckets: Record<string, number> = {}
  for (const g of grades) {
    const b = Math.floor(g.total / 10) * 10
    const key = `${b}-${b + 9}`
    buckets[key] = (buckets[key] ?? 0) + 1
  }
  const dist = Object.entries(buckets).map(([k, v]) => ({ range: k, count: v })).sort((a, b) => a.range.localeCompare(b.range))

  const overallAvg = grades.length ? Math.round((grades.reduce((a, g) => a + g.total, 0) / grades.length) * 10) / 10 : 0

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{rubric.title} — 통계</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <Home className="mr-1 h-4 w-4" /> 홈
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="py-6 text-center"><div className="text-2xl font-bold">{grades.length}</div><div className="text-sm text-muted-foreground">채점 인원</div></CardContent></Card>
        <Card><CardContent className="py-6 text-center"><div className="text-2xl font-bold">{overallAvg}</div><div className="text-sm text-muted-foreground">평균 점수</div></CardContent></Card>
        <Card><CardContent className="py-6 text-center"><div className="text-2xl font-bold">{rubric.criteria.length}</div><div className="text-sm text-muted-foreground">평가 항목</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">항목별 평균 점수</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={criterionAvg}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">총점 분포</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dist}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate(`/export/${rubricId}`)}>내보내기</Button>
        <Button variant="outline" onClick={() => navigate(`/grade/${rubricId}`)}>채점으로</Button>
        <Button variant="outline" onClick={() => window.print()}>인쇄</Button>
      </div>
    </div>
  )
}
