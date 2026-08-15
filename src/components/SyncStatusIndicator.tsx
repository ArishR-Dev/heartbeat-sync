import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";

interface Props {
  lastSyncTime: number;
}

const SyncStatusIndicator = ({ lastSyncTime }: Props) => {
  const { connectionStatus, partnerJoined } = useRoom();
  const [syncAge, setSyncAge] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncAge(Math.floor((Date.now() - lastSyncTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  if (!partnerJoined) return null;

  const isSynced = connectionStatus === "connected" && syncAge < 15;
  const isReconnecting = connectionStatus === "reconnecting";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.05 }}
      className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-strong text-[10px] font-bold border border-primary/20 pookie-glow shadow-sm"
    >
      <motion.span 
        className={`w-2 h-2 rounded-full ${
          isReconnecting ? "bg-yellow-400" : isSynced ? "bg-green-400" : "bg-red-400"
        }`}
        animate={isReconnecting || !isSynced ? { opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-foreground tracking-tight">
        {isReconnecting ? "Reconnecting..." : isSynced ? "Synced ✨" : "Syncing..."}
      </span>
    </motion.div>
  );
};

export default SyncStatusIndicator;
