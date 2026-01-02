import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check if user is already logged in when the app starts
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // 2. Login Function (Mocks the API)
  const login = async (data: any) => {
    // In a real app, you would do: await axios.post('/api/auth/login', data)
    
    return new Promise<void>((resolve) => {
      // MOCK DATA based on the Login Form inputs
      const mockUser: User = {
        id: 'user-123',
        email: data.email,
        fullName: 'Test User', // Hardcoded for demo
        role: 'tenant_admin',  // CHANGE THIS to 'user' or 'super_admin' to test permissions!
        tenantId: data.tenantId || 'tenant-1',
        tenantName: data.tenantId ? `${data.tenantId.toUpperCase()} Corp` : 'ACME Corp'
      };

      const mockToken = 'mock-jwt-token-xyz';

      // Save state
      setUser(mockUser);
      setToken(mockToken);

      // Persist to browser storage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      resolve();
    });
  };

  // 3. Logout Function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isLoading,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use this context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};