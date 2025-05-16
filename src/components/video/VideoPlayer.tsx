import { useEffect, useRef, useState } from 'react';
import { useVideoStore } from '../../stores/videoStore';
import { useAuthStore } from '../../stores/authStore';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDuration } from '../../lib/utils';

interface VideoPlayerProps {
  videoId: string;
  url: string;
  uploaderId: string;
  isAdmin: boolean;
}

interface CumMarker {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  timestamp: number;
}

const VideoPlayer = ({ videoId, url }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const { updateWatchTime } = useVideoStore();
  const { user } = useAuthStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [cumMarkers, setCumMarkers] = useState<CumMarker[]>([]);
  const watchTimeIntervalRef = useRef<number | null>(null);
  const accumulatedTimeRef = useRef(0);
  const cumStartTimeRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const [showCumAnimation, setShowCumAnimation] = useState(false);
  const [emojis, setEmojis] = useState<{ id: number; emoji: string; style: { top: string; left: string; animationDelay: string } }[]>([]);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [activeMarkerTimestamp, setActiveMarkerTimestamp] = useState<number | null>(null);

  useEffect(() => {
    fetchCumMarkers();
    
    const channel = supabase
      .channel('cum-markers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cum_markers',
        filter: `video_id=eq.${videoId}`
      }, () => {
        fetchCumMarkers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [videoId]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(!isMuted);
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSkipBackward();
          break;
        case 'arrowright':
          e.preventDefault();
          handleSkipForward();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isMuted]);

  const fetchCumMarkers = async () => {
    const { data: markerData, error } = await supabase
      .from('cum_markers')
      .select('id, user_id, timestamp')
      .eq('video_id', videoId);

    if (error) {
      console.error('Error fetching cum markers:', error);
      return;
    }

    if (markerData) {
      const markers = await Promise.all(
        markerData.map(async (marker) => {
          const { data: userData } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', marker.user_id)
            .single();

          return {
            id: marker.id,
            userId: marker.user_id,
            username: userData?.username || 'Unknown User',
            avatarUrl: userData?.avatar_url,
            timestamp: marker.timestamp
          };
        })
      );

      setCumMarkers(markers);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check if we're near any cum markers
      const nearestMarker = cumMarkers.find(marker => 
        Math.abs(marker.timestamp - video.currentTime) < 0.5
      );
      
      setActiveMarkerTimestamp(nearestMarker?.timestamp ?? null);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [cumMarkers]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
        if (accumulatedTimeRef.current > 0) {
          updateWatchTime(videoId, accumulatedTimeRef.current);
          accumulatedTimeRef.current = 0;
        }
      }
    };
  }, [videoId, updateWatchTime]);

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const createEmojis = () => {
    const emojiList = ['💦', '🍆', '🔥', '😩', '🥵'];
    const newEmojis = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      emoji: emojiList[Math.floor(Math.random() * emojiList.length)],
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 0.5}s`
      }
    }));
    setEmojis(newEmojis);
  };

  const handleCum = async () => {
    if (!user || !videoRef.current) return;

    const duration = cumStartTimeRef.current
      ? Math.floor((Date.now() - cumStartTimeRef.current) / 1000)
      : 0;

    // Get current user stats
    const { data: userData } = await supabase
      .from('users')
      .select('cum_count, total_cum_duration')
      .eq('id', user.id)
      .single();

    if (userData) {
      // Update user stats
      await supabase
        .from('users')
        .update({
          cum_count: (userData.cum_count || 0) + 1,
          total_cum_duration: (userData.total_cum_duration || 0) + duration
        })
        .eq('id', user.id);
    }

    await supabase.from('cum_markers').insert({
      video_id: videoId,
      user_id: user.id,
      timestamp: Math.floor(videoRef.current.currentTime)
    });

    setShowCumAnimation(true);
    createEmojis();
    
    // Send system message about the cum event
    await supabase.from('messages').insert({
      sender_id: user.id,
      content: `💦 ${user.user_metadata.username} just came at ${formatDuration(Math.floor(videoRef.current.currentTime))}! 💦`,
      created_at: new Date().toISOString()
    });

    setTimeout(() => {
      setShowCumAnimation(false);
      setEmojis([]);
    }, 3000);
    cumStartTimeRef.current = null;
  };

  const startCumTimer = () => {
    cumStartTimeRef.current = Date.now();
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  // Group markers by timestamp
  const groupedMarkers = cumMarkers.reduce<Record<number, CumMarker[]>>((acc, marker) => {
    if (!acc[marker.timestamp]) {
      acc[marker.timestamp] = [];
    }
    acc[marker.timestamp].push(marker);
    return acc;
  }, {});

  return (
    <div 
      ref={videoContainerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full"
        onClick={handlePlay}
        onPlay={() => {
          setIsPlaying(true);
          watchTimeIntervalRef.current = window.setInterval(() => {
            accumulatedTimeRef.current += 1;
            if (accumulatedTimeRef.current % 5 === 0) {
              updateWatchTime(videoId, 5);
              accumulatedTimeRef.current = 0;
            }
          }, 1000);
        }}
        onPause={() => {
          setIsPlaying(false);
          if (watchTimeIntervalRef.current) {
            clearInterval(watchTimeIntervalRef.current);
            watchTimeIntervalRef.current = null;
            if (accumulatedTimeRef.current > 0) {
              updateWatchTime(videoId, accumulatedTimeRef.current);
              accumulatedTimeRef.current = 0;
            }
          }
        }}
      />

      {/* Video controls */}
      <div 
        className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="space-y-2 p-4">
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="h-1.5 cursor-pointer rounded-full bg-gray-600"
            onClick={handleProgress}
          >
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* Cum markers bar */}
          <div className="relative h-6">
            {Object.entries(groupedMarkers).map(([timestamp, markers]) => (
              <div
                key={`group-${timestamp}`}
                className="absolute -top-1"
                style={{ left: `${(Number(timestamp) / duration) * 100}%` }}
              >
                <div className="flex -space-x-2">
                  {markers.map((marker, markerIndex) => (
                    <div
                      key={marker.id}
                      className="group/marker relative"
                      style={{ zIndex: markers.length - markerIndex }}
                      onMouseEnter={() => setHoveredMarker(marker.id)}
                      onMouseLeave={() => setHoveredMarker(null)}
                    >
                      <img
                        src={marker.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${marker.userId}`}
                        alt={marker.username}
                        className="h-6 w-6 cursor-pointer rounded-full ring-2 ring-white/50"
                      />
                      <div className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-3 py-1.5 text-sm transition-opacity ${
                        hoveredMarker === marker.id || activeMarkerTimestamp === Number(timestamp) ? 'opacity-100' : 'opacity-0'
                      }`}>
                        {marker.username} came at {formatDuration(Number(timestamp))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handlePlay} className="rounded-full p-1 hover:bg-white/20">
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </button>

              <button onClick={handleSkipBackward} className="rounded-full p-1 hover:bg-white/20">
                <SkipBack className="h-5 w-5" />
              </button>

              <button onClick={handleSkipForward} className="rounded-full p-1 hover:bg-white/20">
                <SkipForward className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full p-1 hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setVolume(value);
                    setIsMuted(value === 0);
                  }}
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-gray-600 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>

              <div className="text-sm">
                {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onMouseDown={startCumTimer}
                onMouseUp={handleCum}
                onMouseLeave={() => { cumStartTimeRef.current = null; }}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Boşal
              </button>

              <button
                onClick={toggleFullscreen}
                className="rounded-full p-1 hover:bg-white/20"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCumAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white/20 backdrop-blur-sm">
          {emojis.map((emoji) => (
            <div
              key={emoji.id}
              className="absolute animate-cum"
              style={{
                top: emoji.style.top,
                left: emoji.style.left,
                animationDelay: emoji.style.animationDelay,
                fontSize: '2rem'
              }}
            >
              {emoji.emoji}
            </div>
          ))}
          <div className="rounded-lg bg-white/90 px-8 py-4 text-2xl font-bold text-gray-900">
            {user?.user_metadata.username} boşaldı 💦
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;