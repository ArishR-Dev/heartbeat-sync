import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeEvents {
  onPartnerJoin: () => void;
  onPartnerLeave: () => void;
  onChatMessage: (msg: { id: string; text: string; sender: string }) => void;
  onReaction: (emoji: string) => void;
  onVideoAction: (action: VideoAction) => void;
  onCursorMove: (pos: { x: number; y: number }) => void;
  onHoldHands: (holding: boolean) => void;
  onHoldHandsRequest: (fromUser: string) => void;
  onHoldHandsResponse: (accepted: boolean) => void;
  onSecretMessage: (msg: SecretMessagePayload) => void;
  onMemoryAdd: (mem: MemoryPayload) => void;
  onMemoryRemove: (id: string) => void;
  onScheduleAdd: (sched: SchedulePayload) => void;
  onScheduleRemove: (id: string) => void;
  onPresenceUpdate: (status: string) => void;
  onTypingIndicator: (typing: boolean) => void;
  onSyncRequest: () => void;
  onSyncResponse: (state: VideoSyncState) => void;
  onCursorChange: (packId: string) => void;
  onGameAction: (action: any) => void;
}

export interface VideoAction {
  type: "play" | "pause" | "seek" | "load" | "sync_state";
  time?: number;
  url?: string;
  isYouTube?: boolean;
}

export interface VideoSyncState {
  url: string | null;
  isYouTube: boolean;
  currentTime: number;
  isPlaying: boolean;
}

export interface SecretMessagePayload {
  id: string;
  text: string;
  revealType: "timer" | "click";
  timerSeconds?: number;
}

export interface MemoryPayload {
  id: string;
  title: string;
  date: string;
  emoji: string;
}

export interface SchedulePayload {
  id: string;
  title: string;
  date: string;
  time: string;
}

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export function useRealtimeRoom(roomCode: string | null, userId: string, events: RealtimeEvents) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [partnerPresent, setPartnerPresent] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!roomCode) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: userId } },
    });

    // Presence
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users = Object.keys(state);
      const hasPartner = users.length > 1;
      setPartnerPresent(hasPartner);
      if (hasPartner) {
        // Store partner's username
        const partnerKey = users.find(k => k !== userId);
        if (partnerKey) {
          const partnerData = state[partnerKey]?.[0] as any;
          if (partnerData?.username) {
            try { localStorage.setItem("pookie_partner_name", partnerData.username); } catch {}
          }
        }
        eventsRef.current.onPartnerJoin();
      }
    });

    channel.on("presence", { event: "leave" }, ({ key }) => {
      if (key !== userId) {
        setPartnerPresent(false);
        eventsRef.current.onPartnerLeave();
      }
    });

    // All broadcast listeners
    const broadcastEvents: [string, (payload: any) => void][] = [
      ["chat", (p: any) => { if (p.sender !== userId) eventsRef.current.onChatMessage(p); }],
      ["reaction", (p: any) => { if (p.sender !== userId) eventsRef.current.onReaction(p.emoji); }],
      ["video", (p: any) => { if (p.sender !== userId) eventsRef.current.onVideoAction(p.action); }],
      ["cursor", (p: any) => { if (p.sender !== userId) eventsRef.current.onCursorMove(p.pos); }],
      ["holdhands", (p: any) => { if (p.sender !== userId) eventsRef.current.onHoldHands(p.holding); }],
      ["holdhands_request", (p: any) => { if (p.sender !== userId) eventsRef.current.onHoldHandsRequest(p.fromUser); }],
      ["holdhands_response", (p: any) => { if (p.sender !== userId) eventsRef.current.onHoldHandsResponse(p.accepted); }],
      ["secret_message", (p: any) => { if (p.sender !== userId) eventsRef.current.onSecretMessage(p.msg); }],
      ["memory_add", (p: any) => { if (p.sender !== userId) eventsRef.current.onMemoryAdd(p.memory); }],
      ["memory_remove", (p: any) => { if (p.sender !== userId) eventsRef.current.onMemoryRemove(p.id); }],
      ["schedule_add", (p: any) => { if (p.sender !== userId) eventsRef.current.onScheduleAdd(p.schedule); }],
      ["schedule_remove", (p: any) => { if (p.sender !== userId) eventsRef.current.onScheduleRemove(p.id); }],
      ["presence_status", (p: any) => { if (p.sender !== userId) eventsRef.current.onPresenceUpdate(p.status); }],
      ["typing", (p: any) => { if (p.sender !== userId) eventsRef.current.onTypingIndicator(p.typing); }],
      ["sync_request", (p: any) => { if (p.sender !== userId) eventsRef.current.onSyncRequest(); }],
      ["sync_response", (p: any) => { if (p.sender !== userId) eventsRef.current.onSyncResponse(p.state); }],
      ["cursor_change", (p: any) => { if (p.sender !== userId) eventsRef.current.onCursorChange(p.packId); }],
      ["game_action", (p: any) => { if (p.sender !== userId) eventsRef.current.onGameAction(p.action); }],
    ];

    broadcastEvents.forEach(([event, handler]) => {
      channel.on("broadcast", { event }, ({ payload }) => handler(payload));
    });

    // Get username for presence
    let username = "Pookie";
    try {
      const saved = localStorage.getItem("pookie_user");
      if (saved) username = JSON.parse(saved).username || "Pookie";
    } catch {}

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setConnectionStatus("connected");
        await channel.track({ user_id: userId, username, online_at: new Date().toISOString() });
      } else if (status === "CLOSED") {
        setConnectionStatus("disconnected");
      } else if (status === "CHANNEL_ERROR") {
        setConnectionStatus("reconnecting");
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setConnectionStatus("disconnected");
    };
  }, [roomCode, userId]);

  const broadcast = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      channelRef.current?.send({
        type: "broadcast",
        event,
        payload: { ...payload, sender: userId },
      });
    },
    [userId]
  );

  const sendChat = useCallback(
    (id: string, text: string) => broadcast("chat", { id, text, sender: userId }),
    [broadcast, userId]
  );
  const sendReaction = useCallback((emoji: string) => broadcast("reaction", { emoji }), [broadcast]);
  const sendVideoAction = useCallback((action: VideoAction) => broadcast("video", { action }), [broadcast]);
  const sendCursor = useCallback((x: number, y: number) => broadcast("cursor", { pos: { x, y } }), [broadcast]);
  const sendHoldHands = useCallback((holding: boolean) => broadcast("holdhands", { holding }), [broadcast]);
  const sendHoldHandsRequest = useCallback((fromUser: string) => broadcast("holdhands_request", { fromUser }), [broadcast]);
  const sendHoldHandsResponse = useCallback((accepted: boolean) => broadcast("holdhands_response", { accepted }), [broadcast]);
  const sendSecretMessage = useCallback((msg: SecretMessagePayload) => broadcast("secret_message", { msg }), [broadcast]);
  const sendMemoryAdd = useCallback((memory: MemoryPayload) => broadcast("memory_add", { memory }), [broadcast]);
  const sendMemoryRemove = useCallback((id: string) => broadcast("memory_remove", { id }), [broadcast]);
  const sendScheduleAdd = useCallback((schedule: SchedulePayload) => broadcast("schedule_add", { schedule }), [broadcast]);
  const sendScheduleRemove = useCallback((id: string) => broadcast("schedule_remove", { id }), [broadcast]);
  const sendPresenceStatus = useCallback((status: string) => broadcast("presence_status", { status }), [broadcast]);
  const sendTypingIndicator = useCallback((typing: boolean) => broadcast("typing", { typing }), [broadcast]);
  const sendSyncRequest = useCallback(() => broadcast("sync_request", {}), [broadcast]);
  const sendSyncResponse = useCallback((state: VideoSyncState) => broadcast("sync_response", { state }), [broadcast]);
  const sendCursorChange = useCallback((packId: string) => broadcast("cursor_change", { packId }), [broadcast]);
  const sendGameAction = useCallback((action: Record<string, unknown>) => broadcast("game_action", { action }), [broadcast]);

  return {
    partnerPresent,
    connectionStatus,
    sendChat,
    sendReaction,
    sendVideoAction,
    sendCursor,
    sendHoldHands,
    sendHoldHandsRequest,
    sendHoldHandsResponse,
    sendSecretMessage,
    sendMemoryAdd,
    sendMemoryRemove,
    sendScheduleAdd,
    sendScheduleRemove,
    sendPresenceStatus,
    sendTypingIndicator,
    sendSyncRequest,
    sendSyncResponse,
    sendCursorChange,
    sendGameAction,
  };
}
