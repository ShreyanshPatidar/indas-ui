// Core API Utilities
// Shared helper functions for API handling

import type { APIResponse } from './types'

/**
 * Safely parses a JSON string, handling multiple levels of encoding.
 * Useful for APIs that return double or triple encoded JSON strings.
 * 
 * @param data - The data to parse (string or any)
 * @param fallback - Optional fallback value if parsing fails
 * @returns Parsed object or original data if not a string/parseable
 */
export const safeJSONParse = <T = any>(data: any, fallback?: T): T => {
    // If null or undefined, return fallback or data
    if (data === null || data === undefined) {
        return fallback !== undefined ? fallback : data
    }

    // If not a string, return as is (assuming it's already an object)
    if (typeof data !== 'string') {
        return data
    }

    // Try parsing
    try {
        const parsed = JSON.parse(data)

        // Recursive check for nested encoding (common in some legacy .NET APIs)
        if (typeof parsed === 'string') {
            return safeJSONParse(parsed, fallback)
        }

        return parsed
    } catch (error) {
        // Parsing failed, return fallback if provided, otherwise original string
        return (fallback !== undefined ? fallback : data) as T
    }
}
export const handleAPIResponse = <T = any>(
    response: APIResponse<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
) => {
    if (response.success) {
        // Ensure data is parsed safely
        const parsedData = safeJSONParse(response.data)

        if (parsedData) {
            onSuccess?.(parsedData)
        } else {
            // If data is null/undefined but success is true, still call onSuccess with empty/null
            onSuccess?.(parsedData)
        }
    } else {
        const errorMessage = response.error || 'An unexpected error occurred'
        onError?.(errorMessage)
    }
}

/**
 * Helper to log API errors with consistent formatting
 */
export const logAPIError = (context: string, error: any, details?: any) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`❌ [${context}] Error:`, message)

    if (details) {
        console.error(`❌ [${context}] Details:`, details)
    }

    if (error instanceof Error && error.stack) {
        console.debug(`❌ [${context}] Stack:`, error.stack)
    }
}
