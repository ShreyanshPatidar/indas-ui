import APIClient from '@/lib/api/core/client'
import type { APIResponse } from '@/lib/api/core/types'

export interface SalesFilters {
  FromDate?: string
  ToDate?: string
  LedgerID?: string
  PlantID?: string
  SalesEmployeeID?: string
  CategoryID?: string
  Source?: string
}

export interface SalesRow {
  BookingID: number
  BookingNo: string
  JobName: string
  ClientName: string
  LedgerID: number
  SalesEmployeeName: string
  ProductionUnitName: string
  Source: string
  CategoryName: string
  Status: string
  Bucket: string
  CreatedDate: string
  FinalCost: number
  OrderQuantity: number
  QuotedCost: number
  OrderValue: number
  ProfitPercentage: number
}

export interface SalesKpis {
  StatusBuckets: Array<{ Bucket: string; Count: number }>
  SourceSplit: Array<{ Source: string; Count: number }>
  Totals: Array<{ TotalQuotes: number; TotalValueLakh: number; QuotedValueLakh: number; AvgMargin: number; Customers: number }>
  PrevPeriod: Array<{ TotalQuotes: number; Won: number; TotalValueLakh: number }>
  TopCustomers: Array<{ Customer: string; LedgerID: number; Quotes: number; ValueLakh: number }>
  SalesTeam: Array<{ Name: string; Quotes: number; Won: number; ValueLakh: number }>
  CategoryValue: Array<{ Category: string; Quotes: number; ValueLakh: number }>
  MonthlyTrend: Array<{ Month: string; Created: number; Approved: number }>
  QuoteAging: Array<{ D0to3: number; D4to7: number; D8to14: number; D14plus: number }>
  WinLoss: Array<{ Won: number; InProgress: number; Rework: number; Lost: number }>
  Rows: SalesRow[]
}

export async function getSalesDashboardKpis(
  filters: SalesFilters,
  session: any
): Promise<APIResponse<SalesKpis>> {
  return APIClient.post('api/dashboard/GetSalesDashboardKpis', filters, session)
}
