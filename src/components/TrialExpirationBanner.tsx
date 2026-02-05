import React from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';

interface TrialExpirationBannerProps {
  daysRemaining: number;
  onClose?: () => void;
}

const TrialExpirationBanner: React.FC<TrialExpirationBannerProps> = ({ daysRemaining, onClose }) => {
  // 根据剩余天数决定样式
  const isUrgent = daysRemaining <= 1;
  const isWarning = daysRemaining <= 3;
  
  const bgColor = isUrgent 
    ? 'bg-red-500/20 border-red-500/50' 
    : isWarning 
      ? 'bg-amber-500/20 border-amber-500/50' 
      : 'bg-blue-500/20 border-blue-500/50';
  
  const textColor = isUrgent 
    ? 'text-red-300' 
    : isWarning 
      ? 'text-amber-300' 
      : 'text-blue-300';
  
  const iconColor = isUrgent 
    ? 'text-red-400' 
    : isWarning 
      ? 'text-amber-400' 
      : 'text-blue-400';

  const getMessage = () => {
    if (daysRemaining <= 0) {
      return '您的免费试用期已结束';
    } else if (daysRemaining === 1) {
      return '您的免费试用期将在今天结束';
    } else {
      return `您的免费试用期还剩 ${daysRemaining} 天`;
    }
  };

  return (
    <div className={`${bgColor} border rounded-lg px-4 py-3 mb-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {isWarning ? (
          <AlertTriangle className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        ) : (
          <Clock className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        )}
        <p className={`${textColor} text-sm font-medium`}>
          {getMessage()}
          {daysRemaining > 0 && (
            <span className="text-slate-400 font-normal ml-2">
              请及时获取赞助码以继续使用
            </span>
          )}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-80 transition-opacity p-1`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default TrialExpirationBanner;
