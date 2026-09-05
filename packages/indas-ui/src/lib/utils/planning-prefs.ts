// Remembers the user's last planning checkbox selections (global, per-browser) so a
// fresh estimation / reel / shipper view re-checks what they used last. Loaded
// quotations always win over these defaults — only apply on new/empty state.

const KEY = 'estimo:planning-prefs'

export interface PlanningPrefs {
  planningOptions: string[]        // estimation: e.g. ['special-size','client-supplied']
  reelPlanOnSpecialSize: boolean   // reel-selection modal (reel tab)
  paperPlanOnSpecialSize: boolean  // reel-selection modal (paper tab)
  shipperPalletizeAll: boolean     // shipper-planning modal
  shipperSpecialSize: boolean      // shipper-planning modal
  gridIncludeMaterials: boolean    // grid-costing template config: include material columns
}

export function getPlanningPrefs(): Partial<PlanningPrefs> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function savePlanningPref<K extends keyof PlanningPrefs>(key: K, value: PlanningPrefs[K]): void {
  if (typeof window === 'undefined') return
  try {
    const current = getPlanningPrefs()
    window.localStorage.setItem(KEY, JSON.stringify({ ...current, [key]: value }))
  } catch {
    // localStorage unavailable (private mode / quota) — preferences are best-effort.
  }
}
