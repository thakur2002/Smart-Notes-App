import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    try {
      const res = await axios.post('https://smartnotesappserver.onrender.com/auth/login', credentials,{withCredentials: true});
      setUser(res.data.user); // Now contains user data from server
    } catch (error) {
     // console.error('Login failed:', error.response?.data || error.message);
      throw error;
    }
  };
const logout = useCallback(async () => {
  try {
    await axios.post('https://smartnotesappserver.onrender.com/auth/logout', {}, {
      withCredentials: true
    });
  } catch (e) {
    console.error('Logout failed:', e);
  }
  setUser(null);
}, []);

  useEffect(() => {  
      const checkAuth = async () => {
    try {
      const res = await axios.get('https://smartnotesappserver.onrender.com/auth/me', {
        withCredentials: true
      });
      setUser(res.data);
    } catch (err) {
      console.error('Auth check failed:', err.response?.data || err.message);
      logout();
    }
    setLoading(false);
  };
  checkAuth();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
