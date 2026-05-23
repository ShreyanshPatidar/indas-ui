'use client'
import { Checkbox } from 'indas-ui'
import { Preview } from '../../../components/preview'

export default function CheckboxPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Checkbox</h1>
      <p className="text-[rgb(var(--fg-muted))] mb-8">Boolean toggle with optional indeterminate state.</p>
      <h2 className="text-xl font-semibold mb-3 mt-8">Basic</h2>
      <Preview code={`<Checkbox defaultChecked />\n<Checkbox />`}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Checked</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox /> Unchecked</label>
        </div>
      </Preview>
    </div>
  )
}
