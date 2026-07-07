/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    // 允许 .js 导入路径自动解析到 .ts 源文件（TypeScript 迁移期）
    extensionAlias: {
      '.js': ['.ts', '.js']
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: ``,
        silenceDeprecations: ['legacy-js-api']
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia']
  },
  build: {
    // 提高 chunk 大小警告阈值（Univer.js 较大）
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 代码分割策略：将大型依赖拆分为独立 chunk
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-element': ['element-plus'],
          'vendor-univer': [
            '@univerjs/core',
            '@univerjs/design',
            '@univerjs/ui',
            '@univerjs/sheets-ui',
            '@univerjs/docs-ui'
          ],
          'vendor-monaco': ['monaco-editor']
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
})
