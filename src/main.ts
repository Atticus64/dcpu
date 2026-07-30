import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useThemeStore } from '@/stores/theme'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const themeStore = useThemeStore()
themeStore.init()

const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap'
document.head.appendChild(link)

app.mount('#app')
