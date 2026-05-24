'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
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
    <aside className="w-[260px] shrink-0 border-r border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] sticky top-0 h-screen overflow-hidden flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-[rgb(var(--bd-default))]">
        <Link href="/" className="flex items-center gap-2.5 mb-4 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary-hover))] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            iu
          </div>
          <div>
            <div className="font-semibold text-[15px] tracking-tight text-[rgb(var(--fg-default))] group-hover:text-[rgb(var(--color-primary))] transition">
              indas-ui
            </div>
            <div className="text-[10px] text-[rgb(var(--fg-muted))] font-medium tracking-wide">
              v0.0.1 · {totalCount} components
            </div>
          </div>
        </Link>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--fg-muted))]" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1.5 text-[13px] rounded-md border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-app))] text-[rgb(var(--fg-default))] placeholder:text-[rgb(var(--fg-muted))] focus:outline-none focus:border-[rgb(var(--color-primary))] focus:ring-2 focus:ring-[rgb(var(--color-primary))]/10 transition"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
        <Link
          href="/"
          className={`block px-2.5 py-1.5 rounded-md text-[13px] font-medium transition ${
            pathname === '/'
              ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]'
              : 'text-[rgb(var(--fg-default))] hover:bg-[rgb(var(--bg-hover))]'
          }`}
        >
          Introduction
        </Link>

        {filtered.map((cat) => (
          <div key={cat.slug}>
            <div className="text-[10px] uppercase tracking-[0.08em] text-[rgb(var(--fg-muted))] font-semibold mb-1.5 px-2.5 flex items-baseline justify-between">
              <span>{cat.title}</span>
              <span className="opacity-50 font-normal text-[9px]">{cat.components.length}</span>
            </div>
            <div className="space-y-px">
              {cat.components.map((c) => {
                const href = `/components/${c.slug}`
                const isActive = pathname === href
                return (
                  <Link
                    key={c.slug}
                    href={href}
                    className={`block px-2.5 py-1 rounded-md text-[13px] transition ${
                      isActive
                        ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-medium'
                        : 'text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--fg-default))]'
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
          <div className="text-[13px] text-[rgb(var(--fg-muted))] text-center py-8">
            No components match "{query}"
          </div>
        )}
      </nav>

      <div className="px-5 py-3 border-t border-[rgb(var(--bd-default))] flex items-center gap-4">
        <a
          href="https://github.com/ShreyanshPatidar/indas-ui"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] transition font-medium"
        >
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/indas-ui"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] transition font-medium"
        >
          npm
        </a>
        <span className="ml-auto text-[10px] text-[rgb(var(--fg-muted))]">MIT</span>
      </div>
    </aside>
  )
}
