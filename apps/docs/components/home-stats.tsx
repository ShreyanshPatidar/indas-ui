'use client'

import Link from 'next/link'
import { ArrowRight, Clock, Inbox, Layers, Moon, Package, Palette, Send, Trophy } from 'lucide-react'
import { KpiQuickStats } from 'indas-ui'

/**
 * The front page's hero column, drawn with the library's own KpiQuickStats so the first thing a
 * visitor sees is a component in use: a realistic "Today" card, then the library at a glance.
 * A client component because the icons are passed as components, which a server page cannot hand
 * across.
 */
export function HomeStats({ components, categories }: { components: number; categories: number }) {
  return (
    <div className="space-y-3">
      <KpiQuickStats
        title="Today"
        columns={2}
        stats={[
          { label: 'Enquiries', value: 24, icon: Inbox, iconColor: 'primary' },
          { label: 'Sent', value: 18, icon: Send, iconColor: 'info' },
          { label: 'Pending', value: 12, icon: Clock, iconColor: 'warning' },
          { label: 'Won', value: 8, icon: Trophy, iconColor: 'success' },
        ]}
      />
      <KpiQuickStats
        title="Indas UI at a glance"
        columns={2}
        stats={[
          { label: 'Components', value: components, icon: Package, iconColor: 'primary' },
          { label: 'Categories', value: categories, icon: Layers, iconColor: 'info' },
          { label: 'Themes', value: 6, icon: Palette, iconColor: 'success' },
          { label: 'Modes', value: 2, icon: Moon, iconColor: 'warning' },
        ]}
      />
      <Link
        href="/components/kpi-quick-stats"
        className="group inline-flex items-center gap-1 text-[11px] text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))] transition"
      >
        Built with <code className="font-mono text-[rgb(var(--fg-default))] group-hover:text-[rgb(var(--color-primary))]">KpiQuickStats</code>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
