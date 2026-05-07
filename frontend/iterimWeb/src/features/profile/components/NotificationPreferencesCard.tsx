import { useEffect, useState } from 'react';
import { Bell, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/api';

export function NotificationPreferencesCard() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getNotificationPreferences()
      .then((data) => {
        if (!cancelled) setPrefs(data);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            variant: 'error',
            title: t('notifications.preferences.errorToast'),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t, toast]);

  const update = (patch: Partial<NotificationPreferences>) => {
    setPrefs((current) => (current ? { ...current, ...patch } : current));
  };

  const handleSave = async () => {
    if (!prefs) return;
    setIsSaving(true);
    try {
      await updateNotificationPreferences(prefs);
      toast({
        variant: 'success',
        title: t('notifications.preferences.savedToast'),
      });
    } catch {
      toast({
        variant: 'error',
        title: t('notifications.preferences.errorToast'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {t('notifications.preferences.title')}
        </CardTitle>
        <CardDescription>
          {t('notifications.preferences.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading || !prefs ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : (
          <>
            {/* Master switch */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label
                  htmlFor="notif-master"
                  className="text-sm font-medium text-foreground"
                >
                  {t('notifications.preferences.master')}
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('notifications.preferences.masterDescription')}
                </p>
              </div>
              <Switch
                id="notif-master"
                checked={prefs.notificationsEnabled}
                onCheckedChange={(v) => update({ notificationsEnabled: v })}
              />
            </div>

            {/* Per-type toggles — disabled & dimmed when master is off */}
            <div
              className={cn(
                'space-y-4 border-t border-border pt-4 transition-opacity',
                !prefs.notificationsEnabled && 'opacity-50 pointer-events-none',
              )}
              aria-disabled={!prefs.notificationsEnabled}
            >
              <PrefRow
                id="notif-workitem"
                label={t('notifications.preferences.workItemAssigned')}
                checked={prefs.notifyOnWorkItemAssigned}
                disabled={!prefs.notificationsEnabled}
                onChange={(v) => update({ notifyOnWorkItemAssigned: v })}
              />
              <PrefRow
                id="notif-blocker"
                label={t('notifications.preferences.blockerResolved')}
                checked={prefs.notifyOnBlockerResolved}
                disabled={!prefs.notificationsEnabled}
                onChange={(v) => update({ notifyOnBlockerResolved: v })}
              />
              <PrefRow
                id="notif-team"
                label={t('notifications.preferences.addedToTeam')}
                checked={prefs.notifyOnAddedToTeam}
                disabled={!prefs.notificationsEnabled}
                onChange={(v) => update({ notifyOnAddedToTeam: v })}
              />
              <PrefRow
                id="notif-org"
                label={t('notifications.preferences.addedToOrganization')}
                checked={prefs.notifyOnAddedToOrganization}
                disabled={!prefs.notificationsEnabled}
                onChange={(v) => update({ notifyOnAddedToOrganization: v })}
              />
            </div>

            <p className="text-xs text-muted-foreground italic">
              {t('notifications.preferences.passwordResetNote')}
            </p>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface PrefRowProps {
  id: string;
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}

function PrefRow({ id, label, checked, disabled, onChange }: PrefRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-sm text-foreground">
        {label}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}