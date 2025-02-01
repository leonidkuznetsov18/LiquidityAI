import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="text-center space-y-4">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <pre className="text-sm text-red-500">{error.message}</pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={ErrorFallback}
        >
          <Router />
          <Toaster />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default App;