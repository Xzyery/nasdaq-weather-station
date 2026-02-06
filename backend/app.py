import sys
import argparse
import datetime
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import ORDER_MAP, META_INFO, MODULE_CONFIG
from models import init_db, Session, Metric
from data_fetcher import update_metrics, logger
from routes.routes_auth import auth_bp, sponsor_bp
from auth import require_auth, check_module_access
from flask import g

app = Flask(__name__)
CORS(app)

# 注册认证路由
app.register_blueprint(auth_bp)
app.register_blueprint(sponsor_bp)

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """获取仪表盘数据 - 需要认证和模块权限"""
    # 检查是否有认证头
    auth_header = request.headers.get('Authorization')
    module = request.args.get('module', 'nasdaq')  # 默认纳斯达克
    
    # 如果有认证头，验证权限
    if auth_header:
        from auth import decode_token
        from models import User
        
        try:
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
            payload = decode_token(token)
            
            if payload:
                session = Session()
                user = session.query(User).filter_by(id=payload['user_id']).first()
                
                if user and user.is_active:
                    # 检查模块访问权限
                    access_info = check_module_access(user, module, session)
                    
                    if not access_info['allowed']:
                        session.close()
                        return jsonify({
                            'error': '访问受限',
                            'reason': 'expired',
                            'message': f'您的{MODULE_CONFIG.get(module, {}).get("name", "该模块")}试用期已结束，请输入赞助码继续使用。',
                            'sponsor_link': MODULE_CONFIG.get(module, {}).get('sponsor_link', '')
                        }), 403
                
                session.close()
        except Exception as e:
            logger.error(f"Auth check error: {e}")
    
    # 获取数据（无论是否认证都返回数据，让前端处理权限）
    session = Session()
    metrics = session.query(Metric).all()
    
    result = []
    for mid in ORDER_MAP:
        m = next((x for x in metrics if x.id == mid), None)
        if m:
            try:
                history = json.loads(m.history_json) if m.history_json else []
            except:
                history = []
            
            meta = META_INFO.get(mid, {'formula': '未知', 'range': '未知', 'freq': '未知', 'update': '未知'})
            
            # 获取最新数据日期（从历史记录中）
            data_date = history[-1]['date'] if history else None

            result.append({
                "id": m.id,
                "name": m.name,
                "ticker": m.ticker,
                "value": m.value,
                "secondaryValue": m.secondary_value,
                "unit": m.unit,
                "description": m.description,
                "statusText": m.status_text,
                "statusColor": m.status_color,
                "history": history,
                "formula": meta['formula'],
                "dataRange": meta['range'],
                "dataDate": data_date,
                "nextUpdateTime": meta['update'],
                "updateFrequency": meta['freq']
            })
    
    session.close()
    return jsonify(result)

@app.route('/api/refresh', methods=['POST'])
def force_refresh():
    update_metrics()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Nasdaq Macro Weather Station Backend')
    parser.add_argument('--update', action='store_true', help='Update data from FRED and exit (for Cron jobs)')
    parser.add_argument('--skip-update', action='store_true', help='Skip initial data update check')
    args = parser.parse_args()

    init_db()

    if args.update:
        print("Running CLI Update Task...")
        update_metrics()
        print("Done.")
        sys.exit(0)
    
    print("Starting Flask Server on port 5000...")
    app.run(host='0.0.0.0', port=5000)
