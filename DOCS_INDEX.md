# 📚 文档导航

## 部署文档

| 文档 | 适用场景 | 推荐指数 |
|------|---------|---------|
| **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** | 🎯 **从这里开始** - 帮你选择最适合的部署方案 | ⭐⭐⭐⭐⭐ |
| [QUICK_START.md](QUICK_START.md) | 15分钟快速部署（国外服务器） | ⭐⭐⭐⭐ |
| [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) | 🇨🇳 国内服务器专用（阿里云/腾讯云等） | ⭐⭐⭐⭐⭐ |
| [README_DEPLOYMENT.md](README_DEPLOYMENT.md) | 完整部署文档（国外服务器） | ⭐⭐⭐⭐ |

## 配置文件

| 文件 | 用途 | 方案 |
|------|------|------|
| `.github/workflows/update-data.yml` | 自动更新 + 推送到 Gitee | 标准 + Gitee |
| `.github/workflows/update-data-oss.yml` | 自动更新 + 上传到 OSS | OSS 方案 |
| `update_data.sh` | 服务器端自动拉取脚本 | Gitee 方案 |
| `download_from_oss.sh` | 从 OSS 下载数据 | OSS 方案 |
| `test_network.sh` | 网络连接测试 | 诊断工具 |
| `nasdaq-backend.service` | systemd 服务配置 | 所有方案 |
| `nginx-config.conf` | Nginx 配置模板 | 所有方案 |

## 核心代码

| 文件 | 说明 |
|------|------|
| `backend/app.py` | Flask 主程序 |
| `backend/standalone_fetcher.py` | 独立数据获取（供 GitHub Actions 使用） |
| `backend/data_fetcher.py` | FRED 数据抓取逻辑 |
| `backend/json_store.py` | JSON 数据存储引擎 |
| `backend/routes/routes_auth.py` | 认证和赞助 API |
| `backend/scripts/generate_sponsor_codes.py` | 赞助码生成脚本 |

## 使用流程

### 新用户部署

1. **阅读** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - 选择方案
2. **测试** 运行 `test_network.sh`（如果是国内服务器）
3. **部署** 按照对应文档执行

### 国外服务器

```
QUICK_START.md → 按步骤执行 → 完成
```

### 国内服务器

```
CHINA_DEPLOYMENT.md → 选择方案 → 配置 GitHub Actions/OSS → 部署
```

## 常见场景

### 场景 1: 我有阿里云服务器，想快速部署

→ 阅读 [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) 方案一（Gitee 镜像）

### 场景 2: 我有 AWS/GCP 服务器

→ 阅读 [QUICK_START.md](QUICK_START.md)

### 场景 3: 我不确定服务器能否访问 GitHub

→ 先运行 `bash test_network.sh`，根据结果选择方案

### 场景 4: 我已经部署了，但 git pull 很慢

→ 切换到 [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) 方案一

### 场景 5: 我想要最稳定的方案，不在乎成本

→ 使用 [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) 方案二（OSS）

## 文件树

```
纳斯达克宏观气象站/
│
├── 📖 文档
│   ├── README.md                    # 项目总览
│   ├── DEPLOYMENT_GUIDE.md          # 🎯 部署选择指南（从这里开始）
│   ├── QUICK_START.md               # 快速部署（国外）
│   ├── CHINA_DEPLOYMENT.md          # 国内部署方案
│   ├── README_DEPLOYMENT.md         # 详细部署文档
│   └── DOCS_INDEX.md                # 本文件
│
├── 🔧 配置文件
│   ├── .github/workflows/
│   │   ├── update-data.yml          # GitHub Actions（标准 + Gitee）
│   │   └── update-data-oss.yml      # GitHub Actions（OSS 方案）
│   ├── update_data.sh               # 服务器更新脚本（Gitee）
│   ├── download_from_oss.sh         # OSS 下载脚本
│   ├── test_network.sh              # 网络测试脚本
│   ├── nasdaq-backend.service       # systemd 配置
│   └── nginx-config.conf            # Nginx 配置
│
└── 💻 源代码
    ├── backend/                     # 后端代码
    └── src/                         # 前端代码
```

## 快速链接

- 🚀 [开始部署](DEPLOYMENT_GUIDE.md)
- 🇨🇳 [国内服务器专用](CHINA_DEPLOYMENT.md)
- ⚡ [15分钟快速部署](QUICK_START.md)
- 🧪 [测试网络连接](test_network.sh)
- 📊 [项目说明](README.md)
