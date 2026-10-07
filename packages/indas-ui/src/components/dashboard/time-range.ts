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

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
// Monday of the week holding `d` (weeks run Monday to Sunday, as the fiscal weeks do).
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))

/**
 * The dates a selection covers.
 *
 * Quick picks (This / Last …) count from `today`: "This week" is the week holding today, "Last
 * month" the calendar month before this one, "This quarter" the fiscal quarter holding today.
 * They used to anchor to the financial year's first period, so "This week" meant Week 1 in April.
 * A "This …" range runs to today, since nothing after today has happened yet.
 *
 * A numbered pick (W27, month "9", Q3, a year "2025") is that period of the financial year
 * starting `fyStart`. Year "all" is all time, from the earliest date a book could hold to today.
 */
export const rangeFromSelection = (
  sel: TimeFilterSelection | undefined,
  fyStart: number,
  today: Date = new Date()
): { from: Date; to: Date } => {
  const t = startOfDay(today)
  const fyOpen = new Date(fyStart, 3, 1)
  const fyClose = new Date(fyStart + 1, 2, 31)
  const yearOf = (mo: number) => (mo >= 3 ? fyStart : fyStart + 1)
  const monthRange = (mo: number) => ({ from: new Date(yearOf(mo), mo, 1), to: new Date(yearOf(mo), mo + 1, 0) })
  const type = sel?.type || 'Month'

  if (type === 'Day') {
    const pick = sel?.days?.[0] || 'today'
    if (pick === 'yesterday') return { from: addDays(t, -1), to: addDays(t, -1) }
    const span = ({ last7: 7, last14: 14, last30: 30 } as Record<string, number>)[pick]
    return span ? { from: addDays(t, -(span - 1)), to: t } : { from: t, to: t }
  }

  if (type === 'Week') {
    const pick = sel?.weeks?.[0] || 'this'
    const monday = mondayOf(t)
    if (pick === 'this') return { from: monday, to: t }
    if (pick === 'last') return { from: addDays(monday, -7), to: addDays(monday, -1) }
    // "Last 2 weeks" is this week and the one before it, to today.
    const weeks = ({ last2: 2, last4: 4 } as Record<string, number>)[pick]
    if (weeks) return { from: addDays(monday, -7 * (weeks - 1)), to: t }
    const wk = /^W\d+$/i.test(pick) ? parseInt(pick.slice(1)) : 1
    return fiscalWeekRange(fyStart, wk) || { from: fyOpen, to: fyClose }
  }

  if (type === 'Quarter') {
    const pick = sel?.quarters?.[0] || 'this'
    // The fiscal quarter holding today: Apr–Jun is Q1.
    const qStart = new Date(t.getFullYear(), t.getMonth() - (((t.getMonth() - 3 + 12) % 12) % 3), 1)
    if (pick === 'this') return { from: qStart, to: t }
    if (pick === 'last') return { from: new Date(qStart.getFullYear(), qStart.getMonth() - 3, 1), to: addDays(qStart, -1) }
    const qNum = /^q[1-4]$/i.test(pick) ? parseInt(pick.slice(1)) - 1 : 0
    const startMonth = (3 + qNum * 3) % 12
    const sy = yearOf(startMonth)
    return { from: new Date(sy, startMonth, 1), to: new Date(sy, startMonth + 3, 0) }
  }

  if (type === 'Year') {
    const pick = sel?.years?.[0] || 'this'
    if (pick === 'all') return { from: new Date(1970, 0, 1), to: t }
    if (pick === 'last') return { from: new Date(fyStart - 1, 3, 1), to: new Date(fyStart, 2, 31) }
    const fy = /^\d{4}$/.test(pick) ? parseInt(pick) : fyStart
    return { from: new Date(fy, 3, 1), to: new Date(fy + 1, 2, 31) }
  }

  const months = sel?.months || []
  if (months.includes('this')) return { from: new Date(t.getFullYear(), t.getMonth(), 1), to: t }
  if (months.includes('last')) return { from: new Date(t.getFullYear(), t.getMonth() - 1, 1), to: new Date(t.getFullYear(), t.getMonth(), 0) }
  const picks = months.filter(s => /^\d{1,2}$/.test(s)).map(s => parseInt(s))
  if (picks.length > 0) {
    const ranges = picks.map(monthRange)
    return {
      from: ranges.reduce((a, b) => (b.from < a.from ? b : a)).from,
      to: ranges.reduce((a, b) => (b.to > a.to ? b : a)).to,
    }
  }
  return { from: new Date(t.getFullYear(), t.getMonth(), 1), to: t }
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
    const w = sel.weeks?.[0] || 'this'
    const quick = ({ this: 'This Week', last: 'Last Week', last2: 'Last 2 Weeks', last4: 'Last 4 Weeks' } as Record<string, string>)[w]
    if (quick) return `${t(quick)} (${dayRange})`
    const wk = /^W\d+$/i.test(w) ? w.slice(1) : '1'
    return `${t('Week')} ${wk} (${dayRange})`
  }

  if (!dateFrom && !dateTo && sel?.type === 'Quarter') {
    const q = sel.quarters?.[0] || 'this'
    const label = q === 'this' ? t('This Quarter') : q === 'last' ? t('Last Quarter') : /^q[1-4]$/i.test(q) ? `Q${q.slice(1)}` : 'Q1'
    return `${label} (${fmtMon(from)} – ${fmtMon(to)})`
  }

  if (!dateFrom && !dateTo && sel?.type === 'Year') {
    const y = sel.years?.[0] || 'this'
    if (y === 'all') return t('All Time')
    const fy = y === 'last' ? fyStart - 1 : /^\d{4}$/.test(y) ? parseInt(y) : fyStart
    return `${t('FY')} ${fy}-${fy + 1}`
  }

  const m0 = sel?.months?.[0]
  if (!dateFrom && !dateTo && sel?.type === 'Month' && (m0 === 'this' || m0 === 'last')) {
    return `${t(m0 === 'this' ? 'This Month' : 'Last Month')} (${dayRange})`
  }

  const sameMonth = from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()
  if (sameMonth) return from.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  return `${fmtMon(from)} – ${fmtMon(to)}`
}
