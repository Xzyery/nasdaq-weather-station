import os
import logging
import secrets

# Configuration
FRED_API_KEY = '10493b350971713a5302f3f8ef7e4909'

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', secrets.token_hex(32))
JWT_EXPIRATION_HOURS = 24 * 7  # Token有效期7天
TRIAL_DAYS = 7  # 试用期天数

# 模块配置 - 赞助链接可自定义
MODULE_CONFIG = {
    'nasdaq': {
        'name': '纳斯达克气象站',
        'sponsor_link': 'https://www.bilibili.com/',
        'color': 'indigo'
    },
    'sp500': {
        'name': '标普500气象站',
        'sponsor_link': 'https://fred.stlouisfed.org/series/INDPRO',
        'color': 'blue'
    },
    'gold': {
        'name': '黄金宏观气象站',
        'sponsor_link': 'https://im.qq.com/index/#/',
        'color': 'yellow'
    }
}

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('backend')

# Database
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BACKEND_DIR, 'macro_weather_v3.db')
DB_URI = f'sqlite:///{DB_FILE}?check_same_thread=False'

# Dashboard Config
ORDER_MAP = [
    'dgs10', 'fedfunds', 'tech_strength', 'vxn', 
    'hyd', 'dxy', 'stress', 'curve',
    'margin', 'buffett', 'cpi', 'indpro',
    'unrate', 'vix',
    # 黄金专属指标
    'real_yield', 'breakeven', 'fed_assets', 'nonfarm', 'gold_dxy', 'gold_unrate',
    # 金银指数
    'gold_index', 'silver_index',
    # 指数走势图
    'nasdaq_index', 'nasdaq100_index', 'sp500_index'
]

META_INFO = {
    'dgs10': {'formula': '直接读取', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'fedfunds': {'formula': '直接读取', 'range': '过去90个交易日', 'freq': '每月', 'update': '每月初更新上月数据'},
    'tech_strength': {'formula': '纳斯达克指数 / 标普500指数', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'vxn': {'formula': '直接读取 (优先VXN，缺失用VIX)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'hyd': {'formula': '直接读取 (高收益债利差)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'dxy': {'formula': '直接读取 (广义美元指数)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'stress': {'formula': '直接读取 (金融压力指数 STL)', 'range': '过去90个交易日', 'freq': '每周', 'update': '每周五更新'},
    'curve': {'formula': '10年期收益率 - 2年期收益率', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'margin': {'formula': '同比增速: (本季-去年同季)/去年同季', 'range': '过去20个季度', 'freq': '每季度', 'update': '每季度末更新'},
    'buffett': {'formula': 'SP500指数 / GDP (趋势追踪)', 'range': '过去90天 (基于3年数据)', 'freq': '每日/每季度', 'update': 'SP500每日，GDP每季度'},
    'cpi': {'formula': '同比增速: (本月-去年同月)/去年同月', 'range': '过去24个月', 'freq': '每月', 'update': '每月中旬公布上月数据'},
    'indpro': {'formula': '同比增速: (本月-去年同月)/去年同月', 'range': '过去24个月', 'freq': '每月', 'update': '每月中旬公布上月数据'},
    'unrate': {'formula': '直接读取 (月度失业率)', 'range': '过去24个月', 'freq': '每月', 'update': '每月第一个周五公布'},
    'vix': {'formula': '直接读取 (CBOE VIX)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    # 黄金专属指标
    'real_yield': {'formula': '直接读取 (10年期TIPS收益率)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'breakeven': {'formula': '直接读取 (10年期盈亏平衡通胀率)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'fed_assets': {'formula': '直接读取 (美联储总资产)', 'range': '过去90周', 'freq': '每周', 'update': '每周四更新'},
    'nonfarm': {'formula': '环比变化: 本月就业人数 - 上月就业人数', 'range': '过去24个月', 'freq': '每月', 'update': '每月第一个周五公布'},
    'gold_dxy': {'formula': '直接读取 (广义美元指数)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'gold_unrate': {'formula': '直接读取 (月度失业率)', 'range': '过去24个月', 'freq': '每月', 'update': '每月第一个周五公布'},
    # 金银铜指数与比率
    'gold_index': {'formula': '直接读取 (NASDAQ Commodity Gold Index)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日更新'},
    'silver_index': {'formula': '直接读取 (NASDAQ Commodity Silver Index)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日更新'},
    # 指数走势图
    'nasdaq_index': {'formula': '直接读取 (纳斯达克综合指数)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'nasdaq100_index': {'formula': '直接读取 (纳斯达克100指数)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'},
    'sp500_index': {'formula': '直接读取 (标普500指数)', 'range': '过去90个交易日', 'freq': '每日', 'update': '美东时间每个交易日 18:00'}
}

