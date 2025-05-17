// src/components/layout/Sidebar.tsx

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, Trophy, LogOut, User, Settings, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate(); // useNavigate('/') navigate() olarak değiştirildi.
  const { user, signOut, isAdmin } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        // More menüsü dışına tıklanınca, eğer admin sayfasında değilsek hover'ı kaldır
        if (location.pathname !== '/admin') {
          // Bu satır doğrudan hover'ı kaldırmaz ama menüyü kapatır,
          // hover'ı yönetmek için CSS'e veya state'e ihtiyacımız var.
          // Ancak, daha basit bir çözüm menüyü kapatmaktır.
        }
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [location.pathname]); // location.pathname bağımlılıklara eklendi

  const isActive = (path: string) => location.pathname === path;

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin');
      setShowMoreMenu(false); // Admin paneline gidince menüyü kapat
    }
  };

  const handleSignOutClick = () => {
    setShowUserMenu(false);
    signOut();
    navigate('/'); // Çıkış yapınca ana sayfaya yönlendir
  };

  // Admin Panel butonunun aktif ve hover durumunu yönetmek için yeni bir değişken
  const isAdminButtonActive = isActive('/admin');

  return (
    <div className="relative flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* ... (Logo ve diğer menü elemanları aynı kalacak) ... */}
      <div className="gap-2 ml-3 mt-4 flex flex-row items-center p-2">
        <div className="flex items-baseline gap-1">
          <span className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 montserrat-black text-2xl font-bold text-white select-none">
            boşalanzi
          </span>
        </div>
      </div>

      <nav className="relative flex w-full min-w-0 flex-col p-2">
        <Link
          to="/"
          className={`
            group flex h-12 items-center justify-start rounded-lg px-3 text-base font-medium
            transition-all duration-200
            hover:bg-border/10 hover:shadow-custom-inset
            ${isActive('/') ? 'active text-foreground' : 'text-white'}
          `}
        >
          <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
            <Home className={`icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110 ${isActive('/') ? 'text-foreground fill-current' : 'text-white'}`} />
          </div>
          <span className={`label transition-transform duration-200 ease group-hover:rotate-2`}>
            Home
          </span>
        </Link>

        <Link
          to="/chat"
          className={`
            group flex h-12 items-center justify-start rounded-lg px-3 text-base font-medium
            transition-all duration-200
            hover:bg-border/10 hover:shadow-custom-inset
            ${isActive('/chat') ? 'active text-foreground' : 'text-white'}
          `}
        >
          <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
            <MessageSquare className={`icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110 ${isActive('/chat') ? 'text-foreground fill-current' : 'text-white'}`} />
          </div>
          <span className={`label transition-transform duration-200 ease group-hover:rotate-2`}>
            Chat
          </span>
        </Link>

        <Link
          to="/leaderboard"
          className={`
            group flex h-12 items-center justify-start rounded-lg px-3 text-base font-medium
            transition-all duration-200
            hover:bg-border/10 hover:shadow-custom-inset
            ${isActive('/leaderboard') ? 'active text-foreground' : 'text-white'}
          `}
        >
            <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
            <Trophy className={`icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110 ${isActive('/leaderboard') ? 'text-foreground fill-current' : 'text-white'}`} />
          </div>
          <span className={`label transition-transform duration-200 ease group-hover:rotate-2`}>
            Leaderboard
          </span>
        </Link>

        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`
              group flex w-full h-12 items-center justify-start rounded-lg px-3 text-base font-medium
              transition-all duration-200
              hover:bg-border/10 hover:shadow-custom-inset
              ${showMoreMenu ? 'bg-border/10 shadow-custom-inset text-foreground' : 'text-white'}
            `}
          >
              <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
              <MoreHorizontal className={`icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110 ${showMoreMenu ? 'text-foreground fill-current' : 'text-white'}`} />
            </div>
            <span className={`label font-medium transition-transform duration-200 ease group-hover:rotate-2`}>
              More
            </span>
          </button>

          {showMoreMenu && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 z-50 ml-2 w-max space-y-1 rounded-xl bg-popover p-2 shadow-lg border border-gray-800 transform">
              <button
                onClick={handleAdminClick}
                className={`
                  flex w-full items-center gap-2 rounded-md p-3 text-sm font-medium
                  transition-all duration-200
                  text-white
                  ${isAdminButtonActive && !showMoreMenu ? 'bg-sidebar-accent text-foreground' : 'hover:bg-sidebar-accent hover:shadow-none'}
                  ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}
                `}
                disabled={!isAdmin}
              >
                <Settings className={`h-4 w-4 ${isAdminButtonActive ? 'text-foreground' : 'text-white'}`} />
                Admin Panel
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ... (Kullanıcı menüsü aynı kalacak) ... */}
      <div className="mt-auto p-4">
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
              className="group flex w-full items-center rounded-lg p-3 transition-all duration-200 hover:bg-border/10 hover:shadow-custom-inset"
          >
            <img
              src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
              alt="Avatar"
              className="h-10 w-10 rounded-full ring-2 ring-blue-500/50"
            />
            <div className="ml-3 flex-1 text-left">
              <p className="text-sm font-medium text-white">
                {user?.user_metadata?.username || 'User'}
              </p>
              <p className="text-xs text-gray-400">
                {isAdmin ? 'Admin' : 'User'}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-full space-y-1 rounded-xl bg-popover p-2 shadow-lg border border-gray-800">
              <Link
                to={`/profile/${user?.user_metadata?.username}`}
                className="flex w-full items-center gap-2 rounded-md p-3 text-sm font-medium
                         transition-all duration-200
                         text-white
                         hover:bg-sidebar-accent hover:shadow-none"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="h-4 w-4 text-white" />
                Profile
              </Link>
              <button
                onClick={handleSignOutClick}
                className="flex w-full items-center gap-2 rounded-md p-3 text-sm font-medium
                         transition-all duration-200
                         text-destructive
                         hover:bg-sidebar-accent hover:shadow-none"
              >
                <LogOut className="h-4 w-4 text-destructive" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;