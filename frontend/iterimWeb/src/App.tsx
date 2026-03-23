import { Routes, Route, Navigate, Outlet } from 'react-router';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { OrganizationPage } from '@/features/organizations/pages/OrganizationPage';
import { ProductsListPage } from '@/features/products/pages/ProductsListPage';
import { ProductPage } from '@/features/products/pages/ProductPage';
import { TeamsListPage } from '@/features/teams/pages/TeamsListPage';
import { TeamDetailPage } from '@/features/teams/pages/TeamDetailPage';
import { ToastProvider } from '@/components/ui/toast';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { BacklogPage } from '@/features/backlog/pages/BacklogPage';
import { BoardPage } from '@/features/board/pages/BoardPage';
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
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/org/:orgId" element={<OrganizationPage />} />
            <Route path="/org/:orgId/products" element={<ProductsListPage />} />
            <Route path="/org/:orgId/products/:productId" element={<ProductPage />} />
            <Route path="/org/:orgId/products/:productId/teams" element={<TeamsListPage />} />
            <Route path="/org/:orgId/products/:productId/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/org/:orgId/products/:productId/teams/:teamId/backlog" element={<BacklogPage />} />
			      <Route path="/org/:orgId/products/:productId/teams/:teamId/iterations" element={<BacklogPage />} />
            <Route path="/org/:orgId/products/:productId/teams/:teamId/board" element={<BoardPage />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;