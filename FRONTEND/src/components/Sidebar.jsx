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
 */
export default function Sidebar({ activeTab, onTabChange, tabs }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const iconMap = {
    consultation: <LayoutDashboard />,
    statistiques: <BarChart3 />,
    'creer-ticket': <PlusCircle />,
  };

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

      {/* Footer — minimal */}
      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0</div>
      </div>
    </aside>
  );
}
