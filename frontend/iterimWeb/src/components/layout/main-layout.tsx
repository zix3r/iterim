import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-100/50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Baltas "lapas" pagrindiniam turiniui su užapvalintais kampais ir lengvu šešėliu */}
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200/60 bg-white p-6 md:p-8 shadow-sm min-h-[calc(100vh-8rem)]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}