import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarHeart, Clock, Plus, Trash2, Bell, Download, ExternalLink } from "lucide-react";
import { useRoom, type ScheduledDate as ScheduledDateType } from "@/contexts/RoomContext";
import { registerPushSW, requestNotificationPermission, showLocalNotification, syncSchedulesToSW } from "@/lib/pushNotifications";
import { serverNow, startAutoSync } from "@/lib/serverTime";
import { toast } from "@/hooks/use-toast";

// ──── Calendar helpers ────

const generateICS = (title: string, date: string, time: string): string => {
  const dt = new Date(`${date}T${time}`);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const end = new Date(dt.getTime() + 2 * 60 * 60 * 1000);
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PookieWatch//EN",
    "BEGIN:VEVENT", `DTSTART:${fmt(dt)}`, `DTEND:${fmt(end)}`,
    `SUMMARY:Watch ${title} 🎬`,
    `DESCRIPTION:PookieWatch date - time to watch ${title} together! ❤️`,
    "BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY",
    `DESCRIPTION:${title} starts in 10 minutes!`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
};

const downloadICS = (title: string, date: string, time: string) => {
  const blob = new Blob([generateICS(title, date, time)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pookiewatch-${title.replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
};

const googleCalUrl = (title: string, date: string, time: string) => {
  const dt = new Date(`${date}T${time}`);
  const end = new Date(dt.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Watch ${title} 🎬`)}&dates=${fmt(dt)}/${fmt(end)}&details=${encodeURIComponent(`PookieWatch date ❤️`)}`;
};

const outlookCalUrl = (title: string, date: string, time: string) => {
  const dt = new Date(`${date}T${time}`);
  const end = new Date(dt.getTime() + 2 * 60 * 60 * 1000);
  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(`Watch ${title} 🎬`)}&startdt=${dt.toISOString()}&enddt=${end.toISOString()}&body=${encodeURIComponent(`PookieWatch date ❤️`)}`;
};

// ──── Countdown hook ────

const useCountdown = (date: string, time: string) => {
  const targetRef = useRef(new Date(`${date}T${time}`).getTime());
  const [remaining, setRemaining] = useState(() => Math.max(0, targetRef.current - serverNow()));

  useEffect(() => {
    targetRef.current = new Date(`${date}T${time}`).getTime();
    const update = () => setRemaining(Math.max(0, targetRef.current - serverNow()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [date, time]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isExpired = remaining === 0;
  const isUrgent = remaining > 0 && remaining < 3600000;

  return { days, hours, minutes, seconds, remaining, isExpired, isUrgent };
};

// ──── Countdown display ────

const CountdownDisplay = memo(({ date, time, title, id, onExpired }: { date: string; time: string; title: string; id: string; onExpired: (id: string) => void }) => {
  const { days, hours, minutes, seconds, isExpired, isUrgent } = useCountdown(date, time);
  const firedRef = useRef(false);

  useEffect(() => {
    if (isExpired && !firedRef.current) {
      firedRef.current = true;
      onExpired(id);
    }
  }, [isExpired, onExpired, id]);

  if (isExpired) {
    return <span className="text-[10px] font-bold text-primary animate-pulse">🎬 It's time to watch!</span>;
  }

  return (
    <div className={`flex items-center gap-1 text-[10px] tabular-nums font-medium ${isUrgent ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
      <Clock size={10} />
      {days > 0 && <span>{days}d</span>}
      <span>{hours}h</span>
      <span>{minutes}m</span>
      <span>{seconds}s</span>
      <span className="ml-0.5">to watch 🎬</span>
    </div>
  );
});
CountdownDisplay.displayName = "CountdownDisplay";

// ──── Main component ────

const ScheduleDate = () => {
  const { scheduledDates, addSchedule, removeSchedule, broadcastGameAction, onGameAction } = useRoom();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [showCalMenu, setShowCalMenu] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    startAutoSync();
    registerPushSW();
    setPushEnabled(Notification.permission === "granted");
  }, []);

  useEffect(() => { syncSchedulesToSW(scheduledDates); }, [scheduledDates]);

  useEffect(() => {
    const prevHandler = onGameAction.current;
    onGameAction.current = (action: any) => {
      if (action?.type === "watch-started" && action?.scheduleId) {
        const sched = scheduledDates.find((d) => d.id === action.scheduleId);
        if (sched && !triggeredRef.current.has(sched.id)) {
          triggeredRef.current.add(sched.id);
          triggerCelebration(sched.title);
        }
      } else {
        prevHandler?.(action);
      }
    };
    return () => { onGameAction.current = prevHandler; };
  }, [onGameAction, scheduledDates]);

  const triggerCelebration = useCallback((name: string) => {
    setCelebration(name);
    showLocalNotification("It's Watch Time! 🎬", `Time to watch ${name} with your partner ❤️`);
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1);
    } catch {}
    try { navigator.vibrate?.([200, 100, 200]); } catch {}
  }, []);

  const enableNotifications = async () => {
    const ok = await requestNotificationPermission();
    setPushEnabled(ok);
    if (ok) {
      syncSchedulesToSW(scheduledDates);
      toast({ title: "Reminders enabled 🔔", description: "You'll be notified before your watch dates." });
    }
  };

  const handleAdd = () => {
    if (!title.trim() || !date || !time) return;
    addSchedule(title.trim(), date, time);
    toast({ title: "Watch date scheduled 💕", description: `${title.trim()} added to your calendar.` });
    setTitle(""); setDate(""); setTime(""); setShowForm(false);
  };

  const handleExpired = useCallback((scheduleId: string) => {
    if (triggeredRef.current.has(scheduleId)) return;
    triggeredRef.current.add(scheduleId);
    const sched = scheduledDates.find((d) => d.id === scheduleId);
    if (!sched) return;
    broadcastGameAction({ type: "watch-started", scheduleId });
    triggerCelebration(sched.title);
  }, [scheduledDates, broadcastGameAction, triggerCelebration]);

  const formatDate = (d: string, t: string) => {
    try {
      return new Date(`${d}T${t}`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch { return `${d} at ${t}`; }
  };

  const isExpired = (d: string, t: string) => new Date(`${d}T${t}`).getTime() <= serverNow();

  const sortedDates = [...scheduledDates].sort((a, b) => {
    const tA = new Date(`${a.date}T${a.time}`).getTime();
    const tB = new Date(`${b.date}T${b.time}`).getTime();
    const now = serverNow();
    const aExp = tA <= now;
    const bExp = tB <= now;
    if (aExp !== bExp) return aExp ? 1 : -1;
    return tA - tB;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-lg"
          >
            <motion.div
              initial={{ y: 30, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-strong rounded-3xl p-8 max-w-sm mx-4 text-center pookie-glow"
            >
              <div className="relative mb-4">
                {["🎉", "❤️", "✨", "🎬", "💕", "🎊"].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-2xl"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0], scale: [0, 1.5, 0],
                      x: [0, (i % 2 === 0 ? 1 : -1) * (30 + i * 15)],
                      y: [0, -(20 + i * 10)],
                    }}
                    transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
                    style={{ left: "50%", top: "50%" }}
                  >{emoji}</motion.span>
                ))}
                <motion.span className="text-6xl block" animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🎬</motion.span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Your watch date has started! 💕</h2>
              <p className="text-sm text-muted-foreground mb-1">
                It's time to watch <span className="font-semibold text-primary">{celebration}</span>!
              </p>
              <p className="text-xs text-muted-foreground mb-6">Grab your snacks and get cozy ❤️</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCelebration(null)}
                className="px-6 py-3 rounded-xl pookie-gradient text-primary-foreground font-semibold text-sm pookie-glow"
              >
                Start Watching ▶️
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarHeart size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground tracking-tight">Watch Dates</span>
        </div>
        <div className="flex items-center gap-1.5">
          {!pushEnabled && Notification.permission !== "denied" && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={enableNotifications}
              className="px-2 py-1.5 rounded-lg bg-muted/40 text-muted-foreground hover:text-primary text-[10px] font-medium transition-colors duration-200 flex items-center gap-1"
            >
              <Bell size={11} />
              <span className="hidden sm:inline">Never miss a date ❤️</span>
            </motion.button>
          )}
          {Notification.permission === "denied" && (
            <span className="text-[10px] text-muted-foreground">🔕 Blocked</span>
          )}
          {pushEnabled && (
            <span className="text-[10px] text-primary">🔔</span>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 rounded-xl pookie-gradient text-primary-foreground text-xs font-semibold"
          >
            <Plus size={12} className="inline mr-1" />Schedule
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="glass rounded-2xl p-4 space-y-3">
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are we watching? 🎬" className="w-full bg-muted/40 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground transition-shadow duration-200" />
              <div className="flex gap-2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-muted/40 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground transition-shadow duration-200" />
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1 bg-muted/40 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground transition-shadow duration-200" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAdd} disabled={!title.trim() || !date || !time} className="w-full py-2.5 rounded-xl pookie-gradient text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity">
                Schedule Date 💕
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 max-h-64 overflow-y-auto custom-scroll">
        {sortedDates.length === 0 && !showForm && (
          <div className="text-center py-6">
            <motion.span className="text-3xl block mb-2 opacity-40" animate={{ y: [0, -5, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>📅</motion.span>
            <p className="text-xs text-muted-foreground">No watch dates yet 💕</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">Schedule one to count down together!</p>
          </div>
        )}
        <AnimatePresence>
          {sortedDates.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ delay: i * 0.04, ease: [0.4, 0, 0.2, 1] }}
              className={`glass rounded-xl px-3 py-2.5 group card-interactive ${isExpired(d.date, d.time) ? "border border-primary/30 pookie-glow" : "border border-border/20"}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">📅</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">{d.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(d.date, d.time)}</p>
                  <CountdownDisplay date={d.date} time={d.time} title={d.title} id={d.id} onExpired={handleExpired} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <button onClick={() => setShowCalMenu(showCalMenu === d.id ? null : d.id)} className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors duration-150" title="Add to Calendar">
                      <Download size={12} />
                    </button>
                    <AnimatePresence>
                      {showCalMenu === d.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }} className="absolute right-0 top-6 z-50 glass-strong rounded-lg p-1.5 shadow-lg min-w-[120px]">
                          <button onClick={() => { window.open(googleCalUrl(d.title, d.date, d.time), "_blank"); setShowCalMenu(null); }} className="w-full text-left px-2 py-1.5 text-[10px] font-medium rounded hover:bg-muted/50 text-foreground flex items-center gap-1.5 transition-colors duration-150">
                            <ExternalLink size={10} /> Google Calendar
                          </button>
                          <button onClick={() => { window.open(outlookCalUrl(d.title, d.date, d.time), "_blank"); setShowCalMenu(null); }} className="w-full text-left px-2 py-1.5 text-[10px] font-medium rounded hover:bg-muted/50 text-foreground flex items-center gap-1.5 transition-colors duration-150">
                            <ExternalLink size={10} /> Outlook
                          </button>
                          <button onClick={() => { downloadICS(d.title, d.date, d.time); setShowCalMenu(null); }} className="w-full text-left px-2 py-1.5 text-[10px] font-medium rounded hover:bg-muted/50 text-foreground flex items-center gap-1.5 transition-colors duration-150">
                            <Download size={10} /> Apple / .ics
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button onClick={() => removeSchedule(d.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-200 p-1">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ScheduleDate;
