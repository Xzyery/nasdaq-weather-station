import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials, SponsorLinks } from '../types';
import * as authService from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  redeemCode: (code: string, module: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  sponsorLinks: SponsorLinks;
  canAccessModule: (module: string) => boolean;
  getTrialDaysRemaining: () => number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: authService.getToken(),
    isAuthenticated: false,
    isLoading: true,
  });
  
  const [sponsorLinks, setSponsorLinks] = useState<SponsorLinks>({});

  // 初始化：检查本地token并获取用户信息
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token无效，清除
          authService.clearToken();
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
      
      // 获取赞助链接
      try {
        const links = await authService.getSponsorLinks();
        setSponsorLinks(links);
      } catch (error) {
        console.error('Failed to fetch sponsor links:', error);
      }
    };
    
    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setState({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await authService.register(credentials);
    setState({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const redeemCode = useCallback(async (code: string, module: string) => {
    const response = await authService.redeemSponsorCode(code, module);
    // 更新用户信息
    setState(prev => ({
      ...prev,
      user: response.user,
    }));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const canAccessModule = useCallback((module: string): boolean => {
    if (!state.user) return false;
    
    // 试用期内可以访问所有模块
    if (state.user.is_trial_active && state.user.trial_days_left > 0) {
      return true;
    }
    
    // 检查是否已激活该模块
    return state.user.activated_modules.includes(module);
  }, [state.user]);

  const getTrialDaysRemaining = useCallback((): number | null => {
    if (!state.user) return null;
    if (!state.user.is_trial_active) return 0;
    return state.user.trial_days_left;
  }, [state.user]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        redeemCode,
        refreshUser,
        sponsorLinks,
        canAccessModule,
        getTrialDaysRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
