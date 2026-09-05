import { defineConfig } from 'tsup'
import path from 'node:path'

/**
 * Build: one entry per component group so consumers only pay for what they import
 * (`import { Button } from 'indas-ui/ui'` no longer pulls ECharts or the DataGrid).
 * The root `indas-ui` entry is kept for backwards compatibility. Code splitting shares
 * common chunks between entries; `sideEffects` in package.json lets bundlers drop
 * unused modules.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    ui: 'src/components/ui/index.ts',
    layout: 'src/components/layout/index.ts',
    datagrid: 'src/components/datagrid/index.ts',
    dashboard: 'src/components/dashboard/index.ts',
    charts: 'src/components/dashboard/charts/index.ts',
    kpi: 'src/components/dashboard/kpi/index.ts',
    modals: 'src/components/modals/index.ts',
    forms: 'src/components/forms/index.ts',
    providers: 'src/providers.ts',
  },
  format: ['esm', 'cjs'],
  splitting: true,
  treeshake: true,
  dts: true,
  sourcemap: true,
  clean: true,
  // Every module is client-side React; the directive must lead each emitted file.
  banner: { js: "'use client';" },
  external: ['react', 'react-dom', 'next', 'next-auth', 'next/link', 'next/image', 'next/navigation', 'next/headers'],
  injectStyle: false,
  esbuildOptions(options) {
    options.alias = { '@': path.resolve(__dirname, 'src') }
  },
  loader: { '.css': 'copy' },
})
