import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CaseManagement from './pages/CaseManagement';
import CollabBoard from './pages/CollabBoard';
import AssetLibrary from './pages/AssetLibrary';
import ExportCenter from './pages/ExportCenter';
import BrandSettings from './pages/BrandSettings';
import SystemSettings from './pages/SystemSettings';
import Login from './pages/Login';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f4]">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-5 h-5 border-2 border-olive-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">載入中...</span>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/cases" element={<CaseManagement />} />
          <Route path="/collab" element={<CollabBoard />} />
          <Route path="/library" element={<AssetLibrary />} />
          <Route path="/export" element={<ExportCenter />} />
          <Route path="/brand" element={<BrandSettings />} />
          <Route path="/settings" element={<SystemSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
