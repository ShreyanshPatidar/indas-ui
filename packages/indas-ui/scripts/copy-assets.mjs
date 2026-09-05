#!/usr/bin/env node
/**
 * Copies non-TS assets (CSS, JSON locales) from src to dist, mirroring paths,
 * so per-module output keeps its relative imports working.
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'src')
const dist = path.join(root, 'dist')
const exts = new Set(['.css', '.json'])
let copied = 0
let marked = 0

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full)
    else if (exts.has(path.extname(entry))) {
      const target = path.join(dist, path.relative(src, full))
      mkdirSync(path.dirname(target), { recursive: true })
      copyFileSync(full, target)
      copied++
    }
  }
}

// Every emitted module is client-side React; make the directive explicit so Next.js
// consumers can import any entry from a Server Component without a client wrapper.
function markClient(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) markClient(full)
    else if (entry.endsWith('.js')) {
      const content = readFileSync(full, 'utf8')
      if (!/^['"]use client['"]/.test(content)) {
        writeFileSync(full, `'use client';\n${content}`)
        marked++
      }
    }
  }
}

walk(src)
markClient(dist)
console.log(`copied ${copied} asset file(s); added 'use client' to ${marked} module(s)`)
