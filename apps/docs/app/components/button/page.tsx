'use client'
import { Button } from 'indas-ui'
import { Preview } from '../../../components/preview'

export default function ButtonPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <div className="text-[11px] uppercase tracking-wider text-[rgb(var(--fg-muted))] font-semibold">
          Forms & Inputs
        </div>
        <h1 className="text-4xl font-bold tracking-tight mt-2 mb-3 text-[rgb(var(--fg-default))]">
          Button
        </h1>
        <p className="text-base text-[rgb(var(--fg-muted))] leading-relaxed max-w-2xl">
          The action button system. Designed for ERP workflows: every action (create, save, edit, delete, print, send, download, refresh) has its own semantic variant with appropriate colors and icons.
        </p>
      </div>

      {/* Import */}
      <section className="mb-12">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--fg-muted))] mb-2">Import</div>
        <pre className="bg-[#0a0a0a] border border-[rgb(var(--bd-default))] rounded-lg px-4 py-3 text-[13px] overflow-x-auto">
          <code className="text-[#e4e4e7] font-mono">{`import { Button } from 'indas-ui'`}</code>
        </pre>
      </section>

      {/* Action Buttons — the main event */}
      <section className="mb-12">
        <div className="flex items-baseline gap-3 mb-1">
          <h2 className="text-2xl font-bold tracking-tight">Action buttons</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))]">
            Recommended
          </span>
        </div>
        <p className="text-sm text-[rgb(var(--fg-muted))] mb-5 leading-relaxed max-w-2xl">
          These are the workhorse variants. Each carries semantic color, optional auto-icon, and consistent sizing. On mobile, they collapse to icon-only with the label as tooltip.
        </p>

        <Preview
          code={`<Button variant="action-create">Create</Button>
<Button variant="action-save">Save</Button>
<Button variant="action-save-as">Save As</Button>
<Button variant="action-edit">Edit</Button>
<Button variant="action-delete">Delete</Button>
<Button variant="action-print">Print</Button>
<Button variant="action-send">Send</Button>
<Button variant="action-mail">Mail</Button>
<Button variant="action-download">Download</Button>
<Button variant="action-refresh">Refresh</Button>
<Button variant="action-apply">Apply</Button>
<Button variant="action-cancel">Cancel</Button>
<Button variant="action-back">Back</Button>
<Button variant="action-secondary">Secondary</Button>`}
        >
          <Button variant="action-create">Create</Button>
          <Button variant="action-save">Save</Button>
          <Button variant="action-save-as">Save As</Button>
          <Button variant="action-edit">Edit</Button>
          <Button variant="action-delete">Delete</Button>
          <Button variant="action-print">Print</Button>
          <Button variant="action-send">Send</Button>
          <Button variant="action-mail">Mail</Button>
          <Button variant="action-download">Download</Button>
          <Button variant="action-refresh">Refresh</Button>
          <Button variant="action-apply">Apply</Button>
          <Button variant="action-cancel">Cancel</Button>
          <Button variant="action-back">Back</Button>
          <Button variant="action-secondary">Secondary</Button>
        </Preview>

        {/* Variant reference table */}
        <div className="mt-6 border border-[rgb(var(--bd-default))] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">Variant</th>
                <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">Color</th>
                <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">When to use</th>
              </tr>
            </thead>
            <tbody className="text-[rgb(var(--fg-default))]">
              {[
                ['action-create', 'Primary (brand)', 'Add a new record (user, item, ledger…)'],
                ['action-save', 'Success (green)', 'Commit changes to the database'],
                ['action-save-as', 'Sky', 'Clone the current record with new identifiers'],
                ['action-edit', 'Warning (amber)', 'Switch a row to editable mode'],
                ['action-delete', 'Error (red)', 'Destructive delete operation'],
                ['action-print', 'Purple', 'Generate a printable PDF or send to printer'],
                ['action-send', 'Info (blue)', 'Send a quotation, invoice, or notification'],
                ['action-mail', 'Error (red)', 'Send an email with attachment'],
                ['action-download', 'Success (green)', 'Download CSV/Excel/PDF export'],
                ['action-refresh', 'Neutral', 'Re-fetch data from server'],
                ['action-apply', 'Teal (auto-icon: ✓)', 'Apply filter, settings, or selection'],
                ['action-cancel', 'Neutral (auto-icon: ✗)', 'Cancel current modal or operation'],
                ['action-back', 'Neutral', 'Navigate to previous step'],
                ['action-secondary', 'Neutral', 'Secondary actions in toolbars'],
              ].map(([variant, color, use]) => (
                <tr key={variant} className="border-t border-[rgb(var(--bd-default))]">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[rgb(var(--color-primary))]">{variant}</td>
                  <td className="px-4 py-2.5 text-[12px] text-[rgb(var(--fg-muted))]">{color}</td>
                  <td className="px-4 py-2.5 text-[12px]">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Specialized button components */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-1">Companion components</h2>
        <p className="text-sm text-[rgb(var(--fg-muted))] mb-5 leading-relaxed max-w-2xl">
          Three button variants exported alongside <code className="px-1 py-0.5 rounded bg-[rgb(var(--bg-subtle))] text-[12px]">Button</code> for specific use cases.
        </p>

        <div className="space-y-5">
          <ButtonCard
            name="CheckboxButton"
            slug="checkbox-button"
            desc="Toggle button styled like a checkbox. Common in toolbars (e.g. 'Set First Plan as Master')."
          />
          <ButtonCard
            name="InputButton"
            slug="input-button"
            desc="Inline number input inside a bordered button. Optional stepper (+/−)."
          />
          <ButtonCard
            name="FilterPillButton"
            slug="filter-pill-button"
            desc="Status filter pill with a count badge. Used for grid/list status tabs."
          />
        </div>
      </section>

      {/* Generic variants — secondary section, smaller */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-tight mb-1">Generic variants</h2>
        <p className="text-sm text-[rgb(var(--fg-muted))] mb-4 leading-relaxed max-w-2xl">
          Standard variants for non-action use cases (form submits, hero CTAs, modal footers). Prefer action variants when the intent is semantic.
        </p>

        <Preview
          code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>`}
        >
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </Preview>
      </section>

      {/* Sizes */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-tight mb-4">Sizes</h2>
        <Preview
          code={`<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>`}
        >
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Preview>
      </section>

      {/* States */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold tracking-tight mb-4">States</h2>
        <Preview
          code={`<Button variant="action-save" loading>Saving...</Button>
<Button variant="action-create" disabled>Disabled</Button>`}
        >
          <Button variant="action-save" loading>Saving...</Button>
          <Button variant="action-create" disabled>Disabled</Button>
        </Preview>
      </section>

      {/* Props */}
      <section>
        <h2 className="text-xl font-semibold tracking-tight mb-4">Props</h2>
        <div className="border border-[rgb(var(--bd-default))] rounded-lg overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[rgb(var(--bg-subtle))] text-[rgb(var(--fg-muted))]">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">Prop</th>
                <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2 font-semibold text-[11px] uppercase tracking-wider">Default</th>
              </tr>
            </thead>
            <tbody className="text-[rgb(var(--fg-default))]">
              {[
                ['variant', `'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'action-*' (14 variants)`, `'primary'`],
                ['size', `'xs' | 'sm' | 'md' | 'lg' | 'footer'`, `'md'`],
                ['icon', `LucideIcon | ReactNode`, `—`],
                ['iconPosition', `'left' | 'right'`, `'left'`],
                ['iconOnly', `boolean`, `false`],
                ['loading', `boolean`, `false`],
                ['fab', `boolean`, `false`],
                ['tooltip', `string`, `—`],
              ].map(([prop, type, def]) => (
                <tr key={prop} className="border-t border-[rgb(var(--bd-default))]">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-[rgb(var(--color-primary))]">{prop}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-[rgb(var(--fg-muted))]">{type}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{def}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ButtonCard({ name, slug, desc }: { name: string; slug: string; desc: string }) {
  return (
    <a
      href={`/components/${slug}`}
      className="block p-4 rounded-lg border border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-surface))] hover:border-[rgb(var(--color-primary))] hover:bg-[rgb(var(--bg-hover))] transition"
    >
      <div className="font-mono text-sm font-semibold text-[rgb(var(--color-primary))] mb-1">{name}</div>
      <div className="text-[12px] text-[rgb(var(--fg-muted))] leading-relaxed">{desc}</div>
    </a>
  )
}
