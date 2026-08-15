import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useCouple } from "./CoupleContext";
import { usePresence } from "@/hooks/usePresence";
import { chatService } from "@/lib/services/chatService";
import { gameService, type GameSession, type GameType } from "@/lib/services/gameService";
import { toast } from "@/hooks/use-toast";
import {
  useRealtimeRoom,
  type VideoAction,
  type VideoSyncState,
  type SecretMessagePayload,
  type MemoryPayload,
  type SchedulePayload,
  type ConnectionStatus,
} from "@/hooks/useRealtimeRoom";

export type MoodTheme = "default" | "night" | "horror";

export interface ChatMessage {
  id: string;
  sender: "me" | "partner";
  text: string;
  timestamp: number;
}

export interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

export interface SecretMsg {
  id: string;
  text: string;
  revealType: "timer" | "click";
  timerSeconds?: number;
  revealed: boolean;
  createdAt: number;
  sender: "me" | "partner";
}

export interface Memory {
  id: string;
  title: string;
  date: string;
  emoji: string;
}

export interface ScheduledDate {
  id: string;
  title: string;
  date: string;
  time: string;
}

interface RoomState {
  holdingHands: boolean;
  myHoldHands: boolean;
  partnerHoldHands: boolean;
  moodTheme: MoodTheme;
  messages: ChatMessage[];
  reactions: Reaction[];
  partnerCursor: { x: number; y: number } | null;
  secretMessages: SecretMsg[];
  memories: Memory[];
  scheduledDates: ScheduledDate[];
  partnerActivity: string;
  partnerTyping: boolean;
  holdHandsRequest: string | null;
  myCursorPack: string;
  partnerCursorPack: string;
  cursorSize: number;
  cursorOpacity: number;
  // Video Shared State
  mediaUrl: string | null;
  isPlaying: boolean;
  playbackPosition: number;
  lastPlaybackUpdate: number;
  hostOnlyControl: boolean;
  hostId: string | null;
}

interface RoomContextType extends RoomState {
  roomCode: string | null;
  partnerJoined: boolean;
    partnerStatus: string;
    connectionStatus: ConnectionStatus;
    isLoading: boolean;
    mediaUrl: string | null;
    isPlaying: boolean;
    playbackPosition: number;
    lastPlaybackUpdate: number;
    hostOnlyControl: boolean;
    hostId: string | null;
    createRoom: () => Promise<void>;
  joinRoom: (code: string) => Promise<{ error?: string }>;
  leaveRoom: () => Promise<void>;
  toggleMyHoldHands: () => void;
  requestHoldHands: () => void;
  respondHoldHands: (accepted: boolean) => void;
  setMoodTheme: (theme: MoodTheme) => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  broadcastVideoAction: (action: VideoAction) => void;
  broadcastCursor: (x: number, y: number) => void;
  onVideoAction: React.MutableRefObject<((action: VideoAction) => void) | null>;
  onSyncRequest: React.MutableRefObject<(() => void) | null>;
  onSyncResponse: React.MutableRefObject<((state: VideoSyncState) => void) | null>;
  sendSecretMessage: (text: string, revealType: "timer" | "click", timerSeconds?: number) => void;
  revealSecret: (id: string) => void;
  addMemory: (title: string, emoji: string) => void;
  removeMemory: (id: string) => void;
  addSchedule: (title: string, date: string, time: string) => void;
  removeSchedule: (id: string) => void;
  sendTyping: (typing: boolean) => void;
  broadcastActivity: (activity: string) => void;
  requestVideoSync: () => void;
  respondVideoSync: (state: VideoSyncState) => void;
  setMyCursorPack: (packId: string) => void;
  setCursorSize: (size: number) => void;
  setCursorOpacity: (opacity: number) => void;
  broadcastGameAction: (action: Record<string, unknown>) => void;
  onGameAction: React.MutableRefObject<((action: { type: string; [key: string]: unknown }) => void) | null>;
}

const RoomContext = createContext<RoomContextType | null>(null);

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
};

const getUserName = () => {
  try {
    const saved = localStorage.getItem("pookie_user");
    if (saved) return JSON.parse(saved).username || "Pookie";
  } catch (error) {
    console.error("RoomContext username error:", error);
  }
  return "Pookie";
};

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { coupleId, partner, pairingStatus, createInvite, joinCouple, leaveCouple, pairingCode, isLoading: coupleLoading } = useCouple();
  const { presences } = usePresence(coupleId, user?.id, user);

  const partnerPresence = useMemo(() => {
    if (!partner) return null;
    return presences[partner.id];
  }, [partner, presences]);

  const userId = user?.id || "anonymous";
  const [stateLoading, setStateLoading] = useState(false);

  const videoActionRef = useRef<((action: VideoAction) => void) | null>(null);
  const syncRequestRef = useRef<(() => void) | null>(null);
  const syncResponseRef = useRef<((state: VideoSyncState) => void) | null>(null);
  const gameActionRef = useRef<((action: { type: string; [key: string]: unknown }) => void) | null>(null);

  const [state, setState] = useState<RoomState>({
    holdingHands: false,
    myHoldHands: false,
    partnerHoldHands: false,
    moodTheme: "default",
    messages: [],
    reactions: [],
    partnerCursor: null,
    secretMessages: [],
    memories: (() => {
      try { const s = localStorage.getItem("pookie_memories"); return s ? JSON.parse(s) : []; } catch { return []; }
    })(),
    scheduledDates: (() => {
      try { const s = localStorage.getItem("pookie_schedules"); return s ? JSON.parse(s) : []; } catch { return []; }
    })(),
    partnerActivity: "watching",
    partnerTyping: false,
    holdHandsRequest: null,
    myCursorPack: localStorage.getItem("pookie_cursor_pack") || "default",
    partnerCursorPack: "default",
    cursorSize: Number(localStorage.getItem("pookie_cursor_size")) || 32,
    cursorOpacity: Number(localStorage.getItem("pookie_cursor_opacity")) || 1,
    // Video Shared State
    mediaUrl: null,
    isPlaying: false,
    playbackPosition: 0,
    lastPlaybackUpdate: Date.now(),
    hostOnlyControl: true,
    hostId: null,
  });

  // Persist
  useEffect(() => { localStorage.setItem("pookie_memories", JSON.stringify(state.memories)); }, [state.memories]);
  useEffect(() => { localStorage.setItem("pookie_schedules", JSON.stringify(state.scheduledDates)); }, [state.scheduledDates]);

  const handlePartnerJoin = useCallback(() => {
  }, []);

  const handlePartnerLeave = useCallback(() => {
    setState((s) => ({
      ...s, partnerCursor: null,
      partnerHoldHands: false, holdingHands: false, holdHandsRequest: null,
    }));
  }, []);

  const handleChatMessage = useCallback((msg: { id: string; content: string; sender_id: string; created_at?: string }) => {
    setState((s) => {
      if (s.messages.some(m => m.id === msg.id)) return s;
      
      const sender: "me" | "partner" = msg.sender_id === userId ? "me" : "partner";
      const newMsg: ChatMessage = { 
        id: msg.id, 
        sender, 
        text: msg.content, 
        timestamp: msg.created_at ? new Date(msg.created_at).getTime() : Date.now() 
      };
      
      return { 
        ...s, 
        messages: [...s.messages, newMsg] 
      };
    });
  }, [userId]);

  const handleReaction = useCallback((emoji: string) => {
    const r: Reaction = { id: crypto.randomUUID(), emoji, x: 20 + Math.random() * 60, y: Math.random() * 30 };
    setState((s) => ({ ...s, reactions: [...s.reactions, r] }));
    setTimeout(() => setState((s) => ({ ...s, reactions: s.reactions.filter((rx) => rx.id !== r.id) })), 3000);
  }, []);

  const handleVideoAction = useCallback((action: VideoAction) => { videoActionRef.current?.(action); }, []);
  const handleCursorMove = useCallback((pos: { x: number; y: number }) => { setState((s) => ({ ...s, partnerCursor: pos })); }, []);

  const handleHoldHands = useCallback((holding: boolean) => {
    setState((s) => ({ ...s, partnerHoldHands: holding, holdingHands: s.myHoldHands && holding }));
  }, []);

  const handleHoldHandsRequest = useCallback((fromUser: string) => {
    setState((s) => ({ ...s, holdHandsRequest: fromUser }));
  }, []);

  const handleHoldHandsResponse = useCallback((accepted: boolean) => {
    if (accepted) {
      setState((s) => ({ ...s, holdingHands: true, myHoldHands: true, partnerHoldHands: true, holdHandsRequest: null }));
    } else {
      setState((s) => ({ ...s, myHoldHands: false, holdHandsRequest: null }));
    }
  }, []);

  const handleSecretMessage = useCallback((handleMsg: SecretMessagePayload) => {
    const secret: SecretMsg = { ...handleMsg, revealed: false, createdAt: Date.now(), sender: "partner" };
    setState((s) => ({ ...s, secretMessages: [...s.secretMessages, secret] }));
    if (handleMsg.revealType === "timer" && handleMsg.timerSeconds) {
      setTimeout(() => {
        setState((s) => ({ ...s, secretMessages: s.secretMessages.map((m) => m.id === handleMsg.id ? { ...m, revealed: true } : m) }));
      }, handleMsg.timerSeconds * 1000);
    }
  }, []);

  const handleMemoryAdd = useCallback((mem: MemoryPayload) => {
    setState((s) => {
      if (s.memories.some((m) => m.id === mem.id)) return s;
      return { ...s, memories: [mem, ...s.memories] };
    });
  }, []);

  const handleMemoryRemove = useCallback((id: string) => {
    setState((s) => ({ ...s, memories: s.memories.filter((m) => m.id !== id) }));
  }, []);

  const handleScheduleAdd = useCallback((sched: SchedulePayload) => {
    setState((s) => {
      if (s.scheduledDates.some((d) => d.id === sched.id)) return s;
      return { ...s, scheduledDates: [...s.scheduledDates, sched] };
    });
  }, []);

  const handleScheduleRemove = useCallback((id: string) => {
    setState((s) => ({ ...s, scheduledDates: s.scheduledDates.filter((d) => d.id !== id) }));
  }, []);

  const handlePresenceUpdate = useCallback((status: string) => {
    if (status.startsWith("activity:")) {
      setState((s) => ({ ...s, partnerActivity: status.replace("activity:", "") }));
    }
  }, []);

  const handleTypingIndicator = useCallback((typing: boolean) => {
    setState((s) => ({ ...s, partnerTyping: typing }));
  }, []);

  const handleSyncRequest = useCallback(() => { syncRequestRef.current?.(); }, []);
  const handleSyncResponse = useCallback((syncState: VideoSyncState) => { syncResponseRef.current?.(syncState); }, []);

  // Fetch chat history and subscribe
  useEffect(() => {
    if (!coupleId) return;

    const loadHistory = async () => {
      try {
        const history = await chatService.fetchMessages(coupleId);
        const formattedMessages: ChatMessage[] = history.map((m: any) => ({
          id: m.id,
          sender: m.sender_id === userId ? "me" : "partner",
          text: m.content,
          timestamp: new Date(m.created_at).getTime(),
        }));
        setState(s => ({ ...s, messages: formattedMessages }));
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    loadHistory();

    const subscription = chatService.subscribeToMessages(coupleId, (newMsg) => {
      handleChatMessage(newMsg);
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [coupleId, userId, handleChatMessage]);

  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`room_state:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload: any) => {
          const newRoom = payload.new;
          setState((s) => ({
            ...s,
            mediaUrl: newRoom.media_url || null,
            isPlaying: !!newRoom.is_playing,
            playbackPosition: newRoom.position || 0,
            lastPlaybackUpdate: new Date(newRoom.updated_at).getTime(),
            hostId: newRoom.host_id || null,
            moodTheme: newRoom.mood_theme as MoodTheme || s.moodTheme,
          }));
          
          // Trigger local video sync
          if (videoActionRef.current) {
            // Calculate drift-corrected time
            const now = Date.now();
            const elapsed = newRoom.is_playing ? (now - new Date(newRoom.updated_at).getTime()) / 1000 : 0;
            const targetTime = newRoom.position + elapsed;
            
            videoActionRef.current({
              type: newRoom.is_playing ? "play" : "pause",
              time: targetTime,
              url: newRoom.media_url,
            });
          }
        }
      )
      .subscribe();

    const fetchRoom = async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("couple_id", coupleId)
        .eq("is_active", true)
        .single();
      
      if (data) {
        const room = data as any;
        setState(s => ({
          ...s,
          mediaUrl: room.media_url || null,
          isPlaying: !!room.is_playing,
          playbackPosition: room.position || 0,
          lastPlaybackUpdate: new Date(room.updated_at).getTime(),
          hostId: room.host_id || null,
          moodTheme: (room.mood_theme as MoodTheme) || s.moodTheme,
        }));
      }
    };

    fetchRoom();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const handleCursorChange = useCallback((packId: string) => {
    setState((s) => ({ ...s, partnerCursorPack: packId }));
  }, []);
  const handleGameAction = useCallback((action: { type: string; [key: string]: unknown }) => { gameActionRef.current?.(action); }, []);

  const rt = useRealtimeRoom(coupleId, userId, {
    onPartnerJoin: handlePartnerJoin,
    onPartnerLeave: handlePartnerLeave,
    onChatMessage: handleChatMessage,
    onReaction: handleReaction,
    onVideoAction: handleVideoAction,
    onCursorMove: handleCursorMove,
    onHoldHands: handleHoldHands,
    onHoldHandsRequest: handleHoldHandsRequest,
    onHoldHandsResponse: handleHoldHandsResponse,
    onSecretMessage: handleSecretMessage,
    onMemoryAdd: handleMemoryAdd,
    onMemoryRemove: handleMemoryRemove,
    onScheduleAdd: handleScheduleAdd,
    onScheduleRemove: handleScheduleRemove,
    onPresenceUpdate: handlePresenceUpdate,
    onTypingIndicator: handleTypingIndicator,
    onSyncRequest: handleSyncRequest,
    onSyncResponse: handleSyncResponse,
    onCursorChange: handleCursorChange,
    onGameAction: handleGameAction,
  });

  const handleCreateRoom = useCallback(async () => {
    setStateLoading(true);
    await createInvite();
    setStateLoading(false);
  }, [createInvite]);

  const handleJoinRoom = useCallback(async (code: string) => {
    setStateLoading(true);
    const res = await joinCouple(code);
    setStateLoading(false);
    return res as { error?: string };
  }, [joinCouple]);

  const handleLeaveRoom = useCallback(async () => {
    setStateLoading(true);
    await leaveCouple();
    setStateLoading(false);
  }, [leaveCouple]);

  const toggleMyHoldHands = useCallback(() => {
    setState((s) => {
      const newMy = !s.myHoldHands;
      rt.sendHoldHands(newMy);
      return { ...s, myHoldHands: newMy, holdingHands: newMy && s.partnerHoldHands };
    });
  }, [rt]);

  const requestHoldHands = useCallback(() => {
    rt.sendHoldHandsRequest(getUserName());
    setState((s) => ({ ...s, myHoldHands: true }));
    rt.sendHoldHands(true);
  }, [rt]);

  const respondHoldHands = useCallback((accepted: boolean) => {
    rt.sendHoldHandsResponse(accepted);
    if (accepted) {
      setState((s) => ({ ...s, holdingHands: true, myHoldHands: true, partnerHoldHands: true, holdHandsRequest: null }));
      rt.sendHoldHands(true);
    } else {
      setState((s) => ({ ...s, holdHandsRequest: null }));
    }
  }, [rt]);

  const broadcastVideoAction = useCallback(async (action: VideoAction) => {
    if (!coupleId) return;
    
    // Check host control
    if (state.hostOnlyControl && state.hostId && state.hostId !== userId) {
      toast({
        title: "Host only control",
        description: "Only the host can control the video right now.",
        variant: "destructive",
      });
      return;
    }

    // Map VideoAction to room update
    const update: any = {
      updated_at: new Date().toISOString(),
    };

    if (action.type === "play" || action.type === "pause") {
      update.is_playing = action.type === "play";
      if (action.time !== undefined) update.position = action.time;
    } else if (action.type === "seek" && action.time !== undefined) {
      update.position = action.time;
      update.is_playing = state.isPlaying;
    } else if (action.type === "load" && action.url) {
      update.media_url = action.url;
      update.position = 0;
      update.is_playing = true;
    }

    const { error } = await supabase
      .from("rooms")
      .update(update)
      .eq("couple_id", coupleId);
      
    if (error) console.error("Failed to broadcast video action:", error);
  }, [coupleId, userId, state.hostOnlyControl, state.hostId, state.isPlaying]);

  const setMoodTheme = useCallback((theme: MoodTheme) => setState((s) => ({ ...s, moodTheme: theme })), []);

  const sendMessage = useCallback(async (text: string) => {
    if (!coupleId) return;
    
    // Optimistic UI update
    const tempId = crypto.randomUUID();
    setState((s) => ({ 
      ...s, 
      messages: [...s.messages, { id: tempId, sender: "me", text, timestamp: Date.now() }] 
    }));

    try {
      await chatService.sendMessage(coupleId, userId, text);
      // The real message will arrive via subscription and we'll deduplicate by ID if we get the real ID,
      // but chatService.sendMessage returns the inserted record. 
      // Actually, handleChatMessage handles deduplication.
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on error?
      setState(s => ({ ...s, messages: s.messages.filter(m => m.id !== tempId) }));
    }
  }, [rt, coupleId, userId]);

  const sendReactionLocal = useCallback((emoji: string) => {
    const r: Reaction = { id: crypto.randomUUID(), emoji, x: 20 + Math.random() * 60, y: Math.random() * 30 };
    setState((s) => ({ ...s, reactions: [...s.reactions, r] }));
    setTimeout(() => setState((s) => ({ ...s, reactions: s.reactions.filter((rx) => rx.id !== r.id) })), 3000);
    rt.sendReaction(emoji);
  }, [rt]);

  const sendSecretMessageLocal = useCallback((text: string, revealType: "timer" | "click", timerSeconds?: number) => {
    const id = crypto.randomUUID();
    const msg: SecretMsg = { id, text, revealType, timerSeconds, revealed: false, createdAt: Date.now(), sender: "me" };
    setState((s) => ({ ...s, secretMessages: [...s.secretMessages, msg] }));
    rt.sendSecretMessage({ id, text, revealType, timerSeconds });
    if (revealType === "timer" && timerSeconds) {
      setTimeout(() => setState((s) => ({ ...s, secretMessages: s.secretMessages.map((m) => m.id === id ? { ...m, revealed: true } : m) })), timerSeconds * 1000);
    }
  }, [rt]);

  const revealSecret = useCallback((id: string) => {
    setState((s) => ({ ...s, secretMessages: s.secretMessages.map((m) => m.id === id ? { ...m, revealed: true } : m) }));
  }, []);

  const addMemory = useCallback((title: string, emoji: string) => {
    const mem: Memory = { id: crypto.randomUUID(), title, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }), emoji };
    setState((s) => ({ ...s, memories: [mem, ...s.memories] }));
    rt.sendMemoryAdd(mem);
  }, [rt]);

  const removeMemory = useCallback((id: string) => {
    setState((s) => ({ ...s, memories: s.memories.filter((m) => m.id !== id) }));
    rt.sendMemoryRemove(id);
  }, [rt]);

  const addSchedule = useCallback((title: string, date: string, time: string) => {
    const sched: ScheduledDate = { id: crypto.randomUUID(), title, date, time };
    setState((s) => ({ ...s, scheduledDates: [...s.scheduledDates, sched] }));
    rt.sendScheduleAdd(sched);
  }, [rt]);

  const removeSchedule = useCallback((id: string) => {
    setState((s) => ({ ...s, scheduledDates: s.scheduledDates.filter((d) => d.id !== id) }));
    rt.sendScheduleRemove(id);
  }, [rt]);

  const sendTyping = useCallback((typing: boolean) => { rt.sendTypingIndicator(typing); }, [rt]);
  const broadcastActivity = useCallback((activity: string) => { rt.sendPresenceStatus(`activity:${activity}`); }, [rt]);
  const requestVideoSync = useCallback(() => { rt.sendSyncRequest(); }, [rt]);
  const respondVideoSync = useCallback((syncState: VideoSyncState) => { rt.sendSyncResponse(syncState); }, [rt]);

  const setMyCursorPack = useCallback((packId: string) => {
    setState((s) => ({ ...s, myCursorPack: packId }));
    localStorage.setItem("pookie_cursor_pack", packId);
    rt.sendCursorChange(packId);
  }, [rt]);

  const setCursorSize = useCallback((size: number) => {
    setState((s) => ({ ...s, cursorSize: size }));
    localStorage.setItem("pookie_cursor_size", String(size));
  }, []);

  const setCursorOpacity = useCallback((opacity: number) => {
    setState((s) => ({ ...s, cursorOpacity: opacity }));
    localStorage.setItem("pookie_cursor_opacity", String(opacity));
  }, []);

  const broadcastGameAction = useCallback((action: Record<string, unknown>) => {
    rt.sendGameAction(action);
  }, [rt]);

  return (
    <RoomContext.Provider
      value={{
        ...state,
        roomCode: pairingCode,
        partnerJoined: pairingStatus === "paired",
        partnerStatus: partnerPresence?.online_status || "offline",
        connectionStatus: rt.connectionStatus,
        isLoading: stateLoading || coupleLoading,
        createRoom: handleCreateRoom,
        joinRoom: handleJoinRoom,
        leaveRoom: handleLeaveRoom,
        toggleMyHoldHands, requestHoldHands, respondHoldHands,
        setMoodTheme, sendMessage,
        sendReaction: sendReactionLocal,
        broadcastVideoAction,
        broadcastCursor: rt.sendCursor,
        onVideoAction: videoActionRef,
        onSyncRequest: syncRequestRef,
        onSyncResponse: syncResponseRef,
        sendSecretMessage: sendSecretMessageLocal, revealSecret,
        addMemory, removeMemory,
        addSchedule, removeSchedule,
        sendTyping, broadcastActivity, requestVideoSync, respondVideoSync,
        setMyCursorPack, setCursorSize, setCursorOpacity,
        broadcastGameAction,
        onGameAction: gameActionRef,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
