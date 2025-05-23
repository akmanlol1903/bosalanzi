import { useState } from 'react';
import { Edit2, Trash2, Star } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import { useVideoStore } from '../../stores/videoStore';
import { cn } from '../../lib/utils';
import { tr } from 'date-fns/locale'; // türkçe yerelleştirme için

type Video = Database['public']['Tables']['videos']['Row'];

interface AdminVideoCardProps {
  video: Video;
  onEdit: () => void;
  onDelete: () => void;
}

const AdminVideoCard = ({ video, onEdit, onDelete }: AdminVideoCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { favoriteVideos, toggleFavorite } = useVideoStore();
  const isFavorited = favoriteVideos.includes(video.id);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(video.id);
  };

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
            <span className="text-xl font-semibold text-gray-400">küçük resim yok</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{video.title}</h3>
          <button
            onClick={handleFavorite}
            className="group/star relative rounded-full p-2 text-white transition-colors hover:bg-gray-600"
            aria-label={isFavorited ? "favorilerden kaldır" : "favorilere ekle"}
          >
            <Star className={cn("h-5 w-5 transition-colors", { "text-yellow-500 fill-current": isFavorited })} />
            <span className="absolute -left-20 top-1/2 hidden -translate-y-1/2 rounded bg-black/90 px-2 py-1 text-sm group-hover/star:block">
              {isFavorited ? "favorilerden kaldır" : "favorilere ekle"}
            </span>
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-400">
          yüklendi {formatDistanceToNow(new Date(video.created_at), { addSuffix: true, locale: tr })}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-gray-600"
          >
            <Edit2 className="h-4 w-4" />
            düzenle
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
            sil
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-gray-800 p-6 text-center">
            <h3 className="mb-4 text-lg font-medium">videoyu sil</h3>
            <p className="mb-6 text-gray-400">
              "{video.title}" adlı videoyu silmek istediğinizden emin misiniz? bu işlem geri alınamaz.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  onDelete();
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
              >
                sil
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg bg-gray-700 px-4 py-2 font-medium text-white hover:bg-gray-600"
              >
                iptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideoCard;