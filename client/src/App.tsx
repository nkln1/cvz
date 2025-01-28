import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import { AuthProvider } from "@/context/AuthContext";
import ClientDashboard from "@/pages/dashboard/ClientDashboard";
import { ServiceRouteGuard } from "@/components/auth/ServiceRouteGuard";
import ServiceRequests from "@/pages/dashboard/services/ServiceRequests";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/contact" component={Contact} />
      <Route path="/dashboard" component={ClientDashboard} />

      {/* Service Dashboard Routes */}
      <Route path="/dashboard/service/requests">
        <ServiceRouteGuard>
          <ServiceRequests />
        </ServiceRouteGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;