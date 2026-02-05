import React from 'react';
import { AlertTriangle, LogIn, LogOut } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
  onReject: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-red-500/50 shadow-2xl shadow-red-500/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-red-500/20 border-b border-red-500/30 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-400 animate-pulse" />
          <h2 className="text-xl font-bold text-red-400">重要提示！！免责声明！！</h2>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-slate-300 leading-relaxed">
            本网站只是对 FRED 网站进行了整理和可视化，数据主要来源于 FRED，若有侵权，本站会进行删除。同时有部分数据基于自己的理解会对数据进行处理，不是售卖数据。
          </p>
          
          <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
            <p className="text-red-300 font-bold text-lg leading-relaxed">
              ⚠️ 本站仅作为指数参考，不构成投资建议！
            </p>
            <p className="text-red-300 font-bold text-lg leading-relaxed mt-2">
              ⚠️ 涨跌还会受到很多新闻以及突发事件影响，本网站指标是一个宏观参考，不构成投资建议！不能准确预测市场波动！
            </p>
            <p className="text-red-400 font-extrabold text-xl leading-relaxed mt-3 underline decoration-2">
              ⚠️ 若有不对，本站概不负责！
            </p>
          </div>
          
          <p className="text-slate-400 text-sm">
            点击"知晓并进入"表示您已阅读并同意以上免责声明。
          </p>
        </div>
        
        {/* Buttons */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onAccept}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <LogIn className="w-5 h-5" />
            <span>知晓并进入</span>
          </button>
          <button
            onClick={onReject}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            <span>退出并关闭本站</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
