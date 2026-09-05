import APIClient from '@/lib/api/core/client'
import type { APIResponse } from '@/lib/api/core/types'

export interface ManagementFilters {
  FromDate?: string
  ToDate?: string
  LedgerID?: string
  PlantID?: string
  SalesEmployeeID?: string
  CategoryID?: string
  ContentType?: string
  Source?: string
  Granularity?: 'day' | 'week' | 'month'
}

export interface ManagementKpis {
  StatusBuckets: Array<{ Bucket: string; Count: number }>
  SourceSplit: Array<{ Source: string; Count: number }>
  MarginDistribution: Array<{ GT10: number; B5to10: number; B0to5: number; Negative: number }>
  ProposalSummary: Array<{ Customer: string; Proposals: number; TotalValueLakh: number; AvgValueLakh: number }>
  TatAvg: Array<{ EngToCost: number; EngToCostSample: number; CostToDecision: number; CostToDecisionSample: number }>
  Totals: Array<{ TotalQuotes: number; TotalValueLakh: number; AvgMargin: number }>
  PrevPeriod: Array<{ TotalQuotes: number; Won: number; TotalValueLakh: number }>
  CategoryRfq: Array<{ Category: string; Rfq: number; Estimo: number; ParkBuddy: number; IsForBot: number }>
  SalesTeam: Array<{ Name: string; Quotes: number; Won: number }>
  MonthlyTrend: Array<{ Month: string; Quotes: number; ValueLakh: number }>
  QuoteOutcome: Array<{ Bucket: string; Count: number }>
  Rows: ManagementRow[]
}

export interface ManagementRow {
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
  OrderValue: number
  ProfitPercentage: number
}

export async function getManagementKpis(
  filters: ManagementFilters,
  session: any
): Promise<APIResponse<ManagementKpis>> {
  return APIClient.post('api/dashboard/GetSalesPipelineKpis', filters, session)
}
