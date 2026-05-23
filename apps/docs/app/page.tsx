import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-3 text-[rgb(var(--fg-default))]">indas-ui</h1>
      <p className="text-lg text-[rgb(var(--fg-muted))] mb-8">
        React components extracted from Indas Estimo. Tailwind + Radix + Lucide.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Install</h2>
        <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-4 text-sm overflow-x-auto">
          <code>npm install indas-ui</code>
        </pre>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">Setup</h2>
        <p className="mb-3 text-[rgb(var(--fg-default))]">Import the design tokens in your app root:</p>
        <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-4 text-sm overflow-x-auto mb-4">
          <code>{`import 'indas-ui/tokens.css'`}</code>
        </pre>
        <p className="mb-3 text-[rgb(var(--fg-default))]">Set a theme class on your html element:</p>
        <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-4 text-sm overflow-x-auto">
          <code>{`<html class="theme-default light">`}</code>
        </pre>
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
        <h2 className="text-xl font-semibold mb-3">Components</h2>
        <div className="grid grid-cols-2 gap-3">
          {['button', 'input', 'card', 'checkbox', 'switch', 'textarea', 'label'].map((c) => (
            <Link
              key={c}
              href={`/components/${c}`}
              className="block p-4 border border-[rgb(var(--bd-default))] rounded-lg hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--bg-hover))] transition"
            >
              <div className="font-medium capitalize">{c}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
