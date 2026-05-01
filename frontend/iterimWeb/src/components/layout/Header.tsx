import { Link, useNavigate } from 'react-router';
import { Bell, Menu, Moon, Shield, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from './Sidebar';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { updateMyTheme } from '@/lib/api';

export function Header() {
  const { user, logout } = useAuth();
  const { resolvedTheme, theme, setTheme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleThemeToggle = async () => {
    const previousTheme = theme;
    const nextTheme = toggleTheme();

    try {
      await updateMyTheme({ theme: nextTheme });
    } catch {
      setTheme(previousTheme);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center px-4 md:px-6 gap-4">

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5 text-muted-foreground" />
                <span className="sr-only">{t('header.openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetTitle className="sr-only">{t('header.navigation')}</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-foreground tracking-tight">
          <div className="bg-primary text-primary-foreground p-1 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
              <path d="M15 9.75V7.5a.75.75 0 00-1.5 0v2.25h-3V7.5a.75.75 0 00-1.5 0v2.25H4.5v10.5a3 3 0 003 3h9a3 3 0 003-3V9.75H15z" />
            </svg>
          </div>
          Iterim
        </Link>

        <div className="flex-1" />

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleThemeToggle}
            title={resolvedTheme === 'dark' ? t('header.themeToggle.toLight') : t('header.themeToggle.toDark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">{t('header.themeToggle.srLabel')}</span>
          </Button>

          {/* Kalbos perjungimo mygtukas — perjungia tarp lt <-> en */}
          <LanguageToggle className="text-muted-foreground hover:text-foreground hover:bg-accent" />

          {user?.role === 'Admin' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => navigate('/admin')}
              title={t('header.adminPanel')}
            >
              <Shield className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            title={t('header.notifications')}
          >
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-muted text-foreground font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name ?? t('user.fallbackName')}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email ?? ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">{t('user.profile')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer focus:bg-red-500/10 focus:text-red-700"
                onClick={handleLogout}
              >
                {t('user.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}