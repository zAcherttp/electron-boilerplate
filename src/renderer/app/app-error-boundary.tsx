import type { ReactNode } from 'react'
import { Component } from 'react'
import { Alert } from '../components/ui/alert'
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
        <Alert title="The application view stopped unexpectedly">
          <p>Reset the view to try rendering it again.</p>
          <Button onClick={this.reset}>Reset view</Button>
        </Alert>
      </main>
    )
  }
}
