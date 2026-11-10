// Bundles src/web-components (React included) into dist/web-components/indas-ui.js, and builds its
// stylesheet: the tokens, a box-model reset scoped to the Indas tags, and every Tailwind class the
// components use. Run by `npm run build`, after the library build.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { build } from 'esbuild'

const pkg = new URL('../', import.meta.url)
const out = new URL('dist/web-components/', pkg)
mkdirSync(out, { recursive: true })

await build({
  entryPoints: [new URL('src/web-components/index.tsx', pkg).pathname.replace(/^\/([A-Za-z]:)/, '$1')],
  bundle: true,
  format: 'esm',
  // Split, so the export libraries (Excel, PDF) the grid loads on demand stay out of the first file.
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  minify: true,
  jsx: 'automatic',
  target: 'es2020',
  outdir: out.pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  entryNames: 'indas-ui',
  alias: { '@': new URL('src', pkg).pathname.replace(/^\/([A-Za-z]:)/, '$1') },
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.css': 'empty' },
  logLevel: 'warning',
})

const tags = ['indas-button', 'indas-input', 'indas-badge', 'indas-card', 'indas-data-grid']
const scope = `:where(${tags.join(', ')})`
const input = `${readFileSync(new URL('src/styles/tokens.css', pkg), 'utf8')}
${scope}, ${scope} *, ${scope} ::before, ${scope} ::after { box-sizing: border-box; border-width: 0; border-style: solid; }
${scope} { display: block; font-family: inherit; }
indas-button, indas-badge { display: inline-block; }
${scope} button, ${scope} input, ${scope} select, ${scope} textarea { font: inherit; color: inherit; margin: 0; }
${scope} table { border-collapse: collapse; }
@tailwind components;
@tailwind utilities;
`
const tmp = new URL('wc-input.css', out)
writeFileSync(tmp, input)
const cssOut = new URL('indas-ui.css', out).pathname.replace(/^\/([A-Za-z]:)/, '$1')
execFileSync(process.execPath, [new URL('../../node_modules/tailwindcss/lib/cli.js', pkg).pathname.replace(/^\/([A-Za-z]:)/, '$1'), '-c', 'web-components.tailwind.config.ts', '-i', tmp.pathname.replace(/^\/([A-Za-z]:)/, '$1'), '-o', cssOut, '--minify'], { cwd: pkg.pathname.replace(/^\/([A-Za-z]:)/, '$1'), stdio: 'inherit' })
rmSync(tmp)
console.log('web components -> dist/web-components/ (indas-ui.js, indas-ui.css)')
