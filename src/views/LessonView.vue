<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useProgressStore } from "@/stores/progress";
import { useLocaleStore } from "@/stores/locale";
import LessonRenderer from "@/components/lesson/LessonRenderer.vue";
import MultipleChoice from "@/components/exercises/MultipleChoice.vue";
import ReorderLines from "@/components/exercises/ReorderLines.vue";
import CodeExercise from "@/components/exercises/CodeExercise.vue";
import type { LessonExercise } from "@/types";

const route = useRoute();
const progress = useProgressStore();
const locale = useLocaleStore();

const markdown = ref("");
const lessonExercise = ref<LessonExercise | null>(null);
const notFound = ref(false);

async function loadLesson() {
  markdown.value = "";
  lessonExercise.value = null;
  notFound.value = false;

  const lessonId = route.params.lessonId as string;
  const lang = locale.locale;

  try {
    const md = await import(`@/data/lessons/${lang}/${lessonId}.md?raw`);
    markdown.value = md.default;
  } catch {
    try {
      const md = await import(`@/data/lessons/en/${lessonId}.md?raw`);
      markdown.value = md.default;
    } catch {
      notFound.value = true;
      return;
    }
  }

  try {
    const ex = await import(`@/data/exercises/${lang}/${lessonId}.json`);
    lessonExercise.value = ex.default;
  } catch {
    try {
      const ex = await import(`@/data/exercises/en/${lessonId}.json`);
      lessonExercise.value = ex.default;
    } catch {
      // no exercises for this lesson
    }
  }
}

onMounted(async () => {
  progress.loadFromStorage();
  await loadLesson();
});

watch(
  () => locale.locale,
  () => {
    loadLesson();
  },
);

function onComplete(id: string, passed: boolean) {
  const lessonId = route.params.lessonId as string;
  progress.setResult(`${lessonId}-${id}`, passed);
  progress.saveToStorage();
}

const allPassed = computed(() => {
  if (!lessonExercise.value) return false;
  return lessonExercise.value.exercises.every((ex) => progress.isExercisePassed(ex.id));
});
</script>

<template>
  <div v-if="notFound" class="not-found">
    <h1>{{ locale.t("lesson.notFound.title") }}</h1>
    <p>{{ locale.t("lesson.notFound.text") }}</p>
  </div>

  <div v-else class="lesson-page">
    <article class="lesson-body">
      <LessonRenderer :content="markdown" />
    </article>

    <aside v-if="lessonExercise" class="exercises-section">
      <h2>{{ locale.t("exercises.title") }}</h2>
      <p v-if="allPassed" class="all-done">{{ locale.t("exercises.allDone") }}</p>

      <div v-for="exercise in lessonExercise.exercises" :key="exercise.id">
        <MultipleChoice
          v-if="exercise.type === 'multiple-choice'"
          :exercise="exercise"
          @complete="onComplete"
        />
        <ReorderLines
          v-else-if="exercise.type === 'reorder-lines'"
          :exercise="exercise"
          @complete="onComplete"
        />
        <CodeExercise
          v-else-if="exercise.type === 'code'"
          :exercise="exercise"
          @complete="onComplete"
        />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.lesson-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
.lesson-body {
  margin-bottom: 2rem;
}
.exercises-section {
  border-top: 2px solid var(--color-border);
  padding-top: 1.5rem;
}
.exercises-section h2 {
  font-size: 1.4rem;
  margin-bottom: 1rem;
}
.all-done {
  background: var(--color-success-bg);
  border: 1px solid var(--color-success-border);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-weight: 600;
  color: var(--color-success-text);
}
.not-found {
  max-width: 600px;
  margin: 3rem auto;
  text-align: center;
}
</style>
