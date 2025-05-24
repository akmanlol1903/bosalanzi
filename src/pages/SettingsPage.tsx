import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const SettingsPage = () => {
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [about, setAbout] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    document.title = 'ayarlar - videochat'; // Sayfa başlığı eklendi
    if (user) {
      setUsername(user.user_metadata.username || '');
      setAvatarUrl(user.user_metadata.avatar_url || '');
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('users')
      .select('about')
      .eq('id', user.id)
      .single();

    if (data) {
      setAbout(data.about || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username,
          avatar_url: avatarUrl
        }
      });

      if (updateError) throw updateError;

      const { error: dbError } = await supabase
        .from('users')
        .update({
          username,
          avatar_url: avatarUrl,
          about
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'profil başarıyla güncellendi!' });
    } catch (error) {
      console.error('profil güncellenirken hata:', error);
      setMessage({ type: 'error', text: 'profil güncellenemedi. lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl bg-gray-800/50 p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold">profil ayarları</h1>
        
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {message.text && (
            <div className={`rounded-lg p-4 ${
              message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {message.text}
            </div>
          )}
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              kullanıcı adı
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300">
              avatar urlsi
            </label>
            <input
              type="url"
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="about" className="block text-sm font-medium text-gray-300">
              hakkımda
            </label>
            <textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-700 bg-gray-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={4}
              placeholder="kendin hakkında bir şeyler yaz..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? 'kaydediliyor...' : 'değişiklikleri kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;