import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[Care Bridge ErrorBoundary] Caught unhandled React error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSettings = () => {
    try {
      localStorage.removeItem('dischargeai_settings');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error);
      const stack = this.state.errorInfo?.componentStack || this.state.error?.stack || '';

      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="bg-white rounded-3xl shadow-xl border border-rose-200 max-w-2xl w-full p-8 space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Care Bridge Application Error
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  An unexpected error occurred during rendering. The interface has been preserved from crashing to a blank screen.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 text-xs font-mono text-rose-950 break-words leading-relaxed">
              <span className="font-bold text-rose-700 block mb-1">Error Message:</span>
              {errorMsg}
            </div>

            {stack && (
              <details className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] font-mono text-slate-600">
                <summary className="cursor-pointer font-bold text-slate-700 hover:text-slate-900 select-none">
                  View Component Stack Trace
                </summary>
                <pre className="mt-2.5 overflow-x-auto whitespace-pre-wrap leading-normal text-[10px] text-slate-600">
                  {stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleResetSettings}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                Reset Settings & Clear Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
