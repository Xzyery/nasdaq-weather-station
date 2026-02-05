# 部署方案快速选择指南

## 🤔 我应该选择哪个方案？

### 快速决策树

```
你的服务器在哪？
│
├─ 国外（AWS/GCP/Azure等）
│  └─ 使用标准方案
│     → README_DEPLOYMENT.md 或 QUICK_START.md
│
└─ 国内（阿里云/腾讯云/华为云等）
   │
   ├─ 能访问 GitHub 吗？
   │  │
   │  ├─ 能，但速度慢或不稳定
   │  │  └─ 使用 Gitee 镜像（推荐）⭐⭐⭐⭐⭐
   │  │     → CHINA_DEPLOYMENT.md 方案一
   │  │
   │  └─ 完全无法访问
   │     └─ 使用阿里云 OSS ⭐⭐⭐⭐
   │        → CHINA_DEPLOYMENT.md 方案二
   │
   └─ 还没测试过？
      └─ 运行 test_network.sh 测试网络
         → 根据测试结果选择方案
```

---

## 📊 方案详细对比

| 特性 | 标准方案 | Gitee 镜像 | OSS 存储 |
|------|---------|-----------|---------|
| **适用区域** | 国外服务器 | 国内服务器 | 国内服务器 |
| **GitHub 访问** | 需要 | 不需要 | 不需要 |
| **配置难度** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **稳定性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **下载速度** | 快 | 很快 | 极快 |
| **费用** | 免费 | 免费 | OSS 费用 |
| **版本控制** | ✅ | ✅ | ❌ |
| **代码同步** | ✅ | ✅ | 仅数据 |

---

## 🎯 推荐方案

### 1️⃣ 国外服务器 → 标准方案

**文档**: [QUICK_START.md](QUICK_START.md)

✅ 优点：
- 配置简单
- GitHub 访问稳定
- 免费且可靠

⚠️ 注意：
- 需要服务器能访问 GitHub

---

### 2️⃣ 国内服务器 → Gitee 镜像（最推荐）

**文档**: [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) 方案一

✅ 优点：
- 速度快（国内 CDN）
- 100% 稳定
- 免费（5GB 额度）
- 保留完整 Git 版本控制

⚠️ 注意：
- 需要创建 Gitee 账号
- 需要配置 GitHub Secrets

**适合场景**：
- ✅ 阿里云、腾讯云、华为云等服务器
- ✅ 需要同步代码 + 数据
- ✅ 预算有限

---

### 3️⃣ 国内服务器 → OSS 存储

**文档**: [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) 方案二

✅ 优点：
- 极稳定（99.99% 可用性）
- 内网传输速度最快
- 不依赖任何 Git 服务

⚠️ 注意：
- 需要开通阿里云 OSS
- 有一定费用（约 ¥0.12/GB/月）
- 不保留代码版本

**适合场景**：
- ✅ 已有阿里云 OSS
- ✅ 仅需要数据文件
- ✅ 对稳定性要求极高

---

## 🚀 快速开始（3 步）

### Step 1: 测试网络连接

在阿里云服务器上运行：

```bash
# 下载测试脚本
wget https://raw.githubusercontent.com/你的用户名/nasdaq-weather-station/main/test_network.sh

# 运行测试
chmod +x test_network.sh
./test_network.sh
```

### Step 2: 根据测试结果选择方案

| 测试结果 | 推荐方案 |
|---------|---------|
| Gitee 速度 > 1000 KB/s | 方案一：Gitee 镜像 |
| GitHub/Gitee 都无法访问 | 方案二：OSS 存储 |
| GitHub 速度正常 | 标准方案 |

### Step 3: 按照相应文档部署

- **Gitee 镜像**: [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) 方案一
- **OSS 存储**: [CHINA_DEPLOYMENT.md](CHINA_DEPLOYMENT.md) 方案二
- **标准方案**: [QUICK_START.md](QUICK_START.md)

---

## 💡 常见问题

### Q: 我已经按标准方案部署了，但发现 git pull 很慢，怎么办？

A: 可以无缝切换到 Gitee 镜像方案：

```bash
cd /opt/nasdaq-weather-station

# 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/你的用户名/nasdaq-weather-station.git

# 修改更新脚本使用 Gitee
# 编辑 update_data.sh，将 origin 改为 gitee
```

### Q: OSS 方案和 Gitee 方案可以同时使用吗？

A: 可以！这样可以实现双重保障：
- GitHub Actions 同时推送到 Gitee + 上传到 OSS
- 服务器优先从 Gitee 拉取，失败则从 OSS 下载

### Q: 我的服务器只能访问内网，怎么办？

A: 使用 OSS 内网端点（免流量费）：
```bash
# 配置 ossutil 时使用内网 endpoint
# 例如：oss-cn-shanghai-internal.aliyuncs.com
```

---

## 📞 需要帮助？

遇到问题可以：
1. 查看对应方案的详细文档
2. 运行 `test_network.sh` 诊断网络
3. 查看服务器日志排查错误
4. 在 GitHub Issues 提问

---

**选择适合你的方案，立即开始部署！** 🚀
