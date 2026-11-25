import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  label?: string
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'Unexpected error',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label ?? 'module', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            Your cart and local data are still safe. Reload to continue billing.
          </p>
          <p className="truncate text-xs text-muted-foreground/80">
            {this.state.message}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            this.setState({ hasError: false, message: '' })
            window.location.reload()
          }}
        >
          Reload Safe
        </Button>
      </div>
    )
  }
}
