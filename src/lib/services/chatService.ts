import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type: string;
}

export const chatService = {
  async fetchMessages(coupleId: string, limit = 50) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
  },

  async sendMessage(coupleId: string, senderId: string, content: string, type = "text") {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          couple_id: coupleId,
          sender_id: senderId,
          content,
          type,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  subscribeToMessages(coupleId: string, onMessage: (message: any) => void) {
    return supabase
      .channel(`chat:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          onMessage(payload.new);
        }
      )
      .subscribe();
  },
};
