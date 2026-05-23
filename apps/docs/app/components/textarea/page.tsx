'use client'
import { Textarea } from 'indas-ui'
import { Preview } from '../../../components/preview'

export default function TextareaPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Textarea</h1>
      <p className="text-[rgb(var(--fg-muted))] mb-8">Multi-line text input.</p>
      <Preview code={`<Textarea label="Notes" placeholder="Add notes..." rows={4} />`}>
        <div className="w-80">
          <Textarea label="Notes" placeholder="Add notes..." rows={4} />
        </div>
      </Preview>
    </div>
  )
}
