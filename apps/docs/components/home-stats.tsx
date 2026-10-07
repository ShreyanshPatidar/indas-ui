'use client'

import { Layers, Moon, Package, Palette } from 'lucide-react'
import { KpiQuickStats } from 'indas-ui'

/**
 * The front page's "at a glance" card, drawn with the library's own KpiQuickStats so the first
 * thing a visitor sees is a component in use. A client component because the icons are passed as
 * components, which a server page cannot hand across.
 */
export function HomeStats({ components, categories }: { components: number; categories: number }) {
  return (
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
  )
}
