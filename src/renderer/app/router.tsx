import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from '@tanstack/react-router'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'
import { ScrollArea } from '../components/ui/scroll-area'
import { ApplicationTitleBar } from '../features/application-window/application-title-bar'
import { SystemInfoPage } from '../features/system-info/system-info-page'

function RootLayout() {
  return (
    <div className="application-frame">
      <ApplicationTitleBar />
      <ScrollArea className="application-viewport">
        <Outlet />
      </ScrollArea>
    </div>
  )
}

function RouteError({ reset }: { reset: () => void }) {
  return (
    <main className="app-shell app-fallback">
      <Alert className="max-w-xl" variant="destructive">
        <TriangleAlertIcon aria-hidden="true" />
        <AlertTitle>This route could not be rendered</AlertTitle>
        <AlertDescription>
          <p>Reset the route to try again.</p>
          <Button variant="outline" onClick={reset}>
            Reset route
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="app-shell app-fallback">
      <EmptyState
        action={
          <Link className="text-link" to="/">
            Return home
          </Link>
        }
        description="The requested desktop route does not exist."
        title="Page not found"
      />
    </main>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: RouteError,
  notFoundComponent: NotFoundPage,
})

const indexRoute = createRoute({
  component: SystemInfoPage,
  getParentRoute: () => rootRoute,
  path: '/',
})

const routeTree = rootRoute.addChildren([indexRoute])

export function createApplicationRouter() {
  return createRouter({
    history: createHashHistory(),
    routeTree,
  })
}

export type ApplicationRouter = ReturnType<typeof createApplicationRouter>

declare module '@tanstack/react-router' {
  interface Register {
    router: ApplicationRouter
  }
}
