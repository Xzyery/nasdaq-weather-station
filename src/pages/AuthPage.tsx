import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import DisclaimerModal from '../components/DisclaimerModal';

interface AuthPageProps {
  onSuccess?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  const { login, register } = useAuth();

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
  };

  const handleDisclaimerReject = () => {
    // 关闭页面
    window.close();
    // 如果 window.close() 不起作用（非脚本打开的窗口），则跳转到空白页
    window.location.href = 'about:blank';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // 验证
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    
    if (!isLogin && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login({ email, password });
        setSuccess('登录成功！');
      } else {
        await register({ email, password });
        setSuccess('注册成功！您现在有7天免费试用期。');
      }
      
      // 短暂延迟后回调
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || '操作失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* 免责声明弹窗 */}
      {showDisclaimer && (
        <DisclaimerModal 
          onAccept={handleDisclaimerAccept}
          onReject={handleDisclaimerReject}
        />
      )}
      
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">宏观气象站</h1>
          <p className="text-slate-400">专业的宏观经济指标监控平台</p>
        </div>
        
        {/* Card */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">
          {/* Tabs */}
          <div className="flex mb-6 bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              注册
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                邮箱地址
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6个字符"
                  className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <span>{isLogin ? '登录' : '注册'}</span>
              )}
            </button>
          </form>
          
          {/* Trial Info */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <p className="text-sm text-indigo-300 text-center">
                🎉 新用户注册即享 <span className="font-bold">7天免费试用</span>，可访问所有功能
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          数据来源: FRED (St. Louis Fed)
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
