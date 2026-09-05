#!/usr/bin/env node
// Watch mode with the same pipeline as `build`: tsc emit + alias rewrite, assets copied
// once up front so linked consumers (apps/docs) resolve dist/styles and dist/locales.
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const bin = (name) => path.join(root, '..', '..', 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name)
const run = (name, args) => spawn(bin(name), args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })

spawnSync(bin('tsc'), ['-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
spawnSync(bin('tsc-alias'), ['-p', 'tsconfig.build.json', '--resolve-full-paths'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
spawnSync(process.execPath, [path.join(root, 'scripts', 'copy-assets.mjs')], { cwd: root, stdio: 'inherit' })

const procs = [
  run('tsc', ['-p', 'tsconfig.build.json', '--watch', '--preserveWatchOutput']),
  run('tsc-alias', ['-p', 'tsconfig.build.json', '--resolve-full-paths', '--watch']),
]
const stop = () => { for (const p of procs) p.kill(); process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
