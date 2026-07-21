import { queryOptions, useQuery } from '@tanstack/react-query'

export const systemInfoQueryOptions = queryOptions({
  queryFn: () => window.app.system.getInfo(),
  queryKey: ['system', 'info'],
})

export function useSystemInfoQuery() {
  return useQuery(systemInfoQueryOptions)
}
