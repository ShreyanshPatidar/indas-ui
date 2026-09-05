#!/usr/bin/env node
// Post-build: copy CSS/JSON assets next to the emitted modules (ESM in dist/, CJS in
// dist/cjs/), mark client modules with 'use client', and flag dist/cjs as CommonJS.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'src')
const dist = path.join(root, 'dist')
const cjs = path.join(dist, 'cjs')
const exts = new Set(['.css', '.json'])
// Server-only modules must not carry the client directive (next/headers, getServerSession).
const SERVER_ONLY = /from\s+['"](next\/headers|next-auth\/next)['"]|require\(['"](next\/headers|next-auth\/next)['"]\)/
let copied = 0
let marked = 0

function copyAssets(dir, outRoot) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) copyAssets(full, outRoot)
    else if (exts.has(path.extname(entry))) {
      const target = path.join(outRoot, path.relative(src, full))
      mkdirSync(path.dirname(target), { recursive: true })
      copyFileSync(full, target)
      copied++
    }
  }
}

function markClient(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) markClient(full)
    else if (entry.endsWith('.js')) {
      const content = readFileSync(full, 'utf8')
      if (/^['"]use client['"]/.test(content) || SERVER_ONLY.test(content)) continue
      writeFileSync(full, `'use client';\n${content}`)
      marked++
    }
  }
}

copyAssets(src, dist)
if (existsSync(cjs)) {
  copyAssets(src, cjs)
  writeFileSync(path.join(cjs, 'package.json'), '{ "type": "commonjs" }\n')
}
markClient(dist)
console.log(`copied ${copied} asset file(s); added 'use client' to ${marked} module(s)`)
