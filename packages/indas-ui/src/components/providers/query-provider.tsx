'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { DEFAULT_QUERY_CONFIG } from '@/lib/react-query-config'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a client instance - one per user session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Use global config from react-query-config.ts
            ...DEFAULT_QUERY_CONFIG,
            // Retry failed requests once
            retry: 1,
            // Don't retry on 4xx errors (client errors)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools - only shows in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
