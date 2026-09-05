// Grid Costing — Drafts API
// Save/resume bulk-costing work in progress. Multiple named drafts per user,
// scoped server-side to the session's CompanyID + UserID.

import APIClient from '../core/client'
import type { APIResponse } from '../core/types'

/** A draft as returned by the LIST endpoint (no heavy RowsJson). */
export interface GridCostingDraftSummary {
  DraftID: number
  DraftName: string
  RowCount: number | null
  CompletedRowCount: number | null
  CreatedAt: string
  UpdatedAt: string
  /** Pre-formatted readable date from the backend SQL (e.g. "13 Jun 2026, 06:42"). */
  UpdatedAtText?: string
}

/** Full draft incl. the serialized grid state. */
export interface GridCostingDraftFull extends GridCostingDraftSummary {
  RowsJson: string
}

export interface SaveDraftRequest {
  /** 0 / null = create new; >0 = update existing. */
  DraftID?: number | null
  DraftName: string
  /** Full grid state (rows + selectedProcesses + materials) serialized. */
  RowsJson: string
  RowCount: number
  /** Rows that have at least one material allocated (drives the resume UI). */
  CompletedRowCount: number
}

/** Create or update a draft. Returns the saved DraftID. */
export async function saveGridCostingDraft(
  req: SaveDraftRequest,
  session: any
): Promise<APIResponse<{ DraftID: number }>> {
  return APIClient.post('api/gridcostingdraft/save', req, session)
}

/** List the current user's drafts (newest first). */
export async function listGridCostingDrafts(
  session: any
): Promise<APIResponse<GridCostingDraftSummary[]>> {
  return APIClient.get('api/gridcostingdraft/list', session)
}

/** Load a single draft (with RowsJson) by ID. */
export async function getGridCostingDraft(
  draftId: number,
  session: any
): Promise<APIResponse<GridCostingDraftFull>> {
  return APIClient.get(`api/gridcostingdraft/get/${draftId}`, session)
}

/** Soft-delete a draft. */
export async function deleteGridCostingDraft(
  draftId: number,
  session: any
): Promise<APIResponse<{ Message: string }>> {
  return APIClient.post(`api/gridcostingdraft/delete/${draftId}`, {}, session)
}
