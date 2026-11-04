# 프로젝트 루브릭 평가 도구 (Project Rubric Grader) — 구현 계획

## 1. 개요
교사가 프로젝트/수행평가를 루브릭으로 채점하고, 학생별 점수·피드백을
관리·통계 내는 웹앱. API 없이 로컬 저장.

## 2. 목표 사용자
- 교사, 평가자

## 3. 핵심 기능
- 루브릭 템플릿 생성 (항목, 수준 1~4, 점수)
- 학생 목록 관리 (CSV 가져오기)
- 학생별 채점 (클릭으로 수준 선택 + 코멘트)
- 자동 점수 계산 (가중치)
- 피드백 자동 생성 (선택 수준별 코멘트 조합)
- 통계: 항목별 평균, 분포 차트
- 내보내기: CSV/Excel, PDF 리포트

## 4. 화면 구성
- 홈: 평가 목록
- 루브릭 에디터
- 채점 화면: 학생 전환 + 루브릭 그리드
- 대시보드: 통계 차트
- 내보내기

## 5. 기술 스택
- React + Vite + TypeScript
- UI: shadcn/ui + Tailwind
- 차트: Recharts
- 내보내기: SheetJS (xlsx), jsPDF
- 저장: IndexedDB (Dexie)

## 6. 데이터 모델
- Rubric { id, title, criteria: Criterion[] }
- Criterion { id, name, weight, levels: Level[] }
- Level { score, description, feedback }
- Student { id, name, number }
- Grade { studentId, rubricId, selections, total, comment, gradedAt }

## 7. 구현 단계
1. 세팅
2. 루브릭 에디터
3. 학생 관리 (CSV)
4. 채점 UI
5. 점수/피드백 계산
6. 통계 대시보드
7. 내보내기 (CSV/PDF)
8. 접근성

## 8. 비기능 요구사항
- 대량 학생 성능
- 인쇄 CSS

## 9. 검증
- 단위: 점수 계산
- E2E: 채점→내보내기
