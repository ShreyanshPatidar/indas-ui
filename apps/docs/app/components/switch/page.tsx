'use client'
import { Switch } from 'indas-ui'
import { Preview } from '../../../components/preview'

export default function SwitchPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Switch</h1>
      <p className="text-[rgb(var(--fg-muted))] mb-8">On/off toggle.</p>
      <Preview code={`<Switch defaultChecked />\n<Switch />`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3"><Switch defaultChecked /> <span className="text-sm">Enabled</span></div>
          <div className="flex items-center gap-3"><Switch /> <span className="text-sm">Disabled</span></div>
        </div>
      </Preview>
    </div>
  )
}
