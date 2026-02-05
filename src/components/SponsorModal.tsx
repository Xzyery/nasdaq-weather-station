import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Key, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface SponsorModalProps {
  module: 'nasdaq' | 'sp500' | 'gold';
  moduleName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const SponsorModal: React.FC<SponsorModalProps> = ({ module, moduleName, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { redeemCode, sponsorLinks } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!code.trim()) {
      setError('请输入赞助码');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await redeemCode(code.trim(), module);
      setSuccess(`成功激活${moduleName}！`);
      
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || '激活失败，请检查赞助码是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const sponsorLink = sponsorLinks[module]?.link || '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">激活{moduleName}</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-slate-300">
              您的免费试用期已结束。请输入赞助码以继续使用{moduleName}。
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                赞助码
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="请输入赞助码"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all uppercase tracking-wider font-mono"
                autoFocus
              />
            </div>
            
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
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>验证中...</span>
                </>
              ) : (
                <span>激活</span>
              )}
            </button>
          </form>
          
          {/* Sponsor Link */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center mb-3">
              还没有赞助码？
            </p>
            <a
              href={sponsorLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-medium rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <span>获取赞助码</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorModal;
