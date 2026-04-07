import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAuthenticatedHome } from "../components/RouteGuards";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    navigate(user ? getAuthenticatedHome(user) : "/signin", { replace: true });
  }, [loading, navigate, user]);

  return <p className="callback-message">Completing Google sign-in...</p>;
}
