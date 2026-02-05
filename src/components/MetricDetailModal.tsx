import React from 'react';
import { MetricData, StatusColor } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { X, Calendar, Clock, RefreshCw, TrendingUp, Database } from 'lucide-react';

interface Props {
  data: MetricData;
  onClose: () => void;
}

const MetricDetailModal: React.FC<Props> = ({ data, onClose }) => {
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

  const getChartColor = (color: StatusColor) => {
    switch (color) {
      case StatusColor.Success: return { stroke: '#34d399', fill: '#34d39920' };
      case StatusColor.Warning: return { stroke: '#fbbf24', fill: '#fbbf2420' };
      case StatusColor.Danger: return { stroke: '#f87171', fill: '#f8717120' };
      default: return { stroke: '#94a3b8', fill: '#94a3b820' };
    }
  };

  const chartColors = getChartColor(data.statusColor);

  // 格式化日期显示
  const formatDataDate = (dateStr?: string) => {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 计算统计信息
  const stats = React.useMemo(() => {
    if (!data.history || data.history.length === 0) {
      return { min: 0, max: 0, avg: 0, change: 0 };
    }
    const values = data.history.map(h => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const first = values[0];
    const last = values[values.length - 1];
    const change = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
    return { min, max, avg, change };
  }, [data.history]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{data.name}</h2>
              <p className="text-slate-400 text-sm font-mono">{data.ticker}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* 当前值和状态 */}
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex-1 min-w-[200px] bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">当前值</p>
              <p className="text-3xl font-bold text-white">
                {data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-lg text-slate-400 ml-1">{data.unit}</span>
              </p>
              <div className={`inline-block px-2 py-1 rounded text-xs font-bold border mt-2 ${getStatusStyles(data.statusColor)}`}>
                {data.statusText}
              </div>
            </div>

            <div className="flex-1 min-w-[200px] bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <p className="text-slate-400 text-sm">数据日期</p>
              </div>
              <p className="text-xl font-semibold text-white">{formatDataDate(data.dataDate)}</p>
              <p className="text-slate-500 text-xs mt-1">更新频率: {data.updateFrequency || '未知'}</p>
            </div>

            <div className="flex-1 min-w-[200px] bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-slate-400 text-sm">下次更新</p>
              </div>
              <p className="text-lg font-medium text-white">{data.nextUpdateTime || '未知'}</p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/30 rounded-lg p-3 text-center">
              <p className="text-slate-500 text-xs">最小值</p>
              <p className="text-lg font-semibold text-blue-400">{stats.min.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-3 text-center">
              <p className="text-slate-500 text-xs">最大值</p>
              <p className="text-lg font-semibold text-red-400">{stats.max.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-3 text-center">
              <p className="text-slate-500 text-xs">平均值</p>
              <p className="text-lg font-semibold text-slate-300">{stats.avg.toFixed(2)}</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-3 text-center">
              <p className="text-slate-500 text-xs">区间变化</p>
              <p className={`text-lg font-semibold ${stats.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* 历史图表 */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-slate-400" />
              <h3 className="text-slate-300 font-semibold">历史数据图表</h3>
              <span className="text-slate-500 text-xs">({data.history?.length || 0} 个数据点)</span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.stroke} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColors.stroke} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
                    }}
                    formatter={(value: number) => [value.toFixed(4), data.name]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={chartColors.stroke}
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-slate-400 text-sm font-semibold mb-2">指标说明</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{data.description}</p>
            </div>
            <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-slate-400 text-sm font-semibold mb-2">计算公式</h4>
              <p className="text-slate-300 text-sm font-mono">{data.formula || '直接读取'}</p>
              <h4 className="text-slate-400 text-sm font-semibold mt-3 mb-1">数据范围</h4>
              <p className="text-slate-300 text-sm">{data.dataRange || '未知'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <p className="text-center text-slate-500 text-xs">
            数据来源: FRED (Federal Reserve Economic Data) | 点击空白处关闭
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetricDetailModal;
