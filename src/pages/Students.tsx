import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import type { Student } from '../lib/types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

function uid() { return crypto.randomUUID() }

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function load() { setStudents(await db.students.orderBy('number').toArray()) }
  useEffect(() => { load() }, [])

  async function addOne() {
    if (!name.trim()) return
    await db.students.add({ id: uid(), name: name.trim(), number: number.trim() })
    setName(''); setNumber('')
    load()
  }

  async function remove(id: string) {
    await db.students.delete(id)
    await db.grades.where('studentId').equals(id).delete()
    load()
  }

  async function clearAll() {
    if (!confirm('모든 학생을 삭제하시겠습니까?')) return
    await db.students.clear()
    await db.grades.clear()
    load()
  }

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    const rows: { number: string; name: string }[] = []
    let start = 0
    const first = lines[0].toLowerCase()
    if (first.includes('이름') || first.includes('번호') || first.includes('name') || first.includes('number')) start = 1
    for (let i = start; i < lines.length; i++) {
      const cols = lines[i].split(/[,\t]/).map((s) => s.trim().replace(/^"|"$/g, ''))
      if (cols.length < 2) continue
      // detect order: if first col numeric -> number,name
      let number = cols[0], name = cols[1]
      if (!/^\d/.test(cols[0]) && /^\d/.test(cols[1])) { name = cols[0]; number = cols[1] }
      if (!name) continue
      rows.push({ number, name })
    }
    return rows
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const rows = parseCsv(text)
    let added = 0
    for (const r of rows) {
      await db.students.add({ id: uid(), name: r.name, number: r.number })
      added++
    }
    toast.success(`${added}명 추가됨`)
    load()
    if (fileRef.current) fileRef.current.value = ''
  }

  const filtered = students.filter((s) => (s.name + ' ' + s.number).toLowerCase().includes(query.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">학생 관리</h1>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 홈
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>CSV 가져오기</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">CSV 형식: 번호,이름 (헤더 선택)</p>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="block" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>수동 추가</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="번호" value={number} onChange={(e) => setNumber(e.target.value)} className="w-24" />
          <Input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={addOne}><Plus className="h-4 w-4" /></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>학생 목록 ({students.length})</CardTitle>
          <Button variant="destructive" size="sm" onClick={clearAll}><Trash2 className="mr-1 h-3 w-3" /> 전체 삭제</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="검색" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>번호</TableHead>
                <TableHead>이름</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(page*PAGE_SIZE, (page+1)*PAGE_SIZE).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.number}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" aria-label="학생 삭제" onClick={() => remove(s.id)}><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between text-sm">
            <span>{filtered.length}명</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page===0} onClick={() => setPage((p)=>p-1)}>이전</Button>
              <span>{page+1}/{totalPages}</span>
              <Button variant="outline" size="sm" disabled={page>=totalPages-1} onClick={() => setPage((p)=>p+1)}>다음</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
