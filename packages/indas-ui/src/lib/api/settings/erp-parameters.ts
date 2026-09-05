import APIClient from '@/lib/api/core/client'

export interface ERPParameter {
  ParameterID: number
  ParameterName: string
  ParameterType: string
  ParameterValue: string
}

// getselectedblockdata double-serializes: Ok(js.Serialize(jsonString)) — unwrap until array.
function parseRows(data: any): ERPParameter[] {
  let d = data
  for (let i = 0; i < 2 && typeof d === 'string'; i++) {
    try { d = JSON.parse(d) } catch { return [] }
  }
  return Array.isArray(d) ? d : []
}

export async function getERPParametersAPI(parameterType: string, session: any) {
  try {
    const response = await APIClient.get(
      `/api/userauthentication/getselectedblockdata?CurrentBlock=${encodeURIComponent(parameterType)}`,
      session
    )
    if (!response.success) return { success: false as const, error: response.error || 'Failed to load settings' }
    return { success: true as const, data: parseRows(response.data) }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Failed to load settings' }
  }
}

export async function saveERPParameterAPI(
  param: { ParameterName: string; ParameterType: string; ParameterValue: string },
  session: any
) {
  try {
    const payload = { JsonObjectReference: [param], PID: 0 }
    const response = await APIClient.post('/api/userauthentication/insertrecorddata', payload, session)
    const body = typeof response.data === 'string' ? response.data.trim() : ''
    if (!response.success) return { success: false as const, error: response.error || 'Failed to save setting' }
    if (body && body.toLowerCase() !== 'success') {
      return { success: false as const, error: body === 'Duplicate Data' ? 'This value already exists' : body }
    }
    return { success: true as const }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Failed to save setting' }
  }
}

export async function deleteERPParameterAPI(
  parameterID: number,
  parameterName: string,
  parameterValue: string,
  session: any
) {
  try {
    const payload = {
      ParameterID: parameterID,
      JsonObjectReference: [{ ParameterName: parameterName, ParameterValue: parameterValue }],
    }
    const response = await APIClient.post('/api/userauthentication/deleteparameterdata', payload, session)
    const body = typeof response.data === 'string' ? response.data.trim() : ''
    if (!response.success) return { success: false as const, error: response.error || 'Failed to delete setting' }
    if (body && body.toLowerCase() !== 'success') {
      return { success: false as const, error: body }
    }
    return { success: true as const }
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Failed to delete setting' }
  }
}
