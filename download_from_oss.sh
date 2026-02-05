#!/bin/bash
# 从阿里云 OSS 下载数据文件
# 使用方案二：OSS 存储时使用此脚本

cd /opt/nasdaq-weather-station/backend

echo "[$(date)] Downloading database from Aliyun OSS..."

# 使用 ossutil 下载
ossutil cp oss://nasdaq-weather-data/data/latest.db ./macro_weather_v3.db --force

if [ $? -eq 0 ]; then
    echo "[$(date)] ✓ Database downloaded successfully"
    
    # 重启后端服务
    sudo systemctl restart nasdaq-backend
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] ✓ Backend restarted"
    else
        echo "[$(date)] ✗ Failed to restart backend"
    fi
else
    echo "[$(date)] ✗ OSS download failed"
fi
