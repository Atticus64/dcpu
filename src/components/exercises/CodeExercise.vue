<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { CodeExercise } from '@/types'
import { compileCode } from '@/api/compiler'
import { useThemeStore } from '@/stores/theme'
import { useLocaleStore } from '@/stores/locale'

type Monaco = typeof import('monaco-editor')

const props = defineProps<{ exercise: CodeExercise }>()
const emit = defineEmits<{ complete: [id: string, passed: boolean] }>()
const locale = useLocaleStore()

const code = ref(props.exercise.starterCode)
const output = ref('')
const isRunning = ref(false)
const submitted = ref(false)
const passed = ref(false)

const editorContainer = ref<HTMLDivElement | null>(null)
let editor: import('monaco-editor').editor.IStandaloneCodeEditor | null = null
let monacoModule: Monaco | null = null

const themeStore = useThemeStore()

const languageId = props.exercise.language === 'c' ? 'c' : 'x86asm'

onMounted(async () => {
  const EditorWorker = (await import('monaco-editor/esm/vs/editor/editor.worker?worker')).default
  const TsWorker = (await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker')).default
  const JsonWorker = (await import('monaco-editor/esm/vs/language/json/json.worker?worker')).default
  const CssWorker = (await import('monaco-editor/esm/vs/language/css/css.worker?worker')).default
  const HtmlWorker = (await import('monaco-editor/esm/vs/language/html/html.worker?worker')).default

  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') return new JsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
      if (label === 'typescript' || label === 'javascript') return new TsWorker()
      return new EditorWorker()
    },
  }

  const monaco = await import('monaco-editor')
  monacoModule = monaco

  const { registerAssemblyLanguage } = await import('@/utils/monaco-languages')
  const { registerMonacoThemes } = await import('@/utils/monaco-themes')
  registerAssemblyLanguage(monaco)
  registerMonacoThemes(monaco)

  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: code.value,
      language: languageId,
      theme: themeStore.theme,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      scrollBeyondLastLine: false,
      renderLineHighlight: 'line',
      lineNumbers: 'on',
      tabSize: 2,
      readOnly: isRunning.value,
    })

    editor.onDidChangeModelContent(() => {
      code.value = editor!.getValue()
    })
  }
})

onUnmounted(() => {
  editor?.dispose()
})

watch(themeStore, () => {
  if (editor && monacoModule) {
    monacoModule.editor.setTheme(themeStore.theme)
  }
})

watch(isRunning, (val) => {
  editor?.updateOptions({ readOnly: val })
})

async function run() {
  isRunning.value = true
  output.value = ''
  submitted.value = false

  try {
    const result = await compileCode({ code: code.value, language: props.exercise.language })
    output.value = result.success ? result.stdout : (result.error || result.stderr || 'Error')

    const passes = result.success && (
      !props.exercise.expectedPattern
        ? true
        : new RegExp(props.exercise.expectedPattern, 'i').test(code.value)
    )

    submitted.value = true
    passed.value = passes
    emit('complete', props.exercise.id, passes)
  } catch (err) {
    output.value = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
    submitted.value = false
  } finally {
    isRunning.value = false
  }
}

function reset() {
  code.value = props.exercise.starterCode
  editor?.setValue(code.value)
  output.value = ''
  submitted.value = false
}
</script>

<template>
  <div class="exercise-card">
    <h3>{{ locale.t('exercise.code.title') }}</h3>
    <p class="instruction">{{ exercise.instruction }}</p>

    <div class="editor-wrapper">
      <div ref="editorContainer" class="monaco-editor-container" />
    </div>

    <div class="actions">
      <button @click="run" :disabled="isRunning" class="btn">
        {{ isRunning ? locale.t('exercise.code.running') : locale.t('exercise.code.run') }}
      </button>
      <button @click="reset" class="btn btn-sm btn-secondary">{{ locale.t('exercise.code.reset') }}</button>
    </div>

    <div v-if="output" class="output-panel" :class="{ error: !passed && submitted }">
      <pre>{{ output }}</pre>
    </div>

    <div v-if="submitted" class="feedback" :class="{ pass: passed, fail: !passed }">
      <p>{{ passed ? locale.t('exercise.code.greatJob') : locale.t('exercise.code.notQuite') }}</p>
      <p class="explanation">{{ exercise.explanation }}</p>
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
.editor-wrapper {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}
.monaco-editor-container {
  height: 250px;
}
.actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.output-panel {
  margin-top: 0.75rem;
  background: var(--color-output-bg);
  border-radius: 6px;
  padding: 1rem;
}
.output-panel pre {
  margin: 0;
  color: var(--color-output-text);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-all;
}
.output-panel.error pre {
  color: var(--color-output-error);
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
