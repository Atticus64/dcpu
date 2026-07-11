import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ExerciseResult {
  exerciseId: string
  passed: boolean
  timestamp: number
}

export const useProgressStore = defineStore('progress', () => {
  const results = ref<ExerciseResult[]>([])

  const passedExercises = computed(() => results.value.filter(r => r.passed).map(r => r.exerciseId))

  function isExercisePassed(id: string): boolean {
    return results.value.some(r => r.exerciseId === id && r.passed)
  }

  function isLessonPassed(lessonId: string): boolean {
    return results.value.some(r => r.exerciseId.startsWith(lessonId) && r.passed)
  }

  function setResult(exerciseId: string, passed: boolean) {
    const existing = results.value.findIndex(r => r.exerciseId === exerciseId)
    if (existing >= 0) {
      results.value[existing] = { exerciseId, passed, timestamp: Date.now() }
    } else {
      results.value.push({ exerciseId, passed, timestamp: Date.now() })
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem('dcpu-progress')
      if (stored) {
        results.value = JSON.parse(stored)
      }
    } catch {
      // ignore
    }
  }

  function saveToStorage() {
    localStorage.setItem('dcpu-progress', JSON.stringify(results.value))
  }

  return { results, passedExercises, isExercisePassed, isLessonPassed, setResult, loadFromStorage, saveToStorage }
})
