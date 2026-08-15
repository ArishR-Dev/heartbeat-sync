import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import { Send, Smile } from "lucide-react";

const EMOJIS = ["❤️", "😘", "🫂", "💕", "🥺", "😍", "🫶", "💖"];

const ChatBubble = memo(({ msg }: { msg: { id: string; sender: "me" | "partner"; text: string } }) => {
  const isEmojiOnly = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/.test(msg.text.trim());
  
  return (
    <motion.div
      initial={{ opacity: 0, x: msg.sender === "me" ? 20 : -20, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
    >
      <div className={`${isEmojiOnly ? "text-4xl px-1 py-1 bg-transparent shadow-none" : "max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm"} leading-relaxed ${
        !isEmojiOnly && (msg.sender === "me"
          ? "pookie-gradient text-primary-foreground rounded-br-md"
          : "bg-muted/70 text-foreground rounded-bl-md")
      }`}>
        {msg.text}
      </div>
    </motion.div>
  );
});
ChatBubble.displayName = "ChatBubble";

const ChatPanel = () => {
  const { messages, sendMessage, sendReaction, partnerJoined, partnerTyping, sendTyping } = useRoom();
  const [input, setInput] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(false), 1500);
  }, [sendTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    sendTyping(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  if (!partnerJoined) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border/20 flex items-center gap-2">
        <span className="text-base">💬</span>
        <span className="font-semibold text-sm text-foreground tracking-tight">Room Chat</span>
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0 custom-scroll scroll-fade-y">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <motion.span className="text-4xl opacity-25" animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>💬</motion.span>
            <p className="text-xs">Say hi to your pookie!</p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        {partnerTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-muted/50 rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-1 flex gap-1 border-t border-border/20">
        {EMOJIS.slice(0, 4).map((e) => (
          <motion.button key={e} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => sendReaction(e)} className="text-base p-1 transition-transform">{e}</motion.button>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-border/20 flex gap-2 items-center">
        <button onClick={() => setShowEmojis(!showEmojis)} className="text-muted-foreground hover:text-foreground transition-colors duration-150">
          <Smile size={18} />
        </button>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-muted/40 rounded-full px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground transition-shadow duration-200"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!input.trim()}
          className="p-1.5 rounded-full pookie-gradient text-primary-foreground disabled:opacity-30 transition-opacity duration-200"
        >
          <Send size={13} />
        </motion.button>
      </div>

      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-border/20"
          >
            <div className="grid grid-cols-8 gap-1 p-2">
              {EMOJIS.map((e) => (
                <motion.button key={e} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => { sendMessage(e); setShowEmojis(false); }} className="text-xl p-1">{e}</motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPanel;
