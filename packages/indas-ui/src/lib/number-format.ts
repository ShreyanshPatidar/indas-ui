/**
 * How every number in the library is written. Indian grouping by default (20,00,000, not
 * 2,000,000): the products built on this library keep Indian books, and a bare `toLocaleString()`
 * follows whatever locale the browser happens to be set to, so the same figure read differently on
 * two machines.
 *
 * A product that needs another convention calls `setNumberLocale()` once at start-up.
 */

let numberLocale = 'en-IN'

export function setNumberLocale(locale: string): void {
  numberLocale = locale
}

export function getNumberLocale(): string {
  return numberLocale
}

/** A full number with grouping, up to two decimals. Empty for null, undefined or NaN. */
export function formatNumber(value: number | string | null | undefined, maximumFractionDigits = 2): string {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return typeof value === 'string' ? value : ''
  return n.toLocaleString(numberLocale, { maximumFractionDigits })
}

const trim = (n: number) => n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2).replace(/\.?0+$/, '')

/**
 * A short number for chart axes, where a full figure runs into its neighbour: 12,500 · 20 L ·
 * 1.4 Cr in Indian grouping; 12.5K · 2M · 1.4B otherwise. Below a lakh (or a thousand) it is the
 * full number.
 */
export function formatCompactNumber(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return String(value)
  const sign = n < 0 ? '-' : ''
  const a = Math.abs(n)
  if (numberLocale === 'en-IN') {
    if (a >= 1e7) return `${sign}${trim(a / 1e7)} Cr`
    if (a >= 1e5) return `${sign}${trim(a / 1e5)} L`
    return formatNumber(n, 0)
  }
  if (a >= 1e9) return `${sign}${trim(a / 1e9)}B`
  if (a >= 1e6) return `${sign}${trim(a / 1e6)}M`
  if (a >= 1e3) return `${sign}${trim(a / 1e3)}K`
  return formatNumber(n, 0)
}
