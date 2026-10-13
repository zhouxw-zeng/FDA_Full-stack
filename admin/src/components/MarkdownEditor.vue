<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { EditPen, Link, List, View } from '@element-plus/icons-vue';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

defineOptions({ name: 'MarkdownEditor' });

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    /** 编辑区最小高度（px） */
    minHeight?: number;
    disabled?: boolean;
  }>(),
  {
    placeholder: '在这里编写 Markdown 内容',
    minHeight: 260,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const mode = ref<'edit' | 'preview'>('edit');
const textareaRef = ref<HTMLTextAreaElement>();

const stats = computed(() => {
  const text = props.modelValue ?? '';
  return {
    lines: text ? text.split('\n').length : 0,
    chars: text.length,
  };
});

/** 预览统一走 sanitize，避免 Markdown 里夹带脚本 */
const previewHtml = computed(() => {
  const html = marked.parse(props.modelValue || '', { breaks: true, gfm: true }) as string;
  return DOMPurify.sanitize(html);
});

function update(value: string): void {
  emit('update:modelValue', value);
}

function getRange(): { start: number; end: number; selected: string } {
  const source = props.modelValue ?? '';
  const element = textareaRef.value;
  if (!element) {
    return { start: source.length, end: source.length, selected: '' };
  }
  return {
    start: element.selectionStart,
    end: element.selectionEnd,
    selected: source.slice(element.selectionStart, element.selectionEnd),
  };
}

/** 替换指定区间，并把光标放到期望位置 */
async function replaceRange(
  start: number,
  end: number,
  text: string,
  selection?: [number, number],
): Promise<void> {
  const source = props.modelValue ?? '';
  update(source.slice(0, start) + text + source.slice(end));

  await nextTick();
  const element = textareaRef.value;
  if (!element) {
    return;
  }
  element.focus();
  if (selection) {
    element.setSelectionRange(start + selection[0], start + selection[1]);
    return;
  }
  const caret = start + text.length;
  element.setSelectionRange(caret, caret);
}

function wrapSelection(before: string, after = before): void {
  const { start, end, selected } = getRange();
  const inner = selected || '文本';
  void replaceRange(start, end, `${before}${inner}${after}`, [
    before.length,
    before.length + inner.length,
  ]);
}

/** 给选中行（或当前行）加前缀，用于标题 / 列表 / 引用 */
function prefixLines(prefix: string): void {
  const source = props.modelValue ?? '';
  const { start, end } = getRange();
  const lineStart = source.lastIndexOf('\n', Math.max(start - 1, 0)) + 1;
  const blockEnd = end > lineStart ? end : lineStart;
  const block = source.slice(lineStart, blockEnd);

  const prefixed = (block || '')
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');

  void replaceRange(lineStart, blockEnd, prefixed);
}

const actions: { label: string; text?: string; icon?: typeof List; run: () => void }[] = [
  { label: '二级标题', text: 'H2', run: () => prefixLines('## ') },
  { label: '加粗', text: 'B', run: () => wrapSelection('**') },
  { label: '斜体', text: 'I', run: () => wrapSelection('*') },
  { label: '无序列表', icon: List, run: () => prefixLines('- ') },
  { label: '引用', text: '>', run: () => prefixLines('> ') },
  { label: '行内代码', text: '</>', run: () => wrapSelection('`') },
  { label: '代码块', text: '{ }', run: () => wrapSelection('\n```\n', '\n```\n') },
  { label: '链接', icon: Link, run: () => wrapSelection('[', '](https://)') },
];
</script>

<template>
  <div class="md-editor" :class="{ 'md-editor--disabled': props.disabled }">
    <header class="md-editor__head">
      <div class="md-editor__toolbar">
        <el-tooltip v-for="action in actions" :key="action.label" :content="action.label" placement="top">
          <button
            type="button"
            class="md-editor__tool"
            :aria-label="action.label"
            :disabled="props.disabled"
            @click="action.run()"
          >
            <el-icon v-if="action.icon"><component :is="action.icon" /></el-icon>
            <span v-else :class="`md-editor__tool-text md-editor__tool-text--${action.text === 'B' ? 'bold' : action.text === 'I' ? 'italic' : 'plain'}`">
              {{ action.text }}
            </span>
          </button>
        </el-tooltip>
      </div>

      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="edit">
          <el-icon><EditPen /></el-icon>
          <span class="md-editor__mode-text">编辑</span>
        </el-radio-button>
        <el-radio-button value="preview">
          <el-icon><View /></el-icon>
          <span class="md-editor__mode-text">预览</span>
        </el-radio-button>
      </el-radio-group>
    </header>

    <div class="md-editor__body" :style="{ minHeight: `${props.minHeight}px` }">
      <textarea
        v-show="mode === 'edit'"
        ref="textareaRef"
        class="md-editor__input"
        :value="props.modelValue"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        spellcheck="false"
        @input="update(($event.target as HTMLTextAreaElement).value)"
      />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="mode === 'preview'" class="md-editor__preview markdown-body" v-html="previewHtml" />
    </div>

    <footer class="md-editor__foot">
      <span>{{ stats.lines }} 行</span>
      <span>{{ stats.chars }} 字符</span>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.md-editor {
  overflow: hidden;
  background-color: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);

  &--disabled {
    opacity: 0.7;
  }

  &__head {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    background-color: var(--app-surface-2);
    border-bottom: 1px solid var(--app-border);
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    align-items: center;
  }

  &__tool {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 6px;
    color: var(--app-ink-2);
    cursor: pointer;
    background-color: transparent;
    border: none;
    border-radius: var(--app-radius-sm);

    &:hover:not(:disabled) {
      color: var(--app-primary);
      background-color: var(--app-surface-3);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__tool-text {
    font-size: 12px;
    line-height: 1;

    &--bold {
      font-weight: 700;
    }

    &--italic {
      font-style: italic;
    }
  }

  &__mode-text {
    margin-left: 4px;
  }

  &__body {
    display: flex;
  }

  &__input {
    flex: 1;
    width: 100%;
    padding: 12px 14px;
    color: var(--app-ink);
    font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.75;
    resize: vertical;
    background-color: transparent;
    border: none;
    outline: none;
  }

  &__preview {
    flex: 1;
    padding: 12px 14px;
    overflow: auto;
    color: var(--app-ink-2);
  }

  &__foot {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    padding: 6px 10px;
    color: var(--app-ink-3);
    font-size: 12px;
    background-color: var(--app-surface-2);
    border-top: 1px solid var(--app-border);
  }
}

/* 预览区排版，跟随主题令牌 */
.markdown-body {
  font-size: 13px;
  line-height: 1.8;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 16px 0 8px;
    color: var(--app-ink);
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 20px;
  }

  :deep(h2) {
    font-size: 16px;
  }

  :deep(h3) {
    font-size: 14px;
  }

  :deep(p) {
    margin: 8px 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 8px 0;
    list-style: disc;
  }

  :deep(li) {
    margin: 4px 0;
  }

  :deep(code) {
    padding: 1px 5px;
    font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    background-color: var(--app-surface-3);
    border-radius: var(--app-radius-sm);
  }

  :deep(pre) {
    padding: 12px;
    margin: 10px 0;
    overflow: auto;
    background-color: var(--app-surface-3);
    border-radius: var(--app-radius);

    code {
      padding: 0;
      background-color: transparent;
    }
  }

  :deep(blockquote) {
    padding: 4px 12px;
    margin: 10px 0;
    color: var(--app-ink-3);
    border-left: 3px solid var(--app-border-strong);
  }

  :deep(a) {
    color: var(--app-primary);
  }

  :deep(table) {
    width: 100%;
    margin: 10px 0;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    padding: 6px 10px;
    border: 1px solid var(--app-border);
  }
}
</style>

