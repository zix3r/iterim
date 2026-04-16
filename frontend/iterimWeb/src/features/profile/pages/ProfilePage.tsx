import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, LockKeyhole, Save, Upload, UserRound } from 'lucide-react';
import { addRecentPage } from '@/lib/recentPages';
import {
  changeMyPassword,
  getMyProfile,
  updateMyAvatar,
  updateMyProfile,
  type CurrentUserProfile,
} from '@/lib/api';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const avatarColors = ['#1d4ed8', '#be185d', '#0f766e', '#9a3412', '#4c1d95', '#334155'];

type ProfileErrors = {
  name?: string;
  email?: string;
};

type PasswordErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

function PasswordReq({ met, label }: { met: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${met ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
        {met
          ? <polyline points="20 6 9 17 4 12" />
          : <line x1="18" y1="6" x2="6" y2="18" />}
      </svg>
      {label}
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function toDisplayDate(isoDate: string): string {
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return isoDate;

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dt);
}

function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  if (trimmed.length > 100) return 'Name cannot exceed 100 characters.';
  return undefined;
}

function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  if (!emailRegex.test(trimmed)) return 'Invalid email format.';
  return undefined;
}

function validatePasswordStrength(password: string): string | undefined {
  if (!password) return 'New password is required.';
  if (!strongPasswordRegex.test(password)) {
    return 'Use at least 8 characters, including upper/lowercase letters and a number.';
  }
  return undefined;
}

function createInitialsAvatar(name: string, color: string): string {
  const initials = getInitials(name);
  const safeInitials = initials.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="${color}"/><text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-size="92" font-weight="700" font-family="Inter, Arial, sans-serif" fill="white">${safeInitials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [profileApiError, setProfileApiError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordApiError, setPasswordApiError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [avatarDraft, setAvatarDraft] = useState('');
  const [avatarApiError, setAvatarApiError] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  useEffect(() => {
    addRecentPage({
      path: '/profile',
      label: 'Profile',
      iconType: 'User',
    });
  }, []);

  const loadProfile = async () => {
    try {
      setLoadingError(null);
      setIsLoading(true);

      const data = await getMyProfile();
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
      setAvatarDraft(data.avatarUrl ?? '');
    } catch (err) {
      setLoadingError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const passwordStrengthChecks = useMemo(
    () => ({
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
    }),
    [newPassword],
  );

  const avatarPreview = avatarDraft || profile?.avatarUrl || '';
  const profileNameForInitials = name || profile?.name || 'User';

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: ProfileErrors = {
      name: validateName(name),
      email: validateEmail(email),
    };

    setProfileErrors(nextErrors);
    setProfileApiError('');

    if (nextErrors.name || nextErrors.email) return;

    try {
      setIsSavingProfile(true);
      const updated = await updateMyProfile({ name: name.trim(), email: email.trim() });
      setProfile(updated);
      setName(updated.name);
      setEmail(updated.email);
      await refreshUser();

      toast({
        title: 'Profile updated',
        description: 'Name and email were saved successfully.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      if (message.toLowerCase().includes('email')) {
        setProfileErrors((prev) => ({ ...prev, email: message }));
      } else {
        setProfileApiError(message);
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const nextErrors: PasswordErrors = {
      oldPassword: oldPassword ? undefined : 'Current password is required.',
      newPassword: validatePasswordStrength(newPassword),
      confirmPassword: confirmPassword ? undefined : 'Please confirm your new password.',
    };

    if (newPassword && oldPassword && newPassword === oldPassword) {
      nextErrors.newPassword = 'New password must be different from current password.';
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setPasswordErrors(nextErrors);
    setPasswordApiError('');

    if (nextErrors.oldPassword || nextErrors.newPassword || nextErrors.confirmPassword) return;

    try {
      setIsSavingPassword(true);
      await changeMyPassword({ oldPassword, newPassword });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});

      toast({
        title: 'Password changed',
        description: 'Your new password was saved successfully.',
        variant: 'success',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password.';
      if (errorMessage.toLowerCase().includes('old password is incorrect')) {
        setPasswordApiError('Current password is incorrect.');
      } else {
        setPasswordApiError(errorMessage);
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarApiError('Only image files are allowed.');
      return;
    }

    if (file.size > 1_500_000) {
      setAvatarApiError('File is too large. Maximum size is 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarDraft(reader.result);
        setAvatarApiError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInitialsAvatarPick = (color: string) => {
    const generatedAvatar = createInitialsAvatar(profileNameForInitials, color);
    setAvatarDraft(generatedAvatar);
    setAvatarApiError('');
  };

  const handleAvatarSave = async () => {
    if (!avatarDraft) {
      setAvatarApiError('Choose an avatar before saving.');
      return;
    }

    try {
      setIsSavingAvatar(true);
      setAvatarApiError('');

      const updated = await updateMyAvatar({ avatarUrl: avatarDraft });
      setProfile(updated);
      setAvatarDraft(updated.avatarUrl ?? avatarDraft);
      await refreshUser();

      toast({
        title: 'Avatar updated',
        description: 'Your new avatar was saved successfully.',
        variant: 'success',
      });
    } catch (err) {
      setAvatarApiError(err instanceof Error ? err.message : 'Failed to update avatar.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 md:p-8 max-w-6xl mx-auto py-8 text-sm text-zinc-500">Loading profile information...</div>;
  }

  if (loadingError) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 mb-4">
          {loadingError}
        </div>
        <Button onClick={loadProfile} variant="outline">Try again</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Profile"
        description="View and edit your account information"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            Personal information
          </CardTitle>
          <CardDescription>
            Edit your name and email. Registration date is read-only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleProfileSubmit} noValidate>
            {profileApiError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {profileApiError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="profile-name" className="text-sm font-medium text-zinc-700">Name</label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (profileErrors.name) {
                      setProfileErrors((prev) => ({ ...prev, name: validateName(e.target.value) }));
                    }
                  }}
                  aria-invalid={!!profileErrors.name}
                />
                {profileErrors.name && <p className="text-xs text-red-600">{profileErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="profile-email" className="text-sm font-medium text-zinc-700">Email</label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (profileErrors.email) {
                      setProfileErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                    }
                  }}
                  aria-invalid={!!profileErrors.email}
                />
                {profileErrors.email && <p className="text-xs text-red-600">{profileErrors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Registration date</label>
              <Input value={profile ? toDisplayDate(profile.createdAt) : '-'} disabled />
            </div>

            <Button type="submit" disabled={isSavingProfile} className="gap-2">
              <Save className="h-4 w-4" />
              {isSavingProfile ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LockKeyhole className="h-4 w-4" />
            Password
          </CardTitle>
          <CardDescription>
            Current password is required to make changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit} noValidate>
            {passwordApiError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {passwordApiError}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="old-password" className="text-sm font-medium text-zinc-700">Current password</label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (passwordErrors.oldPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      oldPassword: e.target.value ? undefined : 'Current password is required.',
                    }));
                  }
                }}
                aria-invalid={!!passwordErrors.oldPassword}
              />
              {passwordErrors.oldPassword && <p className="text-xs text-red-600">{passwordErrors.oldPassword}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-zinc-700">New password</label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) {
                    setPasswordErrors((prev) => ({ ...prev, newPassword: validatePasswordStrength(e.target.value) }));
                  }
                }}
                aria-invalid={!!passwordErrors.newPassword}
              />
              {passwordErrors.newPassword && <p className="text-xs text-red-600">{passwordErrors.newPassword}</p>}

              <div className="flex flex-wrap gap-2 pt-1">
                <PasswordReq met={passwordStrengthChecks.length} label="8+ characters" />
                <PasswordReq met={passwordStrengthChecks.upper} label="Uppercase letter" />
                <PasswordReq met={passwordStrengthChecks.lower} label="Lowercase letter" />
                <PasswordReq met={passwordStrengthChecks.number} label="Number" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-zinc-700">Confirm new password</label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value && e.target.value === newPassword
                        ? undefined
                        : 'Passwords do not match.',
                    }));
                  }
                }}
                aria-invalid={!!passwordErrors.confirmPassword}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-600">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" disabled={isSavingPassword} className="gap-2">
              <Save className="h-4 w-4" />
              {isSavingPassword ? 'Saving...' : 'Change password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Avatar
          </CardTitle>
          <CardDescription>
            Upload a photo or choose a colored initials avatar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {avatarApiError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {avatarApiError}
            </div>
          )}

          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
            <Avatar className="h-20 w-20 border border-zinc-200">
              <AvatarImage src={avatarPreview || undefined} alt={profileNameForInitials} />
              <AvatarFallback className="text-lg font-semibold">{getInitials(profileNameForInitials)}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <label className="inline-flex">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-zinc-200 px-3 text-sm font-medium hover:bg-zinc-50">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload photo
                </span>
              </label>
              <p className="text-xs text-zinc-500">PNG/JPG/WEBP, up to 1.5 MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">Initials color</p>
            <div className="flex flex-wrap gap-2">
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-8 w-8 rounded-full border border-zinc-200 transition-transform hover:scale-105"
                  style={{ backgroundColor: color }}
                  aria-label={`Select ${color} color`}
                  onClick={() => handleInitialsAvatarPick(color)}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleAvatarSave} disabled={isSavingAvatar} className="gap-2">
            <Save className="h-4 w-4" />
            {isSavingAvatar ? 'Saving...' : 'Save avatar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
