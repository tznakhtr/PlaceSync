import { Component, type ReactNode } from 'react';
import { AlertCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * ErrorBoundary:
 * Catches unhandled JavaScript rendering crashes in child components.
 * Renders a user-friendly recovery UI without exposing stack traces or sensitive internals.
 */
export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error): void {
    // Development-only diagnostic logging; never logs sensitive user or token data
    if (import.meta.env.DEV) {
      // Safe, non-sensitive summary
      console.warn('PlaceSync UI encountered a render error:', error?.message);
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-navy-900">Something went wrong</h2>
            <p className="text-sm text-grey-500">
              An unexpected error occurred while displaying this page. Please try reloading or
              return to your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReload}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Reload page
              </Button>
              <a
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-grey-700 bg-surface border border-grey-200 hover:bg-grey-50 transition-colors"
              >
                <Home className="w-4 h-4 mr-1.5" />
                Go to dashboard
              </a>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
