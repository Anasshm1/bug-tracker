import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protégée par rôle.
 * Si l'utilisateur n'est pas connecté → redirige vers /login.
 * Si le rôle ne correspond pas → redirige vers le bon dashboard.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <span className="spinner"></span>
        <span>Chargement...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirige vers le bon dashboard selon le rôle
    const redirect = user.role === 'DEV' ? '/dev' : '/reporter';
    return <Navigate to={redirect} replace />;
  }

  return children;
}
