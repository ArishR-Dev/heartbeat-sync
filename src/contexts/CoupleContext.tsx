import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type User } from "./AuthContext";

export type PairingStatus = "unpaired" | "pairing" | "paired";

interface CoupleContextType {
  coupleId: string | null;
  partner: User | null;
  pairingStatus: PairingStatus;
  pairingCode: string | null;
  isLoading: boolean;
  createInvite: () => Promise<void>;
  joinCouple: (code: string) => Promise<{ error?: string }>;
  leaveCouple: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | null>(null);

export const useCouple = () => {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple must be used within CoupleProvider");
  return ctx;
};

export const CoupleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [pairingStatus, setPairingStatus] = useState<PairingStatus>("unpaired");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCouple = useCallback(async () => {
    if (!user) {
      setCoupleId(null);
      setPartner(null);
      setPairingStatus("unpaired");
      setPairingCode(null);
      setIsLoading(false);
      return;
    }

    const { data: couples, error } = await supabase
      .from("couples")
      .select(`
        *,
        user1:user1_id (*),
        user2:user2_id (*)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching couple:", error);
      setIsLoading(false);
      return;
    }

    if (couples && couples.length > 0) {
      const couple = couples[0];
      setCoupleId(couple.id);
      setPairingStatus(couple.status as PairingStatus);
      setPairingCode(couple.pairing_code);

      const partnerData = couple.user1_id === user.id ? couple.user2 : couple.user1;
      if (partnerData) {
        setPartner({
          id: partnerData.id,
          username: partnerData.username,
          email: "", // We don't have partner's email for security
          avatar: partnerData.avatar || "🐱",
          gender: partnerData.gender as "male" | "female" | undefined,
        });
      } else {
        setPartner(null);
      }
    } else {
      setCoupleId(null);
      setPartner(null);
      setPairingStatus("unpaired");
      setPairingCode(null);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCouple();

    if (!user) return;

    // Subscribe to changes in couples table
    const channel = supabase
      .channel("couple_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couples",
        },
        () => {
          fetchCouple();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCouple]);

  const createInvite = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc("get_or_create_invite" as never);
    if (error) {
      console.error("Error creating invite:", error);
    }
    await fetchCouple();
    setIsLoading(false);
  }, [fetchCouple]);

  const joinCouple = useCallback(async (code: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.rpc("join_couple_by_code" as never, { _pairing_code: code } as any);
    
    if (error) {
      setIsLoading(false);
      return { error: error.message };
    }

    const res = data as { error?: string, success?: boolean };
    if (res.error) {
      setIsLoading(false);
      return { error: res.error };
    }

    await fetchCouple();
    setIsLoading(false);
    return { success: true };
  }, [fetchCouple]);

  const leaveCouple = useCallback(async () => {
    if (!coupleId) return;
    setIsLoading(true);
    // In Phase 2, we just delete the couple record if it's ours
    // A better way would be unpairing, but let's keep it simple for now
    await supabase.from("couples").delete().eq("id", coupleId);
    await fetchCouple();
    setIsLoading(false);
  }, [coupleId, fetchCouple]);

  return (
    <CoupleContext.Provider
      value={{
        coupleId,
        partner,
        pairingStatus,
        pairingCode,
        isLoading,
        createInvite,
        joinCouple,
        leaveCouple,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
};
