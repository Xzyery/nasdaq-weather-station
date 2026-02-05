import json
import logging
import datetime
import pandas as pd
from fredapi import Fred
from config import FRED_API_KEY, logger
from models import Session, Metric
from app_utils import calculate_status, series_to_history

def get_fred_series(fred, series_id, years_back=2):
    """
    Fetch series using observation_start to ensure consistent history length.
    """
    try:
        start_date = (datetime.datetime.now() - datetime.timedelta(days=365*years_back)).strftime('%Y-%m-%d')
        # FRED API calls generally ignore 'limit' if start_date is provided, which is what we want.
        series = fred.get_series(series_id, observation_start=start_date)
        
        if series is None or series.empty:
            logger.warning(f"FRED returned empty data for {series_id}")
            # Try to return empty series with datetime index to prevent errors later
            return pd.Series(dtype=float)
            
        # Ensure index is datetime
        series.index = pd.to_datetime(series.index)
        return series
    except Exception as e:
        logger.error(f"Error fetching FRED {series_id}: {e}")
        return pd.Series(dtype=float)

def update_metrics():
    logger.info("Starting FRED data update task...")
    
    try:
        fred = Fred(api_key=FRED_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize FRED API: {e}")
        return

    session = Session()
    metrics_buffer = []

    # --- 1. DGS10 ---
    s = get_fred_series(fred, 'DGS10')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('dgs10', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='dgs10', name='10年期美债收益率', ticker='FRED: DGS10', unit='%', value=val,
            description='全球无风险利率基准，直接影响股票贴现率和估值。收益率上升抬高企业融资成本，压缩成长股估值。当前周期4.0%-4.5%为中性区间，>4.5%明显压制估值。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 2. FEDFUNDS ---
    s = get_fred_series(fred, 'FEDFUNDS')
    if not s.empty:
        val = s.iloc[-1]
        prev = s.iloc[-2] if len(s) > 1 else val
        stat, col = calculate_status('fedfunds', val, val - prev)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='fedfunds', name='联邦基金利率', ticker='FRED: FEDFUNDS', unit='%', value=val,
            description='美联储政策利率，决定市场流动性。加息周期收紧流动性，压制高估值资产；降息周期释放流动性，利好成长股。关注美联储点阵图(Dot Plot)和FOMC声明。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 3. NASDAQ Index (Trend Chart) ---
    s_nasdaq = get_fred_series(fred, 'NASDAQCOM')
    if not s_nasdaq.empty:
        val = s_nasdaq.iloc[-1]
        prev = s_nasdaq.iloc[-2] if len(s_nasdaq) > 1 else val
        change = (val - prev) / prev
        stat, col = calculate_status('nasdaq_index', val, change)
        hist = series_to_history(s_nasdaq, 90)
        metrics_buffer.append(Metric(
            id='nasdaq_index', name='纳斯达克指数', ticker='FRED: NASDAQCOM', unit='点', 
            value=val, secondary_value=round(change*100, 2),
            description='纳斯达克综合指数实时走势，反映美国科技股整体表现。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 3.5 NASDAQ 100 Index (Trend Chart) ---
    s_ndx = get_fred_series(fred, 'NASDAQ100')
    if not s_ndx.empty:
        val = s_ndx.iloc[-1]
        prev = s_ndx.iloc[-2] if len(s_ndx) > 1 else val
        change = (val - prev) / prev
        stat, col = calculate_status('nasdaq100_index', val, change)
        hist = series_to_history(s_ndx, 90)
        metrics_buffer.append(Metric(
            id='nasdaq100_index', name='纳斯达克100', ticker='FRED: NASDAQ100', unit='点', 
            value=val, secondary_value=round(change*100, 2),
            description='纳斯达克100指数，聚焦最大的100家非金融科技巨头，包含苹果、微软、英伟达等。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 4. S&P 500 Index (Trend Chart) ---
    s_sp500 = get_fred_series(fred, 'SP500')
    if not s_sp500.empty:
        val = s_sp500.iloc[-1]
        prev = s_sp500.iloc[-2] if len(s_sp500) > 1 else val
        change = (val - prev) / prev
        stat, col = calculate_status('sp500_index', val, change)
        hist = series_to_history(s_sp500, 90)
        metrics_buffer.append(Metric(
            id='sp500_index', name='标普500指数', ticker='FRED: SP500', unit='点', 
            value=val, secondary_value=round(change*100, 2),
            description='标普500指数实时走势，反映美股大盘整体表现。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 5. Tech Strength (NASDAQ/SP500) ---
    # Reuse s_nasdaq and s_sp500 from above
    if not s_nasdaq.empty and not s_sp500.empty:
        df = pd.DataFrame({'nasdaq': s_nasdaq, 'sp500': s_sp500}).dropna()
        if not df.empty:
            df['ratio'] = df['nasdaq'] / df['sp500']
            val = df['ratio'].iloc[-1]
            prev = df['ratio'].iloc[-2] if len(df) > 1 else val
            change = (val - prev) / prev
            stat, col = calculate_status('tech_strength', val, change)
            hist = series_to_history(df['ratio'], 90)
            metrics_buffer.append(Metric(
                id='tech_strength', name='科技相对强度', ticker='FRED: Nasdaq/SP500', unit='比率', 
                value=val, secondary_value=round(change*100, 2),
                description='纳斯达克/标普500比率，衡量科技股相对大盘的表现。比率上升表示科技股领涨，风险偏好上升；下降表示资金转向防御性板块。',
                status_text=stat, status_color=col, history_json=json.dumps(hist)
            ))

    # --- 6. Volatility (VXN or VIX) ---
    s = get_fred_series(fred, 'VXNCLS')
    ticker_display = 'FRED: VXN'
    if s.empty or pd.isna(s.iloc[-1]) or s.iloc[-1] == 0:
        s = get_fred_series(fred, 'VIXCLS')
        ticker_display = 'FRED: VIX'
    
    if not s.empty:
        # Fill NaNs with previous values to avoid gaps in chart
        s = s.ffill() 
        val = s.iloc[-1]
        stat, col = calculate_status('vxn', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='vxn', name='纳指波动率', ticker=ticker_display, unit='', value=val,
            description='CBOE编制的纳斯达克100波动率指数。反映市场对未杨30天的预期波动。<15表示市场过于乐观；15-25为正常区间；>30表示恐慌踩踏，常为反向买入机会。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 7. HY Spread ---
    s = get_fred_series(fred, 'BAMLH0A0HYM2')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('hyd', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='hyd', name='高收益债利差', ticker='FRED: HY Spread', unit='%', value=val,
            description='高收益债券与国债的收益率差额，反映信用风险溢价。<3.5%表示信用市场健康；4%-5%为警戒区间；>5%表示信用收紧严重，企业融资困难。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 8. Dollar Index (Broad) ---
    s = get_fred_series(fred, 'DTWEXBGS')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('dxy', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='dxy', name='广义美元指数', ticker='FRED: Broad Dollar', unit='', value=val,
            description='美联储编制的贸易加权美元指数，覆盖主要贸易伙伴货币。美元走强会压缩跨国企业海外营收换算，影响EPS。基期2006年=100。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 9. Financial Stress ---
    s = get_fred_series(fred, 'STLFSI4')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('stress', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='stress', name='金融压力指数', ticker='FRED: STLFSI4', unit='', value=val,
            description='圣路易斯联储编制的金融市场压力综合指标，综合利率、汇率、信用等多维度数据。0为正常基准；>0表示金融环境趋紧；<0表示宽松。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 10. Yield Curve ---
    s = get_fred_series(fred, 'T10Y2Y')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('curve', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='curve', name='收益率曲线利差', ticker='FRED: 10Y-2Y', unit='%', value=val,
            description='10年期与2年期美债收益率之差。负值(倒挂)是著名的衰退预警信号，历史上曾准确预测多次衰退。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 11. Margin Debt Proxy ---
    s = get_fred_series(fred, 'BOGZ1FL663067003Q') # Quarterly
    if not s.empty:
        s_yoy = s.pct_change(periods=4) * 100
        # Need to drop NaNs created by pct_change
        s_yoy = s_yoy.dropna()
        
        if not s_yoy.empty:
            val = s_yoy.iloc[-1]
            stat, col = calculate_status('margin', val)
            hist = series_to_history(s_yoy, 20)
            metrics_buffer.append(Metric(
                id='margin', name='融资余额增速', ticker='FRED: Margin Debt', unit='YoY%', value=val,
                description='证券保证金贷款的同比增速，反映市场杠杆水平。高增速(>30%)往往伴随市场过热；负增长可能预示市场调整。极端值常与市场顶部/底部关联。',
                status_text=stat, status_color=col, history_json=json.dumps(hist)
            ))

    # --- 12. Buffett Proxy ---
    s_sp500 = get_fred_series(fred, 'SP500', years_back=3)
    s_gdp = get_fred_series(fred, 'GDP', years_back=3)
    if not s_sp500.empty and not s_gdp.empty:
        # Forward fill GDP to match SP500 daily frequency
        s_gdp_daily = s_gdp.resample('D').ffill().reindex(s_sp500.index, method='ffill')
        
        # Scaling factor 4.8 to approximate market cap level
        ratio = (s_sp500 / s_gdp_daily) * 100 * 4.8
        ratio = ratio.dropna()
        
        if not ratio.empty:
            val = ratio.iloc[-1]
            stat, col = calculate_status('buffett', val)
            hist = series_to_history(ratio, 90)
            metrics_buffer.append(Metric(
                id='buffett', name='市场估值指标', ticker='FRED: SP500/GDP', unit='', value=val,
                description='基于SP500指数与GDP比值的趋势追踪指标（非真正巴菲特指数）。数值上升表示估值扩张，下降表示估值收缩。关注趋势变化而非绝对数值。',
                status_text=stat, status_color=col, history_json=json.dumps(hist)
            ))

    # --- 13. CPI ---
    s = get_fred_series(fred, 'CPIAUCSL')
    if not s.empty:
        s_yoy = s.pct_change(periods=12) * 100
        s_yoy = s_yoy.dropna()
        if not s_yoy.empty:
            val = s_yoy.iloc[-1]
            stat, col = calculate_status('cpi', val)
            hist = series_to_history(s_yoy, 24)
            metrics_buffer.append(Metric(
                id='cpi', name='CPI 通胀率', ticker='FRED: CPI', unit='YoY%', value=val,
                description='消费者物价指数同比增速，美联储货币政策的核心参考。美联储2%目标；>3%可能触发鹰派立场，压制估值；<2%可能触发鸽派立场。',
                status_text=stat, status_color=col, history_json=json.dumps(hist)
            ))

    # --- 14. Industrial Production ---
    s = get_fred_series(fred, 'INDPRO')
    if not s.empty:
        s_yoy = s.pct_change(periods=12) * 100
        s_yoy = s_yoy.dropna()
        if not s_yoy.empty:
            val = s_yoy.iloc[-1]
            stat, col = calculate_status('indpro', val)
            hist = series_to_history(s_yoy, 24)
            metrics_buffer.append(Metric(
                id='indpro', name='工业生产指数', ticker='FRED: INDPRO', unit='YoY%', value=val,
                description='衡量制造业、采矿业和公用事业的实际产出。同比负增长 (<0%) 通常标志着经济进入收缩期。',
                status_text=stat, status_color=col, history_json=json.dumps(hist)
            ))

    # --- 15. Unemployment Rate (For S&P 500) ---
    s = get_fred_series(fred, 'UNRATE')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('unrate', val)
        hist = series_to_history(s, 24)
        metrics_buffer.append(Metric(
            id='unrate', name='失业率', ticker='FRED: UNRATE', unit='%', value=val,
            description='美国劳动力市场核心指标。历史上失业率快速上升(萝姆规则: 3个月均线比近12个月低点上南0.5%)时，衰退已经开始。<4%为充分就业。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 16. VIX (Specific for S&P 500) ---
    s = get_fred_series(fred, 'VIXCLS')
    if not s.empty:
        s = s.ffill()
        val = s.iloc[-1]
        stat, col = calculate_status('vix', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='vix', name='标普500波动率', ticker='FRED: VIX', unit='', value=val,
            description='CBOE编制的标普500波动率指数，被称为“恐慌指数”。12-20为正常区间；<12表示市场过度自满；>30表示极度恐慌，历史上常为中长期买点。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))
    
    # ========== 黄金专属指标 (15-20) ==========

    # --- 17. Real Yield (10-Year TIPS) ---
    s = get_fred_series(fred, 'DFII10')
    if not s.empty:
        s = s.ffill()
        val = s.iloc[-1]
        stat, col = calculate_status('real_yield', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='real_yield', name='10年期实际利率', ticker='FRED: DFII10', unit='%', value=val,
            description='10年期TIPS收益率，反映剰切除通胀后的真实回报。与黄金呈强负相关：实际利率>2%显著利空黄金（持有黄金的机会成本高）；<0%强利好黄金（负利率环境）。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 18. Breakeven Inflation Rate ---
    s = get_fred_series(fred, 'T10YIE')
    if not s.empty:
        s = s.ffill()
        val = s.iloc[-1]
        stat, col = calculate_status('breakeven', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='breakeven', name='10年期通胀预期', ticker='FRED: T10YIE', unit='%', value=val,
            description='10年期名义国债与TIPS的收益率差，反映市场对未杩10年平均通胀的预期。>2.5%表示通胀预期升温，利好黄金；<2%表示通缩预期，利空黄金。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 19. Fed Total Assets (Balance Sheet) ---
    s = get_fred_series(fred, 'WALCL')
    if not s.empty:
        val = s.iloc[-1] / 1e6  # Convert to Trillions
        prev = s.iloc[-2] / 1e6 if len(s) > 1 else val
        change = val - prev
        stat, col = calculate_status('fed_assets', val, change)
        hist = [{"date": d.strftime('%Y-%m-%d'), "value": float(v/1e6)} for d, v in s.tail(90).items() if pd.notna(v)]
        metrics_buffer.append(Metric(
            id='fed_assets', name='美联储资产负债表', ticker='FRED: WALCL', unit='万亿$', value=val,
            secondary_value=round(change, 3),
            description='美联储总资产规模，反映宏观流动性状态。扩表(资产增加)=释放流动性，美元贬值压力，利好黄金；缩表(资产减少)=回收流动性，黄金承压。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 20. Non-Farm Payrolls (Monthly Change) ---
    s = get_fred_series(fred, 'PAYEMS')
    if not s.empty:
        s_diff = s.diff()  # PAYEMS单位已经是千人，直接计算环比变化
        s_diff = s_diff.dropna()
        if not s_diff.empty:
            val = s_diff.iloc[-1]
            stat, col = calculate_status('nonfarm', val)
            hist = series_to_history(s_diff, 24)
            metrics_buffer.append(Metric(
                id='nonfarm', name='非农就业变化', ticker='FRED: PAYEMS', unit='千人/月', value=val,
                description='每月新增就业人数。>200千人=就业强劲（美联储偏鹰，利空黄金）；<100千人=就业放缓（降息预期升温，利好黄金）。',
                status_text=stat, status_color=col, history_json=json.dumps(hist)
            ))

    # ========== 黄金专属版本的复用指标 ==========

    # --- 21. 美元指数 (黄金视角) ---
    s = get_fred_series(fred, 'DTWEXBGS')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('dxy', val)
        hist = series_to_history(s, 90)
        metrics_buffer.append(Metric(
            id='gold_dxy', name='美元指数', ticker='FRED: Broad Dollar', unit='', value=val,
            description='贸易加权美元指数。黄金以美元计价，两者约70-80%时间呈负相关。美元走强压制金价；美元走弱提振金价。但危机时期可能同涨(避险需求)。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 22. 失业率 (黄金视角) ---
    s = get_fred_series(fred, 'UNRATE')
    if not s.empty:
        val = s.iloc[-1]
        stat, col = calculate_status('unrate', val)
        hist = series_to_history(s, 24)
        metrics_buffer.append(Metric(
            id='gold_unrate', name='失业率', ticker='FRED: UNRATE', unit='%', value=val,
            description='经济衰退的重要确认信号。失业率趋势性上升意味着经济进入衰退，美联储将被迫降息，金价往往迎来重要上涨行情。参考萝姆规则判断衰退。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # ========== 金银铜指数与比率 (黄金板块专用) ==========

    # --- 23. NASDAQ Gold Index (日度) ---
    s_gold_idx = get_fred_series(fred, 'NASDAQQGLDI')
    if not s_gold_idx.empty:
        val = s_gold_idx.iloc[-1]
        prev = s_gold_idx.iloc[-2] if len(s_gold_idx) > 1 else val
        change = (val - prev) / prev
        stat, col = calculate_status('gold_index', val, change)
        hist = series_to_history(s_gold_idx, 90)
        metrics_buffer.append(Metric(
            id='gold_index', name='黄金趋势指数', ticker='NASDAQ Gold Index', unit='点', 
            value=val, secondary_value=round(change*100, 2),
            description='纳斯达克编制的黄金商品指数(NQCIGLD)，追踪黄金期货的总回报表现。用于观察黄金市场中长期趋势，非实时金价。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # --- 24. NASDAQ Silver Index (日度) ---
    s_silver_idx = get_fred_series(fred, 'NASDAQQSLVO')
    if not s_silver_idx.empty:
        val = s_silver_idx.iloc[-1]
        prev = s_silver_idx.iloc[-2] if len(s_silver_idx) > 1 else val
        change = (val - prev) / prev
        stat, col = calculate_status('silver_index', val, change)
        hist = series_to_history(s_silver_idx, 90)
        metrics_buffer.append(Metric(
            id='silver_index', name='白银趋势指数', ticker='NASDAQ Silver Index', unit='点', 
            value=val, secondary_value=round(change*100, 2),
            description='纳斯达克编制的白银商品指数(NQCISLV)，追踪白银期货的总回报表现。白银兼具贵金属与工业金属属性，波动性通常高于黄金。',
            status_text=stat, status_color=col, history_json=json.dumps(hist)
        ))

    # Save to DB
    try:
        if metrics_buffer:
            for m in metrics_buffer:
                session.merge(m)
            session.commit()
            logger.info(f"Updated {len(metrics_buffer)} metrics successfully.")
            return True
        else:
            logger.warning("No metrics fetched. Check internet connection or API Key.")
            return False
    except Exception as e:
        logger.error(f"Database commit failed: {e}")
        session.rollback()
        return False
    finally:
        session.close()
