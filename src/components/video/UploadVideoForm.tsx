// src/components/video/UploadVideoForm.tsx
import { FormEvent, useState, useEffect } from 'react';
import { Upload /*, X */ } from 'lucide-react'; // X ikonu artık Dialog tarafından sağlanacak
import { useVideoStore } from '../../stores/videoStore';
import { Database } from '../../lib/database.types';
// DialogHeader ve DialogTitle importları buraya eklenebilir eğer form içinde başlık isteniyorsa
// import { DialogHeader, DialogTitle } from '@/components/ui/dialog';


type Video = Database['public']['Tables']['videos']['Row'];

interface UploadVideoFormProps {
  onClose: () => void;
  editVideo?: Video;
}

const UploadVideoForm = ({ onClose, editVideo }: UploadVideoFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { uploadVideo, updateVideo } = useVideoStore();

  useEffect(() => {
    if (editVideo) {
      setTitle(editVideo.title);
      setDescription(editVideo.description || '');
      setUrl(editVideo.url);
      setThumbnailUrl(editVideo.thumbnail_url || '');
    }
  }, [editVideo]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title || !url) {
      setError('başlık ve video urlsi gereklidir');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const videoData = {
        title,
        description,
        url,
        thumbnail_url: thumbnailUrl || undefined
      };

      let success;
      if (editVideo) {
        success = await updateVideo(editVideo.id, videoData);
      } else {
        success = await uploadVideo(videoData);
      }
      
      if (success) {
        onClose(); // Form başarıyla gönderilince dialog'u kapat
      } else {
        setError('video yüklenemedi. yönetici yetkiniz olmayabilir.');
      }
    } catch (err) {
      console.error(err);
      setError('video yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Dialog içinde olduğundan, dış sarmalayıcı ve başlık/kapatma kısmı DialogContent'e bırakıldı.
    // Bu kısım doğrudan DialogContent içine yerleştirilecek.
    // Bu nedenle <div className="fixed inset-0 ..."> ve başlık kısmı kaldırıldı.
    // Dialog'un kendi padding'i olacağından p-6 buradan kaldırılabilir.
    <div className="w-full rounded-lg bg-gray-800 p-6 shadow-lg"> {/* Bu div'e artık gerek yok, AdminPage'deki DialogContent'in padding'i ayarlanacak. */}
      {/* Başlık ve kapatma butonu Dialog tarafından sağlanacak */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-4">
         <h2 className="text-xl font-semibold">{editVideo ? 'videoyu düzenle' : 'yeni video yükle'}</h2>
         {/* Kapatma butonu Dialog'da olduğu için bu kaldırılabilir veya DialogClose ile değiştirilebilir */}
         {/*
         <button
            className="rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
            onClick={onClose}
            aria-label="kapat"
          >
            <X className="h-5 w-5" />
          </button>
          */}
       </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-300">
            başlık *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="video başlığını girin"
            required
          />
        </div>
        
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-300">
            açıklama
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="video açıklamasını girin"
            rows={3}
          />
        </div>
        
        <div>
          <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-300">
            video urlsi *
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="video urlsi girin"
            required
          />
          <p className="mt-1 text-xs text-gray-400">
            video dosyasının tam url'sini girin (mp4, webm, vb.)
          </p>
        </div>
        
        <div>
          <label htmlFor="thumbnailUrl" className="mb-1 block text-sm font-medium text-gray-300">
            küçük resim urlsi
          </label>
          <input
            type="url"
            id="thumbnailUrl"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="küçük resim urlsi girin"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            className="rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={onClose} // Dialog'un kendi kapatma mekanizması da kullanılabilir.
            disabled={isLoading}
          >
            iptal
          </button>
          <button
            type="submit"
            className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                {editVideo ? 'güncelleniyor...' : 'yükleniyor...'}
              </span>
            ) : (
              <span className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                {editVideo ? 'videoyu güncelle' : 'videoyu yükle'}
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadVideoForm;