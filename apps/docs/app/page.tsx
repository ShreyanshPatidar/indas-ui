import Link from 'next/link'
import { REGISTRY } from '../lib/components-registry'

export default function Home() {
  const totalCount = REGISTRY.reduce((sum, c) => sum + c.components.length, 0)

  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[rgb(var(--fg-muted))] mb-3 font-semibold">
        Getting started
      </div>
      <h1 className="text-4xl font-bold mb-3 text-[rgb(var(--fg-default))]">
        indas-ui
      </h1>
      <p className="text-lg text-[rgb(var(--fg-muted))] mb-3 leading-relaxed">
        Production-grade React component library extracted from Indas Estimo ERP.
      </p>
      <p className="text-sm text-[rgb(var(--fg-muted))] mb-10">
        {totalCount}+ components · Tailwind + Radix UI + TanStack Table · TypeScript
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Install</h2>
        <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-4 text-sm overflow-x-auto">
          <code>npm install indas-ui</code>
        </pre>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Setup</h2>
        <ol className="space-y-4 text-sm text-[rgb(var(--fg-default))]">
          <li>
            <div className="font-medium mb-1.5">1. Import design tokens in your app root</div>
            <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-3 overflow-x-auto">
              <code>{`import 'indas-ui/tokens.css'`}</code>
            </pre>
          </li>
          <li>
            <div className="font-medium mb-1.5">2. Set a theme class on your html element</div>
            <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-3 overflow-x-auto">
              <code>{`<html class="theme-default light">`}</code>
            </pre>
            <div className="text-xs text-[rgb(var(--fg-muted))] mt-1.5">
              Themes: theme-default, theme-red, theme-green, theme-purple, theme-orange, theme-black · Modes: light, dark
            </div>
          </li>
          <li>
            <div className="font-medium mb-1.5">3. Mount the provider stack (for DataGrid, contexts, alerts)</div>
            <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-3 overflow-x-auto text-xs">
              <code>{`import { ThemeProvider, LanguageProvider, DeviceProvider, QueryProvider, GlobalAlertProvider } from 'indas-ui'

<ThemeProvider>
  <QueryProvider>
    <LanguageProvider>
      <DeviceProvider>
        <GlobalAlertProvider>
          {children}
        </GlobalAlertProvider>
      </DeviceProvider>
    </LanguageProvider>
  </QueryProvider>
</ThemeProvider>`}</code>
            </pre>
          </li>
        </ol>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Quick Example</h2>
        <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-4 text-sm overflow-x-auto">
          <code>{`import { Button, Card, CardHeader, CardTitle, CardContent } from 'indas-ui'

export default function Example() {
  return (
    <Card>
      <CardHeader><CardTitle>Hello</CardTitle></CardHeader>
      <CardContent>
        <Button variant="primary">Click me</Button>
      </CardContent>
    </Card>
  )
}`}</code>
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Browse by category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REGISTRY.map((cat) => (
            <Link
              key={cat.slug}
              href={`/components/${cat.components[0].slug}`}
              className="block p-4 border border-[rgb(var(--bd-default))] rounded-lg hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--bg-hover))] transition group"
            >
              <div className="flex items-baseline justify-between mb-1">
                <div className="font-semibold text-[rgb(var(--fg-default))] group-hover:text-[rgb(var(--color-primary))]">
                  {cat.title}
                </div>
                <div className="text-xs text-[rgb(var(--fg-muted))]">
                  {cat.components.length}
                </div>
              </div>
              <div className="text-xs text-[rgb(var(--fg-muted))] line-clamp-1">
                {cat.components.slice(0, 4).map((c) => c.name).join(', ')}
                {cat.components.length > 4 && '…'}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
