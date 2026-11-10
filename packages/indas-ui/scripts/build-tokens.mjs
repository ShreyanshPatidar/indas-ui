// Turns src/styles/tokens.css, the one source of the look, into forms other stacks can use, so
// an app that is not React still matches: tokens.json (any language), a Tailwind preset (Vue,
// Svelte, Angular, plain HTML with Tailwind) and a Dart file (Flutter). Run by `npm run build`.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const out = new URL('../dist/tokens/', import.meta.url)
mkdirSync(out, { recursive: true })

/**
 * Every rule block that declares custom properties, by selector. A small brace walk rather than a
 * regex: the :root block holds nested utility rules, and only its own declarations are tokens.
 */
const blocks = {}
{
  const stack = [{ selector: '', own: '' }]
  let text = ''
  for (const ch of css) {
    if (ch === '{') {
      stack[stack.length - 1].own += text.slice(0, text.lastIndexOf(';') + 1)
      const selector = text.slice(text.lastIndexOf(';') + 1).trim().replace(/\s+/g, ' ')
      stack.push({ selector, own: '' })
      text = ''
    } else if (ch === '}') {
      const done = stack.pop()
      done.own += text
      text = ''
      const vars = {}
      for (const d of done.own.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim()
      // The first block of a selector is the theme; later ones sit in @media rules (high
      // contrast, reduced motion) and only adjust it for those readers.
      if (Object.keys(vars).length && !blocks[done.selector]) blocks[done.selector] = vars
    } else text += ch
  }
}

const light = blocks[':root'] ?? {}
const dark = { ...light, ...(blocks['.dark'] ?? {}) }

/** var(--x) followed to its value within one theme; a value that is three numbers is an RGB colour. */
function resolve(theme, value, seen = new Set()) {
  const ref = /^var\(--([\w-]+)\)$/.exec(value)
  if (!ref || seen.has(ref[1])) return value
  seen.add(ref[1])
  return theme[ref[1]] === undefined ? value : resolve(theme, theme[ref[1]], seen)
}
const isRgb = (v) => /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(v)
const flat = (theme) => Object.fromEntries(Object.keys(theme).map((k) => [k, resolve(theme, theme[k])]))

const themes = {}
for (const [selector, vars] of Object.entries(blocks)) {
  const named = /^\.theme-([\w-]+)\.(light|dark)$/.exec(selector)
  if (!named) continue
  const [, name, mode] = named
  themes[name] ??= {}
  themes[name][mode] = flat({ ...(mode === 'dark' ? dark : light), ...vars })
}

const json = { light: flat(light), dark: flat(dark), themes }
writeFileSync(new URL('tokens.json', out), JSON.stringify(json, null, 2))

// Tailwind preset: colour utilities read the CSS variables, so tokens.css (or a theme class) sets
// the actual colours at run time, exactly as in the React components.
const colorNames = Object.keys(light).filter((k) => isRgb(resolve(light, light[k])))
const preset = `/** Indas UI Tailwind preset. Load indas-ui/tokens.css as well: it holds the colours. */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
${colorNames.map((k) => `        '${k}': 'rgb(var(--${k}) / <alpha-value>)',`).join('\n')}
      },
    },
  },
}
`
writeFileSync(new URL('tailwind-preset.cjs', out), preset)

// Dart: one Color per token for light and dark, for a Flutter app to build its ThemeData from.
const dartName = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
const dartColors = (theme) =>
  colorNames
    .map((k) => [k, resolve(theme, theme[k] ?? light[k])])
    .filter(([, v]) => isRgb(v))
    .map(([k, v]) => {
      const [r, g, b] = v.split(/\s+/).map(Number)
      return `  static const Color ${dartName(k)} = Color.fromARGB(255, ${r}, ${g}, ${b});`
    })
    .join('\n')
const dart = `// Generated from indas-ui tokens.css. Do not edit by hand.
import 'dart:ui';

/** Indas UI colours, light theme. */
class IndasLight {
${dartColors(light)}
}

/** Indas UI colours, dark theme. */
class IndasDark {
${dartColors(dark)}
}
`
writeFileSync(new URL('indas_tokens.dart', out), dart)
console.log(`tokens: ${colorNames.length} colours, ${Object.keys(themes).length} themes -> dist/tokens/`)
