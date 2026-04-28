import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('role') || null);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '');
  const [orgName, setOrgName] = useState(() => localStorage.getItem('orgName') || '');

  useEffect(() => {
    if (role) localStorage.setItem('role', role);
    else localStorage.removeItem('role');
  }, [role]);

  useEffect(() => {
    if (userName) localStorage.setItem('userName', userName);
    if (orgName) localStorage.setItem('orgName', orgName);
  }, [userName, orgName]);

  const login = (newRole, name, org) => {
    setRole(newRole);
    setUserName(name || '');
    setOrgName(org || '');
  };

  const logout = () => {
    setRole(null);
    setUserName('');
    setOrgName('');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('orgName');
  };

  return (
    <AuthContext.Provider value={{ role, userName, orgName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
