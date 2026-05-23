// Password Reset Email API
// Uses system email (abhinav.indusanalytics@gmail.com) to send OTP to users

import { SYSTEM_EMAIL_TEMPLATES, renderTemplate } from './templates'

/**
 * Send password reset OTP email to user
 * Uses system email from environment variables
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  otp: string,
  userName: string,
  companyName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get password reset template
    const template = SYSTEM_EMAIL_TEMPLATES.find((t) => t.id === 'password-reset')

    if (!template) {
      throw new Error('Password reset email template not found')
    }

    // Render email body with variables
    const emailBody = renderTemplate(template.body, {
      userName,
      companyName,
      otp,
      validityMinutes: 10,
    })

    const emailSubject = renderTemplate(template.subject, {
      userName,
      companyName,
    })

    // Call backend API to send email using system SMTP
    const response = await fetch('https://api.indusanalytics.co.in/api/email/sendpasswordresetemail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toEmail,
        subject: emailSubject,
        body: emailBody,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || 'Failed to send email')
    }

    const result = await response.json()

    return {
      success: result.success || true,
      error: result.error,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email',
    }
  }
}
