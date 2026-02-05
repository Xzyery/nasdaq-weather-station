import { User, AuthResponse, LoginCredentials, RegisterCredentials, SponsorLinks } from '../types';

const API_BASE = 'http://localhost:5000/api';

// 获取存储的token
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// 设置token
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// 清除token
export const clearToken = (): void => {
  localStorage.removeItem('auth_token');
};

// 带认证的fetch
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};

// 注册
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '注册失败');
  }
  
  // 保存token
  setToken(data.token);
  
  return data;
};

// 登录
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '登录失败');
  }
  
  // 保存token
  setToken(data.token);
  
  return data;
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<User> => {
  const response = await authFetch(`${API_BASE}/auth/me`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '获取用户信息失败');
  }
  
  return data;
};

// 登出
export const logout = (): void => {
  clearToken();
};

// 兑换赞助码
export const redeemSponsorCode = async (code: string, module: string): Promise<AuthResponse> => {
  const response = await authFetch(`${API_BASE}/sponsor/redeem`, {
    method: 'POST',
    body: JSON.stringify({ code, module }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '激活失败');
  }
  
  return data;
};

// 获取赞助链接
export const getSponsorLinks = async (): Promise<SponsorLinks> => {
  const response = await fetch(`${API_BASE}/sponsor/links`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '获取赞助链接失败');
  }
  
  return data;
};

// 检查模块访问权限
export const checkModuleAccess = async (module: string): Promise<{
  module: string;
  module_name: string;
  allowed: boolean;
  reason: string;
  trial_days_left: number | null;
}> => {
  const response = await authFetch(`${API_BASE}/sponsor/check/${module}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || '检查权限失败');
  }
  
  return data;
};
