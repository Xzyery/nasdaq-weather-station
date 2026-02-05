"""
赞助码生成脚本 - 使用 JSON 存储
为每个模块生成 1000 个唯一的赞助码，并保存到 JSON 和 txt 文件中
"""
import os
import sys
import secrets
import string

# 添加 backend 目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json_store

def generate_sponsor_code(prefix: str, length: int = 12) -> str:
    """生成一个唯一的赞助码"""
    # 使用大写字母和数字，排除容易混淆的字符 (O, 0, I, 1, L)
    alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    random_part = ''.join(secrets.choice(alphabet) for _ in range(length - len(prefix) - 1))
    return f"{prefix}-{random_part}"

def generate_codes_for_module(module: str, prefix: str, count: int = 1000, max_uses: int = 1) -> list:
    """为指定模块生成赞助码"""
    codes = []
    existing_codes = set()
    
    # 获取已存在的赞助码
    existing = json_store.get_sponsor_codes_by_module(module)
    existing_codes = set(existing)
    
    while len(codes) < count:
        code = generate_sponsor_code(prefix)
        if code not in existing_codes and code not in codes:
            codes.append(code)
    
    return codes

def save_codes_to_json(codes: list, module: str, max_uses: int = 1):
    """将赞助码保存到 JSON 文件"""
    codes_list = [{'code': code, 'module': module, 'max_uses': max_uses} for code in codes]
    json_store.create_sponsor_codes(codes_list)
    print(f"  ✓ 已将 {len(codes)} 个赞助码保存到 JSON 文件")

def save_codes_to_file(codes: list, filename: str):
    """将赞助码保存到 txt 文件"""
    # 路径改为 data/txt_codes/
    export_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'txt_codes')
    if not os.path.exists(export_dir):
        os.makedirs(export_dir)
        
    filepath = os.path.join(export_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"# 赞助码列表 - 共 {len(codes)} 个\n")
        f.write(f"# 每个赞助码只能使用一次\n")
        f.write("# " + "=" * 50 + "\n\n")
        for code in codes:
            f.write(code + "\n")
    print(f"  ✓ 已将赞助码保存到: {filepath}")

def main():
    """主函数"""
    print("=" * 60)
    print("        赞助码生成器 - 宏观气象站")
    print("=" * 60)
    print()
    
    modules = [
        ('nasdaq', 'NAS', 'nasdaq_sponsor_codes.txt', '纳斯达克气象站'),
        ('sp500', 'SP5', 'sp500_sponsor_codes.txt', '标普500气象站'),
        ('gold', 'GLD', 'gold_sponsor_codes.txt', '黄金宏观气象站'),
    ]
    
    count_per_module = 1000
    
    for module, prefix, filename, display_name in modules:
        print(f"\n[{display_name}]")
        print(f"  正在生成 {count_per_module} 个赞助码...")
        
        codes = generate_codes_for_module(module, prefix, count_per_module)
        
        # 保存到 JSON 文件
        save_codes_to_json(codes, module)
        
        # 保存到 txt 文件
        save_codes_to_file(codes, filename)
    
    print("\n" + "=" * 60)
    print("        生成完成！共生成 3000 个赞助码")
    print("=" * 60)
    print("\n文件列表:")
    print("  - backend/data/txt_codes/nasdaq_sponsor_codes.txt")
    print("  - backend/data/txt_codes/sp500_sponsor_codes.txt")
    print("  - backend/data/txt_codes/gold_sponsor_codes.txt")
    print()

if __name__ == '__main__':
    main()
