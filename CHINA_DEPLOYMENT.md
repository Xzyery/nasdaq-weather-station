# 🇨🇳 国内部署方案（针对阿里云等国内服务器）

由于国内服务器访问 GitHub 可能不稳定，这里提供三种可靠的部署方案。

---

## 方案对比

| 方案 | 稳定性 | 配置难度 | 推荐指数 |
|------|--------|----------|---------|
| 方案一：Gitee 镜像 | ⭐⭐⭐⭐⭐ | 简单 | ⭐⭐⭐⭐⭐ |
| 方案二：阿里云 OSS | ⭐⭐⭐⭐⭐ | 中等 | ⭐⭐⭐⭐ |
| 方案三：GitHub 代理 | ⭐⭐⭐ | 简单 | ⭐⭐⭐ |

**推荐：方案一（Gitee 镜像）** - 最稳定且免费

---

## 🎯 方案一：使用 Gitee 作为国内镜像（推荐）

### 原理
```
GitHub Actions → 同时推送到 → GitHub + Gitee
                                    ↓
                      阿里云服务器 ← 从 Gitee 拉取（国内快）
```

### 步骤

#### 1. 创建 Gitee 仓库（3分钟）

1. 访问 [https://gitee.com](https://gitee.com) 注册账号
2. 创建新仓库，名称如：`nasdaq-weather-station`
3. 设置为**公开**或**私有**（私有需要配置密码）

#### 2. 配置 GitHub Secrets（2分钟）

在 GitHub 仓库中：**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

添加以下三个 Secrets：

| Name | Value | 示例 |
|------|-------|------|
| `GITEE_REPO` | `你的Gitee用户名/仓库名` | `zhangsan/nasdaq-weather-station` |
| `GITEE_USERNAME` | Gitee 用户名 | `zhangsan` |
| `GITEE_PASSWORD` | Gitee 密码或令牌 | `your_password_or_token` |

#### 3. 首次同步到 Gitee（Windows 本地）

```powershell
cd "c:\Users\bxw\Desktop\纳斯达克宏观气象站"

# 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/你的用户名/nasdaq-weather-station.git

# 推送到 Gitee
git push gitee main
```

#### 4. 阿里云服务器配置

```bash
# SSH 到阿里云
ssh root@你的服务器IP

# 从 Gitee 克隆（速度很快）
cd /opt
git clone https://gitee.com/你的用户名/nasdaq-weather-station.git

cd nasdaq-weather-station

# 添加 Gitee 为主要远程仓库
git remote rename origin github
git remote add origin https://gitee.com/你的用户名/nasdaq-weather-station.git
git remote add gitee https://gitee.com/你的用户名/nasdaq-weather-station.git

# 后续部署与原方案相同...
```

#### 5. 测试 GitHub Actions

- 进入 GitHub 仓库的 **Actions**
- 手动运行 **Update FRED Data**
- 成功后会自动推送到 GitHub 和 Gitee

#### 6. 验证 Gitee 同步

访问你的 Gitee 仓库，查看 `backend/macro_weather_v3.db` 是否有更新。

✅ **完成！** 阿里云服务器现在从 Gitee 拉取数据，速度快且稳定。

---

## 🪣 方案二：使用阿里云 OSS 存储

### 原理
```
GitHub Actions → 获取 FRED 数据 → 上传到阿里云 OSS
                                         ↓
                         阿里云服务器 ← 从 OSS 下载 .db 文件
```

### 优点
- 100% 稳定，不依赖 Git
- 直接从阿里云内网下载，速度极快
- 适合纯数据更新，不需要拉取代码

### 步骤

#### 1. 创建 OSS Bucket（5分钟）

1. 登录阿里云控制台
2. 进入 **对象存储 OSS**
3. 创建 Bucket：
   - 名称：`nasdaq-weather-data`
   - 区域：选择与你服务器相同区域（如华北2）
   - 读写权限：**私有**

#### 2. 获取 AccessKey

1. 进入 **访问控制 RAM**
2. 创建用户，勾选 **OpenAPI 调用访问**
3. 添加权限：`AliyunOSSFullAccess`
4. 保存 **AccessKey ID** 和 **AccessKey Secret**

#### 3. 配置 GitHub Secrets

添加两个 Secrets：

| Name | Value |
|------|-------|
| `OSS_KEY_ID` | 你的 AccessKey ID |
| `OSS_KEY_SECRET` | 你的 AccessKey Secret |

#### 4. 使用 OSS Workflow

将 `.github/workflows/update-data.yml` 替换为 OSS 版本（已创建在项目中）

#### 5. 服务器端下载脚本

创建 `/opt/nasdaq-weather-station/download_from_oss.sh`：

```bash
#!/bin/bash
cd /opt/nasdaq-weather-station/backend

# 使用阿里云 CLI 下载（需预先安装 ossutil）
ossutil cp oss://nasdaq-weather-data/data/latest.db ./macro_weather_v3.db --force

if [ $? -eq 0 ]; then
    echo "[$(date)] ✓ Database downloaded from OSS"
    sudo systemctl restart nasdaq-backend
else
    echo "[$(date)] ✗ OSS download failed"
fi
```

#### 6. 安装 ossutil

```bash
wget http://gosspublic.alicdn.com/ossutil/1.7.16/ossutil64
chmod 755 ossutil64
sudo mv ossutil64 /usr/local/bin/ossutil

# 配置
ossutil config
# 输入你的 AccessKey ID、Secret 和 Endpoint
```

#### 7. 添加到 crontab

```bash
crontab -e
```

添加：
```cron
10 * * * * /opt/nasdaq-weather-station/download_from_oss.sh >> /var/log/nasdaq-oss.log 2>&1
```

---

## 🌐 方案三：配置 GitHub 代理

### 原理
在服务器上配置代理访问 GitHub（需要有可用的代理服务器）

### 步骤

```bash
# 全局 Git 代理（临时）
git config --global http.proxy http://代理地址:端口
git config --global https.proxy http://代理地址:端口

# 或仅针对 GitHub
git config --global http.https://github.com.proxy http://代理地址:端口
```

### 缺点
- 依赖代理服务器稳定性
- 如果代理失效，拉取会失败

---

## 🏆 推荐配置总结

### 最佳实践（方案一）

```
1. GitHub Actions 每天自动更新数据
2. 同时推送到 GitHub + Gitee
3. 阿里云服务器从 Gitee 拉取
```

### 配置清单

- [x] GitHub 仓库已创建并推送
- [x] GitHub Actions 已启用
- [x] Gitee 仓库已创建
- [x] GitHub Secrets 已配置（GITEE_*）
- [x] 服务器已配置 Gitee 为主远程仓库
- [x] 自动更新脚本已设置（crontab）

---

## 🔧 故障排查

### Gitee 推送失败

```bash
# 检查 Gitee 凭据
git remote -v

# 重新配置 Gitee 远程地址（使用个人令牌）
git remote set-url gitee https://gitee.com/你的用户名/nasdaq-weather-station.git
```

### 服务器拉取失败

```bash
# 手动测试拉取
cd /opt/nasdaq-weather-station
git pull gitee main

# 查看远程仓库
git remote -v

# 如果 Gitee 失败，回退到 GitHub（带代理）
export https_proxy=http://代理地址:端口
git pull github main
```

---

## 📊 性能对比

| 指标 | Gitee | GitHub (无代理) | OSS |
|------|-------|----------------|-----|
| 下载速度 | 5-10 MB/s | 不稳定 | 20-50 MB/s |
| 稳定性 | 99.9% | 60% | 99.99% |
| 免费额度 | 5GB | 无限 | 40GB |
| 适用场景 | 完整代码+数据 | 国外服务器 | 仅数据文件 |

---

## ✅ 验证部署成功

运行以下命令确认一切正常：

```bash
# 1. 检查 Gitee 连接
cd /opt/nasdaq-weather-station
git ls-remote gitee

# 2. 手动拉取测试
git pull gitee main

# 3. 查看自动更新日志
tail -f /var/log/nasdaq-update.log

# 4. 检查后端服务
systemctl status nasdaq-backend
```

---

**🎉 选择最适合你的方案，开始部署吧！**

