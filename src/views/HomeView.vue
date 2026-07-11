<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { useLocaleStore } from '@/stores/locale'
import { onMounted } from 'vue'

const progress = useProgressStore()
const locale = useLocaleStore()

onMounted(() => progress.loadFromStorage())

const courses = [
  {
    titleKey: 'course.assembly.title',
    descKey: 'course.assembly.desc',
    lessons: [
      { id: '01-hello-registers', titleKey: 'lesson.hello.title', status: 'ready' },
      { id: '02-memory-variables', titleKey: 'lesson.memory.title', status: 'ready' },
      { id: '03-arithmetic', titleKey: 'lesson.arithmetic.title', status: 'ready' },
    ],
    color: '#f44336',
  },
  {
    titleKey: 'course.c.title',
    descKey: 'course.c.desc',
    lessons: [
      { id: '01-hello-c', titleKey: 'lesson.c.hello.title', status: 'ready' },
    ],
    color: '#2196f3',
  },
]
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1>{{ locale.t('hero.title') }}</h1>
      <p class="subtitle">
        {{ locale.t('hero.subtitle') }}
      </p>
    </section>

    <section class="courses">
      <div v-for="course in courses" :key="course.titleKey" class="course-card">
        <div class="course-header" :style="{ borderLeftColor: course.color }">
          <h2>{{ locale.t(course.titleKey) }}</h2>
          <p>{{ locale.t(course.descKey) }}</p>
        </div>

        <div v-if="course.lessons.length" class="lesson-list">
          <RouterLink
            v-for="lesson in course.lessons"
            :key="lesson.id"
            :to="`/lessons/${lesson.id}`"
            class="lesson-item"
            :class="{ done: progress.isLessonPassed(lesson.id) }"
          >
            <span class="check">{{ progress.isLessonPassed(lesson.id) ? '✓' : '○' }}</span>
            <span>{{ locale.t(lesson.titleKey) }}</span>
          </RouterLink>
        </div>
        <div v-else class="coming-soon">
          <p>{{ locale.t('comingSoon') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
.hero {
  text-align: center;
  margin-bottom: 3rem;
}
.hero h1 {
  font-size: 2rem;
  margin-bottom: 0.75rem;
}
.subtitle {
  font-size: 1.05rem;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}
.courses {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.course-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}
.course-header {
  padding: 1.25rem 1.5rem;
  border-left: 4px solid;
}
.course-header h2 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}
.course-header p {
  font-size: 0.9rem;
  opacity: 0.8;
  line-height: 1.5;
}
.lesson-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
}
.lesson-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  transition: background 0.15s;
}
.lesson-item:hover {
  background: var(--color-border-hover);
}
.lesson-item:last-child {
  border-bottom: none;
}
.lesson-item.done {
  opacity: 0.6;
}
.check {
  width: 1.5rem;
  text-align: center;
  font-weight: 700;
  color: var(--color-success-text);
}
.coming-soon {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  opacity: 0.5;
  font-style: italic;
}
</style>
