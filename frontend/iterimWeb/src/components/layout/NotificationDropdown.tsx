import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  Building2,
  CheckCheck,
  CircleCheck,
  ClipboardList,
  KeyRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useLanguage } from '@/context/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import {
  getNotifications,
  getNotificationUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
  type NotificationTypeName,
} from '@/lib/api';

const POLL_INTERVAL_MS = 30_000;

const TYPE_ICON: Record<NotificationTypeName, typeof Bell> = {
  WorkItemAssigned: ClipboardList,
  BlockerResolved: CircleCheck,
  AddedToTeam: Users,
  AddedToOrganization: Building2,
  PasswordReset: KeyRound,
};

/**
 * Inserts {placeholder} values from params into a translated template.
 * If the translation lookup returned the key itself (i.e. unknown key),
 * falls back to the backend-rendered English string.
 */
function renderTranslated(
  key: string,
  params: Record<string, string> | null | undefined,
  fallback: string,
  t: (k: TranslationKey) => string,
): string {
  let text = t(key as TranslationKey);
  if (text === key) text = fallback;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, v);
    }
  }
  return text;
}

export function NotificationDropdown() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Need the latest setters inside setInterval without re-creating the timer.
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getNotificationUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // Silent fail — bell badge degrades gracefully.
    }
  }, []);

  const fetchList = useCallback(async () => {
    setIsListLoading(true);
    try {
      const res = await getNotifications(1, 20);
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      setItems([]);
    } finally {
      setIsListLoading(false);
    }
  }, []);

  // Poll unread count every 30s. Pause when tab is hidden to save battery.
  useEffect(() => {
    fetchUnreadCount();

    const intervalRef = { current: null as ReturnType<typeof setInterval> | null };
    const start = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchUnreadCount]);

  // Fetch the list when the dropdown opens.
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) fetchList();
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    setOpen(false);

    if (!notif.isRead) {
      // Optimistic update — flip immediately, server is authoritative if it fails.
      setItems((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await markNotificationAsRead(notif.id);
      } catch {
        // Roll back on failure.
        setItems((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: false } : n)),
        );
        setUnreadCount((c) => c + 1);
      }
    }

    if (notif.relatedUrl) {
      navigate(notif.relatedUrl);
    }
  };

  const handleMarkAllRead = async () => {
    if (items.every((n) => n.isRead) || isMarkingAll) return;

    setIsMarkingAll(true);
    const previousItems = items;
    const previousCount = unreadCount;

    // Optimistic
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch {
      setItems(previousItems);
      setUnreadCount(previousCount);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
          title={t('header.notifications')}
          aria-label={
            unreadCount > 0
              ? renderTranslated(
                  'notifications.unreadBadge',
                  { count: String(unreadCount) },
                  `${unreadCount} unread`,
                  t,
                )
              : t('header.notifications')
          }
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center',
                'rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white shadow-sm',
              )}
            >
              {badgeText}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-96 p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t('notifications.dropdownTitle')}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            disabled={isMarkingAll || items.every((n) => n.isRead)}
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            {t('notifications.markAllRead')}
          </Button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {isListLoading && items.length === 0 && (
            <div className="flex items-center justify-center py-10">
              <Spinner size="sm" />
            </div>
          )}

          {!isListLoading && items.length === 0 && (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {t('notifications.empty')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('notifications.emptyDescription')}
              </p>
            </div>
          )}

          {items.map((notif) => {
            const Icon = TYPE_ICON[notif.type] ?? Bell;
            const title = renderTranslated(
              notif.titleKey,
              notif.messageParams,
              notif.title,
              t,
            );
            const message = renderTranslated(
              notif.messageKey,
              notif.messageParams,
              notif.message,
              t,
            );

            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors',
                  'hover:bg-accent focus:bg-accent focus:outline-none',
                  notif.isRead ? 'bg-background' : 'bg-accent/40',
                )}
              >
                {/* Unread dot */}
                <span className="mt-1.5 flex h-2 w-2 shrink-0">
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>

                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    notif.isRead ? 'bg-muted' : 'bg-primary/10',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      notif.isRead ? 'text-muted-foreground' : 'text-primary',
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm leading-tight',
                      notif.isRead
                        ? 'font-normal text-muted-foreground'
                        : 'font-semibold text-foreground',
                    )}
                  >
                    {title}
                  </p>
                  <p
                    className={cn(
                      'mt-0.5 line-clamp-2 text-xs',
                      notif.isRead ? 'text-muted-foreground' : 'text-foreground/80',
                    )}
                  >
                    {message}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}