'use client'
import { Button } from 'indas-ui'
import { Plus, Trash2, Save, Download } from 'lucide-react'
import { Preview } from '../../../components/preview'

export default function ButtonPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Button</h1>
      <p className="text-[rgb(var(--fg-muted))] mb-8">
        Clickable button with variants, sizes, icons, and loading state.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">Variants</h2>
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

      <h2 className="text-xl font-semibold mb-3 mt-8">Sizes</h2>
      <Preview
        code={`<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
      >
        <Button size="xs">Extra Small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </Preview>

      <h2 className="text-xl font-semibold mb-3 mt-8">With Icons</h2>
      <Preview
        code={`<Button icon={Plus}>Create</Button>
<Button icon={Save} variant="secondary">Save</Button>
<Button icon={Trash2} variant="destructive">Delete</Button>
<Button icon={Download} iconPosition="right">Download</Button>`}
      >
        <Button icon={Plus}>Create</Button>
        <Button icon={Save} variant="secondary">Save</Button>
        <Button icon={Trash2} variant="destructive">Delete</Button>
        <Button icon={Download} iconPosition="right">Download</Button>
      </Preview>

      <h2 className="text-xl font-semibold mb-3 mt-8">Loading & Disabled</h2>
      <Preview
        code={`<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>`}
      >
        <Button loading>Loading...</Button>
        <Button disabled>Disabled</Button>
      </Preview>

      <h2 className="text-xl font-semibold mb-3 mt-8">Action Buttons</h2>
      <p className="text-sm text-[rgb(var(--fg-muted))] mb-3">
        Specialized variants for ERP action contexts. Auto-pick appropriate colors.
      </p>
      <Preview
        code={`<Button variant="action-create">Create</Button>
<Button variant="action-save">Save</Button>
<Button variant="action-edit">Edit</Button>
<Button variant="action-delete">Delete</Button>`}
      >
        <Button variant="action-create">Create</Button>
        <Button variant="action-save">Save</Button>
        <Button variant="action-edit">Edit</Button>
        <Button variant="action-delete">Delete</Button>
      </Preview>

      <h2 className="text-xl font-semibold mb-3 mt-8">Props</h2>
      <div className="border border-[rgb(var(--bd-default))] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[rgb(var(--bg-subtle))]">
            <tr>
              <th className="text-left px-4 py-2">Prop</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[rgb(var(--bd-default))]"><td className="px-4 py-2 font-mono">variant</td><td className="px-4 py-2 font-mono text-xs">'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | ...</td><td className="px-4 py-2 font-mono">'primary'</td></tr>
            <tr className="border-t border-[rgb(var(--bd-default))]"><td className="px-4 py-2 font-mono">size</td><td className="px-4 py-2 font-mono text-xs">'xs' | 'sm' | 'md' | 'lg'</td><td className="px-4 py-2 font-mono">'md'</td></tr>
            <tr className="border-t border-[rgb(var(--bd-default))]"><td className="px-4 py-2 font-mono">icon</td><td className="px-4 py-2 font-mono text-xs">LucideIcon</td><td className="px-4 py-2 font-mono">—</td></tr>
            <tr className="border-t border-[rgb(var(--bd-default))]"><td className="px-4 py-2 font-mono">iconPosition</td><td className="px-4 py-2 font-mono text-xs">'left' | 'right'</td><td className="px-4 py-2 font-mono">'left'</td></tr>
            <tr className="border-t border-[rgb(var(--bd-default))]"><td className="px-4 py-2 font-mono">loading</td><td className="px-4 py-2 font-mono text-xs">boolean</td><td className="px-4 py-2 font-mono">false</td></tr>
            <tr className="border-t border-[rgb(var(--bd-default))]"><td className="px-4 py-2 font-mono">iconOnly</td><td className="px-4 py-2 font-mono text-xs">boolean</td><td className="px-4 py-2 font-mono">false</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
