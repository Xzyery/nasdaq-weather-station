# 部署指南

## 架构说明

```
┌─────────────┐      定时运行       ┌──────────────┐
│   GitHub    │  ←──────────────  │ GitHub       │
│  Repository │                   │  Actions     │
└──────┬──────┘                   └──────────────┘
       │                                 │
       │ git pull                        │ 获取 FRED 数据
       │ 拉取数据库                       │ 更新 .db 文件
       │                                 │ 自动提交
       ↓                                 ↓
┌─────────────┐
│  阿里云      │
│  服务器      │
└─────────────┘
```

## 第一步：GitHub 设置

### 1. 创建 GitHub 仓库

```bash
cd "c:\Users\bxw\Desktop\纳斯达克宏观气象站"
git init
git add .
git commit -m "Initial commit: 纳斯达克宏观气象站"
git branch -M main
git remote add origin https://github.com/你的用户名/nasdaq-weather-station.git
git push -u origin main
```

### 2. 启用 GitHub Actions

1. 进入你的 GitHub 仓库
2. 点击 **Settings** → **Actions** → **General**
3. 在 "Workflow permissions" 中选择：
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
4. 点击 **Save**

### 3. 测试自动化

- 进入 **Actions** 标签
- 点击 **Update FRED Data** workflow
- 点击 **Run workflow** → **Run workflow** 手动触发测试

## 第二步：阿里云服务器部署

### 1. 服务器环境准备

```bash
# SSH 登录到阿里云服务器
ssh root@你的服务器IP

# 安装依赖
yum update -y
yum install -y git python3 python3-pip nginx

# 安装 Node.js（用于前端构建）
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

### 2. 克隆项目

```bash
cd /opt
git clone https://github.com/你的用户名/nasdaq-weather-station.git
cd nasdaq-weather-station
```

### 3. 后端部署

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建必要的数据目录
mkdir -p data/txt_codes

# 创建空的 JSON 文件（如果不存在）
echo '{}' > data/users.json
echo '{}' > data/sponsor_codes.json
echo '{}' > data/user_access.json

# 生成赞助码
python scripts/generate_sponsor_codes.py
```

### 4. 使用 systemd 管理后端服务

创建服务文件：

```bash
sudo nano /etc/systemd/system/nasdaq-backend.service
```

内容：

```ini
[Unit]
Description=Nasdaq Weather Station Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/nasdaq-weather-station/backend
Environment="PATH=/opt/nasdaq-weather-station/backend/venv/bin"
ExecStart=/opt/nasdaq-weather-station/backend/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable nasdaq-backend
sudo systemctl start nasdaq-backend
sudo systemctl status nasdaq-backend
```

### 5. 前端构建

```bash
cd /opt/nasdaq-weather-station

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 6. Nginx 配置

```bash
sudo nano /etc/nginx/conf.d/nasdaq.conf
```

内容：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态文件
    location / {
        root /opt/nasdaq-weather-station/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启动 Nginx：

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

## 第三步：自动更新数据

### 在服务器上设置定时拉取

创建更新脚本：

```bash
nano /opt/nasdaq-weather-station/update_data.sh
```

内容：

```bash
#!/bin/bash
cd /opt/nasdaq-weather-station
git pull origin main
sudo systemctl restart nasdaq-backend
echo "$(date): Data updated" >> /var/log/nasdaq-update.log
```

赋予执行权限：

```bash
chmod +x /opt/nasdaq-weather-station/update_data.sh
```

添加到 crontab（每小时检查一次）：

```bash
crontab -e
```

添加：

```cron
# 每小时的第5分钟检查数据更新
5 * * * * /opt/nasdaq-weather-station/update_data.sh
```

## 第四步：防火墙配置

```bash
# 开放 80 端口
firewall-cmd --permanent --add-service=http
firewall-cmd --reload

# 或者如果没有 firewalld
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
```

## 监控和维护

### 查看后端日志

```bash
sudo journalctl -u nasdaq-backend -f
```

### 查看 Nginx 日志

```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### 手动更新数据

```bash
cd /opt/nasdaq-weather-station
git pull origin main
sudo systemctl restart nasdaq-backend
```

## 数据流程总结

1. **GitHub Actions**（每天 UTC 01:00 / 北京时间 09:00）
   - 运行 `standalone_fetcher.py`
   - 从 FRED 获取最新数据
   - 更新 `macro_weather_v3.db`
   - 自动提交并推送到 GitHub

2. **阿里云服务器**（每小时第5分钟）
   - 运行 `git pull` 拉取最新代码和数据
   - 重启后端服务加载新数据
   - 用户访问网站获取最新数据

## 故障排查

### GitHub Actions 失败

- 检查 Actions 日志
- 确认 workflow permissions 设置正确
- 验证 FRED API 是否可访问

### 服务器无法拉取数据

```bash
# 检查 Git 连接
cd /opt/nasdaq-weather-station
git fetch origin

# 检查服务状态
sudo systemctl status nasdaq-backend

# 检查网络
curl -I https://api.github.com
```

### 数据未更新

```bash
# 查看更新日志
cat /var/log/nasdaq-update.log

# 手动触发更新
/opt/nasdaq-weather-station/update_data.sh
```
