# indas-ui

React component library for business applications. Built with Tailwind CSS design tokens, Radix UI primitives, Lucide icons, and an advanced DataGrid.

- **Docs site:** https://shreyanshpatidar.github.io/indas-ui
- **npm:** https://www.npmjs.com/package/indas-ui

---

## Monorepo Structure

```
indas-ui/
├── packages/
│   └── indas-ui/        # The library (published to npm)
├── apps/
│   └── docs/            # Next.js docs site (deployed to GitHub Pages)
└── .github/workflows/
```

## Install (consumers)

```bash
npm install indas-ui
```

### Setup

1. Import design tokens in your app root:
   ```ts
   import 'indas-ui/tokens.css'
   ```
2. Set a theme class on `<html>`:
   ```html
   <html class="theme-default light">
   ```
3. Configure Tailwind to scan the library:
   ```js
   content: ['./src/**/*.{ts,tsx}', './node_modules/indas-ui/dist/**/*.{js,cjs}']
   ```

### Usage

```tsx
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from 'indas-ui'

<Card>
  <CardHeader><CardTitle>Hello</CardTitle></CardHeader>
  <CardContent>
    <Input label="Name" placeholder="Enter name" />
    <Button variant="primary">Create</Button>
  </CardContent>
</Card>
```

### Not React? Use the look on its own

The components are React (they work in any React app: Next.js, Vite, Remix, Astro islands). The
look, every colour in light and dark and each brand theme, comes from `tokens.css`, published in
three more forms for other stacks:

- **Vue, Svelte, Angular, plain HTML with Tailwind:** import `indas-ui/tokens.css`, set the theme
  class on `<html>`, and add the preset:
  ```js
  // tailwind.config.js
  module.exports = { presets: [require('indas-ui/tailwind-preset')], content: ['./src/**/*.{vue,svelte,html,ts}'] }
  ```
  Then `bg-bg-surface`, `text-fg-default`, `border-bd-default`, `bg-color-primary` and the rest
  read the same tokens the React components use.
- **Any language (design tools, native apps, scripts):** `indas-ui/tokens.json` holds `light`,
  `dark` and each brand theme's values (colours as `"R G B"`).
- **Flutter:** copy `node_modules/indas-ui/dist/tokens/indas_tokens.dart` into the app; it has
  `IndasLight` and `IndasDark` with one `Color` per token, for building `ThemeData`.

All three are generated from `tokens.css` on every build, so they never drift from it.

## Components

Button, Input, Card, Checkbox, Switch, Textarea, Label

Plus the `cn()` utility (clsx + tailwind-merge).

## Local Development

```bash
git clone https://github.com/ShreyanshPatidar/indas-ui.git
cd indas-ui
npm install                # installs all workspaces
npm run dev:docs           # docs site at http://localhost:4000
npm run dev:lib            # rebuild library on changes
npm run build              # build the library
npm run build:docs         # build docs (includes library build first)
```

## Publishing

Only CI publishes, so npm never holds a version git does not. A `v*` tag on main publishes
`packages/indas-ui` through npm Trusted Publishing (no token) and makes the GitHub release.
`npm publish` anywhere else refuses to run.

```bash
cd packages/indas-ui
npm version patch --no-git-tag-version   # bump packages/indas-ui/package.json
cd ../..
git commit -am "indas-ui <version>: what changed"
git tag v<version>
git push origin main --tags
```

## License

MIT
