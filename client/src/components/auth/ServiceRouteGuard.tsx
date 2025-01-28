import { FC, ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/context/AuthContext";

interface ServiceRouteGuardProps {
  children: ReactNode;
}

export const ServiceRouteGuard: FC<ServiceRouteGuardProps> = ({ children }) => {
  const { user, loading, isService } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !isService) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};
