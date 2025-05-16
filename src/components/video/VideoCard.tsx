import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, Edit2, Trash2, Users } from 'lucide-react';
import { useVideoStore } from '../../stores/videoStore';
import { Database } from '../../lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';

type Video = Database['public']['Tables']['videos']['Row'];

interface VideoCardProps {
  video: Video;
  watchTime?: number;
  onEdit?: () => void;
  isLatest?: boolean;
}

const VideoCard = ({ video, watchTime = 0, onEdit, isLatest }: VideoCardProps) => {
  const navigate = useNavigate();
  const { deleteVideo } = useVideoStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cumStats, setCumStats] = useState<{ count: number; users: { username: string; count: number }[] } | null>(null);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    await deleteVideo(video.id);
    setShowDeleteConfirm(false);
  };

  const fetchCumStats = async () => {
    const { data: markers } = await supabase
      .from('cum_markers')
      .select('user_id')
      .eq('video_id', video.id);

    if (markers) {
      const userCounts = markers.reduce<Record<string, number>>((acc, marker) => {
        acc[marker.user_id] = (acc[marker.user_id] || 0) + 1;
        return acc;
      }, {});

      const userPromises = Object.entries(userCounts).map(async ([userId, count]) => {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', userId)
          .single();
        return { username: userData?.username || 'Unknown User', count };
      });

      const users = await Promise.all(userPromises);
      setCumStats({
        count: markers.length,
        users: users.sort((a, b) => b.count - a.count)
      });
    }
  };

  useState(() => {
    fetchCumStats();
  });

  return (
    <div
      className="group relative h-full overflow-hidden rounded-2xl bg-gray-800/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 ring-1 ring-white/10 hover:ring-yellow-500/50 backdrop-blur-sm"
      onClick={() => navigate(`/video/${video.id}`)}
    >
      <div className="relative h-full w-full overflow-hidden">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <span className="text-2xl font-semibold text-gray-400">No Thumbnail</span>
          </div>
        )}
        
        <div className="absolute left-6 top-6 rounded-full bg-black/80 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
          {isLatest ? (
            <span className="text-green-400">Today's Video</span>
          ) : (
            <span>{formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}</span>
          )}
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4">
            {video.title}
          </h3>
          
          {video.description && (
            <p className="mt-2 line-clamp-2 text-lg text-gray-300 opacity-0 transition-all delay-100 duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4">
              {video.description}
            </p>
          )}
          
          <div className="mt-4 flex items-center justify-between opacity-0 transition-all delay-200 duration-300 group-hover:opacity-100">
            {!onEdit ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-300">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>{watchTime}s watched</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-gray-300">
                    <Eye className="h-4 w-4 text-purple-400" />
                    <span>Views</span>
                  </div>
                </div>

                {cumStats && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-300">
                    <Users className="h-4 w-4 text-pink-400" />
                    <span>{cumStats.count} cums by {cumStats.users.length} users</span>
                  </div>
                )}

                {cumStats?.users.map(user => (
                  <div key={user.username} className="text-sm text-gray-400">
                    {user.username}: {user.count} times
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 rounded-full bg-gray-700/50 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-gray-600"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-gray-800 p-6 text-center">
            <h3 className="mb-4 text-lg font-medium">Delete Video</h3>
            <p className="mb-6 text-gray-400">
              Are you sure you want to delete "{video.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete();
                }}
                className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg bg-gray-700 px-4 py-2 font-medium text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;