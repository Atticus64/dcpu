<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ReorderLinesExercise } from '@/types'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps<{ exercise: ReorderLinesExercise }>()
const emit = defineEmits<{ complete: [id: string, passed: boolean] }>()
const locale = useLocaleStore()

const items = ref(props.exercise.lines.map((text, i) => ({ text, originalIndex: i })))
const dragIndex = ref<number | null>(null)
const dropIndex = ref<number | null>(null)
const submitted = ref(false)

const correct = computed(() => {
  return items.value.every((item, i) => item.originalIndex === props.exercise.correctOrder[i])
})

function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(e: Event, index: number) {
  e.preventDefault()
  dropIndex.value = index
}

function onDrop() {
  if (dragIndex.value === null || dropIndex.value === null) return
  if (dragIndex.value === dropIndex.value) {
    dragIndex.value = null
    dropIndex.value = null
    return
  }
  const arr = [...items.value]
  const moved = arr.splice(dragIndex.value, 1)[0]!
  arr.splice(dropIndex.value, 0, moved)
  items.value = arr
  dragIndex.value = null
  dropIndex.value = null
}

function submit() {
  submitted.value = true
  emit('complete', props.exercise.id, correct.value)
}

function reset() {
  items.value = props.exercise.lines.map((text, i) => ({ text, originalIndex: i }))
  submitted.value = false
}
</script>

<template>
  <div class="exercise-card">
    <h3>{{ locale.t('exercise.reorder.title') }}</h3>
    <p class="instruction">{{ exercise.instruction }}</p>

    <div class="line-list">
      <div
        v-for="(item, i) in items"
        :key="item.text + i"
        class="line-item"
        :class="{
          dragging: dragIndex === i,
          'drag-over': dropIndex === i && dragIndex !== i,
          correct: submitted && item.originalIndex === exercise.correctOrder[i],
          incorrect: submitted && item.originalIndex !== exercise.correctOrder[i],
        }"
        draggable="true"
        @dragstart="onDragStart(i)"
        @dragover="onDragOver($event, i)"
        @drop="onDrop"
      >
        <span class="handle">≡</span>
        <code>{{ item.text }}</code>
        <span class="pos">{{ i + 1 }}</span>
      </div>
    </div>

    <div v-if="!submitted" class="actions">
      <button @click="submit" class="btn">{{ locale.t('exercise.reorder.checkOrder') }}</button>
    </div>

    <div v-else class="feedback" :class="{ pass: correct, fail: !correct }">
      <p>{{ correct ? locale.t('exercise.reorder.correct') : locale.t('exercise.reorder.incorrect') }}</p>
      <p class="explanation">{{ exercise.explanation }}</p>
      <button @click="reset" class="btn btn-sm">{{ locale.t('exercise.reorder.tryAgain') }}</button>
    </div>
  </div>
</template>

<style scoped>
.exercise-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.instruction {
  margin: 0.5rem 0 1rem;
}
.line-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.line-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  transition: all 0.1s;
}
.line-item:hover {
  background: var(--color-border-hover);
}
.line-item code {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 0.9rem;
}
.handle {
  cursor: grab;
  font-size: 1.2rem;
  opacity: 0.5;
}
.pos {
  font-size: 0.8rem;
  opacity: 0.4;
  min-width: 1.5rem;
  text-align: right;
}
.dragging {
  opacity: 0.4;
}
.drag-over {
  border-color: var(--color-heading);
}
.correct {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
}
.incorrect {
  background: var(--color-error-bg);
  border-color: var(--color-error-border);
}
.actions {
  margin-top: 1rem;
}
.feedback {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 6px;
}
.feedback.pass {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
}
.feedback.fail {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
}
.explanation {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-top: 0.5rem;
}
</style>
