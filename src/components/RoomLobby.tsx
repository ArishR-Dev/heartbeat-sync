import { useState } from "react";
import { motion } from "framer-motion";
import { useRoom } from "@/contexts/RoomContext";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, LogOut, Users, Key, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoomLobby = () => {
  const { user, logout } = useAuth();
  const { createRoom, joinRoom, isLoading } = useRoom();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    setError(null);
    await createRoom();
  };

  const handleJoinRoom = async () => {
    setError(null);
    const result = await joinRoom(joinCode);
    if (result && 'error' in result && result.error) {
      setError(result.error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/8 blur-3xl" />
      </div>

      {/* Left - Hero text */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground">
            Watch{" "}
            <span className="block">together,</span>
            <span className="block pookie-text-gradient italic">wherever</span>
            <span className="block pookie-text-gradient italic">you are.</span>
          </h1>
          <p className="mt-6 text-muted-foreground max-w-md leading-relaxed">
            Create a private cozy space for just the two of you. Sync videos perfectly, chat, and hold hands digitally.
          </p>
        </motion.div>

        {/* User badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-3"
        >
          <span className="text-2xl">{user?.avatar}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="ml-4 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={16} />
          </button>
        </motion.div>
      </div>

      {/* Right - Room actions */}
      <div className="flex-1 flex items-center justify-center px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-sm space-y-4"
        >
          {/* Create Room button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full py-5 px-6 rounded-pookie pookie-gradient text-primary-foreground flex items-center gap-4 pookie-glow shadow-xl disabled:opacity-50"
          >
            <div className="p-2 rounded-full bg-white/20">
              <Heart size={20} />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-base">Create a Room</p>
              <p className="text-xs opacity-80">Start a new watch session</p>
            </div>
            <ArrowRight size={20} />
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Join Room */}
          <div className="glass-strong rounded-pookie p-1 space-y-1">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().trim())}
                placeholder="Enter 6-letter room code"
                maxLength={6}
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleJoinRoom}
              disabled={joinCode.length !== 6 || isLoading}
              className="w-full py-3.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm disabled:opacity-40 transition-colors"
            >
              {isLoading ? "Joining..." : "Join Room"}
            </motion.button>
            {error && <p className="text-xs text-destructive text-center mt-2 px-2">{error}</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoomLobby;
