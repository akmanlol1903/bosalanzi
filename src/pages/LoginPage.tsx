import { MessageCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
// Arka plan CSS'inin global olarak (örn: main.tsx'te) içe aktarıldığını varsayıyoruz

const LoginPage = () => {
  const { signInWithDiscord, loading } = useAuthStore();

  return (
    // Fragment (<>) kullanarak birden fazla kök elementi sarmalıyoruz
    <>
      {/* Arka plan elementleri - Sayfanın tamamını kaplayacak */}
      <div className="fixed inset-0 bg-background"></div>
      {/* graddygrad CSS'inin ve kullandığı değişkenlerin (--primary vb.) tanımlı olduğundan emin olun */}
      {/* graddygrad'in z-index'ini de daha önce konuştuğumuz gibi gözden geçirin */}
      <div className="graddygrad fixed inset-0"></div>

      {/* Ana giriş sayfası içeriği */}
      {/* Buraya 'relative' ve 'z-10' ekledik, 'bg-gray-900' sınıfını kaldırdık */}
      {/* Orijinal radial gradient (bg-[radial-gradient(...)]) bu divde kalmaya devam etti */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-white">
        <div className="mb-8 text-center">
          <MessageCircle className="mx-auto mb-4 h-16 w-16 text-blue-500" />
          <h1 className="montserrat-black relative select-none text-[4rem] text-primary sm:text-[5rem] md:text-[8rem]">boşalanzi</h1>
          <p className="mt-2 text-gray-400">Watch, chat, and vote on videos with friends</p>
        </div>

        <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
          <h2 className="mb-6 text-xl font-semibold">Log in to continue</h2>

          <button
            onClick={signInWithDiscord}
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                {/* Spin animasyonu için tailwindcss-animate veya kendi keyframe tanımınız gerekli */}
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"></div>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center">
                {/* Discord SVG ikonu */}
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
                  <path
                    fill="#fff"
                    d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"
                  />
                </svg>
                Sign in with Discord
              </span>
            )}
          </button>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>By signing in, you agree to our terms and privacy policy.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;