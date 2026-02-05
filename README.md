# 纳斯达克宏观气象站 🌤️

一个基于 FRED（Federal Reserve Economic Data）实时数据的宏观经济监测平台，提供纳斯达克、标普500和黄金市场的综合分析。

## 📊 功能特点

- **实时数据监控**：自动从 FRED API 获取最新宏观经济指标
- **多模块支持**：纳斯达克、标普500、黄金三大模块
- **用户认证系统**：7天免费试用 + 赞助码永久激活
- **可视化分析**：详细的指标数据展示和历史趋势
- **自动化更新**：GitHub Actions 每天自动更新数据

## 🏗️ 技术架构

### 前端
- **框架**：React + TypeScript
- **构建工具**：Vite
- **UI 组件**：自定义组件库
- **状态管理**：Context API

### 后端
- **框架**：Flask (Python)
- **数据存储**：
  - SQLite（FRED 指标数据）
  - JSON（用户数据、赞助码、权限）
- **认证**：JWT + bcrypt
- **数据源**：FRED API

### 自动化
- **GitHub Actions**：定时获取 FRED 数据
- **部署**：阿里云服务器

## 🚀 快速开始

### 本地开发

#### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/nasdaq-weather-station.git
cd nasdaq-weather-station
```

#### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# Windows
.venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 生成赞助码
python scripts/generate_sponsor_codes.py

# 启动后端服务
python app.py
```

后端将在 `http://localhost:5000` 运行

#### 3. 前端设置

```bash
# 回到项目根目录
cd ..

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:3001` 运行

## 📦 生产部署

📖 **[选择适合你的部署方案](DEPLOYMENT_GUIDE.md)** - 快速决策指南

### 国外服务器
详细部署指南请查看 [README_DEPLOYMENT.md](README_DEPLOYMENT.md) 或 [QUICK_START.md](QUICK_START.md)

### 🇨🇳 国内服务器（阿里云等）
**重要**：国内服务器访问 GitHub 可能不稳定，请查看：
- **[CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md)** - 国内部署专用方案
  - ⭐⭐⭐⭐⭐ 方案一：Gitee 镜像（推荐，免费且稳定）
  - ⭐⭐⭐⭐ 方案二：阿里云 OSS 存储
  - ⭐⭐⭐ 方案三：GitHub 代理

### 快速测试
在服务器上运行网络测试，自动推荐最佳方案：
```bash
bash test_network.sh
```

### 快速部署摘要

1. **GitHub 设置**：启用 Actions 并配置 workflow permissions
2. **服务器准备**：安装 Python、Node.js、Nginx
3. **后端部署**：使用 systemd 管理服务
4. **前端构建**：npm run build 并配置 Nginx
5. **自动更新**：设置 crontab 定时拉取数据

## 🗂️ 项目结构

```
nasdaq-weather-station/
├── .github/
│   └── workflows/
│       └── update-data.yml      # GitHub Actions 自动化
├── backend/
│   ├── data/                    # 数据存储
│   │   ├── users.json          # 用户数据
│   │   ├── sponsor_codes.json  # 赞助码
│   │   ├── user_access.json    # 权限记录
│   │   └── txt_codes/          # 导出的赞助码文本
│   ├── routes/                  # API 路由
│   │   └── routes_auth.py
│   ├── scripts/                 # 脚本工具
│   │   └── generate_sponsor_codes.py
│   ├── app.py                   # Flask 应用入口
│   ├── auth.py                  # 认证逻辑
│   ├── config.py                # 配置文件
│   ├── data_fetcher.py          # FRED 数据获取
│   ├── json_store.py            # JSON 存储引擎
│   ├── models.py                # 数据库模型
│   ├── standalone_fetcher.py    # 独立数据获取（GitHub Actions）
│   └── macro_weather_v3.db      # SQLite 数据库
├── src/
│   ├── components/              # React 组件
│   ├── pages/                   # 页面组件
│   ├── services/                # API 服务
│   └── App.tsx                  # 主应用
├── README.md                    # 本文件
└── README_DEPLOYMENT.md         # 部署指南
```

## 🔄 数据流程

### 国外服务器
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
│  服务器     │
└─────────────┘
```

### 🇨🇳 国内服务器（推荐使用 Gitee 镜像）
```
┌──────────────┐
│ GitHub       │  每天 09:00 自动运行
│  Actions     │  获取 FRED 数据
└───────┬──────┘
        │ 同时推送
        ├──────────┐
        ↓          ↓
  ┌─────────┐  ┌─────────┐
  │ GitHub  │  │ Gitee   │  国内镜像
  │ Repo    │  │ Mirror  │  (速度快)
  └─────────┘  └────┬────┘
                    │ git pull
                    │ (每小时)
                    ↓
              ┌─────────────┐
              │  阿里云      │
              │  服务器      │
              └─────────────┘
```

### 工作流程

1. **GitHub Actions** 每天自动运行，从 FRED 获取数据并提交
2. **阿里云服务器** 每小时拉取最新数据
3. **用户** 访问网站获取实时更新的经济指标

## 🔐 用户系统

- **注册**：邮箱 + 密码，自动获得 7 天试用
- **试用期**：所有模块免费访问
- **赞助激活**：使用赞助码永久激活特定模块
- **权限分离**：三个模块独立激活

## 📈 数据指标

### 纳斯达克模块
- 劳动力市场（失业率、就业人数等）
- 通胀指标（CPI、PPI、PCE等）
- 利率与货币政策
- 消费者信心

### 标普500模块
- 工业生产指数
- 制造业 PMI
- 企业盈利指标
- 市场情绪

### 黄金模块
- 实际利率
- 美元指数
- 通胀预期
- 避险情绪

## 🛠️ 维护命令

```bash
# 生成新的赞助码
python backend/scripts/generate_sponsor_codes.py

# 手动更新数据
python backend/standalone_fetcher.py

# 查看后端日志
sudo journalctl -u nasdaq-backend -f

# 重启服务
sudo systemctl restart nasdaq-backend
```

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请通过 GitHub Issues 联系。

