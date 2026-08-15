import { supabase } from "@/integrations/supabase/client";

export type HoldHandsState = 'idle' | 'requesting' | 'approaching' | 'holding' | 'releasing';

export interface HoldHandsSession {
  id: string;
  couple_id: string;
  room_id: string;
  requester_id: string;
  receiver_id: string | null;
  state: HoldHandsState;
  version: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export const holdHandsService = {
  async getSession(coupleId: string) {
    const { data, error } = await supabase
      .from('hold_hands_sessions')
      .select('*')
      .eq('couple_id', coupleId)
      .maybeSingle();

    if (error) throw error;
    return data as HoldHandsSession | null;
  },

  async request(coupleId: string, roomId: string, userId: string) {
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
    
    // Use upsert to handle case where session already exists
    const { data, error } = await supabase
      .from('hold_hands_sessions')
      .upsert({
        couple_id: coupleId,
        room_id: roomId,
        requester_id: userId,
        receiver_id: null,
        state: 'requesting',
        version: 1,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'couple_id' })
      .select()
      .single();

    if (error) throw error;
    return data as HoldHandsSession;
  },

  async updateState(sessionId: string, newState: HoldHandsState, version: number) {
    const { data, error } = await supabase
      .from('hold_hands_sessions')
      .update({
        state: newState,
        version: version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('version', version) // Optimistic concurrency
      .select()
      .single();

    if (error) throw error;
    return data as HoldHandsSession;
  },

  async reset(sessionId: string) {
    const { data, error } = await supabase
      .from('hold_hands_sessions')
      .update({
        state: 'idle',
        version: 1, // Reset version or increment? Let's reset to be clean for next request
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data as HoldHandsSession;
  },

  subscribe(coupleId: string, onUpdate: (session: HoldHandsSession) => void) {
    return supabase
      .channel(`hold_hands:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hold_hands_sessions',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as HoldHandsSession);
          }
        }
      )
      .subscribe();
  }
};
