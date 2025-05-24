// src/components/layout/Sidebar.tsx

import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  Settings,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import HomeIcon from '../icons/HomeIcon';
import TrophyIcon from '../icons/TrophyIcon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin');
    }
  };

  const handleSignOutClick = () => {
    signOut();
    navigate('/');
  };

  const baseItemClasses = "flex items-center gap-3 px-3 h-12 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer";

  return (
    <div className="relative flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="gap-2 ml-3 mt-4 flex flex-row items-center p-2">
        <div className="flex items-baseline gap-1">
          <span className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 montserrat-black text-2xl font-bold text-white select-none">
            boşalanzi
          </span>
        </div>
      </div>

      <nav className="relative flex w-full min-w-0 flex-col p-2 gap-1">
        <Link
          to="/"
          className={cn(
            'group flex h-12 items-center justify-start rounded-lg px-3 text-lg font-medium',
            'transition-all duration-200',
            'hover:bg-border/10 hover:shadow-custom-inset',
            isActive('/') ? 'active text-foreground' : 'text-white'
          )}
        >
          <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
            <HomeIcon
              filled={isActive('/')}
              className={cn(
                'icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110',
                isActive('/') ? 'text-foreground' : 'text-white'
              )}
            />
          </div>
          <span className="label transition-transform duration-200 ease group-hover:rotate-2">
            anasayfa
          </span>
        </Link>

        <Link
          to="/chat"
          className={cn(
            'group flex h-12 items-center justify-start rounded-lg px-3 text-lg font-medium',
            'transition-all duration-200',
            'hover:bg-border/10 hover:shadow-custom-inset',
            isActive('/chat') ? 'active text-foreground' : 'text-white'
          )}
        >
          <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
            <MessageSquare
              className={cn(
                'icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110',
                isActive('/chat') ? 'text-foreground fill-current' : 'text-white'
              )}
            />
          </div>
          <span className="label transition-transform duration-200 ease group-hover:rotate-2">
            sohbet
          </span>
        </Link>

        <Link
          to="/leaderboard"
          className={cn(
            'group flex h-12 items-center justify-start rounded-lg px-3 text-lg font-medium',
            'transition-all duration-200',
            'hover:bg-border/10 hover:shadow-custom-inset',
            isActive('/leaderboard') ? 'active text-foreground' : 'text-white'
          )}
        >
          <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
            <TrophyIcon
              filled={isActive('/leaderboard')}
              className={cn(
                'icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110',
                isActive('/leaderboard') ? 'text-foreground' : 'text-white'
              )}
            />
          </div>
          <span className="label transition-transform duration-200 ease group-hover:rotate-2">
            liderlik tablosu
          </span>
        </Link>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'group flex w-full h-12 items-center justify-start rounded-lg px-3 text-lg font-medium',
                'transition-all duration-200',
                'hover:bg-border/10 hover:shadow-custom-inset',
                'text-white data-[state=open]:bg-border/10 data-[state=open]:shadow-custom-inset data-[state=open]:text-foreground'
              )}
              aria-label="daha fazla"
            >
              <div className="relative h-5 w-5 mr-3 flex items-center justify-center">
                <MoreHorizontal className="icon h-5 w-5 transition-all duration-200 ease-in-out group-hover:scale-110" />
              </div>
              <span className="label font-medium transition-transform duration-200 ease group-hover:rotate-2">
                daha fazla
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="right"
            align="center"
            sideOffset={8}
            className="bg-popover border-gray-800 text-popover-foreground w-auto p-1"
          >
            <DropdownMenuItem
              onClick={handleAdminClick}
              disabled={!isAdmin}
              className={cn(
                baseItemClasses,
                'text-white hover:!bg-sidebar-accent focus:!bg-sidebar-accent',
                !isAdmin && 'cursor-not-allowed opacity-50'
              )}
            >
              <Settings className="h-4 w-4" />
              admin paneli
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      <div className="mt-auto p-4">
        {user ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="group flex w-full items-center rounded-lg p-3 transition-all duration-200 hover:bg-border/10 hover:shadow-custom-inset" aria-label="kullanıcı menüsü">
                <img
                  src={
                    user.user_metadata?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`
                  }
                  alt="avatar"
                  className="h-10 w-10 rounded-full ring-2 ring-blue-500/50"
                />
                <div className="ml-3 flex-1 text-left">
                  <p className="text-sm font-medium text-white">
                    {user.user_metadata?.username || 'kullanıcı'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isAdmin ? 'admin' : 'kullanıcı'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="center"
              sideOffset={8}
              className="bg-popover border-gray-800 text-popover-foreground mb-2 w-[var(--radix-dropdown-menu-trigger-width)] p-1"
            >
              <DropdownMenuItem
                asChild
                className={cn(
                  baseItemClasses,
                  "text-white hover:!bg-sidebar-accent focus:!bg-sidebar-accent"
                )}
              >
                <Link to={`/profile/${user.user_metadata?.username}`}>
                  <User className="h-4 w-4" />
                  profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOutClick}
                className={cn(
                  baseItemClasses,
                  "text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10"
                )}
              >
                <LogOut className="h-4 w-4" />
                çıkış yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="p-3 text-center text-sm text-gray-400">
            lütfen giriş yapın.
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;