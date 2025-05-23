// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { useVideoStore } from '../stores/videoStore';
import VideoCard from '../components/video/VideoCard';
import { ChevronUp, ChevronDown } from 'lucide-react';

const HomePage = () => {
  const { videos, watchTimes, fetchVideos, loading } = useVideoStore();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentIndex, videos.length, handleNext, handlePrev]);

  return (
    <div className="flex h-full items-center justify-center p-4">
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-gray-800/50 p-8 backdrop-blur-sm">
          <h2 className="mt-4 text-xl font-semibold text-gray-300">henüz video yok</h2>
          <p className="mt-2 text-gray-400">
            videolar yüklendiklerinde burada görünecektir.
          </p>
        </div>
      ) : (
        <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
          <div className="aspect-video w-full max-h-full max-w-full">
            <VideoCard
              video={videos[currentIndex]}
              watchTime={watchTimes[videos[currentIndex].id] || 0}
              isLatest={currentIndex === 0}
            />
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full bg-gray-800/80 p-2 text-white transition-opacity hover:bg-gray-700 disabled:opacity-30"
              aria-label="önceki video"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === videos.length - 1}
              className="rounded-full bg-gray-800/80 p-2 text-white transition-opacity hover:bg-gray-700 disabled:opacity-30"
              aria-label="sonraki video"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>

          <div className="absolute bottom-8 right-8 rounded-full bg-gray-800/80 px-4 py-2 text-sm font-medium text-white">
            {currentIndex + 1} / {videos.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;