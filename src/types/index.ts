export interface Lesson {
  id: string
  title: string
  order: number
  markdown: string
}

export interface MultipleChoiceExercise {
  type: 'multiple-choice'
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface ReorderLinesExercise {
  type: 'reorder-lines'
  id: string
  instruction: string
  lines: string[]
  correctOrder: number[]
  explanation: string
}

export interface CodeExercise {
  type: 'code'
  id: string
  language: 'assembly' | 'c'
  instruction: string
  starterCode: string
  expectedPattern?: string
  explanation: string
}

export type Exercise = MultipleChoiceExercise | ReorderLinesExercise | CodeExercise

export interface LessonExercise {
  lessonId: string
  exercises: Exercise[]
}

export interface CompileRequest {
  code: string
  language: 'assembly' | 'c'
}

export interface CompileResponse {
  success: boolean
  stdout: string
  stderr: string
  error: string | null
}

export interface CompileRunResponse {
  success: boolean
  exeBase64: string | null
  error: string | null
}
