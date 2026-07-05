import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { Bug, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Si déjà connecté, rediriger
  if (user) {
    const redirect = user.role === 'DEV' ? '/dev' : '/reporter';
    return <Navigate to={redirect} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser(email, password);
      login(response);

      // Rediriger selon le rôle
      if (response.role === 'DEV') {
        navigate('/dev');
      } else {
        navigate('/reporter');
      }
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">
            <Bug />
          </div>
          <span className="logo-text">Bug Tracker</span>
        </div>
        <p className="subtitle">Connectez-vous pour accéder à votre espace</p>

        {/* Erreur */}
        {error && (
          <div className="login-error" id="login-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Mail />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <Lock />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            id="btn-login"
          >
            {loading ? <span className="spinner"></span> : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
