import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import { AuthProvider } from "@/context/AuthContext";
import ClientDashboard from "@/pages/dashboard/ClientDashboard";
import ServiceDashboard from "@/pages/dashboard/ServiceDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Router() {
  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/contact" component={Contact} />
        <Route path="/dashboard">
          {() => (
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          )}
        </Route>
        <Route path="/service-dashboard">
          {() => (
            <ErrorBoundary>
              <ProtectedRoute allowedRoles={["service"]}>
                <ServiceDashboard />
              </ProtectedRoute>
            </ErrorBoundary>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;