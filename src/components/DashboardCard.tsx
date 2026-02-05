import React from 'react';
import { MetricData, StatusColor } from '../types';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface Props {
  data: MetricData;
  onClick?: () => void;
}

const DashboardCard: React.FC<Props> = ({ data, onClick }) => {
  const getStatusStyles = (color: StatusColor) => {
    switch (color) {
      case StatusColor.Success:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case StatusColor.Warning:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case StatusColor.Danger:
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case StatusColor.Neutral:
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getValueColor = (color: StatusColor) => {
    switch (color) {
      case StatusColor.Success: return 'text-emerald-400';
      case StatusColor.Warning: return 'text-amber-400';
      case StatusColor.Danger: return 'text-red-400';
      default: return 'text-slate-200';
    }
  };

  const strokeColor = (() => {
    switch (data.statusColor) {
      case StatusColor.Success: return '#34d399';
      case StatusColor.Warning: return '#fbbf24';
      case StatusColor.Danger: return '#f87171';
      default: return '#94a3b8';
    }
  })();

  // 格式化数据日期
  const formatDataDate = (dateStr?: string) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`bg-slate-800 rounded-xl border border-slate-700 p-5 flex flex-col h-full shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-indigo-500/50 hover:shadow-indigo-500/10 hover:shadow-xl' : 'hover:border-slate-600'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-slate-100 font-semibold text-lg leading-tight">{data.name}</h3>
          <p className="text-slate-400 text-xs mt-1 font-mono">{data.ticker}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded text-xs font-bold border ${getStatusStyles(data.statusColor)}`}>
            {data.statusText}
          </div>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className={`text-3xl font-bold tracking-tight ${getValueColor(data.statusColor)}`}>
          {data.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
        </span>
        <span className="text-slate-400 font-medium mb-1">{data.unit}</span>
      </div>

      {data.secondaryValue !== undefined && (
         <p className="text-xs text-slate-500 mt-1">
           日内变动: <span className={data.secondaryValue >= 0 ? 'text-emerald-500' : 'text-red-500'}>{data.secondaryValue > 0 ? '+' : ''}{data.secondaryValue}%</span>
         </p>
      )}

      {/* 数据时间信息 */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <div className="flex items-center gap-1 text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>数据: {formatDataDate(data.dataDate)}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="w-3 h-3" />
          <span>{data.updateFrequency || '未知频率'}</span>
        </div>
      </div>

      <div className="mt-4 flex-grow h-16 w-full opacity-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.history}>
            <YAxis domain={['auto', 'auto']} hide />
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-slate-400 text-sm leading-relaxed">
          {data.description}
        </p>
        
        {(data.formula || data.dataRange) && (
          <div className="mt-3 flex flex-col gap-1 text-[11px] text-slate-500 border-t border-slate-700/50 pt-2">
            {data.formula && (
               <div className="flex gap-2 items-start">
                 <span className="text-slate-600 font-semibold shrink-0">公式:</span>
                 <span className="break-words leading-tight text-slate-400">{data.formula}</span>
               </div>
            )}
             {data.dataRange && (
               <div className="flex gap-2 items-start">
                 <span className="text-slate-600 font-semibold shrink-0">数据:</span>
                 <span className="text-slate-400">{data.dataRange}</span>
               </div>
            )}
          </div>
        )}

        {/* 点击提示 */}
        {onClick && (
          <div className="mt-3 text-center">
            <span className="text-xs text-indigo-400/70 hover:text-indigo-400">点击查看详细图表 →</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;