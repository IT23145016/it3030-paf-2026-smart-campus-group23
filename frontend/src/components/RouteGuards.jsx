import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function getAuthenticatedHome(user) {
  return user?.roles?.includes("ADMIN") ? "/dashboard" : "/resources";
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

export { getAuthenticatedHome };
