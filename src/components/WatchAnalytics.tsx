import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Clock, Flame, Heart } from "lucide-react";

const STORAGE_KEY = "pookie_watch_stats";

interface WatchStats {
  totalMinutesToday: number;
  lastSessionDate: string;
  streakDays: number;
  lastActiveDate: string;
}

const getToday = () => new Date().toISOString().slice(0, 10);

const loadStats = (): WatchStats => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { totalMinutesToday: 0, lastSessionDate: getToday(), streakDays: 0, lastActiveDate: "" };
};

const saveStats = (stats: WatchStats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
};

const formatTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const WatchAnalytics = memo(({ partnerJoined }: { partnerJoined: boolean }) => {
  const [stats, setStats] = useState<WatchStats>(loadStats);

  // Track time together
  useEffect(() => {
    if (!partnerJoined) return;

    const today = getToday();
    setStats((prev) => {
      const updated = { ...prev };
      // Reset daily counter if new day
      if (prev.lastSessionDate !== today) {
        // Check streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (prev.lastSessionDate === yStr) {
          updated.streakDays = prev.streakDays + 1;
        } else if (prev.lastSessionDate !== today) {
          updated.streakDays = 1;
        }
        updated.totalMinutesToday = 0;
        updated.lastSessionDate = today;
      }
      return updated;
    });

    const interval = setInterval(() => {
      setStats((prev) => {
        const updated = { ...prev, totalMinutesToday: prev.totalMinutesToday + 1, lastActiveDate: getToday() };
        saveStats(updated);
        return updated;
      });
    }, 60000); // every minute

    return () => clearInterval(interval);
  }, [partnerJoined]);

  // Save on unmount
  useEffect(() => {
    return () => saveStats(stats);
  }, [stats]);

  if (!partnerJoined) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-3 py-1.5"
    >
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock size={10} className="text-primary/60" />
        <span>Together {formatTime(stats.totalMinutesToday)} today</span>
        <Heart size={8} className="text-primary/40 fill-primary/40" />
      </div>
      {stats.streakDays > 1 && (
        <div className="flex items-center gap-1 text-[10px] text-primary font-semibold">
          <Flame size={10} />
          <span>{stats.streakDays}-day streak</span>
        </div>
      )}
    </motion.div>
  );
});

WatchAnalytics.displayName = "WatchAnalytics";
export default WatchAnalytics;
