import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoom } from '@/contexts/RoomContext';
import { Sparkles, Star, Zap, Ghost } from 'lucide-react';

const EGG_CHANCE = 0.05; // 5% chance of an egg appearing

const InteractiveEggs = () => {
  const { partnerJoined } = useRoom();
  const [eggs, setEggs] = useState<{ id: string; type: string; x: number; y: number }[]>([]);

  useEffect(() => {
    if (!partnerJoined) return;

    const interval = setInterval(() => {
      if (Math.random() < EGG_CHANCE) {
        const newEgg = {
          id: crypto.randomUUID(),
          type: ['sparkle', 'star', 'zap', 'ghost'][Math.floor(Math.random() * 4)],
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
        };
        setEggs((prev) => [...prev, newEgg]);
        
        // Remove egg after 5 seconds if not clicked
        setTimeout(() => {
          setEggs((prev) => prev.filter((e) => e.id !== newEgg.id));
        }, 5000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [partnerJoined]);

  const handleEggClick = (id: string) => {
    setEggs((prev) => prev.filter((e) => e.id !== id));
    // Trigger a visual burst or something fun
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {eggs.map((egg) => (
          <motion.div
            key={egg.id}
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            className="absolute pointer-events-auto cursor-pointer p-2"
            style={{ left: `${egg.x}%`, top: `${egg.y}%` }}
            onClick={() => handleEggClick(egg.id)}
            whileHover={{ scale: 1.5, rotate: 15 }}
          >
            {egg.type === 'sparkle' && <Sparkles className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" size={32} />}
            {egg.type === 'star' && <Star className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" size={32} />}
            {egg.type === 'zap' && <Zap className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" size={32} />}
            {egg.type === 'ghost' && <Ghost className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.6)]" size={32} />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveEggs;