// Generic Module Integration Proxy
// One client for ALL module-wise external integrations. The backend endpoint
// api/integration/proxy/{integrationCode} resolves everything API-specific
// (BaseUrl, UrlTemplate, credentials, owning module) from the IntegrationConfig
// table per company — adding an integration to another module needs only config
// rows + a UI, no new backend or client code.
//
// Gating: show integration UI only when the owning module has
// ModuleMaster.IsIntegrationRequired = 1 (useModuleIntegrationRequired).

import APIClient from '../core/client'

export interface IntegrationProxyResult<T = any> {
  success: boolean
  /** Parsed upstream payload (the external API's body, verbatim from the proxy) */
  payload: T | null
  error?: string
}

export async function callIntegrationProxyAPI<T = any>(
  integrationCode: string,
  params: Record<string, string | number | null | undefined>,
  session: any
): Promise<IntegrationProxyResult<T>> {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')

  const response = await APIClient.get(
    `api/integration/proxy/${encodeURIComponent(integrationCode)}${qs ? `?${qs}` : ''}`,
    session
  )

  if (!response.success) {
    return { success: false, payload: null, error: response.error || 'Integration request failed' }
  }

  let payload: any = response.data
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { return { success: false, payload: null, error: payload } }
  }
  if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
    return { success: false, payload: null, error: String(payload.error) }
  }
  return { success: true, payload }
}
