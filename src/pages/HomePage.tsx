import { useEffect, useState } from 'react';
import { useVideoStore } from '../stores/videoStore';
import VideoCard from '../components/video/VideoCard';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
  }, [currentIndex, videos.length]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-gray-800/50 backdrop-blur-sm">
          <h2 className="mt-4 text-xl font-semibold text-gray-300">No videos yet</h2>
          <p className="mt-2 text-gray-400">
            Videos will appear here once they are uploaded.
          </p>
        </div>
      ) : (
        <div className="relative w-full max-w-6xl px-4">
          <div className="aspect-video w-full">
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
            >
              <ChevronUp className="h-6 w-6" />
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === videos.length - 1}
              className="rounded-full bg-gray-800/80 p-2 text-white transition-opacity hover:bg-gray-700 disabled:opacity-30"
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