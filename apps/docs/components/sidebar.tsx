'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { REGISTRY } from '../lib/components-registry'

export function Sidebar() {
  const pathname = usePathname()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return REGISTRY
    const q = query.toLowerCase()
    return REGISTRY.map((cat) => ({
      ...cat,
      components: cat.components.filter(
        (c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)
      ),
    })).filter((cat) => cat.components.length > 0)
  }, [query])

  const totalCount = REGISTRY.reduce((sum, c) => sum + c.components.length, 0)

  return (
    <aside className="w-72 border-r border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] sticky top-0 h-screen overflow-y-auto flex flex-col">
      <div className="p-5 border-b border-[rgb(var(--bd-default))]">
        <Link href="/" className="block mb-4">
          <div className="font-bold text-lg text-[rgb(var(--color-primary))]">indas-ui</div>
          <div className="text-[10px] text-[rgb(var(--fg-muted))]">
            v0.0.1 · {totalCount} components
          </div>
        </Link>
        <input
          type="text"
          placeholder="Search components..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-app))] text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:border-[rgb(var(--color-primary))]"
        />
      </div>

      <nav className="flex-1 p-3 space-y-5">
        <Link
          href="/"
          className={`block px-2 py-1 rounded text-sm ${
            pathname === '/'
              ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-medium'
              : 'text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))]'
          }`}
        >
          Introduction
        </Link>

        {filtered.map((cat) => (
          <div key={cat.slug}>
            <div className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-muted))] font-semibold mb-1 px-2">
              {cat.title}
              <span className="ml-1 opacity-60">({cat.components.length})</span>
            </div>
            <div className="space-y-0.5">
              {cat.components.map((c) => {
                const href = `/components/${c.slug}`
                const isActive = pathname === href
                return (
                  <Link
                    key={c.slug}
                    href={href}
                    className={`block px-2 py-1 rounded text-[13px] transition ${
                      isActive
                        ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-medium'
                        : 'text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))]'
                    }`}
                  >
                    {c.name}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-sm text-[rgb(var(--fg-muted))] text-center py-8">
            No components match "{query}"
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-[rgb(var(--bd-default))] space-y-1.5">
        <a
          href="https://github.com/ShreyanshPatidar/indas-ui"
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))]"
        >
          GitHub →
        </a>
        <a
          href="https://www.npmjs.com/package/indas-ui"
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))]"
        >
          npm →
        </a>
      </div>
    </aside>
  )
}
