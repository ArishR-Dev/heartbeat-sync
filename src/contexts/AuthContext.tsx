import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

type AuthGlobal = typeof globalThis & {
  __pookiewatch_auth_context__?: React.Context<AuthContextType | null>;
};

const authGlobal = globalThis as AuthGlobal;
const AuthContext = authGlobal.__pookiewatch_auth_context__ ?? createContext<AuthContextType | null>(null);
AuthContext.displayName = "AuthContext";
authGlobal.__pookiewatch_auth_context__ = AuthContext;

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mapSupabaseUser = useCallback((u: SupabaseUser): User => {
    const username =
      (u.user_metadata?.username as string | undefined) ||
      (u.user_metadata?.full_name as string | undefined) ||
      (u.email?.split("@")[0] ?? "pookie");
    return {
      id: u.id,
      username,
      email: u.email ?? "",
      avatar: "🐱",
      gender: (u.user_metadata?.gender as "male" | "female" | undefined) || undefined,
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [mapSupabaseUser]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsLoading(false);
    if (error) throw error;
    if (data.user) setUser(mapSupabaseUser(data.user));
  }, [mapSupabaseUser]);

  const register = useCallback(async (username: string, email: string, password: string, avatar: string, gender?: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          avatar,
          gender,
        },
      },
    });
    setIsLoading(false);
    if (error) throw error;
    if (data.user) setUser(mapSupabaseUser(data.user));
  }, [mapSupabaseUser]);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, signInWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
