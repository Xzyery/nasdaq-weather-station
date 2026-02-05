# 快速部署指南

## ⚠️ 重要提示

**如果你使用阿里云等国内服务器**，请先阅读 **[CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md)**，了解针对国内网络的优化方案。

---

## 📋 准备工作

- GitHub 账号
- 阿里云服务器（CentOS/Ubuntu）
- 域名（可选）

---

## 🚀 第一步：GitHub 配置（5分钟）

### 1. 创建仓库并推送代码

```bash
# 在本地项目目录
cd "c:\Users\bxw\Desktop\纳斯达克宏观气象站"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/nasdaq-weather-station.git
git push -u origin main
```

### 2. 启用 GitHub Actions

1. 进入仓库页面
2. **Settings** → **Actions** → **General**
3. **Workflow permissions** 选择：
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests
4. 点击 **Save**

### 3. 测试自动化

- 进入 **Actions** 标签
- 选择 **Update FRED Data**
- 点击 **Run workflow** 手动触发
- 等待约1分钟，查看是否成功

✅ **完成标志**：Actions 运行成功，仓库中的 `backend/macro_weather_v3.db` 文件有更新提交

---

## 🖥️ 第二步：阿里云服务器部署（15分钟）

### 1. SSH 连接服务器

```bash
ssh root@你的服务器IP
```

### 2. 一键安装所有依赖

```bash
# CentOS 系统
yum update -y
yum install -y git python3 python3-pip nginx
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Ubuntu 系统
apt update
apt install -y git python3 python3-pip python3-venv nginx nodejs npm
```

### 3. 克隆项目并配置后端

```bash
cd /opt
git clone https://github.com/你的用户名/nasdaq-weather-station.git
cd nasdaq-weather-station/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 创建数据目录和文件
mkdir -p data/txt_codes
echo '{}' > data/users.json
echo '{}' > data/user_access.json

# 生成赞助码
python scripts/generate_sponsor_codes.py
```

### 4. 配置后端服务（systemd）

```bash
# 复制服务文件
cp /opt/nasdaq-weather-station/nasdaq-backend.service /etc/systemd/system/

# 启动服务
systemctl daemon-reload
systemctl enable nasdaq-backend
systemctl start nasdaq-backend

# 检查状态
systemctl status nasdaq-backend
```

✅ **验证**：看到 "Running on http://127.0.0.1:5000" 表示成功

### 5. 构建前端

```bash
cd /opt/nasdaq-weather-station
npm install
npm run build
```

### 6. 配置 Nginx

```bash
# 复制配置文件
cp /opt/nasdaq-weather-station/nginx-config.conf /etc/nginx/conf.d/nasdaq.conf

# 编辑配置文件，替换域名/IP
nano /etc/nginx/conf.d/nasdaq.conf
# 修改 server_name 为你的域名或服务器IP

# 测试配置
nginx -t

# 重启 Nginx
systemctl enable nginx
systemctl restart nginx
```

### 7. 开放防火墙

```bash
# CentOS (firewalld)
firewall-cmd --permanent --add-service=http
firewall-cmd --reload

# Ubuntu (ufw)
ufw allow 80
ufw reload

# 阿里云安全组
# 在阿里云控制台添加安全组规则：入方向 TCP 80 端口
```

---

## 🔄 第三步：自动数据更新（3分钟）

### 设置定时拉取脚本

```bash
# 设置执行权限
chmod +x /opt/nasdaq-weather-station/update_data.sh

# 添加到 crontab（每小时第5分钟执行）
crontab -e
```

添加以下行：

```cron
5 * * * * /opt/nasdaq-weather-station/update_data.sh >> /var/log/nasdaq-update.log 2>&1
```

保存退出。

✅ **验证**：等待下一个小时的第5分钟，查看日志

```bash
tail -f /var/log/nasdaq-update.log
```

---

## 🎉 第四步：访问网站

在浏览器中打开：`http://你的服务器IP`

你应该能看到纳斯达克宏观气象站的首页！

---

## 📊 数据更新流程确认

### GitHub Actions（每天自动）

1. 每天北京时间 09:00 自动运行
2. 从 FRED 获取最新数据
3. 更新 `macro_weather_v3.db`
4. 自动提交到 GitHub

### 阿里云服务器（每小时自动）

1. 每小时第5分钟运行
2. 从 GitHub 拉取最新代码和数据
3. 重启后端服务加载新数据

---

## 🔧 常用命令

### 查看后端日志

```bash
journalctl -u nasdaq-backend -f
```

### 重启后端服务

```bash
systemctl restart nasdaq-backend
```

### 手动更新数据

```bash
/opt/nasdaq-weather-station/update_data.sh
```

### 查看 Nginx 日志

```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## ❗ 故障排查

### 1. 后端无法启动

```bash
# 查看详细错误
journalctl -u nasdaq-backend -n 50

# 检查 Python 环境
cd /opt/nasdaq-weather-station/backend
source venv/bin/activate
python app.py  # 手动运行查看错误
```

### 2. 前端无法访问

```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查 Nginx 配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### 3. 数据未更新

```bash
# 查看 GitHub Actions 状态
# 在 GitHub 仓库的 Actions 标签查看

# 手动触发更新
cd /opt/nasdaq-weather-station
git pull origin main
systemctl restart nasdaq-backend
```

---

## 🔐 安全建议

1. **修改 SSH 端口**
2. **配置 HTTPS**（推荐使用 Let's Encrypt）
3. **设置防火墙规则**
4. **定期备份数据文件**

---

## ✅ 部署完成清单

- [ ] GitHub Actions 成功运行
- [ ] 阿里云服务器可 SSH 访问
- [ ] 后端服务正常运行（端口 5000）
- [ ] Nginx 正常运行（端口 80）
- [ ] 网站可通过浏览器访问
- [ ] 自动更新脚本配置完成
- [ ] 防火墙和安全组开放 80 端口

---

**🎊 恭喜！你的纳斯达克宏观气象站已成功部署！**

有问题？查看详细文档：[README_DEPLOYMENT.md](README_DEPLOYMENT.md)
