/**
 * Indas UI as standard HTML tags (custom elements), for apps that are not React: Vue, Angular,
 * Svelte, plain HTML, and pages served by PHP, Python, .NET or Java. One script and one stylesheet:
 *
 *   <link rel="stylesheet" href="indas-ui/dist/web-components/indas-ui.css">
 *   <script type="module" src="indas-ui/dist/web-components/indas-ui.js"></script>
 *   <indas-button variant="primary">Save</indas-button>
 *
 * Each tag renders the same React component as the library, into the page itself (no shadow DOM),
 * so the tokens and theme class on <html> style it exactly as in a React app. React ships inside
 * the bundle. Attributes carry text and flags; anything that is not text (a grid's rows and
 * columns) is set as a JavaScript property: `grid.data = rows`.
 */
import * as React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Button } from '@/components/ui/buttons/button'
import { Input } from '@/components/ui/forms/input'
import { Badge } from '@/components/ui/feedback/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/display/card'
import { DataGrid } from '@/components/datagrid/grid'
import { DeviceProvider } from '@/contexts/DeviceContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { GlobalAlertProvider } from '@/contexts/GlobalAlertContext'
import { SearchPreferencesProvider } from '@/contexts/SearchPreferencesContext'

/** The providers every Indas component expects, as a React app sets them up once at its root. */
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DeviceProvider>
      <LanguageProvider>
        <GlobalAlertProvider>
          <SearchPreferencesProvider>{children}</SearchPreferencesProvider>
        </GlobalAlertProvider>
      </LanguageProvider>
    </DeviceProvider>
  )
}

type Props = Record<string, unknown>

/**
 * A custom element that renders `render(props, element)` with React. Attributes listed in
 * `attributes` re-render on change (`disabled` and the like become true when present); names in
 * `properties` are JavaScript properties for values that are not text. The text the tag was
 * written with (`<indas-button>Save</indas-button>`) is kept as `text`; any other children it was
 * written with are kept as `slot`, moved into the component where it has room for them.
 */
function define(tag: string, attributes: string[], properties: string[], render: (p: Props, host: IndasElement) => React.ReactNode) {
  if (customElements.get(tag)) return
  const booleans = new Set(['disabled', 'required', 'readonly', 'loading'])
  class Element extends IndasElement {
    static get observedAttributes() {
      return attributes
    }
    protected draw() {
      const props: Props = {}
      for (const a of attributes) {
        const v = this.getAttribute(a)
        if (v !== null) props[a.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = booleans.has(a) ? true : v
      }
      for (const p of properties) if (this.values[p] !== undefined) props[p] = this.values[p]
      props.text = this.text
      this.mount(<Providers>{render(props, this)}</Providers>)
    }
  }
  for (const p of properties) {
    Object.defineProperty(Element.prototype, p, {
      get(this: IndasElement) {
        return this.values[p]
      },
      set(this: IndasElement, v: unknown) {
        this.values[p] = v
        if (this.isConnected) this.redraw()
      },
    })
  }
  customElements.define(tag, Element)
}

abstract class IndasElement extends HTMLElement {
  values: Record<string, unknown> = {}
  text = ''
  slotNodes: Node[] = []
  private root: Root | null = null
  connectedCallback() {
    if (!this.root) {
      // What the tag was written with, kept before React takes the element over.
      this.text = this.textContent?.trim() ?? ''
      this.slotNodes = Array.from(this.childNodes).filter((n) => n.nodeType === Node.ELEMENT_NODE)
      this.replaceChildren()
      this.root = createRoot(this)
    }
    this.draw()
  }
  disconnectedCallback() {
    // Unmounted a tick later: a tag moved in the page is disconnected and connected again at once.
    queueMicrotask(() => {
      if (!this.isConnected && this.root) {
        this.root.unmount()
        this.root = null
      }
    })
  }
  attributeChangedCallback() {
    if (this.root) this.draw()
  }
  redraw() {
    if (this.root) this.draw()
  }
  protected mount(node: React.ReactNode) {
    this.root!.render(node)
  }
  protected abstract draw(): void
}

/** A box the tag's own child elements are moved into once React has drawn it. */
function Slot({ host }: { host: IndasElement }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useLayoutEffect(() => {
    if (ref.current) for (const n of host.slotNodes) ref.current.appendChild(n)
  }, [host])
  return <div ref={ref} />
}

define('indas-button', ['variant', 'size', 'disabled', 'type'], [], (p) => (
  <Button variant={p.variant as never} size={p.size as never} disabled={Boolean(p.disabled)} type={(p.type as 'button' | 'submit') ?? 'button'}>
    {p.text as string}
  </Button>
))

define('indas-input', ['label', 'placeholder', 'value', 'type', 'name', 'error', 'helper', 'disabled', 'required'], [], (p) => (
  <Input
    label={p.label as string}
    placeholder={p.placeholder as string}
    defaultValue={p.value as string}
    type={(p.type as string) ?? 'text'}
    name={p.name as string}
    error={p.error as string}
    helper={p.helper as string}
    disabled={Boolean(p.disabled)}
    required={Boolean(p.required)}
  />
))

define('indas-badge', ['variant', 'size'], [], (p) => (
  <Badge variant={p.variant as never} size={p.size as never}>
    {p.text as string}
  </Badge>
))

define('indas-card', ['title', 'description'], [], (p, host) => (
  <Card>
    {p.title || p.description ? (
      <CardHeader>
        {p.title ? <CardTitle>{p.title as string}</CardTitle> : null}
        {p.description ? <CardDescription>{p.description as string}</CardDescription> : null}
      </CardHeader>
    ) : null}
    <CardContent>{host.slotNodes.length ? <Slot host={host} /> : (p.text as string)}</CardContent>
  </Card>
))

/**
 * <indas-data-grid title="Orders"></indas-data-grid>, then from JavaScript:
 *   grid.columns = [{ key: 'date', header: 'Date' }, { key: 'amount', header: 'Amount' }]
 *   grid.data = rows
 * Sorting, search, column filters, export, Print and PDF come with it. A column may also be a
 * full TanStack column definition (`accessorKey`, `cell`, ...) for anything beyond a plain value.
 */
define('indas-data-grid', ['title', 'page-size'], ['data', 'columns', 'exportDocument'], (p) => {
  const columns = ((p.columns as Array<Record<string, unknown>>) ?? []).map((c) =>
    'accessorKey' in c || 'accessorFn' in c ? c : { accessorKey: c.key, header: c.header ?? c.key, id: String(c.key) },
  )
  return (
    <DataGrid
      data={(p.data as unknown[]) ?? []}
      columns={columns as never}
      title={p.title as string}
      exportDocument={p.exportDocument as never}
      paginationPageSize={p.pageSize ? Number(p.pageSize) : 50}
      enableSorting
      enableSearch
      enableFilterRow
      enableExport
      enableRowSelection={false}
      enableImport={false}
      enableVisualization={false}
      compactHeader
    />
  )
})
