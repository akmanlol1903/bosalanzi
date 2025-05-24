// src/components/video/VideoPlayer.tsx
import { useEffect, useRef, useState } from 'react';
import { useVideoStore } from '../../stores/videoStore';
import { useAuthStore } from '../../stores/authStore';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Minimize } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDuration, cn } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Database } from '../../lib/database.types';

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

interface CumEventData {
  id: string;
  video_id: string;
  user_id: string;
  video_timestamp: number;
  created_at: string;
  username: string | null;
  avatar_url: string | null;
}


const VideoPlayer = ({ videoId, url }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
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
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [activeMarkerTimestampForTooltip, setActiveMarkerTimestampForTooltip] = useState<number | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const volumeControlTimeoutRef = useRef<number | null>(null);
  const [activeCumEvent, setActiveCumEvent] = useState<CumEventData | null>(null);


  useEffect(() => {
    fetchCumMarkers();
    
    const markerChannel = supabase
      .channel(`cum-markers-${videoId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cum_markers',
        filter: `video_id=eq.${videoId}`
      }, () => {
        fetchCumMarkers();
      })
      .subscribe();

    const cumEventsChannel = supabase
      .channel(`realtime-cum-events-${videoId}`)
      .on<Database['public']['Tables']['cum_events']['Row']>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cum_events',
          filter: `video_id=eq.${videoId}`,
        },
        (payload) => {
          const newEvent = payload.new;
          if (newEvent) {
            setActiveCumEvent(newEvent as CumEventData);
            createEmojis();
            setShowCumAnimation(true);

            setTimeout(() => {
              setShowCumAnimation(false);
              setEmojis([]);
              setActiveCumEvent(null);
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(markerChannel);
      supabase.removeChannel(cumEventsChannel);
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
          setIsMuted(prev => {
            const newMuted = !prev;
            if (videoRef.current) videoRef.current.muted = newMuted;
            if (newMuted && videoRef.current) videoRef.current.volume = 0;
            if (!newMuted && videoRef.current && volume === 0) { 
                const newVolume = 0.5; 
                setVolume(newVolume);
                if(videoRef.current) videoRef.current.volume = newVolume;
            }
            return newMuted;
          });
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          handleSkipBackward();
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          handleSkipForward();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => {
            const newVolume = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = newVolume;
            if (newVolume > 0 && isMuted) setIsMuted(false);
            return newVolume;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => {
            const newVolume = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = newVolume;
            if (newVolume === 0 && !isMuted) setIsMuted(true);
            return newVolume;
          });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isMuted, volume]);

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
  
  const groupedMarkers = cumMarkers.reduce<Record<number, CumMarker[]>>((acc, marker) => {
    const timestamp = Math.round(marker.timestamp);
    if (!acc[timestamp]) {
      acc[timestamp] = [];
    }
    acc[timestamp].push(marker);
    return acc;
  }, {});


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
      if (!isDraggingTimeline) { 
          setCurrentTime(video.currentTime);
      }
  
      if (isPlaying && duration > 0) {
        let newActiveMarkerTimestamp: number | null = null;
        if (Object.keys(groupedMarkers).length > 0) {
            for (const tsStr of Object.keys(groupedMarkers)) {
              const ts = Number(tsStr);
              if (Math.abs(video.currentTime - ts) < 0.75) { 
                newActiveMarkerTimestamp = ts;
                break;
              }
            }
        }
        if (activeMarkerTimestampForTooltip !== newActiveMarkerTimestamp) {
          setActiveMarkerTimestampForTooltip(newActiveMarkerTimestamp);
        }
      } else if (!isPlaying && activeMarkerTimestampForTooltip !== null) {
        // setActiveMarkerTimestampForTooltip(null); 
      }
    };
  
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    const handlePlayEvent = () => setIsPlaying(true);
    const handlePauseEvent = () => {
      setIsPlaying(false);
    }
  
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlayEvent);
    video.addEventListener('pause', handlePauseEvent);
  
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlayEvent);
      video.removeEventListener('pause', handlePauseEvent);
    };
  }, [isDraggingTimeline, isPlaying, groupedMarkers, duration, activeMarkerTimestampForTooltip]); 
  

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
    if (isPlaying) {
      watchTimeIntervalRef.current = window.setInterval(() => {
        accumulatedTimeRef.current += 1;
        if (accumulatedTimeRef.current >= 5) {
          updateWatchTime(videoId, accumulatedTimeRef.current);
          accumulatedTimeRef.current = 0;
        }
      }, 1000);
    } else {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
        watchTimeIntervalRef.current = null;
        if (accumulatedTimeRef.current > 0) {
          updateWatchTime(videoId, accumulatedTimeRef.current);
          accumulatedTimeRef.current = 0;
        }
      }
    }
    return () => {
      if (watchTimeIntervalRef.current) {
        clearInterval(watchTimeIntervalRef.current);
        if (accumulatedTimeRef.current > 0) {
          updateWatchTime(videoId, accumulatedTimeRef.current);
        }
      }
    };
  }, [isPlaying, videoId, updateWatchTime]);


  const handlePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play().catch(err => console.error("Play error:", err));
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen().catch(err => console.error(err));
    }
  };

  const handleMouseMoveOnVideo = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !showVolumeSlider) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  const handleMouseLeaveVideo = () => {
    if (isPlaying && !showVolumeSlider) { 
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = window.setTimeout(() => {
        if(!showVolumeSlider) setShowControls(false);
      }, 500); 
    }
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
    const currentVideoTime = Math.floor(videoRef.current.currentTime);
  
    const currentUserUsername = user.user_metadata.username || 'Anonymous';
    const currentUserAvatarUrl = user.user_metadata.avatar_url || null;
  
    const { error: cumEventError } = await supabase.from('cum_events').insert({
      video_id: videoId,
      user_id: user.id,
      video_timestamp: currentVideoTime,
      username: currentUserUsername,
      avatar_url: currentUserAvatarUrl,
    });
  
    if (cumEventError) {
      console.error('Error recording cum event:', cumEventError);
      return;
    }
  
    await supabase.from('cum_markers').insert({
      video_id: videoId,
      user_id: user.id,
      timestamp: currentVideoTime
    });

    await supabase.from('messages').insert({
      sender_id: user.id,
      content: `💦 ${currentUserUsername} just came at ${formatDuration(currentVideoTime)}! 💦`,
      created_at: new Date().toISOString(),
      is_event_message: true, 
    });
  
    const timerDuration = cumStartTimeRef.current
      ? Math.floor((Date.now() - cumStartTimeRef.current) / 1000)
      : 0;
    const { data: userData } = await supabase
      .from('users')
      .select('cum_count, total_cum_duration')
      .eq('id', user.id)
      .single();
  
    if (userData) {
      await supabase
        .from('users')
        .update({
          cum_count: (userData.cum_count || 0) + 1,
          total_cum_duration: (userData.total_cum_duration || 0) + timerDuration,
        })
        .eq('id', user.id);
    }
    cumStartTimeRef.current = null;
  };

  const startCumTimer = () => {
    cumStartTimeRef.current = Date.now();
  };

  const handleSkipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  const handleTimelineChange = (value: number[]) => {
      if (!videoRef.current || !duration) return;
      const newTime = value[0];
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
  };

  const handleTimelinePointerDown = () => {
    setIsDraggingTimeline(true);
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause(); // Sürüklerken videoyu duraklat
    }
  };
  
  const handleTimelinePointerUp = () => {
    setIsDraggingTimeline(false);
    // Kullanıcı sürüklemeyi bitirdiğinde, eğer video daha önce oynuyorsa ve duraklatıldıysa tekrar başlat.
    // Ancak, eğer video zaten duraklatılmışsa, kullanıcı manuel olarak başlatmalı.
    // Bu kısım için ek bir state (wasPlayingBeforeDrag gibi) tutmak gerekebilir.
    // Şimdilik, basitçe eğer video oynuyorduysa oynatmaya devam etmeyelim, kullanıcı manuel başlatsın.
  };


  const handleMarkerClick = (timestamp: number) => {
    if (videoRef.current) {
      const wasPaused = videoRef.current.paused; 
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
      if (!wasPaused) { 
        videoRef.current.play().catch(err => console.error("Play error on marker click:", err));
      }
    }
  };
  
  const handleVolumeMouseEnter = () => {
    if (volumeControlTimeoutRef.current) {
      clearTimeout(volumeControlTimeoutRef.current);
    }
    setShowControls(true); 
    setShowVolumeSlider(true);
  };

  const handleVolumeMouseLeave = () => {
    volumeControlTimeoutRef.current = window.setTimeout(() => {
      setShowVolumeSlider(false);
       if (isPlaying && controlsTimeoutRef.current === null) { 
        handleMouseMoveOnVideo(); 
      }
    }, 200);
  };
  
  const hasCumMarkers = Object.keys(groupedMarkers).length > 0;

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
        videoRef.current.muted = newVolume === 0;
        videoRef.current.volume = newVolume; 
    }
    setIsMuted(newVolume === 0);
  };

  return (
    <div 
      ref={videoContainerRef}
      className="group/videoplayer relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
      onMouseMove={handleMouseMoveOnVideo}
      onMouseLeave={handleMouseLeaveVideo} 
    >
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full"
        onClick={handlePlay}
        onEnded={() => {
          setShowControls(true);
        }}
      />

      <div 
        className={cn(
          "absolute bottom-3 left-1/2 w-[96%] -translate-x-1/2", 
          "rounded-lg bg-black/50 px-2.5 py-2 backdrop-blur-sm shadow-md",
          "transition-opacity duration-300",
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <TooltipProvider>
          {/* Timeline Container (Marker Bar + Slider) */}
          <div className="relative mb-2 h-5 w-full"> {/* Yüksekliği markerlar ve slider için ayarla */}
            
            {/* Cum Markers Bar (Slider'ın altında kalacak) */}
            {duration > 0 && hasCumMarkers && (
              <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[5] h-1 w-full -translate-y-1/2 rounded-full bg-gray-500/30">
                 {/* İsteğe bağlı: Marker bar için arka plan */}
              </div>
            )}

            {/* Shadcn Slider for Timeline (Markerların üzerinde) */}
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              className="absolute inset-x-0 top-1/2 z-10 h-1.5 -translate-y-1/2" // Daha ince slider track'ı
              onValueChange={handleTimelineChange}
              onPointerDown={handleTimelinePointerDown}
              onPointerUp={handleTimelinePointerUp}
              aria-label="Video timeline"
            />
            
            {/* Cum Markers (Görsel olarak Slider'ın üzerinde gibi, ama tıklama Slider üzerinden) */}
            {duration > 0 && hasCumMarkers && (
              <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[15] flex h-full w-full -translate-y-1/2 items-center">
                {Object.entries(groupedMarkers).map(([timestamp, markers]) => (
                  <Tooltip 
                    key={`tooltip-group-${timestamp}`} 
                    delayDuration={0} 
                    open={activeMarkerTimestampForTooltip === Number(timestamp) || undefined}
                  >
                    <TooltipTrigger asChild>
                       {/* Marker'ı tıklanabilir yapmak için bir div, ama Slider'ın altında kalmalı */}
                       <div
                        className="pointer-events-auto absolute -top-1.5 flex h-5 cursor-pointer items-center justify-center" // Tıklama alanını artır
                        style={{
                          left: `${(Number(timestamp) / duration) * 100}%`,
                          transform: 'translateX(-50%)',
                        }}
                        onClick={(e) => { // Slider'ın tıklanmasını engelleme, marker'a tıklandığında video zamanını ayarla
                          e.stopPropagation(); 
                          handleMarkerClick(Number(timestamp));
                        }}
                      >
                        <div className="flex -space-x-2"> 
                          {markers.slice(0, 3).map((marker, markerIndex) => (
                            <img
                              key={marker.id}
                              src={marker.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${marker.userId}`}
                              alt={marker.username}
                              className="h-4 w-4 rounded-full ring-1 ring-black/60 md:h-5 md:w-5" 
                              style={{ zIndex: markers.length - markerIndex }}
                            />
                          ))}
                          {markers.length > 3 && (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-600 text-[0.6rem] font-semibold text-white ring-1 ring-black/60 md:h-5 md:w-5">
                              +{markers.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="center"
                      className="max-w-xs rounded-md bg-black/80 px-2 py-1 text-xs text-white shadow-lg z-50"
                    >
                      <div className="flex flex-col items-center text-center">
                        {markers.slice(0, 3).map(marker => (
                          <div key={marker.id} className="flex items-center py-0.5">
                            <img src={marker.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${marker.userId}`} alt={marker.username} className="mr-1.5 h-3 w-3 rounded-full"/>
                            <span className="text-[0.7rem]">{marker.username}</span>
                          </div>
                        ))}
                        {markers.length > 3 && (
                          <span className="mt-0.5 text-[0.6rem] text-gray-300"> (+{markers.length - 3} others)</span>
                        )}
                        <span className="mt-0.5 text-[0.6rem] text-gray-400">
                          came at {formatDuration(Number(timestamp))}
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
          
          {/* CONTROLS ROW */}
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1 md:gap-1.5">
                <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                    <button onClick={handlePlay} className="rounded-full p-1.5 text-white" aria-label={isPlaying ? "Pause (K or Space)" : "Play (K or Space)"}>
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center"><p>{isPlaying ? "Pause (K or Space)" : "Play (K or Space)"}</p></TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                    <button onClick={handleSkipBackward} className="rounded-full p-1.5 text-white" aria-label="Skip Backward (J or ←)">
                        <SkipBack className="h-5 w-5" />
                    </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center"><p>Skip Backward (J or ←)</p></TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                    <button onClick={handleSkipForward} className="rounded-full p-1.5 text-white" aria-label="Skip Forward (L or →)">
                        <SkipForward className="h-5 w-5" />
                    </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center"><p>Skip Forward (L or →)</p></TooltipContent>
                </Tooltip>

                <div 
                    className="relative flex items-center"
                    onMouseEnter={handleVolumeMouseEnter}
                    onMouseLeave={handleVolumeMouseLeave}
                >
                    <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                        <button
                        onClick={() => {
                            const newMuted = !isMuted;
                            setIsMuted(newMuted);
                            if(videoRef.current) {
                                videoRef.current.muted = newMuted;
                                if (newMuted) {
                                    videoRef.current.volume = 0; 
                                } else if (volume === 0) { 
                                    const defaultVolume = 0.5;
                                    setVolume(defaultVolume);
                                    videoRef.current.volume = defaultVolume;
                                } else {
                                   if(videoRef.current) videoRef.current.volume = volume; 
                                }
                            }
                        }}
                        className="rounded-full p-1.5 text-white"
                        aria-label={isMuted ? "Unmute (M)" : "Mute (M)"}
                        >
                        {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center"><p>{isMuted ? "Unmute (M)" : "Mute (M)"}</p></TooltipContent>
                    </Tooltip>
                    <div 
                        className={cn(
                            "absolute left-full ml-2 origin-left transform transition-all duration-200 ease-in-out flex items-center py-1",
                            showVolumeSlider ? "w-16 md:w-20 opacity-100" : "w-0 opacity-0 pointer-events-none"
                        )}
                        style={{ transformOrigin: 'left' }}
                    >
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={1}
                          step={0.05}
                          className="w-full h-3" 
                          onValueChange={handleVolumeChange}
                          aria-label="Volume"
                        />
                    </div>
                </div>
              
                <div className={cn(
                    "ml-1.5 md:ml-2 text-xs font-medium text-white tabular-nums transition-all duration-200 ease-in-out",
                    showVolumeSlider ? "pl-16 md:pl-20" : "pl-0" 
                )}>
                    {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
                </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
              <Tooltip delayDuration={150}>
                  <TooltipTrigger asChild>
                    <button
                      onMouseDown={startCumTimer}
                      onMouseUp={handleCum}
                      onMouseLeave={() => { cumStartTimeRef.current = null; }}
                      onTouchStart={startCumTimer}
                      onTouchEnd={handleCum}
                      className="rounded-full p-1.5 text-white text-xl leading-none"
                      aria-label="Mark 'Cum' Point"
                    >
                      💦
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center"><p>Mark "Cum" Point</p></TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleFullscreen}
                    className="rounded-full p-1.5 text-white"
                    aria-label={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                  >
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="center"><p>{isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </div>

      {showCumAnimation && activeCumEvent && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
          {emojis.map((emoji) => (
            <div
              key={emoji.id}
              className="absolute animate-cum text-3xl md:text-4xl"
              style={{
                top: emoji.style.top,
                left: emoji.style.left,
                animationDelay: emoji.style.animationDelay,
              }}
            >
              {emoji.emoji}
            </div>
          ))}
          <div className="rounded-lg bg-white/90 px-6 py-3 text-xl font-bold text-gray-900 shadow-2xl md:px-8 md:py-4 md:text-2xl">
            {activeCumEvent.username || 'Birisi'} boşaldı 💦
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;