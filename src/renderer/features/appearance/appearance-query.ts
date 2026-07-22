import type { ThemeSource } from '../../../contracts/appearance'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { applyRendererTheme } from './renderer-theme'

const appearanceQueryKey = ['appearance']

export function useAppearanceQuery() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryFn: () => window.app.appearance.getState(),
    queryKey: appearanceQueryKey,
    staleTime: Number.POSITIVE_INFINITY,
    throwOnError: true,
  })

  useEffect(
    () =>
      window.app.appearance.onStateChanged((state) => {
        queryClient.setQueryData(appearanceQueryKey, state)
      }),
    [queryClient],
  )

  useEffect(() => {
    if (query.data) applyRendererTheme(query.data.resolved === 'dark')
  }, [query.data])

  return query
}

export function useSetAppearanceSource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (source: ThemeSource) => window.app.appearance.setSource(source),
    onSuccess: (state) => queryClient.setQueryData(appearanceQueryKey, state),
    throwOnError: true,
  })
}
