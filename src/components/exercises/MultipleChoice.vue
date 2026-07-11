<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MultipleChoiceExercise } from '@/types'
import { useLocaleStore } from '@/stores/locale'

const props = defineProps<{ exercise: MultipleChoiceExercise }>()
const emit = defineEmits<{ complete: [id: string, passed: boolean] }>()
const locale = useLocaleStore()

const selected = ref<number | null>(null)
const submitted = ref(false)

const correct = computed(() => selected.value === props.exercise.correctIndex)

function submit() {
  if (selected.value === null) return
  submitted.value = true
  emit('complete', props.exercise.id, correct.value)
}

function reset() {
  selected.value = null
  submitted.value = false
}
</script>

<template>
  <div class="exercise-card">
    <h3>{{ locale.t('exercise.multipleChoice.title') }}</h3>
    <p class="question">{{ exercise.question }}</p>

    <div class="options">
      <label
        v-for="(option, i) in exercise.options"
        :key="i"
        class="option"
        :class="{
          selected: selected === i,
          correct: submitted && i === exercise.correctIndex,
          incorrect: submitted && selected === i && !correct,
        }"
      >
        <input
          type="radio"
          :name="exercise.id"
          :value="i"
          :disabled="submitted"
          v-model="selected"
        />
        <span class="letter">{{ ['A', 'B', 'C', 'D'][i] }}</span>
        {{ option }}
      </label>
    </div>

    <div v-if="!submitted" class="actions">
      <button :disabled="selected === null" @click="submit" class="btn">{{ locale.t('exercise.multipleChoice.submit') }}</button>
    </div>

    <div v-else class="feedback" :class="{ pass: correct, fail: !correct }">
      <p>{{ correct ? locale.t('exercise.multipleChoice.correct') : locale.t('exercise.multipleChoice.incorrect') }}</p>
      <p class="explanation">{{ exercise.explanation }}</p>
      <button @click="reset" class="btn btn-sm">{{ locale.t('exercise.multipleChoice.tryAgain') }}</button>
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
.question {
  font-size: 1.05rem;
  margin: 0.5rem 0 1rem;
}
.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.option:hover:not(.correct):not(.incorrect) {
  background: var(--color-border-hover);
}
.option.selected:not(.submitted) {
  border-color: var(--color-heading);
}
.option.correct {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
}
.option.incorrect {
  background: var(--color-error-bg);
  border-color: var(--color-error-border);
}
.letter {
  font-weight: 600;
  width: 1.5rem;
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
