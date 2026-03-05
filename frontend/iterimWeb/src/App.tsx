import { Routes, Route, Outlet } from 'react-router';
import { Sidebar } from '@/components/ui/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationPage } from '@/pages/OrganizationPage';

// Bendras išdėstymas su Sidebar
function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/org/:orgId" element={<OrganizationPage />} />
        {/* Pridėkite daugiau org-lygio maršrutų čia */}
      </Route>
    </Routes>
  );
}

export default App;