import { Component } from 'react'

/**
 * [REFACTOR U-3] Catches render-time errors and shows a recoverable fallback
 * instead of blanking the entire app tree.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center p-8 text-center"
          role="alert"
        >
          <div className="w-full rounded-none border border-[var(--border)] border-t-2 border-t-[var(--signal)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-heading text-xl font-semibold text-[var(--text-hi)]">
              Something went wrong
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              This section hit an unexpected error. Refresh the page to try again, or go back to the
              feed.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="signal-glow-hover bg-[var(--signal)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--signal-on)]"
              >
                Refresh
              </button>
              {this.props.onReset && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="border border-[var(--border)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)] hover:border-[var(--signal)]/50 hover:text-[var(--text)]"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
