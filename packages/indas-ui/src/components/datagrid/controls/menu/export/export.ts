// Heavy libraries (ExcelJS, jsPDF, PapaParse, file-saver) are loaded on demand so that
// rendering a DataGrid does not ship them; they download the first time a user exports.

/**
 * What a printed or PDF list carries above and below its table, so it reads as a document to hand
 * over rather than a screenshot of a screen: whose it is (letterhead lines, e.g. the company, its
 * address and GSTIN), what it is (title) and what it covers (subtitle, e.g. the period and filters).
 */
export type ExportDocument = {
  title?: string
  subtitle?: string
  letterhead?: string[]
  footer?: string
}

/** Format any cell value into a clean string. Avoids "[object Object]" and stray nulls. */
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }
  return String(value)
}

/**
 * Build headers + rows for export. The DataGrid already hands us rows keyed by their
 * visible column header labels (in display order), so the object keys ARE the headers.
 */
function buildExportRows<TData>(
  data: TData[]
): { headers: string[]; keys: string[]; rows: string[][] } {
  if (data.length === 0) return { headers: [], keys: [], rows: [] }

  const keys = Object.keys(data[0] as any)
  const rows = data.map(item => keys.map(key => formatCellValue((item as any)[key])))

  return { headers: keys, keys, rows }
}

/** A figure (₹1,20,000.50, -3, 12.5 kg is not one): set right, as numbers are on paper. */
function looksNumeric(s: string): boolean {
  return /^[-−]?\s*[₹$]?\s*[\d,]+(\.\d+)?$/.test(s.trim())
}

function titleOf(filename: string, doc?: ExportDocument): string {
  return doc?.title || filename.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** The theme's primary colour, read from the page, so the PDF's header row follows the brand. */
function primaryRgb(): [number, number, number] {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
    const parts = raw.split(/[\s,]+/).map(Number).filter(n => Number.isFinite(n))
    if (parts.length >= 3) return [parts[0], parts[1], parts[2]]
  } catch {
    /* no document: fall through */
  }
  return [60, 60, 60]
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

async function saveBlob(blob: Blob, name: string) {
  const { saveAs } = await import('file-saver')
  saveAs(blob, name)
}

/**
 * Export data to CSV format
 */
export async function exportToCSV<TData>(data: TData[], filename: string = 'data-export') {
  try {
    const Papa = (await import('papaparse')).default
    const { headers, rows } = buildExportRows(data)
    const csv = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    await saveBlob(blob, `${filename}.csv`)
  } catch (error) {
    console.error('❌ [DataGrid Export] CSV export failed:', error)
    throw error
  }
}

/**
 * Export data to Excel format
 */
export async function exportToExcel<TData>(data: TData[], filename: string = 'data-export') {
  try {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data')

    const { headers, rows } = buildExportRows(data)

    if (headers.length > 0) {
      worksheet.addRow(headers)

      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF003366' } // brand primary (#003366)
      }

      rows.forEach(row => worksheet.addRow(row))

      // Auto-size columns from header + cell content length
      worksheet.columns.forEach((column, index) => {
        let maxLength = headers[index]?.length || 10
        rows.forEach(row => {
          const cell = row[index]
          if (cell) maxLength = Math.max(maxLength, cell.length)
        })
        column.width = Math.min(maxLength + 2, 50)
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    await saveBlob(blob, `${filename}.xlsx`)
  } catch (error) {
    console.error('❌ [DataGrid Export] Excel export failed:', error)
    throw error
  }
}

/**
 * Export data to PDF format.
 * Landscape, auto-fit columns, line-wrapped cells, repeated headers, page numbers.
 */
export async function exportToPDF<TData>(data: TData[], filename: string = 'data-export', meta?: ExportDocument) {
  try {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
    const { headers, rows } = buildExportRows(data)

    // Landscape fits wide grids; switch to portrait only for very narrow tables.
    const orientation = headers.length <= 4 ? 'portrait' : 'landscape'
    const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()

    // Letterhead, then the title and what it covers, then when it was made.
    let y = 40
    const [first, ...rest] = meta?.letterhead ?? []
    if (first) {
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(first, 40, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(110)
      for (const line of rest) doc.text(line, 40, (y += 11))
      doc.setTextColor(0)
      y += 20
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(titleOf(filename, meta), 40, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(110)
    if (meta?.subtitle) doc.text(meta.subtitle, 40, (y += 12))
    doc.text(`${rows.length} row${rows.length === 1 ? '' : 's'} · Printed ${new Date().toLocaleString()}`, pageWidth - 40, y, { align: 'right' })
    doc.setTextColor(0)
    const startY = y + 14
    const rightCols = headers.map((_, i) => rows.length > 0 && rows.every(r => !r[i] || looksNumeric(r[i])))

    if (headers.length > 0) {
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY,
        theme: 'striped',
        headStyles: {
          fillColor: primaryRgb(),
          textColor: 255,
          fontStyle: 'bold',
          halign: 'left',
        },
        columnStyles: Object.fromEntries(rightCols.map((r, i) => [i, { halign: r ? 'right' : 'left' }]).filter(([, s]) => (s as any).halign === 'right')),
        styles: {
          fontSize: 7,
          cellPadding: 3,
          overflow: 'linebreak',  // wrap long cells instead of overflowing the page
          valign: 'middle',
        },
        // Let autoTable distribute width across the page, capping any single column.
        tableWidth: 'auto',
        margin: { top: 40, left: 40, right: 40, bottom: 40 },
      })
      // Page numbers once every page exists, so "of N" is right on the first page too.
      const pages = doc.getNumberOfPages()
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p)
        doc.setFontSize(8)
        doc.setTextColor(120)
        const bottom = doc.internal.pageSize.getHeight() - 20
        if (meta?.footer) doc.text(meta.footer, 40, bottom)
        doc.text(`Page ${p} of ${pages}`, pageWidth - 40, bottom, { align: 'right' })
        doc.setTextColor(0)
      }
    } else {
      doc.setFontSize(11)
      doc.text('No data to export.', 40, 80)
    }

    doc.save(`${filename}.pdf`)
  } catch (error) {
    console.error('❌ [DataGrid Export] PDF export failed:', error)
    throw error
  }
}

/**
 * Print the list as a document: letterhead, title, every row (not only the page on screen), the
 * header row repeated on each sheet, figures set right, page numbers. Laid out in a hidden frame
 * so the app's own screen (toolbar, filters, buttons) never reaches the paper.
 */
export async function printTable<TData>(data: TData[], filename: string = 'data-export', meta?: ExportDocument) {
  const { headers, rows } = buildExportRows(data)
  const right = headers.map((_, i) => rows.length > 0 && rows.every(r => !r[i] || looksNumeric(r[i])))
  const landscape = headers.length > 5
  const cell = (tag: 'td' | 'th', v: string, i: number) => `<${tag}${right[i] ? ' class="n"' : ''}>${escapeHtml(v)}</${tag}>`
  const [first, ...rest] = meta?.letterhead ?? []
  // Paper is white whatever theme the screen is in, so the sheet has its own ink-on-paper greys
  // rather than the theme's tokens (in dark mode those are light text, invisible on paper).
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(titleOf(filename, meta))}</title><style>
@page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 14mm 12mm 16mm;
  @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 8pt system-ui, sans-serif; color: #6b6b6b; }
  @bottom-left { content: "${escapeHtml(meta?.footer ?? '').replace(/"/g, '')}"; font: 8pt system-ui, sans-serif; color: #6b6b6b; } }
* { box-sizing: border-box; }
body { font: 9pt/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; color: #1a1a1a; margin: 0; }
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 10px; }
.org { font-size: 13pt; font-weight: 700; }
.lines { color: #555; font-size: 8pt; }
.title { font-size: 12pt; font-weight: 700; text-align: right; }
.sub { color: #555; font-size: 8pt; text-align: right; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th { text-align: left; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .03em; color: #444; border-bottom: 1px solid #1a1a1a; padding: 5px 6px; }
td { padding: 4px 6px; border-bottom: 1px solid #e3e3e3; vertical-align: top; }
.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
tbody tr:nth-child(even) td { background: #f7f7f7; }
.empty { padding: 24px; color: #777; }
</style></head><body>
<div class="head"><div>${first ? `<div class="org">${escapeHtml(first)}</div>` : ''}${rest.map(l => `<div class="lines">${escapeHtml(l)}</div>`).join('')}</div>
<div><div class="title">${escapeHtml(titleOf(filename, meta))}</div>${meta?.subtitle ? `<div class="sub">${escapeHtml(meta.subtitle)}</div>` : ''}<div class="sub">${rows.length} row${rows.length === 1 ? '' : 's'} · Printed ${escapeHtml(new Date().toLocaleString())}</div></div></div>
${headers.length ? `<table><thead><tr>${headers.map((h, i) => cell('th', h, i)).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => cell('td', v, i)).join('')}</tr>`).join('')}</tbody></table>` : '<div class="empty">Nothing to print.</div>'}
</body></html>`
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(frame)
  const win = frame.contentWindow!
  win.document.open()
  win.document.write(html)
  win.document.close()
  await new Promise(r => setTimeout(r, 50))
  win.focus()
  win.print()
  // Removed after the dialog closes; a minute is ample and keeps a slow dialog from losing its page.
  setTimeout(() => frame.remove(), 60_000)
}

/**
 * Export data to JSON format
 */
export async function exportToJSON<TData>(data: TData[], filename: string = 'data-export') {
  try {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    await saveBlob(blob, `${filename}.json`)
  } catch (error) {
    console.error('❌ [DataGrid Export] JSON export failed:', error)
    throw error
  }
}

/**
 * Unified export function that handles all formats.
 */
export async function exportData<TData>(
  data: TData[],
  format: 'excel' | 'csv' | 'pdf' | 'json' | 'print',
  filename: string = 'data-export',
  meta?: ExportDocument
) {
  switch (format) {
    case 'print':
      return await printTable(data, filename, meta)
    case 'excel':
      return await exportToExcel(data, filename)
    case 'csv':
      return await exportToCSV(data, filename)
    case 'pdf':
      return await exportToPDF(data, filename, meta)
    case 'json':
      return await exportToJSON(data, filename)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}
