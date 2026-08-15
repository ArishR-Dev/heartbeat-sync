import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoom, type ScheduledDate } from "@/contexts/RoomContext";
import { Clock, CalendarHeart } from "lucide-react";
import { serverNow } from "@/lib/serverTime";

const useNextCountdown = (dates: ScheduledDate[]) => {
  const [now, setNow] = useState(serverNow());

  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), 1000);
    return () => clearInterval(id);
  }, []);

  const upcoming = dates
    .map((d) => ({ ...d, target: new Date(`${d.date}T${d.time}`).getTime() }))
    .filter((d) => d.target > now)
    .sort((a, b) => a.target - b.target);

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const remaining = next.target - now;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 3600000;

  return { ...next, days, hours, minutes, seconds, remaining, isUrgent };
};

const ScheduleBanner = () => {
  const { scheduledDates } = useRoom();
  const next = useNextCountdown(scheduledDates);
  const [dismissed, setDismissed] = useState(false);

  // Only show if there are upcoming schedules
  if (!next || dismissed || scheduledDates.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`w-full overflow-hidden ${next.isUrgent ? "bg-destructive/10" : "bg-primary/5"}`}
      >
        <div className="max-w-[1400px] mx-auto px-4 py-1.5 flex items-center justify-center gap-2 text-xs">
          <CalendarHeart size={12} className={next.isUrgent ? "text-destructive" : "text-primary"} />
          <span className={`font-medium tabular-nums ${next.isUrgent ? "text-destructive" : "text-primary"}`}>
            {next.days > 0 && `${next.days}d `}
            {next.hours}h {next.minutes}m {next.seconds}s
          </span>
          <span className="text-muted-foreground">
            to watch <span className="font-semibold text-foreground">{next.title}</span> 🎬
          </span>
          <button onClick={() => setDismissed(true)} className="ml-2 text-muted-foreground hover:text-foreground text-[10px]">✕</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleBanner;
