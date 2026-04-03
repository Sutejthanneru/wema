import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("wema_token");
    return token ? { token, user: null } : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("wema_token")));

  useEffect(() => {
    if (!session?.token) {
      localStorage.removeItem("wema_token");
      return;
    }

    localStorage.setItem("wema_token", session.token);
  }, [session]);

  useEffect(() => {
    const token = localStorage.getItem("wema_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        setSession({ token, user: data.data.user, riderProfile: data.data.riderProfile });
      })
      .catch(() => {
        localStorage.removeItem("wema_token");
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const { data } = await api.post("/auth/firebase-login", {
      idToken: payload.idToken || "local-dev-token",
      profile: payload
    });

    localStorage.setItem("wema_token", data.data.token);
    const profileResponse = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${data.data.token}`
      }
    });

    const nextSession = {
      token: data.data.token,
      user: profileResponse.data.data.user,
      riderProfile: profileResponse.data.data.riderProfile
    };

    setSession(nextSession);
    return nextSession;
  };

  const logout = () => {
    localStorage.removeItem("wema_token");
    setSession(null);
  };

  return <AuthContext.Provider value={{ session, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
