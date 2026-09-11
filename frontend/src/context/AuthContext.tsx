// FindBack - Authentication Context
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  authApi,
  getStoredToken,
  removeStoredToken,
  SafeUser,
  setStoredToken,
  UpdateProfileInput,
} from "../lib/api";

interface AuthContextType {
  user: SafeUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<SafeUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { user: fetchedUser } = await authApi.getMe(currentToken);
      setUser(fetchedUser);
      setToken(currentToken);
    } catch (err) {
      console.warn("Session restore failed, logging out:", err);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await authApi.register(name, email, password);
      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
    },
    []
  );

  const updateProfile = useCallback(
    async (data: UpdateProfileInput) => {
      const result = await authApi.updateProfile(data);
      setUser(result.user);
      return result.user;
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [user, token, isLoading, login, register, logout, refreshUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

