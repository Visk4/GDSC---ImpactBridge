import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);

  useEffect(() => {
    if (role) localStorage.setItem('role', role);
    else localStorage.removeItem('role');
  }, [role]);

  const login = (newRole) => setRole(newRole);
  const logout = () => setRole(null);

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
