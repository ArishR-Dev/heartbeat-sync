import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Link as LinkIcon, Volume2, VolumeX, Maximize } from "lucide-react";
import { useRoom } from "@/contexts/RoomContext";
import type { VideoAction, VideoSyncState } from "@/hooks/useRealtimeRoom";
import SyncStatusIndicator from "./SyncStatusIndicator";

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/);
  return match ? match[1] : null;
};

interface Props {
  onVideoLoaded?: (title: string) => void;
}

const VideoPlayer = ({ onVideoLoaded }: Props) => {
  const { broadcastVideoAction, onVideoAction, onSyncRequest, onSyncResponse, requestVideoSync, respondVideoSync, partnerJoined } = useRoom();
  const [videoUrl, setVideoUrl] = useState("");
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [isYouTube, setIsYouTube] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isRemoteAction = useRef(false);
  const syncLock = useRef(false);

  const sendYouTubeCommand = useCallback((func: "playVideo" | "pauseVideo" | "seekTo", args: unknown[] = []) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  }, []);

  // Incoming video actions from partner
  useEffect(() => {
    onVideoAction.current = (action: VideoAction) => {
      isRemoteAction.current = true;
      syncLock.current = true;

      if (action.type === "load" && action.url) {
        const ytId = extractYouTubeId(action.url);
        if (ytId || action.isYouTube) {
          setActiveVideo(ytId || action.url);
          setIsYouTube(true);
        } else {
          setActiveVideo(action.url);
          setIsYouTube(false);
        }
        setIsPlaying(true);
      } else if (action.type === "play") {
        if (isYouTube) sendYouTubeCommand("playVideo");
        else videoRef.current?.play();
        setIsPlaying(true);
      } else if (action.type === "pause") {
        if (isYouTube) sendYouTubeCommand("pauseVideo");
        else videoRef.current?.pause();
        setIsPlaying(false);
      } else if (action.type === "seek" && action.time !== undefined) {
        if (isYouTube) sendYouTubeCommand("seekTo", [action.time, true]);
        else if (videoRef.current) videoRef.current.currentTime = action.time;
      } else if (action.type === "sync_state" && action.time !== undefined) {
        // Failsafe auto-sync: adjust if drift > 2 seconds
        if (videoRef.current && !isYouTube) {
          const drift = Math.abs(videoRef.current.currentTime - action.time);
          if (drift > 2) {
            videoRef.current.currentTime = action.time;
          }
        }
        setLastSyncTime(Date.now());
      }

      setTimeout(() => {
        isRemoteAction.current = false;
        syncLock.current = false;
      }, 150);
    };
    return () => { onVideoAction.current = null; };
  }, [onVideoAction, isYouTube, sendYouTubeCommand]);

  // Handle sync requests from partner (they ask for our current state)
  useEffect(() => {
    onSyncRequest.current = () => {
      if (videoRef.current && activeVideo) {
        respondVideoSync({
          url: activeVideo,
          isYouTube,
          currentTime: videoRef.current.currentTime,
          isPlaying: !videoRef.current.paused,
        });
      }
    };
    return () => { onSyncRequest.current = null; };
  }, [onSyncRequest, activeVideo, isYouTube, respondVideoSync]);

  // Handle sync responses
  useEffect(() => {
    onSyncResponse.current = (syncState: VideoSyncState) => {
      if (syncState.url && !activeVideo) {
        const ytId = extractYouTubeId(syncState.url);
        if (ytId || syncState.isYouTube) {
          setActiveVideo(ytId || syncState.url);
          setIsYouTube(true);
        } else {
          setActiveVideo(syncState.url);
          setIsYouTube(false);
        }
      }
      if (videoRef.current && syncState.currentTime !== undefined) {
        const drift = Math.abs(videoRef.current.currentTime - syncState.currentTime);
        if (drift > 2) {
          videoRef.current.currentTime = syncState.currentTime;
        }
      } else if (isYouTube && syncState.currentTime !== undefined) {
        sendYouTubeCommand("seekTo", [syncState.currentTime, true]);
      }

      if (syncState.isPlaying) {
        if (isYouTube) sendYouTubeCommand("playVideo");
        else videoRef.current?.play();
      } else {
        if (isYouTube) sendYouTubeCommand("pauseVideo");
        else videoRef.current?.pause();
      }
      setIsPlaying(syncState.isPlaying);
      setLastSyncTime(Date.now());
    };
    return () => { onSyncResponse.current = null; };
  }, [onSyncResponse, activeVideo, isYouTube, sendYouTubeCommand]);

  // Failsafe auto-sync: broadcast current state every 8 seconds
  useEffect(() => {
    if (!activeVideo || isYouTube || !partnerJoined) return;
    const interval = setInterval(() => {
      if (videoRef.current && !syncLock.current) {
        broadcastVideoAction({
          type: "sync_state",
          time: videoRef.current.currentTime,
        });
        setLastSyncTime(Date.now());
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [activeVideo, isYouTube, partnerJoined, broadcastVideoAction]);

  // Request sync when partner joins
  useEffect(() => {
    if (partnerJoined && !activeVideo) {
      requestVideoSync();
    }
  }, [partnerJoined, activeVideo, requestVideoSync]);

  const loadVideo = () => {
    if (!videoUrl.trim()) return;
    const ytId = extractYouTubeId(videoUrl);
    if (ytId) {
      setActiveVideo(ytId);
      setIsYouTube(true);
      onVideoLoaded?.(`YouTube: ${ytId}`);
    } else {
      setActiveVideo(videoUrl);
      setIsYouTube(false);
      onVideoLoaded?.(videoUrl.split("/").pop() || "Video");
    }
    setIsPlaying(true);
    broadcastVideoAction({ type: "load", url: videoUrl, isYouTube: !!ytId });
    setVideoUrl("");
  };

  const handleTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (vid && vid.duration) {
      setProgress((vid.currentTime / vid.duration) * 100);
      setDuration(vid.duration);
    }
  }, []);

  const handleVideoPlay = useCallback(() => {
    setIsPlaying(true);
    if (!isRemoteAction.current && !syncLock.current) {
      broadcastVideoAction({ type: "play" });
    }
  }, [broadcastVideoAction]);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
    if (!isRemoteAction.current && !syncLock.current) {
      broadcastVideoAction({ type: "pause" });
    }
  }, [broadcastVideoAction]);

  const handleSeeked = useCallback(() => {
    if (!isRemoteAction.current && !syncLock.current && videoRef.current) {
      broadcastVideoAction({ type: "seek", time: videoRef.current.currentTime });
    }
  }, [broadcastVideoAction]);

  const togglePlay = () => {
    if (isYouTube) {
      sendYouTubeCommand(isPlaying ? "pauseVideo" : "playVideo");
      setIsPlaying(!isPlaying);
      broadcastVideoAction({ type: isPlaying ? "pause" : "play" });
    } else {
      const vid = videoRef.current;
      if (!vid) return;
      if (vid.paused) vid.play();
      else vid.pause();
    }
  };

  const toggleMute = () => {
    if (!isYouTube && videoRef.current) videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isYouTube && videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const time = pct * videoRef.current.duration;
      videoRef.current.currentTime = time;
      broadcastVideoAction({ type: "seek", time });
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    const el = isYouTube ? iframeRef.current : videoRef.current;
    if (el) el.requestFullscreen?.();
  };

  return (
    <div className="flex flex-col gap-3">
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadVideo()}
            placeholder="Paste YouTube or MP4 link..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={loadVideo}
          className="px-4 py-2.5 rounded-xl pookie-gradient text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Watch
        </button>
      </div>

      {/* Video Area */}
      <motion.div layout className="relative w-full aspect-video rounded-2xl overflow-hidden bg-muted/30 glass">
        {!activeVideo ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <motion.span className="text-5xl" animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity }}>🎬</motion.span>
            <p className="text-sm">Paste a link to start watching together</p>
          </div>
        ) : isYouTube ? (
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&enablejsapi=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={activeVideo}
            className="w-full h-full object-contain bg-black"
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onSeeked={handleSeeked}
          />
        )}

        {/* Sync indicator on video */}
        {activeVideo && <SyncStatusIndicator lastSyncTime={lastSyncTime} />}
      </motion.div>

      {/* Controls */}
      {activeVideo && (
        <div className="glass rounded-xl px-3 py-2 space-y-2">
          {!isYouTube && (
            <div className="w-full h-1.5 bg-muted rounded-full cursor-pointer group" onClick={seekTo}>
              <motion.div className="h-full rounded-full pookie-gradient" style={{ width: `${progress}%` }} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="p-2 rounded-full pookie-gradient text-primary-foreground hover:opacity-90 transition-all">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              {!isYouTube && (
                <>
                  <button onClick={toggleMute} className="p-1.5 rounded-full hover:bg-muted transition-colors text-foreground">
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {formatTime((progress / 100) * duration)} / {formatTime(duration)}
                  </span>
                </>
              )}
            </div>
            <button onClick={toggleFullscreen} className="p-1.5 rounded-full hover:bg-muted transition-colors text-foreground">
              <Maximize size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
