import { Routes, Route, Navigate, useLocation } from 'react-router';
import { MainLayout } from '@/components/layout/main-layout';
import { LanguageToggle } from '@/components/shared/LanguageToggle';
import { MyTeamsTreeProvider } from '@/context/MyTeamsTreeContext';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { OrganizationPage } from '@/features/organizations/pages/OrganizationPage';
import { ProductsListPage } from '@/features/products/pages/ProductsListPage';
import { ProductPage } from '@/features/products/pages/ProductPage';
import { TeamsListPage } from '@/features/teams/pages/TeamsListPage';
import { TeamDetailPage } from '@/features/teams/pages/TeamDetailPage';
import { ToastProvider } from '@/components/ui/toast';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { CheckEmailPage } from '@/features/auth/pages/CheckEmailPage';
import { ConfirmEmailPage } from '@/features/auth/pages/ConfirmEmailPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { BacklogPage } from '@/features/backlog/pages/BacklogPage';
import { BoardPage } from '@/features/board/pages/BoardPage';
import { AbsencesPage } from '@/features/absences/pages/AbsencesPage';
import { MetricsPage } from '@/features/metrics/pages/MetricsPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { AdminSystemPage } from '@/features/admin/pages/AdminSystemPage';
import { ThemeProvider } from '@/context/ThemeContext';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AdminOrganizationsPage } from '@/features/admin/pages/AdminOrganizationsPage';
import { QuarterPlanPage } from './features/teams/pages/QuarterPlanPage';

// Maršrutai, kuriuose nerodomas Header/AdminLayout — jiems reikia
// atskiro plūduriuojančio kalbos perjungiklio.
const PUBLIC_ROUTE_PREFIXES = [
  '/login',
  '/register',
  '/check-email',
  '/confirm-email',
  '/forgot-password',
  '/reset-password',
];

function FloatingLanguageToggle() {
  const location = useLocation();
  const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix),
  );
  if (!isPublicRoute) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <LanguageToggle className="bg-background/90 border border-border shadow-sm backdrop-blur" />
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider serverTheme={user?.theme}>
      <ErrorBoundary>
        <ToastProvider>
          <FloatingLanguageToggle />
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Admin — own layout, no sidebar */}
            <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/system" element={<AdminSystemPage />} />
            <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
            <Route
              element={
                <MyTeamsTreeProvider>
                  <MainLayout />
                </MyTeamsTreeProvider>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/org/:orgId" element={<OrganizationPage />} />
              <Route path="/org/:orgId/absences" element={<AbsencesPage />} />
              <Route path="/org/:orgId/products" element={<ProductsListPage />} />
              <Route path="/org/:orgId/products/:productId" element={<ProductPage />} />
              <Route path="/org/:orgId/products/:productId/teams" element={<TeamsListPage />} />
              <Route path="/org/:orgId/products/:productId/teams/:teamId" element={<TeamDetailPage />} />
              <Route path="/org/:orgId/products/:productId/teams/:teamId/backlog" element={<BacklogPage />} />
              <Route path="/org/:orgId/products/:productId/teams/:teamId/iterations" element={<BacklogPage />} />
              <Route path="/org/:orgId/products/:productId/teams/:teamId/board" element={<BoardPage />} />
              <Route path="/org/:orgId/products/:productId/teams/:teamId/metrics" element={<MetricsPage />} />
              <Route path="/org/:orgId/products/:productId/teams/:teamId/quarter" element={<QuarterPlanPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
