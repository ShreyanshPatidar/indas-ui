import type { TimeFilterSelection } from './FilterBar'

// Shared fiscal-year time helpers for all dashboards. FY runs 1 Apr (fyStart) → 31 Mar (fyStart+1).
// Keeps range resolution + context labelling identical across sales/costing/management dashboards.

export const getFiscalStartYear = (fyear?: string): number => {
  const parsed = fyear ? parseInt(String(fyear).split('-')[0]) : NaN
  if (!isNaN(parsed)) return parsed
  const now = new Date()
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
}

// Monday-aligned fiscal weeks, clamped to the FY (1 Apr fyStart → 31 Mar fyStart+1).
// W1 starts on 1 Apr regardless of weekday (partial), then every W ends on Sunday and
// the next starts Monday. The last week is clamped to 31 Mar. Returns null past FY end.
export const fiscalWeekRange = (fyStart: number, wk: number): { from: Date; to: Date } | null => {
  const fyOpen = new Date(fyStart, 3, 1)
  const fyClose = new Date(fyStart + 1, 2, 31)
  // Sunday that ends W1 = the first Sunday on/after 1 Apr (day 0 = Sunday).
  const firstSunday = new Date(fyStart, 3, 1 + ((7 - fyOpen.getDay()) % 7))
  let from: Date
  if (wk <= 1) {
    from = fyOpen
  } else {
    // W2 starts the Monday after W1's Sunday; each later week is +7 days.
    from = new Date(firstSunday.getFullYear(), firstSunday.getMonth(), firstSunday.getDate() + 1 + (wk - 2) * 7)
  }
  if (from > fyClose) return null
  const sunday = wk <= 1 ? firstSunday : new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6)
  const to = sunday > fyClose ? fyClose : sunday
  return { from, to }
}

// Count of Monday-aligned fiscal weeks in the FY.
export const fiscalWeekCount = (fyStart: number): number => {
  let wk = 1
  while (fiscalWeekRange(fyStart, wk + 1)) wk++
  return wk
}

// "this" anchors to the FY's first period (W1 / Apr / Q1), per fiscal reporting.
export const rangeFromSelection = (
  sel: TimeFilterSelection | undefined,
  fyStart: number
): { from: Date; to: Date } => {
  const fyOpen = new Date(fyStart, 3, 1)
  const fyClose = new Date(fyStart + 1, 2, 31)
  const yearOf = (mo: number) => (mo >= 3 ? fyStart : fyStart + 1)
  const monthRange = (mo: number) => ({ from: new Date(yearOf(mo), mo, 1), to: new Date(yearOf(mo), mo + 1, 0) })
  const type = sel?.type || 'Month'

  if (type === 'Day') {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate()
    const pick = sel?.days?.[0] || 'today'
    if (pick === 'yesterday') { const dt = new Date(y, m, d - 1); return { from: dt, to: dt } }
    if (pick === 'last7') return { from: new Date(y, m, d - 6), to: new Date(y, m, d) }
    if (pick === 'last14') return { from: new Date(y, m, d - 13), to: new Date(y, m, d) }
    if (pick === 'last30') return { from: new Date(y, m, d - 29), to: new Date(y, m, d) }
    return { from: new Date(y, m, d), to: new Date(y, m, d) }
  }

  if (type === 'Week') {
    const pick = sel?.weeks?.[0] || 'W1'
    const wk = /^W\d+$/i.test(pick) ? parseInt(pick.slice(1)) : 1
    return fiscalWeekRange(fyStart, wk) || { from: fyOpen, to: fyClose }
  }

  if (type === 'Quarter') {
    const pick = sel?.quarters?.[0]
    const qNum = pick && /^q[1-4]$/i.test(pick) ? parseInt(pick.slice(1)) - 1 : 0
    const startMonth = (3 + qNum * 3) % 12
    const sy = yearOf(startMonth)
    return { from: new Date(sy, startMonth, 1), to: new Date(sy, startMonth + 3, 0) }
  }

  if (type === 'Year') return { from: fyOpen, to: fyClose }

  const picks = (sel?.months || []).filter(s => /^\d{1,2}$/.test(s)).map(s => parseInt(s))
  if (picks.length > 0) {
    const ranges = picks.map(monthRange)
    return {
      from: ranges.reduce((a, b) => (b.from < a.from ? b : a)).from,
      to: ranges.reduce((a, b) => (b.to > a.to ? b : a)).to,
    }
  }
  return monthRange(3)
}

// Header subtitle for the selected period. Week/Day show their day span in brackets;
// Quarter/Year show fiscal labels. `t` translates the period words.
export const buildContextLabel = (
  sel: TimeFilterSelection | undefined,
  fyStart: number,
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  t: (key: string) => string
): string => {
  const range = rangeFromSelection(sel, fyStart)
  const from = dateFrom || range.from
  const to = dateTo || range.to
  const fmtDay = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  const fmtMon = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  const dayRange = from.getTime() === to.getTime() ? fmtDay(from) : `${fmtDay(from)} – ${fmtDay(to)}`

  if (!dateFrom && !dateTo && sel?.type === 'Day') {
    const dpick = sel.days?.[0]
    const pick = dpick === 'yesterday' ? t('Yesterday') : dpick === 'last7' ? t('Last 7 Days') : dpick === 'last14' ? t('Last 14 Days') : dpick === 'last30' ? t('Last 30 Days') : t('Today')
    return `${pick} (${dayRange})`
  }

  if (!dateFrom && !dateTo && sel?.type === 'Week') {
    const w = sel.weeks?.[0]
    const wk = w && /^W\d+$/i.test(w) ? w.slice(1) : '1'
    return `${t('Week')} ${wk} (${dayRange})`
  }

  if (!dateFrom && !dateTo && sel?.type === 'Quarter') {
    const q = sel.quarters?.[0]
    const label = q && /^q[1-4]$/i.test(q) ? `Q${q.slice(1)}` : 'Q1'
    return `${label} (${fmtMon(from)} – ${fmtMon(to)})`
  }

  if (!dateFrom && !dateTo && sel?.type === 'Year') {
    return `${t('FY')} ${fyStart}-${fyStart + 1}`
  }

  const sameMonth = from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()
  if (sameMonth) return from.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  return `${fmtMon(from)} – ${fmtMon(to)}`
}
