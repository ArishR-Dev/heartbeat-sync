import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2, Sparkles, Check } from "lucide-react";
import { CURSOR_PACKS, type CursorPack } from "@/data/cursorPacks";
import { useRoom } from "@/contexts/RoomContext";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "anime", label: "🎌 Anime" },
  { id: "kpop", label: "🎤 K-Pop" },
  { id: "fantasy", label: "⚔️ Fantasy" },
  { id: "default", label: "🖱️ Default" },
] as const;

const CursorPackCard = memo(({
  pack,
  selected,
  onSelect,
}: {
  pack: CursorPack;
  selected: boolean;
  onSelect: () => void;
}) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    whileHover={{ scale: 1.06, y: -2, rotate: 1 }}
    whileTap={{ scale: 0.94, rotate: -1 }}
    onClick={onSelect}
    className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all duration-300 ${
      selected
        ? "bg-primary/12 border-2 border-primary shadow-sm"
        : "glass border border-transparent hover:border-primary/20"
    }`}
  >
    <div className="w-10 h-10 flex items-center justify-center">
      {pack.id === "default" ? (
        <MousePointer2 size={22} className="text-muted-foreground" />
      ) : (
        <img src={pack.preview} alt={pack.name} className="w-8 h-8 object-contain" loading="lazy" />
      )}
    </div>
    <span className="text-[10px] font-medium text-foreground leading-tight text-center line-clamp-2">{pack.name}</span>
    {pack.animated && (
      <span className="absolute top-1 right-1"><Sparkles size={9} className="text-primary" /></span>
    )}
    {selected && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }} className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
        <Check size={9} className="text-primary-foreground" />
      </motion.div>
    )}
  </motion.button>
));
CursorPackCard.displayName = "CursorPackCard";

const CursorLibrary = () => {
  const { myCursorPack, setMyCursorPack, cursorSize, setCursorSize, cursorOpacity, setCursorOpacity } = useRoom();
  const [category, setCategory] = useState<string>("all");

  const filtered = category === "all"
    ? CURSOR_PACKS
    : CURSOR_PACKS.filter((p) => p.category === category);

  const handleSelect = (packId: string) => {
    setMyCursorPack(packId);
    toast({ title: "Cursor updated 🖱️", description: `Switched to ${CURSOR_PACKS.find(p => p.id === packId)?.name || "default"}.` });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MousePointer2 size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground tracking-tight">Cursor Library</span>
      </div>

      {/* Size control */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-muted-foreground font-medium">Size</label>
          <span className="text-[10px] text-muted-foreground tabular-nums">{cursorSize}px</span>
        </div>
        <Slider value={[cursorSize]} onValueChange={([v]) => setCursorSize(v)} min={16} max={64} step={2} className="w-full" />
      </div>

      {/* Opacity control */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-muted-foreground font-medium">Opacity</label>
          <span className="text-[10px] text-muted-foreground tabular-nums">{Math.round(cursorOpacity * 100)}%</span>
        </div>
        <Slider value={[cursorOpacity * 100]} onValueChange={([v]) => setCursorOpacity(v / 100)} min={30} max={100} step={5} className="w-full" />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors duration-200 ${
              category === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {cat.label}
          </motion.button>
        ))}
      </div>

      {/* Cursor grid */}
      <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 custom-scroll">
        {filtered.map((pack) => (
          <CursorPackCard
            key={pack.id}
            pack={pack}
            selected={myCursorPack === pack.id}
            onSelect={() => handleSelect(pack.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CursorLibrary;
