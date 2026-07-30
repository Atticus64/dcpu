<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/stores/locale'
import { ref, onMounted } from 'vue'

const locale = useLocaleStore()
const router = useRouter()
const visible = ref(false)

const features = [
  { icon: '⚡', titleKey: 'landing.feature.compiler.title', descKey: 'landing.feature.compiler.desc' },
  { icon: '🖥️', titleKey: 'landing.feature.dosbox.title', descKey: 'landing.feature.dosbox.desc' },
  { icon: '🎯', titleKey: 'landing.feature.exercises.title', descKey: 'landing.feature.exercises.desc' },
  { icon: '📈', titleKey: 'landing.feature.progress.title', descKey: 'landing.feature.progress.desc' },
]

const demoCode = `ideal
model small
stack 100h

dataseg
msg db 'Hello from DCPU!', 13, 10, 0

codeseg
proc println
    push ax
    push bx
    mov ah, 0Eh
    mov bh, 0
    cld
@@loop:
    lodsb
    cmp al, 0
    je @@end
    int 10h
    jmp @@loop
@@end:
    pop bx
    pop ax
    ret
endp println

start:
    mov ax, @data
    mov ds, ax
    mov si, offset msg
    call println
    mov ax, 4C00h
    int 21h
end start`

onMounted(() => {
  requestAnimationFrame(() => { visible.value = true })
})

function goToLessons() {
  router.push('/lessons')
}
</script>

<template>
  <div class="landing" :class="{ visible }">
    <div class="gradient-bg" />

    <section class="hero">
      <div class="hero-content">
        <div class="chip">x86 Assembly &bull; Turbo Assembler &bull; C</div>
        <h1>{{ locale.t('landing.title') }}</h1>
        <p class="hero-sub">{{ locale.t('landing.subtitle') }}</p>
        <button class="cta" @click="goToLessons">
          <span>{{ locale.t('landing.startButton') }}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </section>

    <section class="features">
      <div
        v-for="(f, i) in features"
        :key="i"
        class="feature-card"
        :style="{ transitionDelay: `${i * 0.1}s` }"
      >
        <span class="feature-icon">{{ f.icon }}</span>
        <h3>{{ locale.t(f.titleKey) }}</h3>
        <p>{{ locale.t(f.descKey) }}</p>
      </div>
    </section>

    <section class="demo-section">
      <h2>{{ locale.t('landing.demo.title') }}</h2>
      <p class="demo-sub">{{ locale.t('landing.demo.sub') }}</p>
      <div class="demo-split">
        <div class="demo-pane demo-code-pane">
          <div class="pane-header">
            <span class="pane-dot" style="background:#ff5f57" />
            <span class="pane-dot" style="background:#febc2e" />
            <span class="pane-dot" style="background:#28c840" />
            <span class="pane-title">source.asm</span>
          </div>
          <pre class="demo-code"><code>ideal
model small
stack 100h

dataseg
<span class="kw">msg</span> <span class="dir">db</span> <span class="str">'Hello from DCPU!'</span>, 13, 10, 0

codeseg
<span class="k">proc</span> <span class="fn">println</span>
    <span class="k">push</span> ax
    <span class="k">push</span> bx
    <span class="k">mov</span> ah, 0Eh
    <span class="k">mov</span> bh, 0
    <span class="k">cld</span>
<span class="lbl">@@loop:</span>
    <span class="k">lodsb</span>
    <span class="k">cmp</span> al, 0
    <span class="k">je</span> @@end
    <span class="k">int</span> 10h
    <span class="k">jmp</span> @@loop
<span class="lbl">@@end:</span>
    <span class="k">pop</span> bx
    <span class="k">pop</span> ax
    <span class="k">ret</span>
<span class="k">endp</span> println

start:
    <span class="k">mov</span> ax, @data
    <span class="k">mov</span> ds, ax
    <span class="k">mov</span> si, <span class="k">offset</span> msg
    <span class="k">call</span> println
    <span class="k">mov</span> ax, 4C00h
    <span class="k">int</span> 21h
<span class="k">end</span> start</code></pre>
        </div>
        <div class="demo-pane demo-term-pane">
          <div class="pane-header">
            <span class="pane-dot" style="background:#ff5f57" />
            <span class="pane-dot" style="background:#febc2e" />
            <span class="pane-dot" style="background:#28c840" />
            <span class="pane-title">DOSBox</span>
          </div>
          <pre class="demo-term"><code>╔══════════════════════════════════╗
║       DCPU v1.0 - DOSBox         ║
╚══════════════════════════════════╝

C:\> program

Hello from DCPU!

    ╭─────────────────╮
    │  Assembly in    │
    │  your browser!  │
    ╰─────────────────╯

C:\> <span class="cursor"></span></code></pre>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  min-height: calc(100vh - 3.5rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.gradient-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, var(--color-theme-accent) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 20% 80%, var(--color-theme-accent) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 80%, var(--color-theme-accent) 0%, transparent 50%);
  opacity: 0.07;
}

.hero {
  padding: 4rem 1.5rem 2.5rem;
  text-align: center;
  position: relative;
  z-index: 1;
}
.hero-content {
  max-width: 700px;
  margin: 0 auto;
}
.chip {
  display: inline-block;
  padding: 0.35rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 1.5rem;
  letter-spacing: 0.02em;
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease;
}
.visible .chip {
  transform: translateY(0);
  opacity: 0.7;
}
h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--color-heading) 0%, var(--color-theme-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, opacity 0.6s ease 0.1s;
}
.visible h1 {
  transform: translateY(0);
  opacity: 1;
}
.hero-sub {
  font-size: 1.1rem;
  line-height: 1.7;
  opacity: 0;
  color: var(--color-text);
  margin-bottom: 2rem;
  transform: translateY(20px);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, opacity 0.6s ease 0.2s;
}
.visible .hero-sub {
  transform: translateY(0);
  opacity: 0.8;
}

.cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 2rem;
  background: var(--color-theme-accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, opacity 0.6s ease 0.3s, box-shadow 0.2s, filter 0.2s;
}
.visible .cta {
  transform: translateY(0);
  opacity: 1;
}
.cta:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 30px color-mix(in srgb, var(--color-theme-accent) 40%, transparent);
}
.cta:active {
  transform: scale(0.97);
}
.cta svg {
  transition: transform 0.2s;
}
.cta:hover svg {
  transform: translateX(3px);
}

.features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  max-width: 820px;
  width: 100%;
  padding: 0 1.5rem 3rem;
  position: relative;
  z-index: 1;
}
.feature-card {
  background: var(--color-bg-soft);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 2rem 1.75rem;
  transform: translateY(30px);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease, box-shadow 0.3s, border-color 0.3s;
}
.visible .feature-card {
  transform: translateY(0);
  opacity: 1;
}
.feature-card:hover {
  border-color: var(--color-theme-accent);
  box-shadow: 0 12px 40px color-mix(in srgb, var(--color-theme-accent) 15%, transparent);
  transform: translateY(-4px);
}
.feature-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 1rem;
}
.feature-card h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  color: var(--color-heading);
}
.feature-card p {
  font-size: 0.92rem;
  line-height: 1.65;
  opacity: 0.75;
}

.demo-section {
  width: 100%;
  max-width: 820px;
  padding: 0 1.5rem 5rem;
  text-align: center;
  position: relative;
  z-index: 1;
}
.demo-section h2 {
  font-size: clamp(1.3rem, 3vw, 1.75rem);
  font-weight: 800;
  margin-bottom: 0.6rem;
  background: linear-gradient(135deg, var(--color-heading) 0%, var(--color-theme-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.demo-sub {
  font-size: 0.95rem;
  opacity: 0.65;
  margin-bottom: 1.5rem;
  max-width: 520px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}
.demo-split {
  display: grid;
  grid-template-columns: 1.4fr 1.4fr;
  gap: 1rem;
  align-items: start;
  transition: transform 0.3s;
}
.demo-split:hover {
  transform: translateY(-2px);
}

.demo-pane {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-bg-soft);
  transition: border-color 0.3s, box-shadow 0.3s;
}
.demo-pane:hover {
  border-color: var(--color-theme-accent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--color-theme-accent) 10%, transparent);
}

.pane-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.75rem;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.pane-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.pane-title {
  font-size: 0.75rem;
  opacity: 0.5;
  margin-left: auto;
  font-family: var(--font-mono);
}

.demo-pane pre {
  margin: 0;
  padding: 1rem;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.82rem;
  line-height: 1.6;
  overflow-x: auto;
  overflow-y: auto;
  text-align: left;
  flex: 1;
}
.demo-code-pane pre {
  min-height: 280px;
}
.demo-pane code {
  font-family: inherit;
}

.demo-code {
  color: var(--color-text);
  tab-size: 2;
}
.demo-code .kw { color: var(--color-syntax-keyword, #c678dd); }
.demo-code .dir { color: var(--color-syntax-directive, #e5c07b); }
.demo-code .str { color: var(--color-syntax-string, #98c379); }
.demo-code .k  { color: var(--color-syntax-keyword, #c678dd); }
.demo-code .fn { color: var(--color-syntax-function, #61afef); }
.demo-code .lbl { color: var(--color-syntax-label, #abb2bf); opacity: 0.7; }

.demo-term {
  display: flex;
  flex-direction: column;
  color: #d4d4d4;
  background: #1e1e1e;
  min-height: 320px;
  white-space: pre;
}
.demo-term code {
  display: block;
}
.demo-term .cursor {
  display: inline-block;
  width: 0.55em;
  height: 1em;
  background: #d4d4d4;
  animation: blink 1s step-end infinite;
  vertical-align: text-bottom;
}
@keyframes blink {
  50% { opacity: 0; }
}

@media (max-width: 768px) {
  .hero {
    padding: 3rem 1rem 2rem;
  }
  .features {
    grid-template-columns: 1fr;
    padding: 0 1rem 2rem;
  }
  .demo-section {
    padding: 0 1rem 3rem;
  }
  .demo-split {
    grid-template-columns: 1fr;
  }
  .demo-pane pre {
    font-size: 0.72rem;
    padding: 0.75rem;
  }
  .demo-term {
    min-height: 120px;
  }
}
</style>
