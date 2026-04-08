import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);
const SESSION_CHECK_INTERVAL_MS = 15000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    async function syncCurrentUser() {
      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
        setAuthMessage("");
      } catch (err) {
        setUser(null);
        setAuthMessage(err.status === 401 ? "" : err.message || "");
      } finally {
        setLoading(false);
      }
    }

    syncCurrentUser();

    const intervalId = window.setInterval(syncCurrentUser, SESSION_CHECK_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncCurrentUser();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, authMessage, setAuthMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
