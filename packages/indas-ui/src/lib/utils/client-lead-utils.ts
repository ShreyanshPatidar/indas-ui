// Utility functions for dynamic Lead/Client name display
// Used across Enquiry and Estimation modules

import type { Client } from '@/lib/api/core/types'

/**
 * Get dynamic label and placeholder based on client's isLead status
 * @param clientId - Selected client ID (as string)
 * @param clients - Array of all clients
 * @returns Object with label and placeholder strings
 */
export function getClientLabelAndPlaceholder(
  clientId: string | undefined,
  clients: Client[]
): { label: string; placeholder: string } {
  // No selection or no clients
  if (!clientId || clientId === '__no_clients__' || clients.length === 0) {
    return {
      label: 'Lead / Customer Name',
      placeholder: 'Select Lead / Customer Name'
    }
  }

  // Find selected client
  const selectedClient = clients.find(c =>
    (c.LedgerId || c.ClientID)?.toString() === clientId
  )

  if (!selectedClient) {
    return {
      label: 'Lead / Customer Name',
      placeholder: 'Select Lead / Customer Name'
    }
  }

  // Check IsLead: true = Lead, false = Client
  const isLead = selectedClient.IsLead === true

  return {
    label: isLead ? 'Lead Name' : 'Customer Name',
    placeholder: isLead ? 'Select Lead Name' : 'Select Customer Name'
  }
}

/**
 * Check if a client is a lead
 * @param client - Client object
 * @returns true if client is a lead, false otherwise
 */
export function isClientLead(client: Client | undefined): boolean {
  if (!client) return false
  return client.IsLead === true
}

/**
 * Get display name for a client (with Lead/Client prefix if needed)
 * @param client - Client object
 * @param includePrefix - Whether to include "Lead:" or "Client:" prefix
 * @returns Display name string
 */
export function getClientDisplayName(client: Client, includePrefix: boolean = false): string {
  const name = client.LedgerName || client.ClientName

  if (!includePrefix) {
    return name
  }

  const prefix = isClientLead(client) ? 'Lead:' : 'Client:'
  return `${prefix} ${name}`
}
