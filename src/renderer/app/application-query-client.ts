import { QueryClient } from '@tanstack/react-query'

export function createApplicationQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        networkMode: 'always',
        retry: 1,
        staleTime: 30_000,
      },
    },
  })
}
