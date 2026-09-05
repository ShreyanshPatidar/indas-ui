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

Tagged GitHub releases auto-publish `packages/indas-ui` to npm via Actions.
Add an `NPM_TOKEN` secret to the repo for the workflow.

Manual:
```bash
cd packages/indas-ui
npm version patch
npm publish
```

## License

MIT
