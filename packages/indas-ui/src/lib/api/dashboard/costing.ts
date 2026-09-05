import APIClient from '@/lib/api/core/client'
import type { APIResponse } from '@/lib/api/core/types'

export interface CostingFilters {
  FromDate?: string
  ToDate?: string
  LedgerID?: string
  PlantID?: string
  SalesEmployeeID?: string
  CategoryID?: string
  Source?: string
  CostingMember?: string
}

export interface CostingRow {
  BookingID: number
  BookingNo: string
  JobName: string
  ClientName: string
  CategoryName: string
  OrderQuantity: number
  CreatedDate: string
  GrandTotalCost: number
  MaterialCost: number
  ConversionCost: number
  OverheadCost: number
  ProfitPercentage: number
  OverheadPercentage: number
}

export interface PendingEnquiryRow {
  EnquiryID: number
  EnquiryNo: string
  JobName: string
  ClientName: string
  EnquiryType: string
  AllocatedTo: string
  AllocatedToUserID: number
  SalesPerson: string
  CategoryName: string
  Status: string
  Reason: string
  CreatedDate: string
  WaitDays: number
}

export interface BotQuotationRow {
  BookingID: number
  BookingNo: string
  JobName: string
  ClientName: string
  OrderQuantity: number
  QuotedCost: number
  AssignToUserID: number
  AssignedTo: string
  CreatedDate: string
  Status: string
}

export interface CostingKpis {
  Totals: Array<{ TotalQuotes: number; Costed: number; Pending: number; AvgMargin: number; AvgOverhead: number; AvgWastage: number; NegativeMargin: number; ThinMargin: number; TotalCostLakh: number }>
  MarginDistribution: Array<{ GT10: number; B5to10: number; B0to5: number; Negative: number }>
  CostComposition: Array<{ MaterialLakh: number; ConversionLakh: number; OverheadLakh: number; FreightLakh: number; PackingLakh: number; ProfitLakh: number }>
  CostPercentages: Array<{ Overhead: number; Profit: number; Packing: number; Wastage: number }>
  Estimators: Array<{ Estimator: string; EnquiryType: string; Created: number; Costed: number; Pending: number; CostValueLakh: number; AvgMargin: number }>
  PendingTotals: Array<{ PendingEnquiries: number; OverdueEnquiries: number; AvgWaitDays: number }>
  PendingAging: Array<{ D0to3: number; D4to7: number; D8to14: number; D14plus: number }>
  PendingRows: PendingEnquiryRow[]
  TatAvg: Array<{ AvgTatDays: number; LinkedSample: number }>
  TopProcesses: Array<{ Process: string; Uses: number; AvgCost: number }>
  TopMaterials: Array<{ Material: string; Uses: number }>
  Rows: CostingRow[]
  BotQuotations: BotQuotationRow[]
  AssigneeKpis: Array<{ Assignee: string; BotQuotes: number; Enquiries: number }>
}

export async function getCostingDashboardKpis(
  filters: CostingFilters,
  session: any
): Promise<APIResponse<CostingKpis>> {
  return APIClient.post('api/dashboard/GetCostingDashboardKpis', filters, session)
}

export async function assignQuotationAPI(
  bookingId: number,
  userId: number,
  session: any
): Promise<APIResponse> {
  return APIClient.post('api/dashboard/AssignQuotation', { BookingID: bookingId, UserID: userId }, session)
}
