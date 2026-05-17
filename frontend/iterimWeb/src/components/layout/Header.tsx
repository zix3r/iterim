import { Link, useNavigate } from 'react-router';
import { Menu, Moon, Shield, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from './Sidebar';
import { NotificationDropdown } from './NotificationDropdown';
import { MessageSquareText } from 'lucide-react';
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
      <div className="flex h-12 items-center px-3 md:px-4 gap-2">

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">{t('header.openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[17.5rem] p-0">
              <SheetTitle className="sr-only">{t('header.navigation')}</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-1.5 font-bold text-base text-foreground tracking-tight">
          <img src="/vite.svg" alt="Iterim Logo" className="w-5 h-5" />
          Iterim
        </Link>

        <div className="flex-1" />

        {/* User Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleThemeToggle}
            title={resolvedTheme === 'dark' ? t('header.themeToggle.toLight') : t('header.themeToggle.toDark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">{t('header.themeToggle.srLabel')}</span>
          </Button>

          <LanguageToggle className="h-9 px-2.5 text-muted-foreground hover:text-foreground hover:bg-accent" />

          {user?.role === 'Admin' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => navigate('/admin')}
              title={t('header.adminPanel')}
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={() => navigate('/feedback')}
            title={t('feedback.headerButton')}
          >
            <MessageSquareText className="h-4 w-4" />
          </Button>

          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? ''} />
                  <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">{initials}</AvatarFallback>
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