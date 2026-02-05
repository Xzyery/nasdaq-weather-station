"""
认证工具模块 - 使用 JSON 存储
"""
import jwt
import bcrypt
import datetime
from functools import wraps
from flask import request, jsonify, g
from config import JWT_SECRET, JWT_EXPIRATION_HOURS
import json_store


def hash_password(password: str) -> str:
    """使用bcrypt加密密码"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(password: str, password_hash: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def generate_token(user_id: int, email: str) -> str:
    """生成JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def decode_token(token: str) -> dict:
    """解码JWT token"""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """验证JWT的装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': '缺少认证信息'}), 401
        
        try:
            # Bearer <token>
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
        except IndexError:
            return jsonify({'error': '认证格式错误'}), 401
        
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Token无效或已过期'}), 401
        
        # 从 JSON 获取用户信息
        user = json_store.get_user_by_id(payload['user_id'])
        if not user or not user.get('is_active', True):
            return jsonify({'error': '用户不存在或已禁用'}), 401
        
        g.current_user = user
        
        return f(*args, **kwargs)
    
    return decorated


def check_module_access(user: dict, module: str) -> dict:
    """
    检查用户对模块的访问权限
    返回: {'allowed': bool, 'reason': str, 'trial_days_left': int or None}
    """
    # 1. 检查试用期
    if json_store.is_trial_active(user):
        days_left = json_store.get_trial_days_left(user)
        return {
            'allowed': True, 
            'reason': 'trial', 
            'trial_days_left': days_left
        }
    
    # 2. 检查是否有该模块的激活权限
    if json_store.has_module_access(user['id'], module):
        return {'allowed': True, 'reason': 'activated', 'trial_days_left': None}
    
    # 3. 无权限
    return {
        'allowed': False, 
        'reason': 'expired', 
        'trial_days_left': 0
    }


def get_user_access_info(user: dict) -> dict:
    """获取用户所有模块的访问状态"""
    trial_days_left = json_store.get_trial_days_left(user)
    is_trial_active = json_store.is_trial_active(user)
    
    # 这一步非常重要：get_user_activated_modules 内部应该调用 has_module_access 来触发过期检查
    activated_modules = []
    from config import MODULE_CONFIG
    for module in MODULE_CONFIG.keys():
        if json_store.has_module_access(user['id'], module):
            activated_modules.append(module)
    
    return {
        'trial_days_left': trial_days_left,
        'is_trial_active': is_trial_active,
        'activated_modules': activated_modules
    }
