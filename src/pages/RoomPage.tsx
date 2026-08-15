import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import VideoPlayer from "@/components/VideoPlayer";
import ChatPanel from "@/components/ChatPanel";
import FloatingHearts from "@/components/FloatingHearts";
import HoldHandsOverlay from "@/components/HoldHandsOverlay";
import SharedCursors from "@/components/SharedCursors";
import MoodThemePicker from "@/components/MoodThemePicker";
import SecretMessage from "@/components/SecretMessage";
import MemoryTimeline from "@/components/MemoryTimeline";
import ScheduleDate from "@/components/ScheduleDate";
import RoomLobby from "@/components/RoomLobby";
import WaitingScreen from "@/components/WaitingScreen";
import CursorLibrary from "@/components/CursorLibrary";
import GamePanel from "@/components/games/GamePanel";
import ScheduleBanner from "@/components/ScheduleBanner";
import CozyMode from "@/components/CozyMode";
import WatchAnalytics from "@/components/WatchAnalytics";
import { Copy, LogOut, Hand, Heart, MessageSquare, Gamepad2, Lock, Film, CalendarHeart, MousePointer2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "secrets", label: "Secrets", icon: Lock },
  { id: "memories", label: "Memories", icon: Film },
  { id: "schedule", label: "Schedule", icon: CalendarHeart },
  { id: "cursors", label: "Cursors", icon: MousePointer2 },
] as const;

type TabId = typeof TABS[number]["id"];

const ACTIVITY_LABELS: Record<string, string> = {
  chat: "Pookie is chatting 💬",
  games: "Pookie is gaming 🎮",
  secrets: "Pookie is writing secrets 🤫",
  memories: "Pookie is reminiscing 📼",
  schedule: "Pookie is planning dates 📅",
  cursors: "Pookie is picking cursors 🖱️",
  watching: "Pookie is watching 🎬",
};

const tabTransition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };

const RoomPage = () => {
  const {
    roomCode, partnerJoined, leaveRoom, joinRoom,
    requestHoldHands, myHoldHands, holdingHands, moodTheme,
    partnerStatus, partnerActivity, partnerTyping,
    connectionStatus, addMemory, secretMessages, broadcastActivity,
  } = useRoom();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("chat");
  const [searchParams] = useSearchParams();

  const unreadSecrets = useMemo(() =>
    secretMessages.filter(m => m.sender === "partner" && !m.revealed).length,
  [secretMessages]);

  // Broadcast active tab as activity
  useEffect(() => {
    broadcastActivity(activeTab);
  }, [activeTab, broadcastActivity]);

  // Auto-join room from invite link: /room?code=ABC123
  useEffect(() => {
    if (roomCode) return;
    const inviteCode = searchParams.get("code");
    if (!inviteCode) return;
    joinRoom(inviteCode);
  }, [roomCode, searchParams, joinRoom]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-night", "theme-horror");
    if (moodTheme === "night") root.classList.add("theme-night");
    if (moodTheme === "horror") root.classList.add("theme-horror");
    return () => root.classList.remove("theme-night", "theme-horror");
  }, [moodTheme]);

  const copyCode = useCallback(() => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomCode]);

  const handleVideoLoaded = useCallback((title: string) => {
    const emojis = ["🎬", "🍿", "❤️", "📺"];
    addMemory(`Watched ${title}`, emojis[Math.floor(Math.random() * emojis.length)]);
  }, [addMemory]);

  // Derive presence label
  const presenceLabel = useMemo(() => {
    if (!partnerJoined) return "Waiting for pookie...";
    if (partnerTyping) return "Pookie is typing... 💬";
    if (partnerStatus === "paused") return "Pookie paused ⏸️";
    if (partnerStatus === "away") return "Pookie is away 💤";
    return ACTIVITY_LABELS[partnerActivity] || "Pookie is watching 🎬";
  }, [partnerJoined, partnerTyping, partnerStatus, partnerActivity]);

  if (!roomCode) return <RoomLobby />;

  return (
    <div className="min-h-screen relative flex flex-col bg-background">
      <FloatingHearts />
      <HoldHandsOverlay />
      <SharedCursors />
      <ScheduleBanner />

      {/* Top bar */}
      <header className="sticky top-0 z-30 glass-strong border-b border-border/20">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="text-primary fill-primary heartbeat gpu-accelerate" size={18} />
            <span className="font-brand text-base sm:text-lg pookie-text-gradient">PookieWatch</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/40 text-xs font-mono hover:bg-muted/60 btn-press text-foreground"
            >
              <span className="tracking-widest text-[11px]">{roomCode}</span>
              <Copy size={11} />
              {copied && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-primary ml-0.5 text-[10px]">✓</motion.span>}
            </button>

            {/* Presence activity indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${partnerJoined ? "bg-green-400 animate-pulse" : "bg-muted-foreground/40"}`} />
              <AnimatePresence mode="wait">
                <motion.span
                  key={presenceLabel}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] text-muted-foreground hidden sm:inline"
                >
                  {presenceLabel}
                </motion.span>
              </AnimatePresence>
            </div>

            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              connectionStatus === "connected" ? "bg-green-400" :
              connectionStatus === "reconnecting" ? "bg-yellow-400 animate-pulse" :
              "bg-red-400"
            }`} />

            <CozyMode />
            <MoodThemePicker />
            <button onClick={leaveRoom} className="text-muted-foreground hover:text-destructive btn-press p-1"><LogOut size={15} /></button>
          </div>
        </div>
        {/* Watch analytics bar */}
        <WatchAnalytics partnerJoined={partnerJoined} />
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-3 sm:px-4 py-3 sm:py-4">
        <AnimatePresence mode="wait">
          {!partnerJoined ? (
            <WaitingScreen key="waiting" />
          ) : (
            <motion.div
              key="room"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-auto lg:h-[calc(100vh-96px)]"
            >
              {/* Left - Video + Actions */}
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <VideoPlayer onVideoLoaded={handleVideoLoaded} />
                <div className="flex items-center gap-3 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    onClick={requestHoldHands}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${
                      myHoldHands ? "pookie-gradient text-primary-foreground pookie-glow" : "glass text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Hand size={15} />
                    {holdingHands ? "Holding Hands 🫶" : myHoldHands ? "Waiting for pookie..." : "Hold Hands 🫶"}
                  </motion.button>
                  <AnimatePresence>
                    {holdingHands && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5, x: -8 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="text-xs text-primary font-medium"
                      >
                        ✨ You're holding hands! ✨
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right - Premium Panel */}
              <div
                className="w-full lg:w-[340px] shrink-0 flex flex-col rounded-pookie overflow-hidden"
                style={{
                  background: "hsl(var(--card) / 0.88)",
                  backdropFilter: "blur(28px) saturate(1.5)",
                  border: "1px solid hsl(var(--border) / 0.35)",
                  boxShadow: "0 8px 40px hsl(var(--primary) / 0.06), 0 1px 3px hsl(var(--foreground) / 0.03), inset 0 1px 0 hsl(var(--card) / 0.5)",
                }}
              >
                {/* Tab navigation */}
                <div className="flex border-b border-border/20 px-1.5 pt-1.5 gap-0.5 relative">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const showBadge = tab.id === "secrets" && unreadSecrets > 0;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 px-0.5 rounded-t-xl text-[10px] font-semibold transition-colors duration-200 ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="tab-indicator"
                            className="absolute inset-0 rounded-t-xl bg-primary/8"
                            style={{ borderBottom: "2px solid hsl(var(--primary))" }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        <Icon size={14} className="relative z-10" />
                        <span className="relative z-10 leading-none">{tab.label}</span>
                        {showBadge && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="absolute -top-0.5 right-1 min-w-[15px] h-[15px] rounded-full pookie-gradient text-primary-foreground text-[8px] font-bold flex items-center justify-center px-0.5"
                          >
                            {unreadSecrets}
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Content with smooth transitions */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                      transition={tabTransition}
                      className="h-full"
                    >
                      {activeTab === "chat" && <ChatPanel />}
                      {activeTab === "games" && <div className="p-3 overflow-y-auto h-full custom-scroll scroll-fade-y"><GamePanel /></div>}
                      {activeTab === "secrets" && <div className="p-3 overflow-y-auto h-full custom-scroll scroll-fade-y"><SecretMessage /></div>}
                      {activeTab === "memories" && <div className="p-3 overflow-y-auto h-full custom-scroll scroll-fade-y"><MemoryTimeline /></div>}
                      {activeTab === "schedule" && <div className="p-3 overflow-y-auto h-full custom-scroll scroll-fade-y"><ScheduleDate /></div>}
                      {activeTab === "cursors" && <div className="p-3 overflow-y-auto h-full custom-scroll scroll-fade-y"><CursorLibrary /></div>}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default RoomPage;
