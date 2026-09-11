import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Role } from "../lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="mt-3 text-sm text-gray-500 font-medium">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTarget = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Access Restricted</h1>
          <p className="mt-2 text-sm text-gray-600">
            You do not have administrative permissions to access this page ({requiredRole} role required).
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors"
            >
              <ArrowLeft size={14} /> Return to Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

