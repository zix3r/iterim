import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { LayoutDashboard, Briefcase, ChevronLeft, LogOut, ClipboardList, Users2, Info, CalendarX2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { LucideIcon } from 'lucide-react';

// 1. Standardized nav link component (Monochrome style)
interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}

const NavLink = ({ to, icon: Icon, label, active }: NavLinkProps) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
      active 
        ? "bg-zinc-900 text-white shadow-md" 
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
    )}
  >
    <Icon className={cn("h-4 w-4", active ? "text-white" : "text-zinc-400")} />
    {label}
  </Link>
);

export function SidebarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgId, productId, teamId } = useParams();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-zinc-50 border-r border-zinc-200">
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          
          {/* LEVEL 1: Dashboard */}
          <NavLink 
            to="/dashboard" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={location.pathname === '/dashboard'} 
          />

          {/* LEVEL 2: Organization Menu */}
          {orgId && (
            <div className="mt-6 space-y-1">
              <Link to="/dashboard" className="flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 mb-4 px-2 group transition-colors">
                <ChevronLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-1" />
                Wait, back
              </Link>
              
              <div className="px-2 mb-2">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Organization</h3>
              </div>
              
              <NavLink 
                to={`/org/${orgId}`} 
                icon={Info} 
                label="Overview"
                active={location.pathname === `/org/${orgId}`} 
              />
              <NavLink 
                to={`/org/${orgId}/products`} 
                icon={Briefcase} 
                label="Products" 
                active={location.pathname.includes('/products') && !productId} 
              />
              <NavLink
                to={`/org/${orgId}/absences`}
                icon={CalendarX2}
                label="Absences"
                active={location.pathname === `/org/${orgId}/absences`}
              />
            </div>
          )}

          {/* LEVEL 3: Product Menu */}
          {orgId && productId && (
            <div className="mt-6 pt-6 border-t border-zinc-200 space-y-1">
               <Link to={`/org/${orgId}/products`} className="flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 mb-4 px-2 group transition-colors">
                <ChevronLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-1" />
                All Products
              </Link>

              <div className="px-2 mb-2">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Product</h3>
              </div>

              <NavLink 
                to={`/org/${orgId}/products/${productId}`} 
                icon={Info} 
                label="Overview" 
                active={location.pathname === `/org/${orgId}/products/${productId}`} 
              />
              <NavLink 
                to={`/org/${orgId}/products/${productId}/teams`} 
                icon={Users2} 
                label="Teams" 
                active={location.pathname.includes('/teams') && !teamId} 
              />
            </div>
          )}

          {/* LEVEL 4: Team Menu */}
          {orgId && productId && teamId && (
            <div className="mt-6 pt-6 border-t border-zinc-200 space-y-1">
               <Link to={`/org/${orgId}/products/${productId}/teams`} className="flex items-center text-xs font-medium text-zinc-500 hover:text-zinc-900 mb-4 px-2 group transition-colors">
                <ChevronLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-1" />
                All Teams
              </Link>

              <div className="px-2 mb-2">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Team</h3>
              </div>

              <NavLink 
                to={`/org/${orgId}/products/${productId}/teams/${teamId}`} 
                icon={Info} 
                label="Overview" 
                active={location.pathname === `/org/${orgId}/products/${productId}/teams/${teamId}`} 
              />
              <NavLink 
                to={`/org/${orgId}/products/${productId}/teams/${teamId}/backlog`} 
                icon={ClipboardList} 
                label="Backlog" 
                active={location.pathname.includes('/backlog')} 
              />
              <NavLink 
                to={`/org/${orgId}/products/${productId}/teams/${teamId}/board`} 
                icon={ClipboardList} 
                label="Board" 
                active={location.pathname.includes('/board')} 
              />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM: User & Logout */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-100/50">
        {user && (
          <div className="px-2 mb-4">
            <p className="text-sm font-semibold text-zinc-900 truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 transition-colors gap-3" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// Wrapper for desktop
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col z-10">
      <SidebarContent />
    </aside>
  );
}