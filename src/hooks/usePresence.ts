import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PresenceState {
  user_id: string;
  online_status: string;
  last_seen: string;
  username: string;
  avatar: string;
}

export function usePresence(coupleId: string | null, userId: string | undefined, profile: any) {
  const [presences, setPresences] = useState<Record<string, PresenceState>>({});
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!coupleId || !userId || !profile) return;

    const channel = supabase.channel(`couple_presence:${coupleId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const formattedState: Record<string, PresenceState> = {};
        
        Object.keys(state).forEach((key) => {
          const userPresence = state[key][0] as any;
          formattedState[key] = {
            user_id: key,
            online_status: "online",
            last_seen: new Date().toISOString(),
            username: userPresence.username || "Pookie",
            avatar: userPresence.avatar || "🐱",
          };
        });
        
        setPresences(formattedState);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            online_status: "online",
            username: profile.username,
            avatar: profile.avatar,
            last_seen: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [coupleId, userId, profile]);

  const updatePresence = useCallback(async (status: string) => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      await channelRef.current.track({
        online_status: status,
        username: profile?.username,
        avatar: profile?.avatar,
        last_seen: new Date().toISOString(),
      });
    }
  }, [profile]);

  return { presences, updatePresence };
}
