import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { 
  LayoutDashboard, Settings, Briefcase, ChevronLeft, 
  LogOut, ClipboardList, Users2, Layers, Info, View
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { LucideIcon } from 'lucide-react';

// 1. Standartizuotas nuorodų komponentas ("Jira" stilius)
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
        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    )}
  >
    <Icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400")} />
    {label}
  </Link>
);

export function SidebarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orgId, productId } = useParams();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 border-r border-slate-200">
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          
          {/* 1 LYGIS: Dashboard (Rodoma visada viršuje) */}
          <NavLink 
            to="/dashboard" 
            icon={LayoutDashboard} 
            label="Mano Organizacijos" 
            active={location.pathname === '/dashboard'} 
          />

          {/* 2 LYGIS: Organizacijos meniu (Rodoma jei parinkta org) */}
          {orgId && (
            <div className="mt-6 space-y-1">
              <Link to="/dashboard" className="flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 mb-4 px-2 group transition-colors">
                <ChevronLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-1" />
                Visi sąrašai
              </Link>
              
              <div className="px-2 mb-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organizacija</h3>
              </div>
              
              <NavLink 
                to={`/org/${orgId}`} 
                icon={View} 
                label="Apžvalga"
                active={location.pathname === `/org/${orgId}`} 
              />
              <NavLink 
                to={`/org/${orgId}/products`} 
                icon={Briefcase} 
                label="Produktai" 
                active={location.pathname.includes('/products') && !productId} 
              />
              <NavLink 
                to={`/org/${orgId}/settings`} 
                icon={Settings} 
                label="Nustatymai" 
                active={location.pathname.includes('/settings')} 
              />
            </div>
          )}

          {/* 3 LYGIS: Produkto meniu (Rodoma tik jei esame produkte) */}
          {orgId && productId && (
            <div className="mt-6 pt-6 border-t border-slate-200 space-y-1">
               <Link to={`/org/${orgId}/products`} className="flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 mb-4 px-2 group transition-colors">
                <ChevronLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-1" />
                Visi produktai
              </Link>

              <div className="px-2 mb-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produktas</h3>
              </div>

              <NavLink 
                to={`/org/${orgId}/products/${productId}`} 
                icon={Info} 
                label="Apžvalga" 
                active={location.pathname === `/org/${orgId}/products/${productId}`} 
              />
              <NavLink 
                to={`/org/${orgId}/products/${productId}/backlog`} 
                icon={ClipboardList} 
                label="Backlog" 
                active={location.pathname.includes('/backlog')} 
              />
              <NavLink 
                to={`/org/${orgId}/products/${productId}/teams`} 
                icon={Users2} 
                label="Komandos" 
                active={location.pathname.includes('/teams')} 
              />
              <NavLink 
                to={`/org/${orgId}/products/${productId}/iterations`} 
                icon={Layers} 
                label="Iteracijos" 
                active={location.pathname.includes('/iterations')} 
              />
            </div>
          )}
        </div>
      </div>

      {/* APAČIA: Vartotojas ir Atsijungimas */}
      <div className="p-4 border-t border-slate-200 bg-slate-100/50">
        {user && (
          <div className="px-2 mb-4">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors gap-3" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Atsijungti
        </Button>
      </div>
    </div>
  );
}

// Staliniams kompiuteriams skirtas apvalkalas
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 flex-col z-10">
      <SidebarContent />
    </aside>
  );
}