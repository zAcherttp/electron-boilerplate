import type { ReactNode } from 'react'
import { Component } from 'react'
import { TriangleAlertIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public override state: AppErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false })
  }

  public override render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="app-shell app-fallback">
        <Alert className="max-w-xl" variant="destructive">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertTitle>The application view stopped unexpectedly</AlertTitle>
          <AlertDescription>
            <p>Reset the view to try rendering it again.</p>
            <Button variant="outline" onClick={this.reset}>
              Reset view
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }
}
