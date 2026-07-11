<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'

const locale = useLocaleStore()

const posts = [
  { id: 'mov', titleKey: 'blog.post.mov.title', descKey: 'blog.post.mov.desc' },
  { id: 'regs', titleKey: 'blog.post.regs.title', descKey: 'blog.post.regs.desc' },
]
</script>

<template>
  <div class="blog">
    <h1>{{ locale.t('blog.title') }}</h1>
    <p class="subtitle">
      {{ locale.t('blog.subtitle') }}
    </p>

    <div class="posts">
      <RouterLink
        v-for="post in posts"
        :key="post.id"
        :to="`/blog/${post.id}`"
        class="post-card"
      >
        <h2>{{ locale.t(post.titleKey) }}</h2>
        <p>{{ locale.t(post.descKey) }}</p>
        <span class="badge">{{ locale.t('blog.readMore') }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.blog {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}
.blog h1 {
  font-size: 1.6rem;
  margin-bottom: 0.5rem;
}
.subtitle {
  opacity: 0.8;
  margin-bottom: 2rem;
}
.posts {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.post-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
}
.post-card {
  text-decoration: none;
  color: var(--color-text);
  transition: background 0.15s, border-color 0.15s;
  cursor: pointer;
  display: block;
}
.post-card:hover {
  background: var(--color-border-hover);
  border-color: var(--color-theme-accent);
}
.post-card h2 {
  font-size: 1.15rem;
  margin-bottom: 0.5rem;
}
.post-card p {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.75rem;
}
.badge {
  font-size: 0.75rem;
  text-transform: uppercase;
  background: var(--color-background-mute);
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  opacity: 0.6;
}
</style>
