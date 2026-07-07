import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

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
    <div className="topbar">
      <div className="topbar-user">
        <div className="topbar-user-info">
          <div className="topbar-user-name">{user?.fullName}</div>
          <div className="topbar-user-role">{user?.role}</div>
        </div>
        <div className="topbar-user-avatar">{initials}</div>
      </div>
      <button className="btn-logout-topbar" onClick={handleLogout} id="btn-logout-topbar">
        <LogOut size={18} />
        <span>Déconnexion</span>
      </button>
    </div>
  );
}
