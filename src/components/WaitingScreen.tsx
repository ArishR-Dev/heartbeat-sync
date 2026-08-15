import { motion } from "framer-motion";
import { Copy, UserPlus } from "lucide-react";
import { useRoom } from "@/contexts/RoomContext";
import { useState } from "react";

const WaitingScreen = () => {
  const { roomCode } = useRoom();
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (roomCode) {
      navigator.clipboard.writeText(`${window.location.origin}/room?code=${roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex items-center justify-center"
    >
      <div className="glass-strong rounded-pookie border-2 border-dashed border-primary/30 p-12 text-center max-w-lg w-full space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 pookie-gradient animate-shimmer" />
        {/* Avatar icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border-4 border-primary/20 pookie-glow">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <UserPlus size={40} className="text-primary" />
          </motion.div>
        </div>

        {/* Room code */}
        {roomCode && (
          <div className="flex items-center justify-center gap-2">
            {roomCode.split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="w-9 h-10 flex items-center justify-center rounded-lg bg-muted text-foreground font-mono font-bold text-lg"
              >
                {ch}
              </motion.span>
            ))}
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold text-foreground">Waiting for your pookie…</h2>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Share the room code or link so they can join. The video and chat will sync automatically once they arrive.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyLink}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl pookie-gradient text-primary-foreground font-semibold text-sm pookie-glow"
        >
          <Copy size={16} />
          {copied ? "Copied! ✓" : "Copy Invite Link"}
        </motion.button>

        {/* Loading dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary/50"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WaitingScreen;
