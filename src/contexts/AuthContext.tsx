import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  gender?: "male" | "female";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, avatar: string, gender?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("pookie_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: crypto.randomUUID(),
      username: email.split("@")[0] || "Pookie",
      email,
      avatar: "🐱",
    };
    
    setUser(mockUser);
    localStorage.setItem("pookie_user", JSON.stringify(mockUser));
    setIsLoading(false);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, avatar: string, gender?: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      avatar,
      gender: gender as "male" | "female" | undefined,
    };
    
    setUser(mockUser);
    localStorage.setItem("pookie_user", JSON.stringify(mockUser));
    setIsLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser: User = {
      id: crypto.randomUUID(),
      username: "Google Pookie",
      email: "google@pookie.com",
      avatar: "🦄",
    };
    
    setUser(mockUser);
    localStorage.setItem("pookie_user", JSON.stringify(mockUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    localStorage.removeItem("pookie_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, signInWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
