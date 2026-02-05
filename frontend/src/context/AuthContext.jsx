import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const { data } = await authAPI.getMe();
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } catch {
        console.error('Auth check failed');
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        setUser(data.data);
        toast.success('Login successful!');
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login with OAuth token
  const loginWithToken = async (token) => {
    try {
      localStorage.setItem('token', token);
      const { data } = await authAPI.getMe();
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        return { success: true };
      }
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  };

  const register = async (username, email, password, role = 'student') => {
    try {
      const { data } = await authAPI.register({ username, email, password, role });
      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        setUser(data.data);
        
        if (role === 'teacher') {
          toast.success('Registration successful! Awaiting admin approval.');
        } else {
          toast.success('Registration successful!');
        }
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || 
                     error.response?.data?.errors?.[0]?.msg || 
                     'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await authAPI.updateProfile(profileData);
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        toast.success('Profile updated!');
        return { success: true };
      }
    } catch {
      toast.error('Failed to update profile');
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithToken,
    register,
    logout: handleLogout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    isApproved: user?.isApproved,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
