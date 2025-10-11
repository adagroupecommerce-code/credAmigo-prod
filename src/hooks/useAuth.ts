import { useState, useEffect, createContext, useContext } from 'react';
import { User, AuthState, LoginCredentials } from '../types/auth';
import { authStorage } from '../data/users';

const AuthContext = createContext<{
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
} | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const currentUser = authStorage.getCurrentUser();
    if (currentUser) {
      setAuthState({
        user: currentUser,
        isAuthenticated: true,
        loading: false
      });
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    // Simular delay de autenticação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const users = authStorage.getUsers();
    const user = users.find(u => 
      u.username === credentials.username && 
      u.password === credentials.password &&
      u.isActive
    );

    if (user) {
      // Atualizar último login
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      authStorage.saveUsers(updatedUsers);
      authStorage.setCurrentUser(updatedUser);
      
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        loading: false
      });
      return true;
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
      return false;
    }
  };

  const logout = () => {
    authStorage.setCurrentUser(null);
    setAuthState({
      user: null,
      isAuthenticated: false,
      loading: false
    });
  };

  return {
    authState,
    login,
    logout
  };
};

export { AuthContext };