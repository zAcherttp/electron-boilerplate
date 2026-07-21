import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { AppErrorBoundary } from './app/app-error-boundary'
import { createApplicationQueryClient } from './app/application-query-client'
import { createApplicationRouter } from './app/router'

const queryClient = createApplicationQueryClient()
const router = createApplicationRouter()

export function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppErrorBoundary>
  )
}
