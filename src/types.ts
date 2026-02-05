export enum StatusColor {
  Success = 'success', // Green
  Warning = 'warning', // Orange
  Danger = 'danger',   // Red
  Neutral = 'neutral', // Grey
}

export interface MetricData {
  id: string;
  name: string;
  ticker: string;
  value: number;
  unit: string;
  description: string;
  statusText: string;
  statusColor: StatusColor;
  history: { date: string; value: number }[]; // For sparkline
  // Additional fields for complex logic
  secondaryValue?: number; // e.g., for Ratio or Comparison
  formula?: string;
  dataRange?: string;
  // New fields for data timing
  dataDate?: string;       // 数据日期 (YYYY-MM-DD)
  nextUpdateTime?: string; // 下次更新时间描述
  updateFrequency?: string; // 更新频率
}

export interface DashboardState {
  metrics: MetricData[];
  lastUpdated: string;
}

export enum Scenario {
  Normal = 'NORMAL',
  HighRisk = 'HIGH_RISK',
  Opportunity = 'OPPORTUNITY',
  Divergence = 'DIVERGENCE',
}

// ========== 用户认证相关类型 ==========

export interface User {
  id: number;
  email: string;
  trial_days_left: number;
  is_trial_active: boolean;
  activated_modules: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ModuleAccessInfo {
  allowed: boolean;
  reason: 'trial' | 'activated' | 'expired';
  trial_days_left: number | null;
}

export interface SponsorLinks {
  [module: string]: {
    name: string;
    link: string;
  };
}