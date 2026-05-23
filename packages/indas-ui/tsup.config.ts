import { defineConfig } from 'tsup'
import path from 'node:path'
import fs from 'node:fs'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'next',
    'next-auth',
    'next/link',
    'next/image',
    'next/navigation',
    'next/headers',
  ],
  treeshake: true,
  injectStyle: false,
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  loader: {
    '.css': 'copy',
  },
  async onSuccess() {
    const distDir = path.resolve(__dirname, 'dist')
    for (const file of fs.readdirSync(distDir)) {
      if (file.endsWith('.js') || file.endsWith('.cjs')) {
        const full = path.join(distDir, file)
        const content = fs.readFileSync(full, 'utf8')
        if (!content.startsWith("'use client'")) {
          fs.writeFileSync(full, `'use client';\n${content}`)
        }
      }
    }
  },
})
