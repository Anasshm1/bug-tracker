import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DevDashboard from './pages/DevDashboard';
import ReporterDashboard from './pages/ReporterDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Page de connexion */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard DEV — protégé */}
          <Route
            path="/dev"
            element={
              <ProtectedRoute requiredRole="DEV">
                <DevDashboard />
              </ProtectedRoute>
            }
          />

          {/* Dashboard REPORTER — protégé */}
          <Route
            path="/reporter"
            element={
              <ProtectedRoute requiredRole="REPORTER">
                <ReporterDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
