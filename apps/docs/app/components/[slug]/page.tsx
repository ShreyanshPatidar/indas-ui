import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Github, Package } from 'lucide-react'
import { REGISTRY } from '../../../lib/components-registry'

export function generateStaticParams() {
  return REGISTRY.flatMap((cat) =>
    cat.components.map((c) => ({ slug: c.slug }))
  )
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let category = null
  let component = null
  for (const cat of REGISTRY) {
    const found = cat.components.find((c) => c.slug === slug)
    if (found) {
      category = cat
      component = found
      break
    }
  }
  if (!component || !category) notFound()

  const importStatement = `import { ${component.name} } from 'indas-ui'`
  const githubBase = 'https://github.com/ShreyanshPatidar/indas-ui/tree/main/packages/indas-ui/src'

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/"
          className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))] font-semibold hover:text-[rgb(var(--color-primary))] transition"
        >
          {category.title}
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mt-2 mb-3 text-[rgb(var(--fg-default))]">
          {component.name}
        </h1>
        {component.description && (
          <p className="text-base text-[rgb(var(--fg-muted))] leading-relaxed max-w-2xl">
            {component.description}
          </p>
        )}
      </div>

      {/* Import */}
      <section className="mb-10">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-2">Import</div>
        <pre className="bg-[#0a0a0a] border border-[rgb(var(--bd-default))] rounded-lg px-4 py-3 text-[13px] overflow-x-auto">
          <code className="text-[#e4e4e7] font-mono">{importStatement}</code>
        </pre>
      </section>

      {/* Status notice */}
      <section className="mb-10">
        <div className="border border-[rgb(var(--bd-default))] rounded-lg p-5 bg-[rgb(var(--bg-surface))]">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-md bg-[rgb(var(--color-warning))]/10 text-[rgb(var(--color-warning))] flex items-center justify-center shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-[rgb(var(--fg-default))] mb-1">
                Interactive demo coming soon
              </div>
              <div className="text-[13px] text-[rgb(var(--fg-muted))] leading-relaxed mb-3">
                This component is fully exported and ready to use in your project.
                A polished playground page is on the roadmap. For now, the source code and TypeScript types are your best reference.
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={githubBase}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-[rgb(var(--fg-default))] border border-[rgb(var(--bd-default))] hover:bg-[rgb(var(--bg-hover))] transition"
                >
                  <Github className="h-3 w-3" />
                  Browse source
                </a>
                <a
                  href="https://www.npmjs.com/package/indas-ui"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-[rgb(var(--fg-default))] border border-[rgb(var(--bd-default))] hover:bg-[rgb(var(--bg-hover))] transition"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on npm
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-3">
          More in {category.title}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {category.components
            .filter((c) => c.slug !== slug)
            .slice(0, 12)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/components/${c.slug}`}
                className="block px-3 py-2 rounded-md text-[13px] text-[rgb(var(--fg-default))] border border-[rgb(var(--bd-default))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--bg-hover))] transition"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </section>
    </div>
  )
}
