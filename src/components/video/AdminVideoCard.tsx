import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { formatDistanceToNow } from 'date-fns';

type Video = Database['public']['Tables']['videos']['Row'];

interface AdminVideoCardProps {
  video: Video;
  onEdit: () => void;
  onDelete: () => void;
}

const AdminVideoCard = ({ video, onEdit, onDelete }: AdminVideoCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-lg bg-gray-800 transition-all hover:bg-gray-700">
      <div className="aspect-video">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
            <span className="text-xl font-semibold text-gray-400">No Thumbnail</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white">{video.title}</h3>
        <p className="mt-1 text-sm text-gray-400">
          Uploaded {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-gray-600"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
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
                onClick={() => {
                  onDelete();
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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

export default AdminVideoCard;