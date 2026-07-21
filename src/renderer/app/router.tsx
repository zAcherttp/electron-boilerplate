import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from '@tanstack/react-router'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'
import { SystemInfoPage } from '../features/system-info/system-info-page'

function RootLayout() {
  return (
    <>
      <header className="app-header">
        <Link className="app-brand" to="/">Electron Boilerplate</Link>
        <span>Desktop foundation</span>
      </header>
      <Outlet />
    </>
  )
}

function RouteError({ reset }: { reset: () => void }) {
  return (
    <main className="app-shell app-fallback">
      <Alert title="This route could not be rendered">
        <p>Reset the route to try again.</p>
        <Button onClick={reset}>Reset route</Button>
      </Alert>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="app-shell app-fallback">
      <EmptyState
        action={<Link className="text-link" to="/">Return home</Link>}
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
