import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Bug,
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  LogOut,
} from 'lucide-react';

/**
 * Sidebar commune pour DEV et REPORTER.
 * Affiche les liens de navigation, l'info utilisateur et le bouton déconnexion.
 */
export default function Sidebar({ activeTab, onTabChange, tabs }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Mapping icônes par clé de tab
  const iconMap = {
    consultation: <LayoutDashboard />,
    statistiques: <BarChart3 />,
    'creer-ticket': <PlusCircle />,
  };

  // Initiales de l'utilisateur pour l'avatar
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Bug />
        </div>
        <span className="sidebar-title">Bug Tracker</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`sidebar-nav-item ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
            id={`nav-${tab.key}`}
          >
            {iconMap[tab.key]}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout} id="btn-logout">
          <LogOut />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
