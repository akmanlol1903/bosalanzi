// src/components/video/VideoCard.tsx
import { useState, useEffect } from 'react'; // useEffect eklendi (cumStats için)
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
  onEdit?: () => void; // Bu prop Admin sayfasındaki VideoCard için olabilir, HomePage'deki için undefined.
  isLatest?: boolean;
}

const VideoCard = ({ video, watchTime = 0, onEdit, isLatest }: VideoCardProps) => {
  const navigate = useNavigate();
  const { deleteVideo } = useVideoStore(); // deleteVideo Admin context'inde kullanılır, burada onEdit ile benzer.
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cumStats, setCumStats] = useState<{ count: number; users: { username: string; count: number }[] } | null>(null);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Tıklamanın navigate fonksiyonunu tetiklemesini engeller
    onEdit?.();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    // Bu fonksiyon AdminVideoCard'da daha anlamlı, ancak yapı benzer.
    // Eğer bu VideoCard doğrudan silme işlemi yapıyorsa:
    // await deleteVideo(video.id);
    // Veya onEdit gibi bir onDelete prop'u olmalı.
    // Şimdilik AdminVideoCard için olduğunu varsayarak bu kısmı yoruma alıyorum,
    // çünkü HomePage'deki VideoCard'ın doğrudan deleteVideo çağırması beklenmez.
    // Eğer onEdit gibi bir onDelete prop'u varsa o kullanılmalı.
    // await deleteVideo(video.id); // Eğer bu VideoCard silme yapacaksa.
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    const fetchCumStats = async () => {
      if (!video?.id) return; // video veya video.id yoksa fonksiyondan çık
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

    fetchCumStats();
  }, [video?.id]); // video.id değiştiğinde çalışır

  // İstenen yeni sınıflar burada tanımlanıyor
  const videoCardClasses = `
    group relative h-full overflow-hidden
    rounded-xl border border-border bg-card
    shadow-custom-inset drop-shadow-md
    transition-shadow hover:shadow-sm
  `;

  return (
    <div
      className={videoCardClasses.trim()} // trim() ile baştaki/sondaki olası boşluklar temizlenir
      onClick={() => navigate(`/video/${video.id}`)}
    >
      {/* İçerik (thumbnail veya fallback) için container */}
      <div className="relative h-full w-full overflow-hidden"> {/* Bu div için ayrıca rounded-xl eklenebilir eğer üstteki overflow-hidden tam kesmiyorsa */}
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" // Resim hover efekti
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-700/30"> {/* Arka plan rengi yeni bg-card ile uyumlu hale getirilebilir, örn: bg-card-muted veya benzeri */}
            <span className="text-2xl font-semibold text-gray-400">No Thumbnail</span>
          </div>
        )}

        {/* "Today's Video" etiketi */}
        <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm md:left-6 md:top-6 md:px-4 md:py-2 md:text-sm">
          {isLatest ? (
            <span className="text-green-400">Today's Video</span>
          ) : (
            <span>{video.created_at ? formatDistanceToNow(new Date(video.created_at), { addSuffix: true }) : 'Date unknown'}</span>
          )}
        </div>

        {/* Hover'da beliren overlay ve bilgiler */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <h3 className="text-lg font-bold text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 md:text-2xl md:translate-y-4">
            {video.title}
          </h3>
          
          {video.description && (
            <p className="mt-1 text-sm text-gray-300 opacity-0 line-clamp-2 transition-all delay-100 duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 md:mt-2 md:text-base md:translate-y-4">
              {video.description}
            </p>
          )}
          
          <div className="mt-2 flex items-center justify-between opacity-0 transition-all delay-200 duration-300 group-hover:opacity-100 md:mt-4">
            {!onEdit ? ( // Sadece HomePage'deki kartta (onEdit prop'u yokken) bu bilgiler gösterilir
              <div className="space-y-1 md:space-y-2">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-1 text-xs text-gray-300 md:gap-1.5 md:text-sm">
                    <Clock className="h-3.5 w-3.5 text-blue-400 md:h-4 md:w-4" />
                    <span>{watchTime}s watched</span>
                  </div>
                  
                  {/* Views bilgisi için bir alan (veritabanından gelmiyorsa kaldırılabilir veya izlenme sayısı eklenebilir) */}
                  {/* <div className="flex items-center gap-1 text-xs text-gray-300 md:gap-1.5 md:text-sm">
                    <Eye className="h-3.5 w-3.5 text-purple-400 md:h-4 md:w-4" />
                    <span>Views</span> 
                  </div> */}
                </div>

                {cumStats && (
                  <div className="flex items-center gap-1 text-xs text-gray-300 md:gap-1.5 md:text-sm">
                    <Users className="h-3.5 w-3.5 text-pink-400 md:h-4 md:w-4" />
                    <span>{cumStats.count} cums by {cumStats.users.length} users</span>
                  </div>
                )}

                {/* Opsiyonel: En çok cum yapan kullanıcılar (çok uzarsa kaldırılabilir) */}
                {/* {cumStats?.users.slice(0, 1).map(user => ( // Örneğin sadece ilk kullanıcıyı göster
                  <div key={user.username} className="text-xs text-gray-400 truncate">
                    Most cums by: @{user.username} ({user.count})
                  </div>
                ))} */}
              </div>
            ) : (
              // Bu kısım AdminPage'deki VideoCard (AdminVideoCard) için geçerli
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1.5 rounded-full bg-gray-700/50 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-gray-600 md:px-4 md:text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500 hover:text-white md:px-4 md:text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Silme onayı modalı (onEdit varsa yani Admin context'indeyse mantıklı) */}
      {showDeleteConfirm && onEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-gray-800 p-6 text-center shadow-xl">
            <h3 className="mb-4 text-lg font-medium text-white">Delete Video</h3>
            <p className="mb-6 text-gray-300">
              Are you sure you want to delete "{video.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(); // Bu fonksiyonun deleteVideo'yu çağırması gerekir.
                                  // Veya AdminVideoCard'daki gibi bir onDelete prop'u ile dışarıdan yönetilmeli.
                                  // Şimdilik sadece modalı kapatıyor. Gerçek silme işlemi için
                                  // AdminVideoCard'daki onDelete prop'unu buraya da taşımanız/kullanmanız gerekebilir.
                  onDelete?.(); // Eğer AdminVideoCard'daysa bu çağrılır.
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
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