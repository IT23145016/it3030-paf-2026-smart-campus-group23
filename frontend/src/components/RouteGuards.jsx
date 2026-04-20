import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function getAuthenticatedHome(user) {
  if (user?.roles?.includes("ADMIN")) {
    return "/dashboard";
  }
  if (user?.roles?.includes("TECHNICIAN")) {
    return "/tickets/manage";
  }
  return "/resources";
}

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="fullscreen-state">Preparing your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="fullscreen-state">Checking session...</div>;
  }

  if (user) {
    return <Navigate to={getAuthenticatedHome(user)} replace />;
  }

  return children;
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="fullscreen-state">Preparing your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!user.roles?.includes("ADMIN")) {
    return <Navigate to={getAuthenticatedHome(user)} replace />;
  }

  return children;
}

export function OperationsRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="fullscreen-state">Preparing your workspace...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!user.roles?.some((role) => role === "ADMIN" || role === "TECHNICIAN")) {
    return <Navigate to={getAuthenticatedHome(user)} replace />;
  }

  return children;
}

export { getAuthenticatedHome };
