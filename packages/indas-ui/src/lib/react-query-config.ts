import type { QueryObserverOptions } from '@tanstack/react-query'

/**
 * React Query Config
 *
 * Controls when data is refetched and how long it's cached.
 *
 * KEY CONCEPTS:
 *
 * 1. STALE TIME (Fresh Time)
 *    - How long data is considered "fresh" before it needs to be refetched
 *    - Example: 10m means data stays fresh for 10 minutes
 *    - During this time, React Query won't refetch even if you remount the component
 *
 * 2. GC TIME (Cache Time / Garbage Collection Time)
 *    - How long unused data stays in memory before being deleted
 *    - Example: 30m means cached data is kept for 30 minutes after last use
 *    - Helps with instant navigation when returning to previously visited pages
 *
 * 3. RETRY
 *    - How many times to retry a failed request
 *    - Example: retry: 1 means try once more if the first attempt fails
 *
 * SIMPLE RULE:
 * - Stale Time = "How fresh is my data?"
 * - GC Time = "How long do I remember it?"
 * - Retry = "How many times do I try again if it fails?"
 */

export const QueryConfig = {
  /**
   * REALTIME - Live monitoring (10s fresh, 5m cache, retry 3x)
   * Use for: Chat, notifications, live production monitoring, real-time dashboards
   */
  REALTIME: {
    staleTime: 10 * 1000,           // Fresh: 10 seconds
    gcTime: 5 * 60 * 1000,          // Cache: 5 minutes
    refetchOnMount: 'always' as const,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,                       // Retry 3 times (critical)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  },

  /**
   * FREQUENT - Short-lived freshness (1m fresh, 10m cache, retry 1x)
   * Use for: Dropdowns, selectors, form options that may change during a session
   */
  FREQUENT: {
    staleTime: 60 * 1000,             // Fresh: 1 minute
    gcTime: 10 * 60 * 1000,           // Cache: 10 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 2000,
  },

  /**
   * MODERATE - Updates occasionally (5m fresh, 20m cache, retry 1x)
   * Use for: Reports, analytics, approval queues, dashboard metrics
   */
  MODERATE: {
    staleTime: 5 * 60 * 1000,       // Fresh: 5 minutes
    gcTime: 20 * 60 * 1000,         // Cache: 20 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,                       // Retry once
    retryDelay: 2000,               // Fixed 2s delay
  },

  /**
   * STANDARD - Default for master pages (10m fresh, 30m cache, retry 1x)
   * Use for: User, Item, Machine, Process, Ledger masters
   */
  STANDARD: {
    staleTime: 10 * 60 * 1000,      // Fresh: 10 minutes
    gcTime: 30 * 60 * 1000,         // Cache: 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,                       // Retry once
    retryDelay: 2000,               // Fixed 2s delay
  },

  /**
   * STATIC - Rarely changing data (30m fresh, 2h cache, retry 1x)
   * Use for: Dropdowns, currencies, departments, branches
   */
  STATIC: {
    staleTime: 30 * 60 * 1000,      // Fresh: 30 minutes
    gcTime: 2 * 60 * 60 * 1000,     // Cache: 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,                       // Retry once
    retryDelay: 3000,               // Fixed 3s delay
  },

  /**
   * PERMANENT - Never changes (forever fresh, 2h cache, no retry)
   * Use for: App config, feature flags, company settings
   */
  PERMANENT: {
    staleTime: Infinity,            // Fresh: Forever
    gcTime: 2 * 60 * 60 * 1000,     // Cache: 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,                       // Don't retry (fail fast)
  },
} as const

/** Type for QueryConfig values */
export type QueryConfigType = typeof QueryConfig[keyof typeof QueryConfig]

/**
 * Default config applied to all queries globally
 */
export const DEFAULT_QUERY_CONFIG = QueryConfig.STANDARD

/**
 * QUICK REFERENCE
 *
 * | Config    | Fresh   | Cache | Auto Refresh? | Retry | Use For                      |
 * |-----------|---------|-------|---------------|-------|------------------------------|
 * | REALTIME  | 10s     | 5m    | YES           | 3x    | Chat, live monitoring        |
 * | FREQUENT  | 1m      | 10m   | NO            | 1x    | Dropdowns, selectors, forms  |
 * | MODERATE  | 5m      | 20m   | NO            | 1x    | Reports, dashboards          |
 * | STANDARD  | 10m     | 30m   | NO            | 1x    | Master pages (default)       |
 * | STATIC    | 30m     | 2h    | NO            | 1x    | Currencies, departments      |
 * | PERMANENT | Forever | 2h    | NO            | 0x    | App config, settings         |
 *
 * USAGE:
 * import { QueryConfig } from '@/lib/react-query-config'
 *
 * useQuery({
 *   queryKey: ['users'],
 *   queryFn: getUsersAPI,
 *   ...QueryConfig.STANDARD,
 * })
 */
