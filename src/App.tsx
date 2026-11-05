import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import RubricEditor from './pages/RubricEditor'
import Students from './pages/Students'
import Grading from './pages/Grading'
import Dashboard from './pages/Dashboard'
import Export from './pages/Export'

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:shadow">
        본문으로 건너뛰기
      </a>
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rubrics/new" element={<RubricEditor />} />
          <Route path="/rubrics/:id/edit" element={<RubricEditor />} />
          <Route path="/students" element={<Students />} />
          <Route path="/grade/:rubricId" element={<Grading />} />
          <Route path="/dashboard/:rubricId" element={<Dashboard />} />
          <Route path="/export/:rubricId" element={<Export />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
