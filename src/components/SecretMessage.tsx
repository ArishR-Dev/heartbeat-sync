import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, MailOpen, Clock, Send } from "lucide-react";
import { useRoom } from "@/contexts/RoomContext";
import { toast } from "@/hooks/use-toast";

const SecretMessage = () => {
  const { secretMessages, sendSecretMessage, revealSecret } = useRoom();
  const [input, setInput] = useState("");
  const [revealType, setRevealType] = useState<"timer" | "click">("click");
  const [timerSec, setTimerSec] = useState(10);
  const [showCompose, setShowCompose] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    sendSecretMessage(input.trim(), revealType, revealType === "timer" ? timerSec : undefined);
    toast({ title: "Secret sent 💌", description: "Your secret message has been delivered!" });
    setInput("");
    setShowCompose(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground tracking-tight">Secret Messages</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCompose(!showCompose)}
          className="px-3 py-1.5 rounded-xl pookie-gradient text-primary-foreground text-xs font-semibold"
        >
          <Mail size={11} className="inline mr-1" />
          New Secret
        </motion.button>
      </div>

      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 space-y-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a secret for your pookie..."
                rows={2}
                className="w-full bg-muted/40 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground placeholder:text-muted-foreground transition-shadow duration-200"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRevealType("click")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${revealType === "click" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}
                >
                  <MailOpen size={11} /> Tap to Reveal
                </button>
                <button
                  onClick={() => setRevealType("timer")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${revealType === "timer" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}
                >
                  <Clock size={11} /> Timer
                </button>
                {revealType === "timer" && (
                  <select value={timerSec} onChange={(e) => setTimerSec(Number(e.target.value))} className="bg-muted/50 rounded-lg px-2 py-1.5 text-xs outline-none text-foreground">
                    <option value={5}>5s</option>
                    <option value={10}>10s</option>
                    <option value={30}>30s</option>
                    <option value={60}>1min</option>
                  </select>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!input.trim()} className="ml-auto p-2 rounded-full pookie-gradient text-primary-foreground disabled:opacity-30">
                  <Send size={13} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 max-h-48 overflow-y-auto custom-scroll">
        {secretMessages.length === 0 && (
          <div className="text-center py-6">
            <motion.span className="text-3xl block mb-2 opacity-30" animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>💌</motion.span>
            <p className="text-xs text-muted-foreground">No secrets between you two yet 💕</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Send something sweet only they can see!</p>
          </div>
        )}
        <AnimatePresence>
          {secretMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              {!msg.revealed ? (
                <motion.button
                  onClick={() => msg.revealType === "click" && revealSecret(msg.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative glass rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer group max-w-[80%] card-interactive"
                >
                  <motion.div animate={{ rotateY: [0, 10, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
                    <Mail size={22} className="text-primary" />
                  </motion.div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">Secret Message 💌</p>
                    <p className="text-[10px] text-muted-foreground">
                      {msg.revealType === "click" ? "Tap to reveal" : `Reveals in ${msg.timerSeconds}s`}
                    </p>
                  </div>
                  <motion.div className="absolute -top-1 -right-1" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Lock size={11} className="text-primary" />
                  </motion.div>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ rotateX: 90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-primary/8 border border-primary/15 text-sm text-foreground"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MailOpen size={11} className="text-primary" />
                    <span className="text-[10px] text-primary font-semibold">Revealed!</span>
                  </div>
                  {msg.text}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SecretMessage;
