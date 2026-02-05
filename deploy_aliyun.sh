#!/bin/bash
# 阿里云一键部署脚本（使用 Gitee 镜像）
# 使用方法：
#   1. 先在 Gitee 创建好仓库并配置 GitHub Actions
#   2. SSH 到阿里云服务器
#   3. 运行: bash <(curl -s https://gitee.com/你的用户名/nasdaq-weather-station/raw/main/deploy_aliyun.sh)

set -e

echo "======================================"
echo "   纳斯达克宏观气象站 - 一键部署"
echo "======================================"
echo ""

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 用户运行此脚本"
    echo "使用: sudo bash deploy_aliyun.sh"
    exit 1
fi

# 读取 Gitee 仓库地址
read -p "请输入你的 Gitee 仓库地址 (例如: https://gitee.com/zhangsan/nasdaq-weather-station.git): " GITEE_REPO

if [ -z "$GITEE_REPO" ]; then
    echo "错误: 仓库地址不能为空"
    exit 1
fi

echo ""
echo "开始部署..."
echo ""

# 1. 安装依赖
echo "1. 安装系统依赖..."
if command -v yum &> /dev/null; then
    # CentOS/RHEL
    yum update -y
    yum install -y git python3 python3-pip nginx
    
    # 安装 Node.js
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
elif command -v apt &> /dev/null; then
    # Ubuntu/Debian
    apt update
    apt install -y git python3 python3-pip python3-venv nginx nodejs npm
else
    echo "错误: 不支持的系统"
    exit 1
fi

echo "✓ 系统依赖安装完成"
echo ""

# 2. 克隆项目
echo "2. 克隆项目..."
cd /opt
if [ -d "nasdaq-weather-station" ]; then
    echo "目录已存在，备份为 nasdaq-weather-station.bak"
    mv nasdaq-weather-station nasdaq-weather-station.bak.$(date +%s)
fi

git clone "$GITEE_REPO" nasdaq-weather-station
cd nasdaq-weather-station

echo "✓ 项目克隆完成"
echo ""

# 3. 配置后端
echo "3. 配置后端..."
cd backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 创建数据目录
mkdir -p data/txt_codes
echo '{}' > data/users.json
echo '{}' > data/user_access.json

# 生成赞助码
python scripts/generate_sponsor_codes.py

echo "✓ 后端配置完成"
echo ""

# 4. 配置 systemd 服务
echo "4. 配置后端服务..."
cp /opt/nasdaq-weather-station/nasdaq-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable nasdaq-backend
systemctl start nasdaq-backend

sleep 2
if systemctl is-active --quiet nasdaq-backend; then
    echo "✓ 后端服务启动成功"
else
    echo "✗ 后端服务启动失败，请检查日志"
    journalctl -u nasdaq-backend -n 20
fi
echo ""

# 5. 构建前端
echo "5. 构建前端..."
cd /opt/nasdaq-weather-station
npm install
npm run build

echo "✓ 前端构建完成"
echo ""

# 6. 配置 Nginx
echo "6. 配置 Nginx..."
cp /opt/nasdaq-weather-station/nginx-config.conf /etc/nginx/conf.d/nasdaq.conf

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')
sed -i "s/你的域名或IP/$SERVER_IP/g" /etc/nginx/conf.d/nasdaq.conf

nginx -t
if [ $? -eq 0 ]; then
    systemctl enable nginx
    systemctl restart nginx
    echo "✓ Nginx 配置完成"
else
    echo "✗ Nginx 配置失败"
fi
echo ""

# 7. 配置防火墙
echo "7. 配置防火墙..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --reload
    echo "✓ firewalld 规则已添加"
elif command -v ufw &> /dev/null; then
    ufw allow 80
    echo "✓ ufw 规则已添加"
fi
echo ""

# 8. 配置自动更新
echo "8. 配置自动更新..."
chmod +x /opt/nasdaq-weather-station/update_data.sh

# 添加到 crontab
(crontab -l 2>/dev/null | grep -v "nasdaq"; echo "5 * * * * /opt/nasdaq-weather-station/update_data.sh >> /var/log/nasdaq-update.log 2>&1") | crontab -

echo "✓ 自动更新已配置（每小时第5分钟）"
echo ""

# 完成
echo "======================================"
echo "   🎉 部署完成！"
echo "======================================"
echo ""
echo "访问地址: http://$SERVER_IP"
echo ""
echo "后端状态: systemctl status nasdaq-backend"
echo "查看日志: journalctl -u nasdaq-backend -f"
echo "更新日志: tail -f /var/log/nasdaq-update.log"
echo ""
echo "⚠️ 重要提示："
echo "1. 请在阿里云安全组开放 80 端口"
echo "2. 确保 GitHub Actions 已配置并推送到 Gitee"
echo "3. 首次数据更新可能需要 1-2 小时"
echo ""
echo "文档: /opt/nasdaq-weather-station/CHINA_DEPLOYMENT.md"
echo ""
