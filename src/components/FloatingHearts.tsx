import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";

const FloatingHearts = () => {
  const { reactions } = useRoom();

  return (
    <AnimatePresence>
      {reactions.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 1, y: 0, scale: 0.5, rotate: Math.random() * 40 - 20 }}
          animate={{ opacity: 0, y: -250, scale: 2, rotate: Math.random() * 180 - 90 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed pointer-events-none z-50 text-3xl"
          style={{ left: `${r.x}%`, bottom: `${r.y}%` }}
        >
          {r.emoji}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default FloatingHearts;
