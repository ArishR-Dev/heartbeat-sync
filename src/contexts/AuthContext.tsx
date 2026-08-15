import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type User as SupabaseUser } from "@supabase/supabase-js";

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

  const fetchProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return {
      id: data.id,
      username: data.username,
      email: supabaseUser.email || "",
      avatar: data.avatar || "🐱",
      gender: data.gender as "male" | "female" | undefined,
    };
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, avatar: string, gender?: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
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
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, signInWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
