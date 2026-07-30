import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/LandingView.vue'),
    },
    {
      path: '/lessons',
      name: 'lessons',
      component: () => import('@/views/LessonsView.vue'),
    },
    {
      path: '/lessons/:lessonId',
      name: 'lesson',
      component: () => import('@/views/LessonView.vue'),
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/BlogView.vue'),
    },
    {
      path: '/blog/:postId',
      name: 'blog-post',
      component: () => import('@/views/BlogPostView.vue'),
    },
    {
      path: '/playground',
      name: 'playground',
      component: () => import('@/views/PlaygroundView.vue'),
    },
  ],
})

export default router
