import React, { useEffect, useRef } from 'react';

const GoldPriceWidget: React.FC = () => {
  const container1Ref = useRef<HTMLDivElement>(null);
  const container2Ref = useRef<HTMLDivElement>(null);
  const container3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 清理旧的脚本
    const containers = [container1Ref, container2Ref, container3Ref];
    containers.forEach(ref => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    });

    // 黄金 Widget
    if (container1Ref.current) {
      const script1 = document.createElement('script');
      script1.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
      script1.async = true;
      script1.innerHTML = JSON.stringify({
        symbols: [["OANDA:XAUUSD|1D"]],
        chartOnly: false,
        width: "100%",
        height: "100%",
        locale: "zh_CN",
        colorTheme: "dark",
        autosize: true,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: "right",
        scaleMode: "Normal",
        fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        fontSize: "10",
        noTimeScale: false,
        valuesTracking: "1",
        changeMode: "price-and-percent",
        chartType: "area",
        lineColor: "rgba(234, 179, 8, 1)",
        bottomColor: "rgba(234, 179, 8, 0.1)",
        topColor: "rgba(234, 179, 8, 0.3)"
      });
      container1Ref.current.appendChild(script1);
    }

    // 白银 Widget
    if (container2Ref.current) {
      const script2 = document.createElement('script');
      script2.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
      script2.async = true;
      script2.innerHTML = JSON.stringify({
        symbols: [["OANDA:XAGUSD|1D"]],
        chartOnly: false,
        width: "100%",
        height: "100%",
        locale: "zh_CN",
        colorTheme: "dark",
        autosize: true,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: "right",
        scaleMode: "Normal",
        fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        fontSize: "10",
        noTimeScale: false,
        valuesTracking: "1",
        changeMode: "price-and-percent",
        chartType: "area",
        lineColor: "rgba(192, 192, 192, 1)",
        bottomColor: "rgba(192, 192, 192, 0.1)",
        topColor: "rgba(192, 192, 192, 0.3)"
      });
      container2Ref.current.appendChild(script2);
    }

    // 铜 Widget
    if (container3Ref.current) {
      const script3 = document.createElement('script');
      script3.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
      script3.async = true;
      script3.innerHTML = JSON.stringify({
        symbols: [["OANDA:XCUUSD|1D"]],
        chartOnly: false,
        width: "100%",
        height: "100%",
        locale: "zh_CN",
        colorTheme: "dark",
        autosize: true,
        showVolume: false,
        showMA: false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: "right",
        scaleMode: "Normal",
        fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        fontSize: "10",
        noTimeScale: false,
        valuesTracking: "1",
        changeMode: "price-and-percent",
        chartType: "area",
        lineColor: "rgba(234, 88, 12, 1)",
        bottomColor: "rgba(234, 88, 12, 0.1)",
        topColor: "rgba(234, 88, 12, 0.3)"
      });
      container3Ref.current.appendChild(script3);
    }
  }, []);

  return (
    <div className="mb-10">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        行情速览：金银铜价格走势
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 黄金 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-[300px]">
          <div className="tradingview-widget-container" ref={container1Ref} style={{ height: '100%', width: '100%' }}>
            <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
            <div className="tradingview-widget-copyright">
              <a href="https://cn.tradingview.com/" rel="noopener nofollow" target="_blank">
                <span className="text-xs text-slate-500">TradingView提供支持</span>
              </a>
            </div>
          </div>
        </div>

        {/* 白银 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-[300px]">
          <div className="tradingview-widget-container" ref={container2Ref} style={{ height: '100%', width: '100%' }}>
            <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
            <div className="tradingview-widget-copyright">
              <a href="https://cn.tradingview.com/" rel="noopener nofollow" target="_blank">
                <span className="text-xs text-slate-500">TradingView提供支持</span>
              </a>
            </div>
          </div>
        </div>

        {/* 铜 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden h-[300px]">
          <div className="tradingview-widget-container" ref={container3Ref} style={{ height: '100%', width: '100%' }}>
            <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
            <div className="tradingview-widget-copyright">
              <a href="https://cn.tradingview.com/" rel="noopener nofollow" target="_blank">
                <span className="text-xs text-slate-500">TradingView提供支持</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoldPriceWidget;
