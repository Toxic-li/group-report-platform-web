<template>
  <div class="formula-editor" :class="{ 'fullscreen': isFullscreen }">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="undoFormula" title="撤销">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M1 14h10V4H1v10zm1-9v6h8V5H2z" fill="currentColor"/>
            <path d="M13 8l-4-4v3H3v2h6v3l4-4z" fill="currentColor"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="redoFormula" title="重做">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M5 4v6h8V4H5zm1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" fill="currentColor"/>
            <path d="M3 8l4 4V5H3v3z" fill="currentColor"/>
          </svg>
        </button>
        <div class="toolbar-divider"></div>
        <button class="toolbar-btn" @click="insertParentheses" title="插入括号">
          <span>( )</span>
        </button>
        <button class="toolbar-btn" @click="insertBracket" title="插入方括号">
          <span>[ ]</span>
        </button>
        <button class="toolbar-btn" @click="insertBraces" title="插入花括号">
          <span>{ }</span>
        </button>
        <button class="toolbar-btn" @click="insertComma" title="插入逗号">
          <span>,</span>
        </button>
        <div class="toolbar-divider"></div>
        <button class="toolbar-btn" @click="formatFormula" title="格式化">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M3 3h10v2H3V3zm0 4h7v2H3V7zm0 4h10v2H3v-2z" fill="currentColor"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="clearFormula" title="清空">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M13 3h-3V1H5v2H2v12h11V3zM8 5h5v1H8V5zm0 3h5v1H8V8zm0 3h5v1H8v-1zM3 5h2v6H3V5z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div class="toolbar-center">
        <span class="cursor-info">Ln {{ cursorPosition.line }}, Col {{ cursorPosition.column }}</span>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="findInFormula" title="查找">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-1 0a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0z" fill="currentColor"/>
            <path d="M15 14l-4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="replaceInFormula" title="替换">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-1 0a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0z" fill="currentColor"/>
            <path d="M7 10h2V8H7v2zm0-4h2V4H7v2z" fill="currentColor"/>
          </svg>
        </button>
        <div class="toolbar-divider"></div>
        <button class="toolbar-btn" @click="copyFormula" title="复制">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M12 1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm-1 10H4V3h7v8z" fill="currentColor"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="toggleTheme" title="切换主题">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm0 3a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1zm0 6a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1z" fill="currentColor"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="toggleFullscreen" title="全屏">
          <svg v-if="!isFullscreen" viewBox="0 0 16 16" width="14" height="14">
            <path d="M1 1v3h3V1H1zm4 0v3h10V1H5zm0 4v10H1V5h4zm6 0v10H9V5h2z" fill="currentColor"/>
          </svg>
          <svg v-else viewBox="0 0 16 16" width="14" height="14">
            <path d="M1 5v9h9V5H1zm1 1h7v7H2V6zm10-1v9h3V5h-3zm1 1h1v7h-1V6z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="editor-container">
      <div v-if="monacoLoading" class="editor-loading">
        <svg class="loading-spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="60" stroke-dashoffset="0" transform="rotate(0 12 12)">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </circle>
        </svg>
        <span>加载编辑器...</span>
      </div>
      <div v-else-if="!monacoLoaded" class="fallback-editor-wrapper">
        <textarea
          ref="fallbackEditor"
          class="fallback-editor"
          v-model="localExpression"
          placeholder="请输入公式，或点击右侧面板插入函数、指标和运算符..."
          @input="handleFallbackInput"
          @click="handleFallbackClick"
          @keydown="handleFallbackKeydown"
        ></textarea>
      </div>
      <div v-else ref="editorContainer" class="monaco-editor"></div>
    </div>

    <div class="editor-status-bar">
      <div class="status-left">
        <span :class="['status-badge', formulaStatus]">{{ formulaStatusText }}</span>
        <span class="status-text">{{ formulaData.expression.length }} 字符</span>
      </div>
      <div class="status-right">
        <span class="status-text">Monaco Editor</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue'

export default {
  name: 'FormulaEditor',
  props: {
    formulaData: Object,
    formulaStatus: String,
    formulaStatusText: String,
    monacoLoading: Boolean,
    monacoLoaded: Boolean,
    cursorPosition: Object,
    isFullscreen: Boolean
  },
  emits: ['load', 'undo', 'redo', 'insert-parentheses', 'insert-bracket', 'insert-braces', 'insert-comma', 'format', 'clear', 'copy', 'find', 'replace', 'toggle-theme', 'toggle-fullscreen', 'expression-change', 'cursor-change'],
  setup(props, { emit }) {
    const editorContainer = ref(null)
    const fallbackEditor = ref(null)
    const localExpression = ref(props.formulaData?.expression || '')

    watch(() => props.formulaData?.expression, (newVal) => {
      localExpression.value = newVal || ''
    })

    onMounted(() => {
      nextTick(() => {
        if (editorContainer.value) {
          emit('load', editorContainer)
          console.log('FormulaEditor mounted, container:', editorContainer.value)
        } else {
          console.error('FormulaEditor mounted but editorContainer is null')
        }
      })
    })

    function handleFallbackInput(event) {
      emit('expression-change', event.target.value)
    }

    function handleFallbackClick() {
      emit('cursor-change', {
        line: fallbackEditor.value?.selectionStart || 0,
        column: fallbackEditor.value?.selectionEnd || 0
      })
    }

    function handleFallbackKeydown(event) {
      if (event.key === 'Tab') {
        event.preventDefault()
        const start = fallbackEditor.value.selectionStart
        const end = fallbackEditor.value.selectionEnd
        const text = fallbackEditor.value.value
        fallbackEditor.value.value = text.substring(0, start) + '  ' + text.substring(end)
        fallbackEditor.value.selectionStart = fallbackEditor.value.selectionEnd = start + 2
      }
    }

    return {
      editorContainer,
      fallbackEditor,
      localExpression,
      handleFallbackInput,
      handleFallbackClick,
      handleFallbackKeydown
    }
  },
  methods: {
    undoFormula() {
      this.$emit('undo')
    },
    redoFormula() {
      this.$emit('redo')
    },
    insertParentheses() {
      this.$emit('insert-parentheses')
    },
    insertBracket() {
      this.$emit('insert-bracket')
    },
    insertBraces() {
      this.$emit('insert-braces')
    },
    insertComma() {
      this.$emit('insert-comma')
    },
    formatFormula() {
      this.$emit('format')
    },
    clearFormula() {
      this.$emit('clear')
    },
    copyFormula() {
      this.$emit('copy')
    },
    findInFormula() {
      this.$emit('find')
    },
    replaceInFormula() {
      this.$emit('replace')
    },
    toggleTheme() {
      this.$emit('toggle-theme')
    },
    toggleFullscreen() {
      this.$emit('toggle-fullscreen')
    }
  }
}
</script>