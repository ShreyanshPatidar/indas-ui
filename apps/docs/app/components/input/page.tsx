'use client'
import { Input } from 'indas-ui'
import { Search, Mail, Lock } from 'lucide-react'
import { Preview } from '../../../components/preview'

export default function InputPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Input</h1>
      <p className="text-[rgb(var(--fg-muted))] mb-8">
        Text input with label, icons, error/helper states, and edit tracking.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">Basic</h2>
      <Preview code={`<Input label="Name" placeholder="Enter your name" />`}>
        <div className="w-80">
          <Input label="Name" placeholder="Enter your name" />
        </div>
      </Preview>

      <h2 className="text-xl font-semibold mb-3 mt-8">With Icons</h2>
      <Preview
        code={`<Input label="Search" placeholder="Search..." leftIcon={Search} />
<Input label="Email" placeholder="you@example.com" rightIcon={Mail} />`}
      >
        <div className="w-80 space-y-3">
          <Input label="Search" placeholder="Search..." leftIcon={Search} />
          <Input label="Email" placeholder="you@example.com" rightIcon={Mail} />
        </div>
      </Preview>

      <h2 className="text-xl font-semibold mb-3 mt-8">Error & Helper</h2>
      <Preview
        code={`<Input label="Email" defaultValue="not-an-email" error="Invalid email format" />
<Input label="Password" type="password" leftIcon={Lock} helper="Must be at least 8 characters" />`}
      >
        <div className="w-80 space-y-3">
          <Input label="Email" defaultValue="not-an-email" error="Invalid email format" />
          <Input label="Password" type="password" leftIcon={Lock} helper="Must be at least 8 characters" />
        </div>
      </Preview>

      <h2 className="text-xl font-semibold mb-3 mt-8">Disabled</h2>
      <Preview code={`<Input label="Read-only" value="Cannot edit this" disabled />`}>
        <div className="w-80">
          <Input label="Read-only" value="Cannot edit this" disabled />
        </div>
      </Preview>
    </div>
  )
}
