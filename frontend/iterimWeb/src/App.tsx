import { Routes, Route, Outlet } from 'react-router';
import { Sidebar } from '@/components/ui/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { OrganizationPage } from '@/pages/OrganizationPage';
import { ProductsListPage } from '@/pages/ProductsListPage';
import { ProductPage } from '@/pages/ProductPage';
import { ToastProvider } from '@/components/ui/toast';

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
    <ToastProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/org/:orgId" element={<OrganizationPage />} />
          <Route path="/org/:orgId/products" element={<ProductsListPage />} />
          <Route path="/org/:orgId/products/:productId" element={<ProductPage />} />
          {/* Pridėkite daugiau org-lygio maršrutų čia */}
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;