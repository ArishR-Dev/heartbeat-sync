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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-[10px] font-semibold"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        isReconnecting ? "bg-yellow-400 animate-pulse" : isSynced ? "bg-green-400" : "bg-red-400"
      }`} />
      <span className="text-foreground">
        {isReconnecting ? "Reconnecting..." : isSynced ? "Synced ✅" : "Syncing..."}
      </span>
    </motion.div>
  );
};

export default SyncStatusIndicator;
