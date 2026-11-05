import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../db'
import type { Rubric, Grade, Student } from '../lib/types'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Download, Home, FileSpreadsheet, FileText } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

export default function Export() {
  const { rubricId } = useParams()
  const navigate = useNavigate()
  const [rubric, setRubric] = useState<Rubric | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    if (!rubricId) return
    db.rubrics.get(rubricId).then((r) => setRubric(r ?? null))
    db.grades.where('rubricId').equals(rubricId).toArray().then(setGrades)
    db.students.toArray().then(setStudents)
  }, [rubricId])

  if (!rubric) return <div className="p-6">로딩...</div>

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))

  function buildRows() {
    return grades.map((g) => {
      const s = studentMap[g.studentId]
      const row: (string | number)[] = [s?.number ?? '', s?.name ?? '']
      row.push(g.total)
      for (const c of rubric!.criteria) {
        const idx = g.selections[c.id]
        row.push(idx !== undefined ? c.levels[idx]?.score ?? '' : '')
      }
      row.push(g.comment)
      return row
    })
  }

  function headers() {
    return ['번호', '이름', '총점', ...rubric!.criteria.map((c) => c.name), '코멘트']
  }

  function downloadCsv() {
    const rows = [headers(), ...buildRows()]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${rubric!.title}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV 다운로드')
  }

  function downloadExcel() {
    const ws = XLSX.utils.aoa_to_sheet([headers(), ...buildRows()])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Grades')
    XLSX.writeFile(wb, `${rubric!.title}.xlsx`)
    toast.success('Excel 다운로드')
  }

  function downloadPdf() {
    const doc = new jsPDF()
    const container = document.createElement('div')
    container.style.width = '800px'
    container.style.padding = '16px'
    container.style.fontFamily = 'system-ui, sans-serif'
    let html = `<h1 style="font-size:20px;margin-bottom:12px">${rubric!.title}</h1>`
    for (const g of grades) {
      const s = studentMap[g.studentId]
      html += `<div style="margin-bottom:16px;padding:12px;border:1px solid #ddd;border-radius:8px">`
      html += `<h2 style="font-size:16px;margin:0 0 8px">${s?.number ?? ''} ${s?.name ?? ''} — 총점 ${g.total}</h2>`
      html += `<ul style="margin:0 0 8px;padding-left:18px">`
      for (const c of rubric!.criteria) {
        const idx = g.selections[c.id]
        const score = idx !== undefined ? c.levels[idx]?.score : '-'
        html += `<li>${c.name}: ${score}점</li>`
      }
      html += `</ul>`
      html += `<p style="white-space:pre-wrap;margin:0">${g.comment || ''}</p>`
      html += `</div>`
    }
    container.innerHTML = html
    document.body.appendChild(container)
    doc.html(container, {
      callback: (d) => {
        d.save(`${rubric!.title}.pdf`)
        document.body.removeChild(container)
        toast.success('PDF 다운로드')
      },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 800,
    })
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{rubric.title} — 내보내기</h1>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <Home className="mr-1 h-4 w-4" /> 홈
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">채점 데이터 {grades.length}명</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={downloadCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button>
          <Button onClick={downloadExcel}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
          <Button onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
          <Button variant="outline" onClick={() => window.print()}>인쇄</Button>
        </CardContent>
      </Card>
    </div>
  )
}
