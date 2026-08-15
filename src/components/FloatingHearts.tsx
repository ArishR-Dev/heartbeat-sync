import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";

const FloatingHearts = () => {
  const { reactions } = useRoom();

  return (
    <AnimatePresence>
      {reactions.map((r) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 1, y: 0, scale: 0.5 }}
          animate={{ opacity: 0, y: -200, scale: 1.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
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
