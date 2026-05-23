'use client'
import { Label, Input } from 'indas-ui'
import { Preview } from '../../../components/preview'

export default function LabelPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Label</h1>
      <p className="text-[rgb(var(--fg-muted))] mb-8">Form label, associates with an input via htmlFor.</p>
      <Preview
        code={`<Label htmlFor="email">Email address</Label>
<Input id="email" placeholder="you@example.com" />`}
      >
        <div className="w-80 space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" placeholder="you@example.com" />
        </div>
      </Preview>
    </div>
  )
}
