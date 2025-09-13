import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication on app load
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    console.log('AuthContext: Checking stored auth', { storedToken: !!storedToken, storedUser: !!storedUser });
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('AuthContext: Setting user from localStorage', parsedUser);
        setToken(storedToken);
        setUser(parsedUser);
        
        // Verify token is still valid
        console.log('AuthContext: Verifying token with /auth/me');
        fetch('/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        }).then(response => {
          console.log('AuthContext: /auth/me response', response.status, response.ok);
          if (!response.ok) {
            console.log('AuthContext: Token invalid, logging out');
            // Token is invalid, clear auth
            logout();
          } else {
            console.log('AuthContext: Token valid, keeping auth');
          }
        }).catch((error) => {
          console.log('AuthContext: /auth/me network error', error);
          // Network error, but keep auth state for now
        });
      } catch (error) {
        console.log('AuthContext: Error parsing stored data', error);
        // Invalid stored data, clear it
        logout();
      }
    } else {
      console.log('AuthContext: No stored auth found');
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    console.log('AuthContext: Login called', { userData, authToken: !!authToken });
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    console.log('AuthContext: Login completed, user and token set');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
