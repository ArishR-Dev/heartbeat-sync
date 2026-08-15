import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import { getCursorPack } from "@/data/cursorPacks";

const SharedCursors = () => {
  const { holdingHands, partnerCursor, broadcastCursor, partnerCursorPack, myCursorPack, cursorSize, cursorOpacity } = useRoom();
  const [heartTrails, setHeartTrails] = useState<{ id: string; x: number; y: number }[]>([]);

  const partnerPack = getCursorPack(partnerCursorPack);
  const myPack = getCursorPack(myCursorPack);

  // Get partner's actual username
  const getPartnerName = () => {
    try {
      const saved = localStorage.getItem("pookie_partner_name");
      if (saved) return saved;
    } catch (error) {
      console.error("SharedCursors partner name error:", error);
    }
    return "Partner";
  };

  // Apply custom cursor CSS to document
  useEffect(() => {
    const style = document.getElementById("pookie-cursor-style") || (() => {
      const el = document.createElement("style");
      el.id = "pookie-cursor-style";
      document.head.appendChild(el);
      return el;
    })();

    if (myPack && myPack.id !== "default" && myPack.cursorUrl) {
      const size = cursorSize || 32;
      style.textContent = `
        * { cursor: url('${myPack.cursorUrl}') ${Math.floor(size/8)} ${Math.floor(size/8)}, auto !important; }
        a, button, [role="button"], input[type="submit"], select, .cursor-pointer {
          cursor: url('${myPack.pointerUrl || myPack.cursorUrl}') ${Math.floor(size/8)} ${Math.floor(size/8)}, pointer !important;
        }
      `;
    } else {
      style.textContent = "";
    }

    return () => { style.textContent = ""; };
  }, [myPack, cursorSize]);

  // Broadcast local cursor position (throttled)
  useEffect(() => {
    let last = 0;
    const handler = (e: MouseEvent) => {
      if (Date.now() - last < 50) return;
      last = Date.now();
      broadcastCursor(e.clientX, e.clientY);

      if (holdingHands) {
        const trail = { id: crypto.randomUUID(), x: e.clientX, y: e.clientY };
        setHeartTrails((prev) => [...prev.slice(-10), trail]);
        setTimeout(() => {
          setHeartTrails((prev) => prev.filter((t) => t.id !== trail.id));
        }, 1200);
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [broadcastCursor, holdingHands]);

  const partnerSize = cursorSize || 32;
  const partnerOpacityVal = cursorOpacity ?? 1;

  return (
    <>
      {/* Partner cursor */}
      {partnerCursor && (
        <motion.div
          className="fixed pointer-events-none z-[55] flex flex-col items-center"
          animate={{ left: partnerCursor.x - partnerSize / 2, top: partnerCursor.y - partnerSize / 2 }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
          style={{ opacity: partnerOpacityVal }}
        >
          {partnerPack && partnerPack.id !== "default" && partnerPack.cursorUrl ? (
            <img src={partnerPack.cursorUrl} alt="" style={{ width: partnerSize, height: partnerSize }} className="object-contain" />
          ) : (
            <svg width={partnerSize} height={partnerSize} viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>
          )}
          <span className="text-[10px] font-semibold bg-primary/90 text-primary-foreground px-1.5 py-0.5 rounded-full whitespace-nowrap -mt-1">
            {getPartnerName()}
          </span>
        </motion.div>
      )}

      {/* Heart trails */}
      <AnimatePresence>
        {heartTrails.map((t) => (
          <motion.div
            key={t.id}
            className="fixed pointer-events-none z-[54]"
            style={{ left: t.x - 8, top: t.y - 8 }}
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.2, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className="text-base">💕</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
};

export default SharedCursors;
