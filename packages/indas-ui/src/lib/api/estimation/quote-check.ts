/**
 * Quote Check API
 *
 * Endpoints for checking quote status and validations
 */

import { Session } from 'next-auth'
import APIClient from '@/lib/api/core/client'

/**
 * Check if another/newer quote exists for this booking
 * Used during Revise operation to prevent revising old quotes
 *
 * @param bookingId - BookingID to check
 * @param session - User session
 * @returns Promise with API response (data: "0" = no other quote, otherwise quote exists)
 */
export async function checkOtherQuoteAPI(
  bookingId: number,
  session: Session
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await APIClient.post(
      '/api/planwindow/GetOtherQuote',
      { BKID: bookingId },
      session
    )

    return response
  } catch (error) {
    console.error('❌ [QUOTE_CHECK_API] Error checking other quote:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check other quote'
    }
  }
}
