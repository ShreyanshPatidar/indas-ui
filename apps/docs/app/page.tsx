import Link from 'next/link'
import { ArrowRight, Package, Layers, Zap } from 'lucide-react'
import { REGISTRY } from '../lib/components-registry'

export default function Home() {
  const totalCount = REGISTRY.reduce((sum, c) => sum + c.components.length, 0)

  return (
    <div>
      {/* Hero */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] text-[11px] font-medium tracking-wide mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--color-primary))] animate-pulse" />
          v0.0.1 · MIT licensed
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4 text-[rgb(var(--fg-default))] leading-[1.05]">
          The ERP component library<br />for serious teams.
        </h1>
        <p className="text-lg text-[rgb(var(--fg-muted))] leading-relaxed max-w-2xl">
          {totalCount}+ production-grade React components extracted from Indas Estimo.
          Includes DataGrid, DatePicker, action buttons, charts, modals — everything you need to ship a real app.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-7">
          <Link
            href="/components/data-grid"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[rgb(var(--color-primary))] text-white text-sm font-medium hover:bg-[rgb(var(--color-primary-hover))] transition shadow-sm"
          >
            Browse components
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a
            href="https://github.com/ShreyanshPatidar/indas-ui"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-[rgb(var(--bd-default))] text-[rgb(var(--fg-default))] text-sm font-medium hover:bg-[rgb(var(--bg-hover))] transition"
          >
            GitHub
          </a>
        </div>
      </div>

      {/* Feature strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-14">
        {[
          { icon: Package, title: 'One install', desc: 'npm install indas-ui — everything ships in one package' },
          { icon: Layers, title: '10 categories', desc: 'Forms, DataGrid, Modals, Layout, Charts, Hooks…' },
          { icon: Zap, title: 'Tailwind native', desc: 'CSS variables for theming, 6 built-in themes' },
        ].map((f) => (
          <div key={f.title} className="p-4 rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))]">
            <div className="h-8 w-8 rounded-md bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] flex items-center justify-center mb-2.5">
              <f.icon className="h-4 w-4" />
            </div>
            <div className="font-semibold text-sm text-[rgb(var(--fg-default))] mb-1">{f.title}</div>
            <div className="text-xs text-[rgb(var(--fg-muted))] leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick start */}
      <section className="mb-14">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight">Quick start</h2>
          <div className="text-xs text-[rgb(var(--fg-muted))]">~30 seconds</div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-2">1. Install</div>
            <CodeBlock>npm install indas-ui</CodeBlock>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-2">2. Import tokens in your app root</div>
            <CodeBlock>{`import 'indas-ui/tokens.css'`}</CodeBlock>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-2">3. Set theme on html element</div>
            <CodeBlock>{`<html class="theme-default light">`}</CodeBlock>
            <div className="text-[11px] text-[rgb(var(--fg-muted))] mt-2 leading-relaxed">
              Themes: <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">theme-default</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">theme-red</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">theme-green</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">theme-purple</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">theme-orange</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">theme-black</code> · Modes:{' '}
              <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">light</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-default))] text-[10px]">dark</code>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Component categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {REGISTRY.map((cat) => (
            <Link
              key={cat.slug}
              href={`/components/${cat.components[0].slug}`}
              className="group block p-4 rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] hover:border-[rgb(var(--color-primary))] hover:shadow-sm transition"
            >
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="font-semibold text-sm text-[rgb(var(--fg-default))] group-hover:text-[rgb(var(--color-primary))] transition">
                  {cat.title}
                </div>
                <div className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]">
                  {cat.components.length}
                </div>
              </div>
              <div className="text-[11px] text-[rgb(var(--fg-muted))] line-clamp-1">
                {cat.components.slice(0, 5).map((c) => c.name).join(' · ')}
                {cat.components.length > 5 && ' …'}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      <pre className="bg-[#0a0a0a] border border-[rgb(var(--bd-default))] rounded-lg px-4 py-3 text-[13px] overflow-x-auto">
        <code className="text-[#e4e4e7] font-mono">{children}</code>
      </pre>
    </div>
  )
}
