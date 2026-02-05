"""
JSON 数据存储模块
用于管理用户、赞助码等数据
"""
import os
import json
import threading
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from config import TRIAL_DAYS

# 数据目录
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
SPONSOR_CODES_FILE = os.path.join(DATA_DIR, 'sponsor_codes.json')
USER_ACCESS_FILE = os.path.join(DATA_DIR, 'user_access.json')

# 线程锁，防止并发写入问题
_lock = threading.Lock()


def ensure_data_dir():
    """确保数据目录存在"""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)


def _load_json(filepath: str) -> Dict:
    """加载 JSON 文件"""
    if not os.path.exists(filepath):
        return {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def _save_json(filepath: str, data: Dict):
    """保存 JSON 文件"""
    ensure_data_dir()
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)


# ==================== 用户管理 ====================

def get_all_users() -> Dict[str, Any]:
    """获取所有用户"""
    return _load_json(USERS_FILE)


def get_user_by_email(email: str) -> Optional[Dict]:
    """根据邮箱获取用户"""
    users = get_all_users()
    return users.get(email.lower())


def get_user_by_id(user_id: int) -> Optional[Dict]:
    """根据 ID 获取用户"""
    users = get_all_users()
    for email, user in users.items():
        if user.get('id') == user_id:
            user['email'] = email
            return user
    return None


def create_user(email: str, password_hash: str) -> Dict:
    """创建新用户"""
    with _lock:
        users = get_all_users()
        email = email.lower()
        
        if email in users:
            raise ValueError('该邮箱已被注册')
        
        # 生成新 ID
        max_id = max([u.get('id', 0) for u in users.values()], default=0)
        new_id = max_id + 1
        
        now = datetime.utcnow().isoformat()
        trial_expires = (datetime.utcnow() + timedelta(days=TRIAL_DAYS)).isoformat()
        
        user = {
            'id': new_id,
            'password_hash': password_hash,
            'created_at': now,
            'trial_expires_at': trial_expires,
            'is_active': True
        }
        
        users[email] = user
        _save_json(USERS_FILE, users)
        
        user['email'] = email
        return user


def update_user(email: str, updates: Dict):
    """更新用户信息"""
    with _lock:
        users = get_all_users()
        email = email.lower()
        
        if email not in users:
            raise ValueError('用户不存在')
        
        users[email].update(updates)
        _save_json(USERS_FILE, users)


# ==================== 赞助码管理 ====================

def get_all_sponsor_codes() -> Dict[str, Any]:
    """获取所有赞助码"""
    return _load_json(SPONSOR_CODES_FILE)


def get_sponsor_code(code: str) -> Optional[Dict]:
    """获取单个赞助码"""
    codes = get_all_sponsor_codes()
    return codes.get(code.upper())


def create_sponsor_codes(codes_list: List[Dict]):
    """批量创建赞助码"""
    with _lock:
        codes = get_all_sponsor_codes()
        
        for code_info in codes_list:
            code = code_info['code'].upper()
            codes[code] = {
                'module': code_info['module'],
                'max_uses': code_info.get('max_uses', 1),
                'current_uses': 0,
                'is_active': True,
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': code_info.get('expires_at')
            }
        
        _save_json(SPONSOR_CODES_FILE, codes)
        return len(codes_list)


def use_sponsor_code(code: str) -> bool:
    """使用赞助码（增加使用次数）"""
    with _lock:
        codes = get_all_sponsor_codes()
        code = code.upper()
        
        if code not in codes:
            return False
        
        codes[code]['current_uses'] += 1
        _save_json(SPONSOR_CODES_FILE, codes)
        return True


def reset_sponsor_code(code: str) -> bool:
    """重置赞助码使用次数"""
    with _lock:
        codes = get_all_sponsor_codes()
        code = code.upper()
        
        if code not in codes:
            return False
        
        codes[code]['current_uses'] = max(0, codes[code]['current_uses'] - 1)
        _save_json(SPONSOR_CODES_FILE, codes)
        return True


def get_sponsor_codes_by_module(module: str) -> List[str]:
    """获取指定模块的所有赞助码"""
    codes = get_all_sponsor_codes()
    return [code for code, info in codes.items() if info.get('module') == module]


# ==================== 用户模块访问权限管理 ====================

def get_all_user_access() -> Dict[str, Any]:
    """获取所有用户访问权限"""
    return _load_json(USER_ACCESS_FILE)


def get_user_access(user_id: int) -> List[Dict]:
    """获取用户的所有模块访问权限"""
    all_access = get_all_user_access()
    user_key = str(user_id)
    return all_access.get(user_key, [])


def add_user_access(user_id: int, module: str, sponsor_code: str):
    """添加用户模块访问权限"""
    with _lock:
        all_access = get_all_user_access()
        user_key = str(user_id)
        
        if user_key not in all_access:
            all_access[user_key] = []
        
        # 检查是否已有该模块权限
        for access in all_access[user_key]:
            if access['module'] == module:
                raise ValueError('已激活该模块')
        
        all_access[user_key].append({
            'module': module,
            'sponsor_code': sponsor_code.upper(),
            'activated_at': datetime.utcnow().isoformat(),
            'expires_at': None  # 永久有效
        })
        
        _save_json(USER_ACCESS_FILE, all_access)


def remove_user_access(user_id: int, module: str = None) -> List[str]:
    """移除用户模块访问权限，返回使用的赞助码列表"""
    with _lock:
        all_access = get_all_user_access()
        user_key = str(user_id)
        
        if user_key not in all_access:
            return []
        
        removed_codes = []
        
        if module:
            # 移除指定模块
            new_access = []
            for access in all_access[user_key]:
                if access['module'] == module:
                    removed_codes.append(access['sponsor_code'])
                else:
                    new_access.append(access)
            all_access[user_key] = new_access
        else:
            # 移除所有模块
            for access in all_access[user_key]:
                removed_codes.append(access['sponsor_code'])
            all_access[user_key] = []
        
        _save_json(USER_ACCESS_FILE, all_access)
        return removed_codes


def has_module_access(user_id: int, module: str) -> bool:
    """检查用户是否有模块访问权限"""
    accesses = get_user_access(user_id)
    return any(a['module'] == module for a in accesses)


def get_user_activated_modules(user_id: int) -> List[str]:
    """获取用户已激活的模块列表"""
    accesses = get_user_access(user_id)
    return [a['module'] for a in accesses]


# ==================== 辅助函数 ====================

def is_trial_active(user: Dict) -> bool:
    """检查用户试用期是否有效"""
    trial_expires = user.get('trial_expires_at')
    if not trial_expires:
        return False
    
    if isinstance(trial_expires, str):
        trial_expires = datetime.fromisoformat(trial_expires.replace('Z', '+00:00').replace('+00:00', ''))
    
    return datetime.utcnow() < trial_expires


def get_trial_days_left(user: Dict) -> int:
    """获取试用期剩余天数"""
    trial_expires = user.get('trial_expires_at')
    if not trial_expires:
        return 0
    
    if isinstance(trial_expires, str):
        trial_expires = datetime.fromisoformat(trial_expires.replace('Z', '+00:00').replace('+00:00', ''))
    
    delta = trial_expires - datetime.utcnow()
    return max(0, delta.days + 1)


# 初始化数据目录
ensure_data_dir()
