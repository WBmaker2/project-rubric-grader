import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import type { Rubric } from '../lib/types'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Plus, Users, Pencil, Trash2, Play, BarChart3, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const [rubrics, setRubrics] = useState<Rubric[]>([])
  const [gradedCounts, setGradedCounts] = useState<Record<string, number>>({})
  const navigate = useNavigate()

  async function load() {
    const rs = await db.rubrics.orderBy('updatedAt').reverse().toArray()
    setRubrics(rs)
    const counts: Record<string, number> = {}
    for (const r of rs) {
      counts[r.id] = await db.grades.where('rubricId').equals(r.id).count()
    }
    setGradedCounts(counts)
  }

  useEffect(() => { load() }, [])

  async function remove(id: string) {
    if (!confirm('이 루브릭을 삭제하시겠습니까?')) return
    await db.rubrics.delete(id)
    await db.grades.where('rubricId').equals(id).delete()
    toast.success('삭제되었습니다')
    load()
  }
  async function duplicate(r: Rubric) {
    const copy: Rubric = { ...r, id: crypto.randomUUID(), title: r.title + ' (복사)', createdAt: Date.now(), updatedAt: Date.now() }
    await db.rubrics.add(copy)
    toast.success('복제되었습니다')
    load()
  }

  const fileRef = useRef<HTMLInputElement>(null)
  async function backup() {
    const data = {
      rubrics: await db.rubrics.toArray(),
      students: await db.students.toArray(),
      grades: await db.grades.toArray(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'rubric-backup.json'; a.click()
    URL.revokeObjectURL(url)
    toast.success('백업 다운로드')
  }
  async function restore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      await db.rubrics.clear(); await db.students.clear(); await db.grades.clear()
      if (data.rubrics) await db.rubrics.bulkAdd(data.rubrics)
      if (data.students) await db.students.bulkAdd(data.students)
      if (data.grades) await db.grades.bulkAdd(data.grades)
      toast.success('복원 완료')
      load()
    } catch {
      toast.error('복원 실패')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">프로젝트 루브릭 평가</h1>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline">업데이트 내역</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>업데이트 내역</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <p className="font-semibold">2026-11-05</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>프로젝트 루브릭 평가 도구 초기 구현</li>
                  <li>루브릭 에디터, 학생 관리(CSV), 채점 UI, 점수/피드백 계산, 통계 대시보드, CSV/Excel/PDF 내보내기</li>
                  <li>접근성, 인쇄 CSS, 성능 개선, 백업/복원, 루브릭 복제, 테스트 추가</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={() => navigate('/students')}>
            <Users className="mr-2 h-4 w-4" /> 학생 관리
          </Button>
          <Button variant="outline" onClick={backup}>백업</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>복원</Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={restore} />
          <Button onClick={() => navigate('/rubrics/new')}>
            <Plus className="mr-2 h-4 w-4" /> 새 루브릭
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">이 프로그램은?</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>교사가 프로젝트/수행평가를 루브릭으로 채점하고, 학생별 점수·피드백과 통계를 관리하는 웹앱입니다. 모든 데이터는 브라우저(IndexedDB)에 저장됩니다.</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><b>새 루브릭</b>으로 평가 항목, 수준(1~4), 가중치를 만듭니다.</li>
            <li><b>학생 관리</b>에서 CSV 가져오기 또는 수동으로 학생을 등록합니다.</li>
            <li>홈에서 루브릭의 <b>채점</b>을 눌러 학생별로 수준을 클릭하고 코멘트를 저장합니다.</li>
            <li><b>통계</b>에서 항목별 평균과 총점 분포를 확인합니다.</li>
            <li><b>내보내기</b>로 CSV/Excel/PDF 파일을 저장합니다.</li>
          </ol>
          <p>백업/복원 버튼으로 데이터를 JSON으로 보관할 수 있고, 루브릭 복제로 템플릿을 재사용할 수 있습니다.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">사용 예시 (실제 화면)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { src: '01-home.png', caption: '1. 홈: 루브릭 목록과 사용법 안내' },
              { src: '02-rubric-editor.png', caption: '2. 루브릭 에디터: 항목·수준·가중치 설정' },
              { src: '03-students.png', caption: '3. 학생 관리: CSV 가져오기/수동 추가' },
              { src: '04-grading.png', caption: '4. 채점: 수준 클릭과 코멘트' },
              { src: '05-dashboard.png', caption: '5. 통계: 항목별 평균과 분포' },
              { src: '06-export.png', caption: '6. 내보내기: CSV/Excel/PDF' },
            ].map((img) => (
              <figure key={img.src} className="space-y-2">
                <img src={`${import.meta.env.BASE_URL}screenshots/${img.src}`} alt={img.caption} className="w-full rounded-md border" loading="lazy" />
                <figcaption className="text-xs text-muted-foreground">{img.caption}</figcaption>
              </figure>
            ))}
          </div>
        </CardContent>
      </Card>

      {rubrics.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            루브릭이 없습니다. 새 루브릭을 만들어 시작하세요.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {rubrics.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{r.title}</span>
                <Badge variant="secondary">{r.criteria.length}개 항목</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                채점 완료: {gradedCounts[r.id] ?? 0}명
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate(`/grade/${r.id}`)}>
                  <Play className="mr-1 h-3 w-3" /> 채점
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/${r.id}`)}>
                  <BarChart3 className="mr-1 h-3 w-3" /> 통계
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/export/${r.id}`)}>
                  <Download className="mr-1 h-3 w-3" /> 내보내기
                </Button>
                <Button size="sm" variant="ghost" aria-label="루브릭 복제" onClick={() => duplicate(r)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/rubrics/${r.id}/edit`)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" aria-label="루브릭 삭제" onClick={() => remove(r.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
