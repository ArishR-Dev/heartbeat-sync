import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RealtimeEvents {
  onPartnerJoin: () => void;
  onPartnerLeave: () => void;
  onChatMessage: (msg: any) => void;
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
  onGameAction: (action: { type: string; [key: string]: unknown }) => void;
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

/**
 * Realtime hook for room interactions.
 */
export function useRealtimeRoom(coupleId: string | null, userId: string, events: RealtimeEvents) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    coupleId ? "connected" : "disconnected"
  );

  const broadcast = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (!coupleId) return;
      const channel = supabase.channel(`room_events:${coupleId}`);
      channel.send({
        type: 'broadcast',
        event,
        payload
      });
    },
    [coupleId]
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
