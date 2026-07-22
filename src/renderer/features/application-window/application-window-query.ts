import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

const applicationWindowQueryKey = ['application-window']

export function useApplicationWindowQuery() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryFn: () => window.app.applicationWindow.getState(),
    queryKey: applicationWindowQueryKey,
    staleTime: Number.POSITIVE_INFINITY,
    throwOnError: true,
  })

  useEffect(
    () =>
      window.app.applicationWindow.onStateChanged((state) => {
        queryClient.setQueryData(applicationWindowQueryKey, state)
      }),
    [queryClient],
  )

  return query
}
