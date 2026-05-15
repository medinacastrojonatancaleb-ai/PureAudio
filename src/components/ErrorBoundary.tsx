import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RotateCcw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center text-error mb-6">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-2xl font-black mb-2">Something went wrong</h2>
      <p className="text-onSurfaceVariant text-sm mb-8 max-w-xs">
        An unexpected error occurred in the player. Don't worry, we can try to restart it for you.
      </p>
      <div className="bg-surfaceVariant/30 p-4 rounded-2xl w-full max-w-md mb-8 overflow-auto">
        <code className="text-xs text-error font-mono break-all text-left block">
          {error.message}
        </code>
      </div>
      <button
        onClick={resetErrorBoundary}
        className="flex items-center gap-2 bg-primary text-onPrimary px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
      >
        <RotateCcw size={20} />
        Reset Player
      </button>
    </div>
  );
}

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Optional: clear local storage or reset app state if needed
        window.location.reload();
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
