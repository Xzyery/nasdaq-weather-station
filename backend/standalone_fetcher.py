"""
独立数据获取脚本 - 用于 GitHub Actions
可以独立运行，不依赖 Flask 服务器
"""
import sys
import os

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from data_fetcher import update_metrics, logger

def main():
    """主函数"""
    try:
        logger.info("=" * 60)
        logger.info("Starting standalone FRED data fetch")
        logger.info("=" * 60)
        
        # 确保数据库已初始化
        from models import init_db
        init_db()
        
        # 更新数据
        success = update_metrics()
        
        if success:
            logger.info("✓ Data fetch completed successfully")
            return 0
        else:
            logger.error("✗ Data fetch failed")
            return 1
            
    except Exception as e:
        logger.error(f"✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
