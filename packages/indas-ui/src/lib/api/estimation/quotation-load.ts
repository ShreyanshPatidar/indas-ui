/**
 * Quotation Load API
 *
 * API endpoint to load complete quotation details by BookingID
 * Used for Review/Revise/Clone functionality from Quote Panel
 */

import { Session } from 'next-auth'
import APIClient from '@/lib/api/core/client'

/**
 * Load complete quotation details by BookingID
 *
 * @param bookingId - BookingID of the quotation to load
 * @param session - User session
 * @returns Promise with complete quotation data including:
 *   - TblBooking: Main booking/quotation details
 *   - TblBookingContents: Planning data for each content
 *   - TblBookingCosting: Costing parameters
 *   - TblBookingProcess: Process list with rates
 *   - TblBookingForms: Form details (for book planning)
 *   - Tblonetimecharges: One-time charges
 *   - TblCorrugationPlyDetails: Corrugation ply breakdown
 *   - TblAllocatedMaterials: Allocated materials
 *   - TblMaterialCostParams: Material cost parameters
 *   - TblAllocatedMaterialLayers: Material layers
 *   - FileAttachment: Attached files
 */
export async function loadPlanDetailsAPI(
  bookingId: number,
  session: Session
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await APIClient.post(
      `/api/planwindow/LoadPlanDetails/${bookingId}`,
      {}, // Empty body - BookingID is in URL
      session
    )

    if (response.success && response.data) {
      return response
    }
    return {
      success: false,
      error: 'No quotation data found for this BookingID'
    }
  } catch (error) {
    console.error('❌ [QUOTATION_LOAD] Error loading plan details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load quotation details'
    }
  }
}
