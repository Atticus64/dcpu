<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useThemeStore } from "@/stores/theme";

const props = defineProps<{ content: string }>();

const container = ref<HTMLDivElement>();
const themeStore = useThemeStore();
let monacoModule: typeof import("monaco-editor") | null = null;

interface CodeBlock {
  code: string;
  language: string;
}

const codeBlocks: CodeBlock[] = [];
let placeholders: HTMLPreElement[] = [];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, "&quot;");
}

function renderMarkdown(md: string): string {
  codeBlocks.length = 0;
  let html = md;

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const index = codeBlocks.length;
    codeBlocks.push({ code: code.trim(), language: lang || "" });
    return `<pre class="code-block" data-code-index="${index}" data-lang="${escapeAttr(lang)}"></pre>`;
  });

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  html = html.replace(/^\|(.+)\|$/gm, (line) => {
    const cells = line.split("|").filter((c) => c.trim());
    if (cells.every((c) => /^[\s:-]+$/.test(c))) return "";
    return `<tr>${cells.map((c) => `<td>${c.trim()}</td>`).join("")}</tr>`;
  });
  html = html.replace(/<tr>.*<\/tr>/g, (match) => `<table>${match}</table>`);

  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

  html = html.replace(/^---$/gm, "<hr>");

  const file_lines = html.split("\n");
  const result: string[] = [];
  let inBlock = false;
  const lines = file_lines.slice(4);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inBlock) {
        result.push("</p>");
        inBlock = false;
      }
      continue;
    }
    if (trimmed.startsWith("<")) {
      if (inBlock) {
        result.push("</p>");
        inBlock = false;
      }
      result.push(line);
    } else if (trimmed.startsWith("|") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (inBlock) {
        result.push("</p>");
        inBlock = false;
      }
      result.push(line);
    } else {
      if (!inBlock) {
        result.push("<p>");
        inBlock = true;
      }
      result.push(line);
    }
  }
  if (inBlock) result.push("</p>");

  return result.join("\n");
}

async function applyColorization() {
  if (!monacoModule || !container.value) return;
  placeholders = [...container.value.querySelectorAll<HTMLPreElement>(".code-block")];
  for (const el of placeholders) {
    const index = parseInt(el.dataset.codeIndex || "");
    const block = codeBlocks[index];
    if (!block) continue;

    const lang = block.language === "asm" ? "x86asm" : block.language || "txt";
    try {
      const colored = await monacoModule.editor.colorize(block.code, lang, { tabSize: 2 });
      el.innerHTML = `<code>${colored}</code>`;
    } catch {
      el.innerHTML = `<pre><code>${escapeHtml(block.code)}</code></pre>`;
    }
  }
}

async function initMonaco() {
  if (monacoModule) return;
  const monaco = await import("monaco-editor");
  monacoModule = monaco;

  const { registerMonacoThemes } = await import("@/utils/monaco-themes");
  const { registerAssemblyLanguage } = await import("@/utils/monaco-languages");
  registerMonacoThemes(monaco);
  registerAssemblyLanguage(monaco);
  monaco.editor.setTheme(themeStore.theme);
}

onMounted(async () => {
  await initMonaco();
  await applyColorization();
});

watch(
  () => themeStore.theme,
  async () => {
    if (monacoModule) {
      monacoModule.editor.setTheme(themeStore.theme);
      await applyColorization();
    }
  },
);

watch(
  () => props.content,
  async () => {
    if (monacoModule) {
      await nextTick();
      await applyColorization();
    }
  },
);

const rendered = computed(() => renderMarkdown(props.content));
</script>

<template>
  <div ref="container" class="lesson-content" v-html="rendered" />
</template>

<style scoped>
.lesson-content {
  line-height: 1.7;
}
.lesson-content :deep(h1) {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}
.lesson-content :deep(h2) {
  font-size: 1.4rem;
  margin: 1.5rem 0 0.75rem;
}
.lesson-content :deep(h3) {
  font-size: 1.15rem;
  margin: 1.25rem 0 0.5rem;
}
.lesson-content :deep(p) {
  margin: 0.75rem 0;
}
.lesson-content :deep(code) {
  background: var(--color-background-mute);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 0.9em;
}
.lesson-content :deep(.code-block) {
  background: var(--color-code-bg);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1rem 0;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.5;
}
.lesson-content :deep(.code-block code) {
  background: none;
  padding: 0;
}
.lesson-content :deep(table) {
  border-collapse: collapse;
  margin: 1rem 0;
  width: 100%;
}
.lesson-content :deep(td) {
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem;
}
.lesson-content :deep(ul) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}
.lesson-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 1.5rem 0;
}
</style>
