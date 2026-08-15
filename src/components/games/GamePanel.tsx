import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, X, Check } from "lucide-react";
import { useRoom } from "@/contexts/RoomContext";
import { toast } from "@/hooks/use-toast";
import TicTacToe from "./TicTacToe";
import ConnectFour from "./ConnectFour";
import DotsAndBoxes from "./DotsAndBoxes";

const GAMES = [
  { id: "tictactoe", label: "Tic Tac Toe", emoji: "✦", desc: "Classic strategy game" },
  { id: "connect4", label: "Connect Four", emoji: "🔴", desc: "Drop & connect to win" },
  { id: "dots", label: "Dots & Boxes", emoji: "⬜", desc: "Claim the most boxes" },
] as const;

interface GameInvite {
  game: string;
  from: string;
}

const GamePanel = () => {
  const { broadcastGameAction, onGameAction } = useRoom();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [invite, setInvite] = useState<GameInvite | null>(null);
  const [waitingAccept, setWaitingAccept] = useState<string | null>(null);

  const getUsername = () => {
    try {
      const saved = localStorage.getItem("pookie_user");
      if (saved) return JSON.parse(saved).username || "Pookie";
    } catch (error) {
      console.error("GamePanel username error:", error);
    }
    return "Pookie";
  };

  useEffect(() => {
    const prevHandler = onGameAction.current;
    onGameAction.current = (action: { type: string; game: string; from?: string }) => {
      if (action?.type === "game-invite") {
        setInvite({ game: action.game, from: action.from });
        return;
      }
      if (action?.type === "game-invite-accept") {
        setWaitingAccept(null);
        setActiveGame(action.game);
        toast({ title: "Game on! 🎮", description: `${gameLabel(action.game)} accepted — let's play!` });
        return;
      }
      if (action?.type === "game-invite-decline") {
        setWaitingAccept(null);
        toast({ title: "Maybe next time 💕", description: "Your partner declined the invite." });
        return;
      }
      prevHandler?.(action);
    };
    return () => { onGameAction.current = prevHandler; };
  }, [onGameAction]);

  const sendInvite = (gameId: string) => {
    setWaitingAccept(gameId);
    broadcastGameAction({ type: "game-invite", game: gameId, from: getUsername() });
    toast({ title: "Invite sent 🎮", description: `Waiting for pookie to accept ${gameLabel(gameId)}...` });
  };

  const acceptInvite = () => {
    if (!invite) return;
    setActiveGame(invite.game);
    broadcastGameAction({ type: "game-invite-accept", game: invite.game });
    setInvite(null);
  };

  const declineInvite = () => {
    if (!invite) return;
    broadcastGameAction({ type: "game-invite-decline", game: invite.game });
    setInvite(null);
  };

  const gameLabel = (id: string) => GAMES.find(g => g.id === id)?.label || id;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Gamepad2 size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground tracking-tight">Games</span>
      </div>

      {/* Invite popup */}
      <AnimatePresence>
        {invite && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="glass-strong rounded-2xl p-4 border border-primary/20 pookie-glow"
          >
            <p className="text-sm font-semibold text-foreground text-center mb-1">🎮 {invite.from} wants to play!</p>
            <p className="text-xs text-muted-foreground text-center mb-3">{gameLabel(invite.game)}</p>
            <div className="flex gap-2 justify-center">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={acceptInvite} className="flex items-center gap-1.5 px-4 py-2 rounded-xl pookie-gradient text-primary-foreground text-xs font-semibold">
                <Check size={14} /> Accept
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={declineInvite} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200">
                <X size={14} /> Decline
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting */}
      <AnimatePresence>
        {waitingAccept && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass rounded-xl p-3 text-center overflow-hidden">
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="text-xs text-primary font-medium">
              Waiting for pookie to accept {gameLabel(waitingAccept)}... 💕
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game selector */}
      {!activeGame && !invite && (
        <div className="flex flex-col gap-2">
          {GAMES.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ 
                scale: 1.05, 
                rotate: i % 2 === 0 ? 1 : -1,
                boxShadow: "0 8px 30px hsl(var(--primary) / 0.15)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendInvite(g.id)}
              disabled={!!waitingAccept}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl glass border border-border/20 hover:border-primary/40 transition-all duration-300 text-left disabled:opacity-50"
            >
              <motion.span 
                className="text-2xl"
                whileHover={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {g.emoji}
              </motion.span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{g.label}</p>
                <p className="text-[10px] text-muted-foreground group-hover:text-foreground/70 transition-colors">{g.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Active game */}
      {activeGame && (
        <div className="flex-1 overflow-y-auto custom-scroll">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground font-medium">Playing: {gameLabel(activeGame)}</span>
            <button onClick={() => setActiveGame(null)} className="text-[10px] text-muted-foreground hover:text-foreground btn-press">← Back</button>
          </div>
          {activeGame === "tictactoe" && <TicTacToe />}
          {activeGame === "connect4" && <ConnectFour />}
          {activeGame === "dots" && <DotsAndBoxes />}
        </div>
      )}

      {/* Empty state */}
      {!activeGame && !invite && !waitingAccept && (
        <div className="flex-1 flex items-end justify-center pb-2">
          <p className="text-[10px] text-muted-foreground/60">Tap a game to invite your partner 💕</p>
        </div>
      )}
    </div>
  );
};

export default GamePanel;
