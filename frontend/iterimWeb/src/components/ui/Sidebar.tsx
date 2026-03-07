import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const location = useLocation();
  const { orgId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="w-64 border-r h-screen p-4 flex flex-col gap-2">
      <div className="font-bold text-xl mb-6 px-2">Iterim</div>

      <Link
        to="/dashboard"
        className={`px-4 py-2 rounded-md hover:bg-muted ${location.pathname === '/dashboard' ? 'bg-muted' : ''}`}
      >
        Dashboard
      </Link>

      {orgId && (
        <div className="mt-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase px-4 mb-2">Organization</p>
          <Link to={`/org/${orgId}`} className={`block px-4 py-2 rounded-md hover:bg-muted ${location.pathname === `/org/${orgId}` ? 'bg-muted' : ''}`}>
            Members
          </Link>
          <Link to={`/org/${orgId}/projects`} className="block px-4 py-2 rounded-md hover:bg-muted">
            Projects
          </Link>
          <Link to={`/org/${orgId}/settings`} className="block px-4 py-2 rounded-md hover:bg-muted">
            Settings
          </Link>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User + logout */}
      <div className="border-t pt-4 flex flex-col gap-2">
        {user && (
          <div className="px-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  );
}