#!/bin/bash
# 阿里云服务器数据更新脚本

# 切换到项目目录
cd /opt/nasdaq-weather-station

# 尝试从 Gitee 拉取（国内镜像，速度快）
echo "[$(date)] Pulling from Gitee mirror..."
git pull gitee main 2>/dev/null

# 如果 Gitee 失败，尝试 GitHub
if [ $? -ne 0 ]; then
    echo "[$(date)] Gitee failed, trying GitHub..."
    git pull origin main
fi

# 检查是否有更新
if [ $? -eq 0 ]; then
    echo "[$(date)] ✓ Pull successful"
    
    # 检查数据库文件是否有变化
    if git diff --name-only HEAD@{1} HEAD | grep -q "backend/macro_weather_v3.db"; then
        echo "[$(date)] Database updated, restarting service..."
        
        # 重启后端服务以加载新数据
        sudo systemctl restart nasdaq-backend
        
        if [ $? -eq 0 ]; then
            echo "[$(date)] ✓ Backend restarted successfully"
        else
            echo "[$(date)] ✗ Failed to restart backend"
        fi
    else
        echo "[$(date)] No database changes, skip restart"
    fi
else
    echo "[$(date)] ✗ Git pull failed from all sources"
fi
