import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SignIn from './pages/SignIn';
import OperationsDashboard from './pages/OperationsDashboard';
import OutletStaffDashboard from './pages/OutletStaffDashboard';
import NewIssue from './pages/NewIssue';
import IssueDetails from './pages/IssueDetails';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-benne-cream">
        <p className="text-benne-brown-muted">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-benne-cream">
        <p className="text-benne-brown-muted">Loading...</p>
      </div>
    );
  }

  if (profile?.role === 'operations_manager') {
    return <OperationsDashboard />;
  }

  if (profile?.role === 'outlet_staff') {
    return <OutletStaffDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-benne-cream">
      <div className="text-center">
        <p className="text-benne-brown-muted mb-4">No role assigned to your account</p>
        <p className="text-sm text-benne-brown-muted">Please contact your administrator</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/sign-in"
        element={user ? <Navigate to="/" replace /> : <SignIn />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues/new"
        element={
          <ProtectedRoute>
            <NewIssue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues/:id"
        element={
          <ProtectedRoute>
            <IssueDetails />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
