import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
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
  roomCode: string | null;
  partnerJoined: boolean;
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
  partnerStatus: string;
  partnerActivity: string;
  partnerTyping: boolean;
  holdHandsRequest: string | null;
  myCursorPack: string;
  partnerCursorPack: string;
  cursorSize: number;
  cursorOpacity: number;
}

interface RoomContextType extends RoomState {
  connectionStatus: ConnectionStatus;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
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

type RoomGlobal = typeof globalThis & {
  __pookiewatch_room_context__?: React.Context<RoomContextType | null>;
};

const roomGlobal = globalThis as RoomGlobal;
const RoomContext = roomGlobal.__pookiewatch_room_context__ ?? createContext<RoomContextType | null>(null);
RoomContext.displayName = "RoomContext";
roomGlobal.__pookiewatch_room_context__ = RoomContext;

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
};

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const generateUserId = () => {
  let id = sessionStorage.getItem("pookie_user_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("pookie_user_id", id);
  }
  return id;
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
  const userId = useRef(generateUserId()).current;
  const videoActionRef = useRef<((action: VideoAction) => void) | null>(null);
  const syncRequestRef = useRef<(() => void) | null>(null);
  const syncResponseRef = useRef<((state: VideoSyncState) => void) | null>(null);
  const gameActionRef = useRef<((action: { type: string; [key: string]: unknown }) => void) | null>(null);

  const [state, setState] = useState<RoomState>({
    roomCode: null,
    partnerJoined: false,
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
    partnerStatus: "watching",
    partnerActivity: "watching",
    partnerTyping: false,
    holdHandsRequest: null,
    myCursorPack: localStorage.getItem("pookie_cursor_pack") || "default",
    partnerCursorPack: "default",
    cursorSize: Number(localStorage.getItem("pookie_cursor_size")) || 32,
    cursorOpacity: Number(localStorage.getItem("pookie_cursor_opacity")) || 1,
  });

  // Persist
  useEffect(() => { localStorage.setItem("pookie_memories", JSON.stringify(state.memories)); }, [state.memories]);
  useEffect(() => { localStorage.setItem("pookie_schedules", JSON.stringify(state.scheduledDates)); }, [state.scheduledDates]);

  const handlePartnerJoin = useCallback(() => {
    setState((s) => ({ ...s, partnerJoined: true }));
  }, []);

  const handlePartnerLeave = useCallback(() => {
    setState((s) => ({
      ...s, partnerJoined: false, partnerCursor: null,
      partnerHoldHands: false, holdingHands: false, holdHandsRequest: null,
    }));
  }, []);

  const handleChatMessage = useCallback((msg: { id: string; text: string }) => {
    setState((s) => ({ ...s, messages: [...s.messages, { id: msg.id, sender: "partner" as const, text: msg.text, timestamp: Date.now() }] }));
  }, []);

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

  const handleSecretMessage = useCallback((msg: SecretMessagePayload) => {
    const secret: SecretMsg = { ...msg, revealed: false, createdAt: Date.now(), sender: "partner" };
    setState((s) => ({ ...s, secretMessages: [...s.secretMessages, secret] }));
    if (msg.revealType === "timer" && msg.timerSeconds) {
      setTimeout(() => {
        setState((s) => ({ ...s, secretMessages: s.secretMessages.map((m) => m.id === msg.id ? { ...m, revealed: true } : m) }));
      }, msg.timerSeconds * 1000);
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
    // status can be "activity:xxx" or legacy status
    if (status.startsWith("activity:")) {
      setState((s) => ({ ...s, partnerActivity: status.replace("activity:", "") }));
    } else {
      setState((s) => ({ ...s, partnerStatus: status }));
    }
  }, []);

  const handleTypingIndicator = useCallback((typing: boolean) => {
    setState((s) => ({ ...s, partnerTyping: typing }));
  }, []);

  const handleSyncRequest = useCallback(() => { syncRequestRef.current?.(); }, []);
  const handleSyncResponse = useCallback((syncState: VideoSyncState) => { syncResponseRef.current?.(syncState); }, []);
  const handleCursorChange = useCallback((packId: string) => {
    setState((s) => ({ ...s, partnerCursorPack: packId }));
  }, []);
  const handleGameAction = useCallback((action: { type: string; [key: string]: unknown }) => { gameActionRef.current?.(action); }, []);

  const rt = useRealtimeRoom(state.roomCode, userId, {
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

  const createRoom = useCallback(() => setState((s) => ({ ...s, roomCode: generateCode(), partnerJoined: false })), []);
  const joinRoom = useCallback((code: string) => setState((s) => ({ ...s, roomCode: code.toUpperCase(), partnerJoined: false })), []);

  const leaveRoom = useCallback(() => {
    setState({
      roomCode: null, partnerJoined: false, holdingHands: false, myHoldHands: false, partnerHoldHands: false,
      moodTheme: "default", messages: [], reactions: [], partnerCursor: null, secretMessages: [],
      memories: (() => { try { const s = localStorage.getItem("pookie_memories"); return s ? JSON.parse(s) : []; } catch { return []; } })(),
      scheduledDates: (() => { try { const s = localStorage.getItem("pookie_schedules"); return s ? JSON.parse(s) : []; } catch { return []; } })(),
      partnerStatus: "watching", partnerActivity: "watching", partnerTyping: false, holdHandsRequest: null,
      myCursorPack: localStorage.getItem("pookie_cursor_pack") || "default",
      partnerCursorPack: "default",
      cursorSize: Number(localStorage.getItem("pookie_cursor_size")) || 32,
      cursorOpacity: Number(localStorage.getItem("pookie_cursor_opacity")) || 1,
    });
  }, []);

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

  const setMoodTheme = useCallback((theme: MoodTheme) => setState((s) => ({ ...s, moodTheme: theme })), []);

  const sendMessage = useCallback((text: string) => {
    const id = crypto.randomUUID();
    setState((s) => ({ ...s, messages: [...s.messages, { id, sender: "me", text, timestamp: Date.now() }] }));
    rt.sendChat(id, text);
  }, [rt]);

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
        connectionStatus: rt.connectionStatus,
        createRoom, joinRoom, leaveRoom,
        toggleMyHoldHands, requestHoldHands, respondHoldHands,
        setMoodTheme, sendMessage,
        sendReaction: sendReactionLocal,
        broadcastVideoAction: rt.sendVideoAction,
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
