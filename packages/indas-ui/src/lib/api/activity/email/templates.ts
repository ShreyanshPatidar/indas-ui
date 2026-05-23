import type { EmailTemplate, EmailTemplateVariable } from './types'

// Pre-defined email templates for common business scenarios
export const SYSTEM_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'quotation-send',
    name: 'Quotation Submission',
    subject: 'Quotation #{{quotationNumber}} - {{companyName}}',
    body: `Dear {{clientName}},

Thank you for your inquiry. Please find attached our detailed quotation for your requirements.

**Quotation Details:**
- Quotation Number: {{quotationNumber}}
- Valid Until: {{validUntil}}
- Total Amount: {{totalAmount}}

**Key Deliverables:**
{{#each deliverables}}
- {{this.name}}: {{this.description}}
{{/each}}

**Terms & Conditions:**
1. Payment Terms: {{paymentTerms}}
2. Delivery Timeline: {{deliveryTimeline}}
3. Warranty: {{warrantyPeriod}}

Please feel free to contact us if you have any questions or need any clarifications.

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}
{{contactNumber}}
{{emailAddress}}`,
    variables: [
      { name: 'clientName', label: 'Customer Name', type: 'text', required: true },
      { name: 'quotationNumber', label: 'Quotation Number', type: 'text', required: true },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { name: 'totalAmount', label: 'Total Amount', type: 'text', required: true },
      { name: 'deliverables', label: 'Deliverables', type: 'select', required: true, options: ['Printing', 'Packaging', 'Design', 'Consulting'] },
      { name: 'paymentTerms', label: 'Payment Terms', type: 'text', required: false, defaultValue: '50% Advance, 50% on Delivery' },
      { name: 'deliveryTimeline', label: 'Delivery Timeline', type: 'text', required: false, defaultValue: '15-20 working days' },
      { name: 'warrantyPeriod', label: 'Warranty Period', type: 'text', required: false, defaultValue: '6 months' },
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'senderTitle', label: 'Your Title', type: 'text', required: false },
      { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true },
      { name: 'emailAddress', label: 'Email Address', type: 'text', required: true }
    ],
    category: 'Business',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'quotation-followup',
    name: 'Quotation Follow-up',
    subject: 'Follow-up: Quotation #{{quotationNumber}}',
    body: `Dear {{clientName}},

I hope this email finds you well.

I'm following up on the quotation we sent you on {{quotationDate}} for {{projectDescription}}.

Just wanted to check if you've had a chance to review our proposal and if you have any questions or need any clarifications.

Our quotation #{{quotationNumber}} is valid until {{validUntil}}, and we'd be happy to discuss any adjustments to meet your specific requirements.

Would you be available for a quick call this week to discuss this further?

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}
{{contactNumber}}`,
    variables: [
      { name: 'clientName', label: 'Customer Name', type: 'text', required: true },
      { name: 'quotationNumber', label: 'Quotation Number', type: 'text', required: true },
      { name: 'quotationDate', label: 'Quotation Date', type: 'date', required: true },
      { name: 'projectDescription', label: 'Project Description', type: 'text', required: true },
      { name: 'validUntil', label: 'Valid Until', type: 'date', required: true },
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'senderTitle', label: 'Your Title', type: 'text', required: false },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true }
    ],
    category: 'Follow-up',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmation #{{orderNumber}}',
    body: `Dear {{clientName}},

We are pleased to confirm your order #{{orderNumber}} placed on {{orderDate}}.

**Order Details:**
- Order Number: {{orderNumber}}
- Order Date: {{orderDate}}
- Expected Delivery: {{deliveryDate}}

**Items Ordered:**
{{#each items}}
- {{this.name}} ({{this.quantity}} units) - {{this.price}}
{{/each}}

**Total Amount:** {{totalAmount}}

**Payment Information:**
- Payment Method: {{paymentMethod}}
- Payment Status: {{paymentStatus}}

**Delivery Information:**
- Delivery Address: {{deliveryAddress}}
- Contact Person: {{contactPerson}}
- Contact Number: {{contactNumber}}

We will notify you once your order is ready for dispatch.

Thank you for your business!

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}`,
    variables: [
      { name: 'clientName', label: 'Customer Name', type: 'text', required: true },
      { name: 'orderNumber', label: 'Order Number', type: 'text', required: true },
      { name: 'orderDate', label: 'Order Date', type: 'date', required: true },
      { name: 'deliveryDate', label: 'Expected Delivery Date', type: 'date', required: true },
      { name: 'items', label: 'Order Items', type: 'text', required: true },
      { name: 'totalAmount', label: 'Total Amount', type: 'text', required: true },
      { name: 'paymentMethod', label: 'Payment Method', type: 'select', required: true, options: ['Cash', 'Bank Transfer', 'Credit Card', 'Cheque'] },
      { name: 'paymentStatus', label: 'Payment Status', type: 'select', required: true, options: ['Paid', 'Pending', 'Partial'] },
      { name: 'deliveryAddress', label: 'Delivery Address', type: 'text', required: true },
      { name: 'contactPerson', label: 'Contact Person', type: 'text', required: true },
      { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true },
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'senderTitle', label: 'Your Title', type: 'text', required: false },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true }
    ],
    category: 'Orders',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'invoice-send',
    name: 'Invoice',
    subject: 'Invoice #{{invoiceNumber}}',
    body: `Dear {{clientName}},

Please find attached our invoice #{{invoiceNumber}} for the services/products provided.

**Invoice Details:**
- Invoice Number: {{invoiceNumber}}
- Invoice Date: {{invoiceDate}}
- Due Date: {{dueDate}}
- Purchase Order: {{purchaseOrderNumber}}

**Amount Due:** {{totalAmount}}

**Payment Details:**
- Bank Name: {{bankName}}
- Account Number: {{accountNumber}}
- IFSC Code: {{ifscCode}}
- Account Holder: {{accountHolder}}

Please make the payment before the due date to avoid any late payment charges.

Thank you for your prompt payment.

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}
{{contactNumber}}`,
    variables: [
      { name: 'clientName', label: 'Customer Name', type: 'text', required: true },
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { name: 'purchaseOrderNumber', label: 'Purchase Order Number', type: 'text', required: false },
      { name: 'totalAmount', label: 'Total Amount', type: 'text', required: true },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { name: 'ifscCode', label: 'IFSC Code', type: 'text', required: true },
      { name: 'accountHolder', label: 'Account Holder', type: 'text', required: true },
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'senderTitle', label: 'Your Title', type: 'text', required: false },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true }
    ],
    category: 'Invoicing',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    subject: 'Payment Reminder: Invoice #{{invoiceNumber}}',
    body: `Dear {{clientName}},

This is a gentle reminder that your payment for invoice #{{invoiceNumber}} is due on {{dueDate}}.

**Invoice Details:**
- Invoice Number: {{invoiceNumber}}
- Invoice Date: {{invoiceDate}}
- Due Date: {{dueDate}}
- Amount Due: {{amountDue}}

If you have already made the payment, please disregard this email. If not, we request you to make the payment at your earliest convenience.

**Payment Details:**
- Bank Name: {{bankName}}
- Account Number: {{accountNumber}}
- IFSC Code: {{ifscCode}}

If you have any questions regarding the invoice or payment, please don't hesitate to contact us.

Thank you for your cooperation.

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}
{{contactNumber}}`,
    variables: [
      { name: 'clientName', label: 'Customer Name', type: 'text', required: true },
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { name: 'amountDue', label: 'Amount Due', type: 'text', required: true },
      { name: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
      { name: 'ifscCode', label: 'IFSC Code', type: 'text', required: true },
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'senderTitle', label: 'Your Title', type: 'text', required: false },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true }
    ],
    category: 'Invoicing',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    subject: 'Welcome to {{companyName}}!',
    body: `Dear {{clientName}},

Welcome to {{companyName}}! We're thrilled to have you as our valued client.

As a new client, you now have access to:
- Premium quality products/services
- Competitive pricing
- Excellent customer support
- Fast delivery services

**Your Account Information:**
- Client ID: {{clientId}}
- Email: {{email}}
- Phone: {{phone}}

**Next Steps:**
1. Browse our catalog of products/services
2. Request quotations for your requirements
3. Place orders and track deliveries
4. Manage your account online

Our team is here to help you with any questions or assistance you may need. Feel free to reach out to us at {{supportEmail}} or call {{supportPhone}}.

Thank you for choosing {{companyName}}!

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}`,
    variables: [
      { name: 'clientName', label: 'Customer Name', type: 'text', required: true },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'text', required: true },
      { name: 'phone', label: 'Phone Number', type: 'text', required: true },
      { name: 'supportEmail', label: 'Support Email', type: 'text', required: true },
      { name: 'supportPhone', label: 'Support Phone', type: 'text', required: true },
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'senderTitle', label: 'Your Title', type: 'text', required: false }
    ],
    category: 'Welcome',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'general-inquiry',
    name: 'General Inquiry Response',
    subject: 'Re: {{subject}}',
    body: `Dear {{clientName}},

Thank you for your inquiry regarding {{inquirySubject}}.

{{#if hasAnswer}}
I'm pleased to provide you with the following information:

{{responseContent}}

{{/if}}
{{#unless hasAnswer}}
I've received your inquiry and I'm looking into the details. I'll get back to you with a comprehensive response within {{responseTime}}.

{{/unless}}

{{#if requiresFollowup}}
I may need some additional information to assist you better:
- {{additionalInfoNeeded}}

{{/if}}
{{#if nextSteps}}
**Next Steps:**
{{nextSteps}}

{{/if}}
If you have any immediate questions, please don't hesitate to contact me at {{contactNumber}} or reply to this email.

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}
{{contactNumber}}
{{emailAddress}}`,
    variables: [
      { name: 'clientName', label: 'Customer Name', type: 'text', required: true },
      { name: 'subject', label: 'Original Subject', type: 'text', required: true },
      { name: 'inquirySubject', label: 'Inquiry Subject', type: 'text', required: true },
      { name: 'hasAnswer', label: 'Has Ready Answer', type: 'boolean', required: true },
      { name: 'responseContent', label: 'Response Content', type: 'text', required: false },
      { name: 'responseTime', label: 'Response Time', type: 'text', required: false, defaultValue: '24 hours' },
      { name: 'requiresFollowup', label: 'Requires Follow-up', type: 'boolean', required: false },
      { name: 'additionalInfoNeeded', label: 'Additional Info Needed', type: 'text', required: false },
      { name: 'nextSteps', label: 'Next Steps', type: 'text', required: false },
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'senderTitle', label: 'Your Title', type: 'text', required: false },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true },
      { name: 'emailAddress', label: 'Email Address', type: 'text', required: true }
    ],
    category: 'General',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'password-reset',
    name: 'Password Reset OTP',
    subject: 'Password Reset - OTP Verification',
    body: `Dear {{userName}},

You have requested to reset your password for {{companyName}}.

Your One-Time Password (OTP) for password reset is:

**{{otp}}**

This OTP is valid for {{validityMinutes}} minutes. Please do not share this OTP with anyone.

If you did not request a password reset, please ignore this email or contact support immediately.

For security purposes:
- This OTP can only be used once
- Never share your OTP with anyone
- Our team will never ask for your OTP

Best regards,
{{companyName}} Support Team`,
    variables: [
      { name: 'userName', label: 'User Name', type: 'text', required: true },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'otp', label: 'OTP Code', type: 'text', required: true },
      { name: 'validityMinutes', label: 'OTP Validity (minutes)', type: 'number', required: true, defaultValue: '10' }
    ],
    category: 'Security',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  },
  {
    id: 'password-reset-success',
    name: 'Password Reset Confirmation',
    subject: 'Password Successfully Reset',
    body: `Dear {{userName}},

Your password has been successfully reset for your {{companyName}} account.

If you made this change, no further action is required.

If you did not reset your password, please contact our support team immediately at {{supportEmail}} or {{supportPhone}}.

For your security:
- Never share your password with anyone
- Use a strong, unique password
- Change your password regularly
- Enable two-factor authentication if available

Best regards,
{{companyName}} Support Team`,
    variables: [
      { name: 'userName', label: 'User Name', type: 'text', required: true },
      { name: 'companyName', label: 'Company Name', type: 'text', required: true },
      { name: 'supportEmail', label: 'Support Email', type: 'text', required: true },
      { name: 'supportPhone', label: 'Support Phone', type: 'text', required: false }
    ],
    category: 'Security',
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0
  }
]

// Template categories
export const TEMPLATE_CATEGORIES = [
  'Business',
  'Follow-up',
  'Orders',
  'Invoicing',
  'Welcome',
  'General',
  'Support',
  'Marketing',
  'Security'
]

// Helper function to render template with variables
export function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template

  // Simple variable replacement {{variable}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    rendered = rendered.replace(regex, String(value || ''))
  })

  // Handle basic conditional logic {{#if condition}}...{{/if}}
  rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
    return variables[condition] ? content : ''
  })

  // Handle unless logic {{#unless condition}}...{{/unless}}
  rendered = rendered.replace(/{{#unless (\w+)}}([\s\S]*?){{\/unless}}/g, (match, condition, content) => {
    return !variables[condition] ? content : ''
  })

  // Handle each loops {{#each array}}...{{/each}} (basic implementation)
  rendered = rendered.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
    const array = variables[arrayName]
    if (!Array.isArray(array)) return ''

    return array.map(item => {
      let itemContent = content
      if (typeof item === 'object' && item !== null) {
        Object.entries(item).forEach(([key, value]) => {
          const regex = new RegExp(`{{this\\.${key}}}`, 'g')
          itemContent = itemContent.replace(regex, String(value || ''))
        })
      } else {
        itemContent = itemContent.replace(/{{this}}/g, String(item || ''))
      }
      return itemContent
    }).join('\n')
  })

  return rendered
}

// Helper function to validate template variables
export function validateTemplateVariables(template: EmailTemplate, variables: Record<string, any>): {
  isValid: boolean
  missingVariables: string[]
  invalidVariables: string[]
} {
  const missingVariables: string[] = []
  const invalidVariables: string[] = []

  template.variables.forEach(variable => {
    const value = variables[variable.name]

    if (variable.required && (value === undefined || value === null || value === '')) {
      missingVariables.push(variable.name)
    }

    if (value !== undefined && value !== null) {
      switch (variable.type) {
        case 'number':
          if (isNaN(Number(value))) {
            invalidVariables.push(`${variable.name} (must be a number)`)
          }
          break
        case 'date':
          if (isNaN(Date.parse(value))) {
            invalidVariables.push(`${variable.name} (must be a valid date)`)
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            invalidVariables.push(`${variable.name} (must be true or false)`)
          }
          break
        case 'select':
          if (variable.options && !variable.options.includes(value)) {
            invalidVariables.push(`${variable.name} (must be one of: ${variable.options.join(', ')})`)
          }
          break
      }
    }
  })

  return {
    isValid: missingVariables.length === 0 && invalidVariables.length === 0,
    missingVariables,
    invalidVariables
  }
}

// Helper function to get template variables from text
export function extractTemplateVariables(text: string): string[] {
  const regex = /{{(\w+)}}/g
  const variables = new Set<string>()
  let match

  while ((match = regex.exec(text)) !== null) {
    variables.add(match[1])
  }

  return Array.from(variables)
}