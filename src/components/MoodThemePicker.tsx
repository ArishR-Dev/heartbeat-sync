import { useRoom, MoodTheme } from "@/contexts/RoomContext";
import { motion } from "framer-motion";

const themes: { id: MoodTheme; label: string; icon: string }[] = [
  { id: "default", label: "Cute Pink", icon: "🌸" },
  { id: "night", label: "Night Cuddle", icon: "🌙" },
  { id: "horror", label: "Horror", icon: "🎃" },
];

const MoodThemePicker = () => {
  const { moodTheme, setMoodTheme } = useRoom();

  const handleThemeChange = (id: MoodTheme) => {
    setMoodTheme(id);
    // Create a burst of small emojis related to the theme
    const count = 12;
    const icons = {
      default: ["🌸", "🩷", "✨"],
      night: ["🌙", "💤", "⭐"],
      horror: ["🎃", "👻", "🦇"],
    }[id];

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.textContent = icons[Math.floor(Math.random() * icons.length)];
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.top = "50%";
      el.style.fontSize = "24px";
      el.style.pointerEvents = "none";
      el.style.zIndex = "9999";
      el.style.transition = "all 0.8s ease-out";
      document.body.appendChild(el);

      const angle = (i / count) * Math.PI * 2;
      const velocity = 100 + Math.random() * 150;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;

      requestAnimationFrame(() => {
        el.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        el.style.opacity = "0";
      });

      setTimeout(() => el.remove(), 800);
    }
  };

  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <motion.button
          key={t.id}
          whileHover={{ scale: 1.1, rotate: moodTheme === t.id ? 0 : 5 }}
          whileTap={{ scale: 0.9, rotate: -5 }}
          onClick={() => handleThemeChange(t.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all interactive-bounce ${
            moodTheme === t.id
              ? "pookie-gradient text-primary-foreground pookie-glow ring-2 ring-primary ring-offset-2 ring-offset-background"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          }`}
        >
          <motion.span
            animate={moodTheme === t.id ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {t.icon}
          </motion.span>
          <span>{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default MoodThemePicker;
