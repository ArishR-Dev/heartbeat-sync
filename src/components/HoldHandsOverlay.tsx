import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import { Heart, X } from "lucide-react";

const HoldHandsOverlay = () => {
  const { holdingHands, holdHandsRequest, respondHoldHands } = useRoom();

  // Heartbeat sound
  useEffect(() => {
    if (!holdingHands || holdHandsRequest) return;
    const ctx = new AudioContext();
    let playing = true;

    const playBeat = async () => {
      while (playing) {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.value = 60;
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc1.connect(gain1).connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);
        await new Promise((r) => setTimeout(r, 200));
        if (!playing) break;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.value = 55;
        gain2.gain.setValueAtTime(0.1, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc2.connect(gain2).connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.12);
        await new Promise((r) => setTimeout(r, 800));
      }
    };
    playBeat();
    return () => { playing = false; ctx.close(); };
  }, [holdingHands]);

  return (
    <>
      {/* Hold Hands Request Popup */}
      <AnimatePresence>
        {holdHandsRequest && !holdingHands && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] glass-strong rounded-2xl px-6 py-4 flex flex-col items-center gap-3 shadow-2xl border border-primary/20"
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Heart className="text-primary fill-primary" size={32} />
            </motion.div>
            <p className="text-sm font-semibold text-foreground text-center">
              {holdHandsRequest} wants to hold hands ❤️
            </p>
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => respondHoldHands(true)}
                className="px-5 py-2 rounded-full pookie-gradient text-primary-foreground text-sm font-semibold"
              >
                Accept 🫶
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => respondHoldHands(false)}
                className="px-5 py-2 rounded-full bg-muted text-muted-foreground text-sm font-semibold hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <X size={14} className="inline mr-1" /> Decline
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Hold Hands Overlay */}
      <AnimatePresence>
        {holdingHands && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="fixed inset-0 z-40 pointer-events-none"
          >
            {/* Vignette + romantic gradient */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "radial-gradient(ellipse at center, transparent 20%, hsla(340, 82%, 15%, 0.4) 60%, hsla(340, 82%, 8%, 0.7) 100%)",
              }}
            />

            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%)",
              }}
            />

            {/* Blur edges */}
            <div
              className="absolute inset-0"
              style={{
                backdropFilter: "blur(2px)",
                mask: "radial-gradient(ellipse at center, transparent 40%, black 100%)",
                WebkitMask: "radial-gradient(ellipse at center, transparent 40%, black 100%)",
              }}
            />

            {/* Hands animation - cinematic */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="relative flex items-center"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Left hand */}
                <motion.div
                  className="text-7xl select-none"
                  initial={{ x: -120, opacity: 0, rotate: -20 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.6))" }}
                >
                  🤚
                </motion.div>

                {/* Connecting glow */}
                <motion.div
                  className="mx-2 relative"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 1], opacity: 1 }}
                  transition={{ delay: 1.8, duration: 1, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      width: 60,
                      height: 60,
                      marginLeft: -15,
                      marginTop: -15,
                      background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
                    }}
                  />
                  <motion.span
                    className="text-4xl block"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.8))" }}
                  >
                    💕
                  </motion.span>
                </motion.div>

                {/* Right hand */}
                <motion.div
                  className="text-7xl select-none"
                  initial={{ x: 120, opacity: 0, rotate: 20 }}
                  animate={{ x: 0, opacity: 1, rotate: 0 }}
                  transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    transform: "scaleX(-1)",
                    filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.6))",
                  }}
                >
                  🤚
                </motion.div>
              </motion.div>

              {/* Text below */}
              <motion.p
                className="absolute bottom-[35%] text-primary font-brand text-xl tracking-wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: [0.6, 1, 0.6], y: 0 }}
                transition={{ delay: 2.5, duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.6)" }}
              >
                You're holding hands 💕
              </motion.p>
            </div>

            {/* Floating particles */}
            {[...Array(16)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-xl pointer-events-none select-none"
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.7, 0],
                  y: -200 - Math.random() * 150,
                  x: (Math.random() - 0.5) * 200,
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut",
                }}
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${50 + Math.random() * 30}%`,
                }}
              >
                {["💕", "💖", "💗", "🩷", "✨", "💫"][i % 6]}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HoldHandsOverlay;
