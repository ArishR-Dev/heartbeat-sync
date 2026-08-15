import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Volume2, VolumeX } from "lucide-react";

const SOUNDS = [
  { id: "rain", label: "Rain 🌧️", emoji: "🌧️" },
  { id: "cafe", label: "Café ☕", emoji: "☕" },
  { id: "fire", label: "Fireplace 🔥", emoji: "🔥" },
  { id: "ocean", label: "Ocean 🌊", emoji: "🌊" },
] as const;

// Generate ambient noise using Web Audio API
const createNoiseSource = (ctx: AudioContext, type: string) => {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  gain.gain.value = 0.12;

  switch (type) {
    case "rain":
      filter.type = "lowpass";
      filter.frequency.value = 2000;
      break;
    case "cafe":
      filter.type = "bandpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      break;
    case "fire":
      filter.type = "lowpass";
      filter.frequency.value = 600;
      break;
    case "ocean":
      filter.type = "lowpass";
      filter.frequency.value = 400;
      break;
  }

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  return { source, gain };
};

const Particle = memo(({ delay, x }: { delay: number; x: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-primary/20"
    initial={{ opacity: 0, y: "100vh", x: `${x}vw` }}
    animate={{
      opacity: [0, 0.6, 0],
      y: [100, -20],
      x: [`${x}vw`, `${x + (Math.random() - 0.5) * 10}vw`],
    }}
    transition={{
      duration: 8 + Math.random() * 6,
      delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
    style={{ width: 2 + Math.random() * 3, height: 2 + Math.random() * 3 }}
  />
));
Particle.displayName = "Particle";

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  delay: Math.random() * 8,
  x: Math.random() * 100,
}));

const CozyMode = () => {
  const [isCozy, setIsCozy] = useState(false);
  const [sound, setSound] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode; ctx: AudioContext } | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.source.stop();
      audioRef.current.ctx.close();
      audioRef.current = null;
    }
  }, []);

  const startAudio = useCallback((type: string) => {
    stopAudio();
    try {
      const ctx = new AudioContext();
      const { source, gain } = createNoiseSource(ctx, type);
      audioRef.current = { source, gain, ctx };
    } catch {}
  }, [stopAudio]);

  useEffect(() => {
    if (sound && isCozy && !muted) {
      startAudio(sound);
    } else {
      stopAudio();
    }
    return stopAudio;
  }, [sound, isCozy, muted, startAudio, stopAudio]);

  const toggleCozy = () => {
    const next = !isCozy;
    setIsCozy(next);
    if (!next) {
      setSound(null);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleCozy}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
          isCozy
            ? "pookie-gradient text-primary-foreground pookie-glow"
            : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
        }`}
      >
        <Moon size={12} />
        <span className="hidden sm:inline">Cozy</span>
      </motion.button>

      {/* Ambient overlay */}
      <AnimatePresence>
        {isCozy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="fixed inset-0 z-[5] pointer-events-none"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 cozy-gradient-bg" />

            {/* Floating particles */}
            {particles.map((p) => (
              <Particle key={p.id} delay={p.delay} x={p.x} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sound picker (floating mini panel) */}
      <AnimatePresence>
        {isCozy && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-3 py-2 rounded-2xl glass-strong border border-border/20"
          >
            <span className="text-[10px] text-muted-foreground font-medium mr-1">🌙 Cozy</span>
            {SOUNDS.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSound(sound === s.id ? null : s.id)}
                className={`text-sm p-1.5 rounded-lg transition-all duration-200 ${
                  sound === s.id ? "bg-primary/15 scale-110" : "hover:bg-muted/50"
                }`}
                title={s.label}
              >
                {s.emoji}
              </motion.button>
            ))}
            <button
              onClick={() => setMuted(!muted)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CozyMode;
