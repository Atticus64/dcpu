<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'
import LessonRenderer from '@/components/lesson/LessonRenderer.vue'

const route = useRoute()
const router = useRouter()
const locale = useLocaleStore()

const postId = route.params.postId as string

const titleKey = computed(() => `blog.post.${postId}.title` as const)
const bodyKey = computed(() => `blog.post.${postId}.body` as const)

function goBack() {
  router.push('/blog')
}
</script>

<template>
  <div class="blog-post">
    <button class="back-link" @click="goBack">← {{ locale.t('nav.blog') }}</button>
    <h1>{{ locale.t(titleKey) }}</h1>
    <div class="content">
      <LessonRenderer :content="locale.t(bodyKey)" />
    </div>
  </div>
</template>

<style scoped>
.blog-post {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
.back-link {
  background: none;
  border: none;
  color: var(--color-theme-accent);
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0;
  margin-bottom: 1.5rem;
}
.back-link:hover {
  text-decoration: underline;
}
h1 {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}
.content {
  line-height: 1.7;
}
</style>
