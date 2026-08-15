import { supabase } from "@/integrations/supabase/client";

export type GameType = "tictactoe" | "connect4" | "dots";
export type GameStatus = "active" | "finished" | "rematch_requested";

export interface GameSession {
  id: string;
  couple_id: string;
  game_type: GameType;
  status: GameStatus;
  player1_id: string | null;
  player2_id: string | null;
  current_turn_id: string | null;
  state: any;
  winner_id: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export const gameService = {
  async getActiveGame(coupleId: string): Promise<GameSession | null> {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("couple_id", coupleId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching active game:", error);
      return null;
    }
    return data as GameSession;
  },

  async startGame(coupleId: string, gameType: GameType, p1Id: string, p2Id: string, initialState: any): Promise<GameSession | null> {
    // First, finish any existing active games for this couple
    await supabase
      .from("game_sessions")
      .update({ status: "finished" })
      .eq("couple_id", coupleId)
      .eq("status", "active");

    const { data, error } = await supabase
      .from("game_sessions")
      .insert({
        couple_id: coupleId,
        game_type: gameType,
        player1_id: p1Id,
        player2_id: p2Id,
        current_turn_id: p1Id, // P1 starts by default
        state: initialState,
        status: "active",
        version: 1
      })
      .select()
      .single();

    if (error) {
      console.error("Error starting game:", error);
      return null;
    }
    return data as GameSession;
  },

  async makeMove(gameId: string, userId: string, nextState: any, nextTurnId: string | null, winnerId: string | null, version: number): Promise<boolean> {
    const { error } = await supabase
      .from("game_sessions")
      .update({
        state: nextState,
        current_turn_id: nextTurnId,
        winner_id: winnerId,
        status: winnerId ? "finished" : "active",
        version: version + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", gameId)
      .eq("version", version) // Optimistic concurrency control
      .eq("current_turn_id", userId); // Basic turn validation

    if (error) {
      console.error("Error making move:", error);
      return false;
    }
    return true;
  },

  async resetGame(gameId: string, nextTurnId: string, initialState: any): Promise<boolean> {
    const { error } = await supabase
      .from("game_sessions")
      .update({
        state: initialState,
        current_turn_id: nextTurnId,
        winner_id: null,
        status: "active",
        version: 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", gameId);

    if (error) {
      console.error("Error resetting game:", error);
      return false;
    }
    return true;
  },

  subscribeToGame(gameId: string, onUpdate: (game: GameSession) => void) {
    return supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          onUpdate(payload.new as GameSession);
        }
      )
      .subscribe();
  }
};
