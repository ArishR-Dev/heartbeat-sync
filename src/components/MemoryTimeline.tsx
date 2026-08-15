import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Film, Trash2 } from "lucide-react";
import { useRoom } from "@/contexts/RoomContext";

const MemoryItem = memo(({ mem, index, onRemove }: { mem: { id: string; title: string; date: string; emoji: string }; index: number; onRemove: (id: string) => void }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 16 }}
    transition={{ delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
    className="relative pl-10 py-1.5 group"
  >
    <div className="absolute left-[11px] top-3.5 w-[10px] h-[10px] rounded-full bg-primary border-2 border-background z-10" />
    <div className="glass rounded-xl px-3 py-2.5 flex items-center gap-3 card-interactive border border-border/20">
      <span className="text-lg">{mem.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{mem.title}</p>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock size={9} /> {mem.date}</p>
      </div>
      <button onClick={() => onRemove(mem.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-200 p-1">
        <Trash2 size={12} />
      </button>
    </div>
  </motion.div>
));
MemoryItem.displayName = "MemoryItem";

const MemoryTimeline = () => {
  const { memories, removeMemory } = useRoom();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Film size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground tracking-tight">Memory Timeline</span>
      </div>

      {memories.length === 0 ? (
        <div className="text-center py-8">
          <motion.span className="text-4xl block mb-2 opacity-25" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>📼</motion.span>
          <p className="text-xs text-muted-foreground">Your love story starts here 💕</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Watch something together to create your first memory!</p>
        </div>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-primary/15" />
          <AnimatePresence>
            {memories.map((mem, i) => (
              <MemoryItem key={mem.id} mem={mem} index={i} onRemove={removeMemory} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MemoryTimeline;
