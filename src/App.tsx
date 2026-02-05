import React, { useState, useEffect } from 'react';
import { MetricData, Scenario } from './types';
import { generateDashboardData } from './services/logicService';
import DashboardCard from './components/DashboardCard';
import MetricDetailModal from './components/MetricDetailModal';
import GoldPriceWidget from './components/GoldPriceWidget';
import SponsorModal from './components/SponsorModal';
import TrialExpirationBanner from './components/TrialExpirationBanner';
import AuthPage from './pages/AuthPage';
import { useAuth } from './contexts/AuthContext';
import { Activity, CloudRain, RefreshCw, AlertTriangle, TrendingUp, ShieldCheck, Loader2, Info, Coins, LogOut, ExternalLink, User } from 'lucide-react';

const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, user, logout, canAccessModule, sponsorLinks, getTrialDaysRemaining } = useAuth();
  
  const [view, setView] = useState<'home' | 'dashboard-nasdaq' | 'dashboard-sp500' | 'dashboard-gold'>('home');
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [scenario, setScenario] = useState<Scenario>(Scenario.Normal);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  
  // 赞助码弹窗状态
  const [sponsorModal, setSponsorModal] = useState<{
    show: boolean;
    module: 'nasdaq' | 'sp500' | 'gold';
    moduleName: string;
  } | null>(null);
  
  // 到期提醒关闭状态
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await generateDashboardData(scenario);
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view !== 'home' && metrics.length === 0 && isAuthenticated) {
      fetchData();
    }
  }, [view, isAuthenticated]);
  
  // 处理模块点击
  const handleModuleClick = (module: 'nasdaq' | 'sp500' | 'gold', moduleName: string) => {
    if (!canAccessModule(module)) {
      // 试用期已过，需要输入赞助码
      setSponsorModal({ show: true, module, moduleName });
    } else {
      // 可以访问
      setView(`dashboard-${module}` as any);
    }
  };
  
  // 获取试用剩余天数
  const trialDaysRemaining = getTrialDaysRemaining();
  const showTrialBanner = trialDaysRemaining !== null && trialDaysRemaining <= 3 && !bannerDismissed;

  // 如果认证加载中
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 如果未登录，显示登录页面
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Filter metrics based on view
  const getFilteredMetrics = () => {
    if (metrics.length === 0) return { indexMetrics: [], ratioMetrics: [], tier1: [], tier2: [], tier3: [] };
    
    // 黄金专属指标 (6个) - 使用黄金专用版本的美元指数和失业率
    if (view === 'dashboard-gold') {
      const goldMetricIds = ['real_yield', 'breakeven', 'fed_assets', 'nonfarm', 'gold_dxy', 'gold_unrate'];
      const goldMetrics = goldMetricIds.map(id => metrics.find(m => m.id === id)).filter(Boolean) as MetricData[];
      
      // 金银铜指数与比率
      const ratioMetricIds = ['gold_index', 'silver_index'];
      const ratioMetrics = ratioMetricIds.map(id => metrics.find(m => m.id === id)).filter(Boolean) as MetricData[];
      
      return { indexMetrics: [], ratioMetrics, tier1: goldMetrics.slice(0, 3), tier2: goldMetrics.slice(3, 6), tier3: [] };
    }

    // 原有的12个指标保持三梯队不变
    const originalTier1 = metrics.slice(0, 4);   // DGS10, FEDFUNDS, Tech Strength, VXN
    const originalTier2 = metrics.slice(4, 8);   // HYD, DXY, Stress, Curve
    const originalTier3 = metrics.slice(8, 12);  // Margin, Buffett, CPI, INDPRO

    if (view === 'dashboard-nasdaq') {
        // 纳斯达克模块：指数走势单独一区
        const nasdaqIndex = metrics.find(m => m.id === 'nasdaq_index');
        const nasdaq100Index = metrics.find(m => m.id === 'nasdaq100_index');
        const indexMetrics = [nasdaqIndex, nasdaq100Index].filter(Boolean) as MetricData[];
        return { indexMetrics, ratioMetrics: [], tier1: originalTier1, tier2: originalTier2, tier3: originalTier3 };
    } else {
        // S&P 500 Mode：指数走势单独一区，用失业率和VIX替换科技相对强度和VXN
        const sp500Index = metrics.find(m => m.id === 'sp500_index');
        const unrate = metrics.find(m => m.id === 'unrate');
        const vix = metrics.find(m => m.id === 'vix');
        
        const indexMetrics = sp500Index ? [sp500Index] : [];
        // 标普500第一梯队：DGS10, FEDFUNDS, 失业率, VIX
        const sp500Tier1 = [metrics[0], metrics[1], unrate, vix].filter(Boolean) as MetricData[];
        
        return { indexMetrics, ratioMetrics: [], tier1: sp500Tier1, tier2: originalTier2, tier3: originalTier3 };
    }
  };

  const { indexMetrics, ratioMetrics, tier1, tier2, tier3 } = getFilteredMetrics();
  const displayMetrics = [...indexMetrics, ...ratioMetrics, ...tier1, ...tier2, ...tier3]; // 用于兼容其他逻辑
  const isNasdaq = view === 'dashboard-nasdaq';
  const isGold = view === 'dashboard-gold';

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
        {/* 顶部用户信息栏 */}
        <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-6xl w-full">
            {/* 试用到期提醒 */}
            {showTrialBanner && (
              <TrialExpirationBanner 
                daysRemaining={trialDaysRemaining} 
                onClose={() => setBannerDismissed(true)}
              />
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Nasdaq Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 group transform hover:-translate-y-1">
                <div 
                  onClick={() => handleModuleClick('nasdaq', '纳斯达克气象站')}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">纳斯达克气象站</h2>
                  </div>
                  
                  <p className="text-slate-400 leading-relaxed mb-6 text-sm h-16">
                    专注成长股风险偏好。监控科技相对强度、纳斯达克波动率(VXN)等核心指标。
                  </p>
                  
                  <div className="flex items-center text-sm font-medium text-indigo-400 group-hover:text-indigo-300 mb-4">
                    进入仪表盘 <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {/* 赞助按钮 */}
                <a
                  href={sponsorLinks.nasdaq?.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <span>赞助</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* S&P 500 Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl hover:shadow-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group transform hover:-translate-y-1">
                <div 
                  onClick={() => handleModuleClick('sp500', '标普500气象站')}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">标普500气象站</h2>
                  </div>
                  
                  <p className="text-slate-400 leading-relaxed mb-6 text-sm h-16">
                    专注美国经济基本面。引入失业率、VIX恐慌指数，监控经济硬着陆风险。
                  </p>
                  
                  <div className="flex items-center text-sm font-medium text-blue-400 group-hover:text-blue-300 mb-4">
                    进入仪表盘 <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {/* 赞助按钮 */}
                <a
                  href={sponsorLinks.sp500?.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <span>赞助</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Gold Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl hover:shadow-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 group transform hover:-translate-y-1">
                <div 
                  onClick={() => handleModuleClick('gold', '黄金宏观气象站')}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-yellow-500 rounded-xl shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Coins className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">黄金宏观气象站</h2>
                  </div>
                  
                  <p className="text-slate-400 leading-relaxed mb-6 text-sm h-16">
                    实际利率、通胀预期、金银比、铜金比、美联储资产负债表等硬通货核心驱动。
                  </p>
                  
                  <div className="flex items-center text-sm font-medium text-yellow-400 group-hover:text-yellow-300 mb-4">
                    进入仪表盘 <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {/* 赞助按钮 */}
                <a
                  href={sponsorLinks.gold?.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full py-2.5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <span>赞助</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* 赞助码输入弹窗 */}
        {sponsorModal?.show && (
          <SponsorModal
            module={sponsorModal.module}
            moduleName={sponsorModal.moduleName}
            onClose={() => setSponsorModal(null)}
            onSuccess={() => {
              setView(`dashboard-${sponsorModal.module}` as any);
            }}
          />
        )}
      </div>
    );
  }

  // 动态样式配置
  const themeConfig = isGold 
    ? { bg: 'bg-yellow-500', shadow: 'shadow-yellow-500/20', text: 'text-yellow-500', icon: Coins, title: '黄金宏观气象站' }
    : isNasdaq 
    ? { bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/20', text: 'text-indigo-500', icon: Activity, title: '纳斯达克宏观气象站' }
    : { bg: 'bg-blue-500', shadow: 'shadow-blue-500/20', text: 'text-blue-500', icon: ShieldCheck, title: '标普500宏观气象站' };

  const IconComponent = themeConfig.icon;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('home')}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors mr-1"
                title="返回首页"
              >
                <div className={`p-2 rounded-lg shadow-lg ${themeConfig.bg} ${themeConfig.shadow}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                    {themeConfig.title}
                </h1>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  数据源: <span className="text-emerald-400 font-mono">FRED (St. Louis Fed)</span> • 更新: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded border border-slate-700 hidden md:block">
                本网站数据来源于FRED，仅作为指数参考，不构成投资建议！
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Loader2 className={`w-10 h-10 animate-spin mb-4 ${themeConfig.text}`} />
            <p>正在从 FRED 抓取宏观指标...</p>
          </div>
        ) : (
          <>
            {isGold ? (
              /* 黄金仪表盘布局 */
              <>
                {/* 金银铜价格走势 Widget */}
                <GoldPriceWidget />

                {/* 金银铜趋势指数与比率 */}
                {ratioMetrics.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      宏观比率：金银铜趋势与比率
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {ratioMetrics.map((metric) => (
                        <DashboardCard key={metric.id} data={metric} onClick={() => setSelectedMetric(metric)} />
                      ))}
                    </div>
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-3">
                      <p className="text-slate-500 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>注意：以上指数数据来源于纳斯达克商品指数，反映的是市场趋势而非实际金银铜价格。具体实时价格请自行查阅行情软件。</span>
                      </p>
                      <div className="border-t border-slate-700/50 pt-3">
                        <p className="text-slate-400 text-xs font-medium mb-2">💡 常用比率计算与逻辑：</p>
                        <ul className="text-slate-500 text-xs space-y-2 ml-4">
                          <li>
                            <span className="text-yellow-500 font-medium">金银比 = 金价 ÷ 银价</span>
                            <span className="block text-slate-600 mt-0.5">历史均值约60-70。&gt;80时银相对便宜，可能回归；&lt;50时金相对便宜。极端值常预示市场转折。</span>
                          </li>
                          <li>
                            <span className="text-orange-500 font-medium">铜金比 = 铜价 ÷ 金价</span>
                            <span className="block text-slate-600 mt-0.5">铜代表工业需求（风险偏好），金代表避险需求。比值上升=经济乐观，下降=避险情绪升温。可作为经济周期的领先指标。</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier 1: 核心定价因子 */}
                <div className="mb-10">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    第一梯队：核心定价因子 (利率与货币)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tier1.map((metric) => (
                      <DashboardCard key={metric.id} data={metric} onClick={() => setSelectedMetric(metric)} />
                    ))}
                  </div>
                </div>

                {/* Tier 2: 周期与情绪 */}
                <div className="mb-12">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    第二梯队：周期与情绪 (经济信号)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tier2.map((metric) => (
                      <DashboardCard key={metric.id} data={metric} onClick={() => setSelectedMetric(metric)} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* 股票仪表盘布局 - 指数走势 + 三梯队 */
              <>
                {/* 指数走势区域 - 仅在有指数数据时显示 */}
                {indexMetrics.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${themeConfig.bg}`}></span>
                      行情速览：指数走势
                    </h2>
                    <div className={`grid grid-cols-1 ${indexMetrics.length === 1 ? 'md:grid-cols-1 lg:grid-cols-1 max-w-md' : 'md:grid-cols-2 lg:grid-cols-2 max-w-2xl'} gap-6`}>
                      {indexMetrics.map((metric) => (
                        <DashboardCard key={metric.id} data={metric} onClick={() => setSelectedMetric(metric)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Tier 1: 核心驱动力 */}
                <div className="mb-10">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${themeConfig.bg}`}></span>
                    第一梯队：核心驱动力 (资金与锚)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tier1.map((metric) => (
                      <DashboardCard key={metric.id} data={metric} onClick={() => setSelectedMetric(metric)} />
                    ))}
                  </div>
                </div>

                {/* Tier 2: 市场健康度 */}
                <div className="mb-10">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    第二梯队：市场健康度 (风险结构)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tier2.map((metric) => (
                      <DashboardCard key={metric.id} data={metric} onClick={() => setSelectedMetric(metric)} />
                    ))}
                  </div>
                </div>

                {/* Tier 3: 长期宏观 */}
                {tier3.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                      第三梯队：长期宏观 (周期位置)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {tier3.map((metric) => (
                        <DashboardCard key={metric.id} data={metric} onClick={() => setSelectedMetric(metric)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Info Footer */}
             <div className="bg-slate-800/30 rounded-lg p-4 text-center border border-slate-700/50">
                <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
                    <Info className="w-4 h-4" />
                    本网站数据来源来自FRED官方数据，<a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">https://fred.stlouisfed.org/</a>
                </p>
             </div>
          </>
        )}
      </main>



      {/* 详情弹窗 */}
      {selectedMetric && (
        <MetricDetailModal 
          data={selectedMetric} 
          onClose={() => setSelectedMetric(null)} 
        />
      )}
    </div>
  );
};

export default App;