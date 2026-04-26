import { Link, useLocation, useNavigate } from 'react-router';
import { Shield, Users, Activity, ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { updateMyTheme } from '@/lib/api';

const ADMIN_TABS: { labelKey: TranslationKey; path: string; icon: typeof Users }[] = [
  { labelKey: 'admin.sidebarUsers', path: '/admin/users', icon: Users },
  { labelKey: 'admin.sidebarSystem', path: '/admin/system', icon: Activity },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { resolvedTheme, theme, setTheme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-zinc-50">
      {/* Header bar */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Shield className="h-5 w-5 text-zinc-700" />
          <h1 className="text-xl font-semibold text-zinc-900">{t('header.adminPanel')}</h1>
          <div className="flex-1" />
          <LanguageToggle className="text-muted-foreground hover:text-foreground hover:bg-accent" />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleThemeToggle}
            title={resolvedTheme === 'dark' ? t('header.themeToggle.toLight') : t('header.themeToggle.toDark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {ADMIN_TABS.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {t(tab.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {children}
      </div>
    </div>
  );
}