import { notFound } from 'next/navigation'
import Link from 'next/link'
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
      <div className="text-xs uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-2">
        {category.title}
      </div>
      <h1 className="text-3xl font-bold mb-2">{component.name}</h1>
      {component.description && (
        <p className="text-[rgb(var(--fg-muted))] mb-8 text-base leading-relaxed">
          {component.description}
        </p>
      )}

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-[rgb(var(--fg-default))]">Import</h2>
        <pre className="bg-[rgb(var(--bg-subtle))] border border-[rgb(var(--bd-default))] rounded-lg p-3 text-sm overflow-x-auto">
          <code>{importStatement}</code>
        </pre>
      </section>

      <section className="mb-8">
        <div className="border border-[rgb(var(--bd-default))] rounded-lg p-5 bg-[rgb(var(--bg-surface))]">
          <div className="text-sm text-[rgb(var(--fg-muted))] leading-relaxed">
            <p className="mb-3">
              This component is exported from the library but does not yet have an interactive demo page.
              The source code is available on GitHub and the API surface can be inspected via TypeScript IntelliSense after install.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href={`${githubBase}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--color-primary))] hover:underline"
              >
                Browse source on GitHub →
              </a>
              <a
                href="https://www.npmjs.com/package/indas-ui"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--color-primary))] hover:underline"
              >
                npm package →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3 text-[rgb(var(--fg-default))]">Related in {category.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {category.components
            .filter((c) => c.slug !== slug)
            .slice(0, 9)
            .map((c) => (
              <Link
                key={c.slug}
                href={`/components/${c.slug}`}
                className="block px-3 py-2 rounded-md text-sm border border-[rgb(var(--bd-default))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--bg-hover))] transition"
              >
                {c.name}
              </Link>
            ))}
        </div>
      </section>
    </div>
  )
}
