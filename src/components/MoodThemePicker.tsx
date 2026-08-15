import { useRoom, MoodTheme } from "@/contexts/RoomContext";
import { motion } from "framer-motion";

const themes: { id: MoodTheme; label: string; icon: string }[] = [
  { id: "default", label: "Cute Pink", icon: "🌸" },
  { id: "night", label: "Night Cuddle", icon: "🌙" },
  { id: "horror", label: "Horror", icon: "🎃" },
];

const MoodThemePicker = () => {
  const { moodTheme, setMoodTheme } = useRoom();

  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <motion.button
          key={t.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMoodTheme(t.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            moodTheme === t.id
              ? "pookie-gradient text-primary-foreground pookie-glow"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default MoodThemePicker;
