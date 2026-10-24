import { Component } from 'react';

/** Keeps a crashing template from taking the whole app down. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('Template crashed:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-canvas p-6 text-center text-ink">
        <div className="text-5xl">🎂</div>
        <p className="text-lg font-semibold">Happy Birthday!</p>
        <p className="max-w-xs text-sm text-mute">This scene hit a snag, but the wish is still on its way.</p>
      </div>
    );
  }
}
