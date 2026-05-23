'use client'
import { useState } from 'react'

export function Preview({ code, children }: { code: string; children: React.ReactNode }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="border border-[rgb(var(--bd-default))] rounded-lg overflow-hidden mb-6">
      <div className="flex items-center justify-between border-b border-[rgb(var(--bd-default))] bg-[rgb(var(--bg-subtle))] px-3 py-2">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('preview')}
            className={`px-3 py-1 text-xs rounded ${tab === 'preview' ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-default))]' : 'text-[rgb(var(--fg-muted))]'}`}
          >
            Preview
          </button>
          <button
            onClick={() => setTab('code')}
            className={`px-3 py-1 text-xs rounded ${tab === 'code' ? 'bg-[rgb(var(--bg-surface))] text-[rgb(var(--fg-default))]' : 'text-[rgb(var(--fg-muted))]'}`}
          >
            Code
          </button>
        </div>
        {tab === 'code' && (
          <button
            onClick={copy}
            className="text-xs px-2 py-1 rounded text-[rgb(var(--fg-muted))] hover:text-[rgb(var(--color-primary))]"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      {tab === 'preview' ? (
        <div className="p-8 bg-[rgb(var(--bg-surface))] flex items-center justify-center flex-wrap gap-3 min-h-32">
          {children}
        </div>
      ) : (
        <pre className="p-4 text-sm overflow-x-auto bg-[rgb(var(--bg-app))]">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}
