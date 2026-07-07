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
      {/* Left Brand Panel */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="brand-icon">
            <Bug />
          </div>
          <h1>Bug Tracker</h1>
          <p>
            Gérez vos tickets, suivez les bugs et collaborez
            efficacement avec votre équipe de développement.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="card-heading">
            <h2>Bienvenue</h2>
            <p>Connectez-vous pour accéder à votre espace</p>
          </div>

          {error && (
            <div className="login-error" id="login-error">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

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

          <div className="login-footer">Bug Tracker v1.0</div>
        </div>
      </div>
    </div>
  );
}
