"""
认证和赞助路由 - 使用 JSON 存储
"""
import datetime
from flask import Blueprint, request, jsonify, g
import json_store
from auth import hash_password, check_password, generate_token, require_auth, get_user_access_info
from config import TRIAL_DAYS, MODULE_CONFIG, logger

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
sponsor_bp = Blueprint('sponsor', __name__, url_prefix='/api/sponsor')


# ==================== 认证路由 ====================

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请求数据无效'}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # 验证
    if not email or '@' not in email:
        return jsonify({'error': '请输入有效的邮箱地址'}), 400
    if len(password) < 6:
        return jsonify({'error': '密码至少需要6个字符'}), 400
    
    try:
        # 检查邮箱是否已存在
        existing = json_store.get_user_by_email(email)
        if existing:
            return jsonify({'error': '该邮箱已被注册'}), 400
        
        # 创建用户
        user = json_store.create_user(email, hash_password(password))
        
        # 生成token
        token = generate_token(user['id'], email)
        
        logger.info(f"New user registered: {email}")
        
        return jsonify({
            'message': '注册成功',
            'token': token,
            'user': {
                'id': user['id'],
                'email': email,
                'trial_days_left': TRIAL_DAYS,
                'is_trial_active': True,
                'activated_modules': []
            }
        }), 201
        
    except ValueError as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({'error': '注册失败，请稍后重试'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请求数据无效'}), 400
    
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': '请输入邮箱和密码'}), 400
    
    try:
        user = json_store.get_user_by_email(email)
        
        if not user:
            return jsonify({'error': '邮箱或密码错误'}), 401
        
        if not check_password(password, user['password_hash']):
            return jsonify({'error': '邮箱或密码错误'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': '账户已被禁用'}), 403
        
        user['email'] = email
        # 获取访问信息
        access_info = get_user_access_info(user)
        
        # 生成token
        token = generate_token(user['id'], email)
        
        logger.info(f"User logged in: {email}")
        
        return jsonify({
            'message': '登录成功',
            'token': token,
            'user': {
                'id': user['id'],
                'email': email,
                **access_info
            }
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': '登录失败，请稍后重试'}), 500


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    """获取当前用户信息"""
    user = g.current_user
    
    access_info = get_user_access_info(user)
    
    return jsonify({
        'id': user['id'],
        'email': user.get('email', ''),
        'created_at': user.get('created_at'),
        **access_info
    })


# ==================== 赞助路由 ====================

@sponsor_bp.route('/links', methods=['GET'])
def get_sponsor_links():
    """获取各模块的赞助链接"""
    links = {}
    for module, config in MODULE_CONFIG.items():
        links[module] = {
            'name': config['name'],
            'link': config['sponsor_link']
        }
    return jsonify(links)


@sponsor_bp.route('/redeem', methods=['POST'])
@require_auth
def redeem_sponsor_code():
    """兑换赞助码"""
    data = request.get_json()
    user = g.current_user
    
    if not data:
        return jsonify({'error': '请求数据无效'}), 400
    
    code = data.get('code', '').strip().upper()  # 赞助码转大写
    module = data.get('module', '').strip().lower()
    
    if not code:
        return jsonify({'error': '请输入赞助码'}), 400
    
    if module not in MODULE_CONFIG:
        return jsonify({'error': '无效的模块'}), 400
    
    try:
        # 查找赞助码
        sponsor_code = json_store.get_sponsor_code(code)
        
        if not sponsor_code:
            return jsonify({'error': '赞助码无效或已失效'}), 400
        
        if not sponsor_code.get('is_active', True):
            return jsonify({'error': '赞助码无效或已失效'}), 400
        
        # 验证模块匹配
        if sponsor_code['module'] != module:
            return jsonify({'error': f'此赞助码不适用于{MODULE_CONFIG[module]["name"]}'}), 400
        
        # 检查使用次数
        max_uses = sponsor_code.get('max_uses', 1)
        current_uses = sponsor_code.get('current_uses', 0)
        if max_uses > 0 and current_uses >= max_uses:
            return jsonify({'error': '此赞助码已达到使用上限'}), 400
        
        # 检查码是否过期
        expires_at = sponsor_code.get('expires_at')
        if expires_at:
            from datetime import datetime
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', ''))
            if expires_at < datetime.utcnow():
                return jsonify({'error': '此赞助码已过期'}), 400
        
        # 检查用户是否已激活该模块
        if json_store.has_module_access(user['id'], module):
            return jsonify({'error': f'您已激活{MODULE_CONFIG[module]["name"]}，无需重复激活'}), 400
        
        # 创建访问权限
        json_store.add_user_access(user['id'], module, code)
        
        # 更新赞助码使用次数
        json_store.use_sponsor_code(code)
        
        logger.info(f"User {user.get('email')} redeemed code {code} for {module}")
        
        # 返回更新后的访问信息
        access_info = get_user_access_info(user)
        
        return jsonify({
            'message': f'成功激活{MODULE_CONFIG[module]["name"]}！',
            'user': {
                'id': user['id'],
                'email': user.get('email', ''),
                **access_info
            }
        })
        
    except ValueError as e:
        logger.error(f"Redeem error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Redeem error: {e}")
        return jsonify({'error': '激活失败，请稍后重试'}), 500


@sponsor_bp.route('/check/<module>', methods=['GET'])
@require_auth
def check_module_access_api(module):
    """检查用户对特定模块的访问权限"""
    from auth import check_module_access
    
    user = g.current_user
    
    if module not in MODULE_CONFIG:
        return jsonify({'error': '无效的模块'}), 400
    
    access_info = check_module_access(user, module)
    
    return jsonify({
        'module': module,
        'module_name': MODULE_CONFIG[module]['name'],
        **access_info
    })
