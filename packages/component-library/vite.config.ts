import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path, { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const packageRoot = fileURLToPath(new URL('.', import.meta.url))

/** After each lib build (incl. `vite build --watch`), restore `import './index.css'` in dist. */
function injectCssImport(): Plugin {
  return {
    name: 'inject-css-import',
    closeBundle() {
      execSync('node scripts/inject-css-import.mjs', {
        cwd: packageRoot,
        stdio: 'inherit',
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), injectCssImport()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'styles.css'
          return assetInfo.name || 'asset'
        },
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
