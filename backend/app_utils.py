import pandas as pd
import datetime

def series_to_history(s, tail_n=90):
    """Convert pandas series to history list, filtering out NaN values."""
    hist = []
    # Ensure index is treated as datetime, though typically handled by caller
    for d, v in s.tail(tail_n).items():
        if pd.notna(v):
            if isinstance(d, (pd.Timestamp, datetime.datetime, datetime.date)):
                date_str = d.strftime('%Y-%m-%d')
            else:
                date_str = str(d)
            hist.append({"date": date_str, "value": float(v)})
    return hist

def calculate_status(metric_id, value, change=0):
    """Centralized business logic."""
    if metric_id == 'dgs10': 
        if value > 5.0: return "高危 (历史极端)", "danger"
        if value > 4.5: return "警戒 (杀估值)", "warning"
        if value > 4.0: return "估值承压", "neutral"
        if value > 3.5: return "中性区间", "success"
        return "流动性宽松", "success"
    
    if metric_id == 'fedfunds':
        if change > 0: return "加息周期", "warning"
        if change < 0: return "降息周期", "success"
        return "利率维持", "neutral"
        
    if metric_id == 'tech_strength':
        if change < 0: return "科技跑输 (弱)", "warning"
        return "科技领涨 (强)", "success"

    if metric_id == 'vxn':
        if value > 30: return "极度恐慌 (机会)", "success"
        if value < 15: return "极度贪婪 (风险)", "danger"
        return "震荡区间", "neutral"

    if metric_id == 'hyd':
        if value > 5.0: return "资金断裂", "danger"
        if value > 4.0: return "压力上升", "warning"
        return "信用良好", "success"

    if metric_id == 'dxy':
        if value > 125: return "汇率利空", "warning"
        return "汇率中性", "success"

    if metric_id == 'stress':
        if value > 0: return "市场承压", "warning"
        return "金融环境宽松", "success"

    if metric_id == 'curve':
        if value < 0: return "衰退预警 (倒挂)", "danger"
        return "曲线正常", "success"

    if metric_id == 'margin':
        if value > 30: return "杠杆过热", "danger"
        if value > 15: return "杠杆上升", "warning"
        if value < -10: return "去杠杆化", "warning"
        return "杠杆正常", "success"

    if metric_id == 'buffett':
        # 这是一个趋势追踪指标，不是真正的巴菲特指数
        # 关注数值的相对高低位置而非绝对值
        if value > 25: return "估值扩张区间", "warning"
        if value > 20: return "估值偏高", "neutral"
        return "估值低位", "success"

    if metric_id == 'cpi':
        if value > 3.0: return "通胀过热", "warning"
        return "通胀受控", "success"

    if metric_id == 'indpro':
        if value < 0: return "衰退收缩", "danger"
        return "经济扩张", "success"

    if metric_id == 'unrate':
        if value > 4.5: return "衰退风险 (高)", "danger" # 萨姆规则经验值
        if value > 4.0: return "就业恶化 (中)", "warning"
        return "充分就业", "success"
    
    if metric_id == 'vix':
        if value > 30: return "极度恐慌 (机会)", "success"
        if value < 12: return "极度贪婪 (风险)", "danger"
        return "正常波动", "neutral"

    # === 黄金专属指标 ===
    if metric_id == 'real_yield':  # 实际利率 (TIPS)
        if value > 2.0: return "强利空 (机会成本高)", "danger"
        if value > 1.0: return "利空 (承压)", "warning"
        if value < 0: return "强利好 (负利率)", "success"
        return "中性", "neutral"

    if metric_id == 'breakeven':  # 通胀预期
        if value > 2.8: return "通胀脱锚 (强利好)", "success"
        if value > 2.5: return "通胀预期升温", "success"
        if value < 2.0: return "通缩风险 (利空)", "warning"
        return "预期稳定", "neutral"

    # === 指数走势 ===
    if metric_id == 'nasdaq_index':  # 纳斯达克指数
        if change > 0.01: return "指数上涨", "success"
        if change < -0.01: return "指数下跌", "warning"
        return "指数持平", "neutral"

    if metric_id == 'nasdaq100_index':  # 纳斯达克100指数
        if change > 0.01: return "指数上涨", "success"
        if change < -0.01: return "指数下跌", "warning"
        return "指数持平", "neutral"

    if metric_id == 'sp500_index':  # 标普500指数
        if change > 0.01: return "指数上涨", "success"
        if change < -0.01: return "指数下跌", "warning"
        return "指数持平", "neutral"

    # === 金银铜指数与比率 ===
    if metric_id == 'gold_index':  # 黄金指数
        if change > 0.01: return "黄金走强", "success"
        if change < -0.01: return "黄金走弱", "warning"
        return "黄金持平", "neutral"

    if metric_id == 'silver_index':  # 白银指数
        if change > 0.01: return "白银走强", "success"
        if change < -0.01: return "白银走弱", "warning"
        return "白银持平", "neutral"

    if metric_id == 'fed_assets':  # 美联储资产负债表
        if change > 0: return "扩表 (印钞利好)", "success"
        if change < 0: return "缩表 (流动性收紧)", "warning"
        return "规模持平", "neutral"

    if metric_id == 'nonfarm':  # 非农就业
        if value > 300: return "就业过热 (利空)", "danger"  # 美联储偏鹰
        if value > 200: return "就业强劲", "warning"
        if value > 100: return "就业健康", "neutral"
        if value < 0: return "就业萎缩 (衰退)", "danger"
        return "就业放缓 (利好)", "success"  # 降息预期

    return "未知", "neutral"
