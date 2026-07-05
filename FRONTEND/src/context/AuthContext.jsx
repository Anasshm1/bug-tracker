import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurer la session depuis localStorage au démarrage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const fullName = localStorage.getItem('fullName');
    const role = localStorage.getItem('role');

    if (token && email && role) {
      setUser({ token, email, fullName, role });
    }
    setLoading(false);
  }, []);

  /**
   * Connecte l'utilisateur et sauvegarde dans localStorage.
   */
  function login(authResponse) {
    const userData = {
      token: authResponse.token,
      email: authResponse.email,
      fullName: authResponse.fullName,
      role: authResponse.role,
    };
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('email', userData.email);
    localStorage.setItem('fullName', userData.fullName);
    localStorage.setItem('role', userData.role);
  }

  /**
   * Déconnecte l'utilisateur.
   */
  function logout() {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
