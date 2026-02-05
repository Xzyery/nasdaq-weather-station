# 纳斯达克宏观气象站 - 部署指南 (Gitee 镜像方案)

本方案专为**国内服务器（阿里云/腾讯云等）**设计，使用 Gitee 作为高速镜像，解决 GitHub 访问不稳定的问题。

## 🏗️ 架构原理

```
GitHub Actions (每天 09:00)
    ↓ (获取数据 & 提交)
GitHub 仓库
    ↓ (自动同步推送)
Gitee 仓库 (国内镜像)
    ↓ (极速拉取)
阿里云服务器 (每小时自动更新)
```

---

## 🚀 部署步骤

### 第一步：Gitee 准备（约 3 分钟）

1. 注册/登录 [Gitee (码云)](https://gitee.com)
2. 创建新仓库：`nasdaq-weather-station`
3. 记录仓库地址，例如：`https://gitee.com/你的用户名/nasdaq-weather-station.git`

### 第二步：配置 GitHub（约 2 分钟）

1. 进入 GitHub 仓库的 **Settings** → **Secrets and variables** → **Actions**
2. 添加以下 Repository Secrets：

| Name | Value | 说明 |
|------|-------|------|
| `GITEE_REPO` | `你的用户名/nasdaq-weather-station` | 不带 https:// |
| `GITEE_USERNAME` | 你的 Gitee 手机号/邮箱 | 用于认证 |
| `GITEE_PASSWORD` | 你的 Gitee 密码 | 用于认证 |

### 第三步：阿里云服务器一键部署（约 10 分钟）

1. SSH 登录到你的阿里云服务器
2. 运行一键部署脚本：

```bash
bash <(curl -s https://raw.githubusercontent.com/你的GitHub用户名/nasdaq-weather-station/main/deploy_aliyun.sh)
```
*(注意：将 URL 中的 `你的GitHub用户名` 替换为实际用户名)*

3. 脚本执行过程中，会提示输入你的 **Gitee 仓库地址**。

---

## 🔄 日常维护

### 自动更新机制
- **GitHub Actions**：每天北京时间 09:00 自动运行，获取最新 FRED 数据并推送到 Gitee。
- **服务器**：每小时第 5 分钟自动从 Gitee 拉取最新数据并重启服务。

### 常用运维命令

```bash
# 手动更新数据
/opt/nasdaq-weather-station/update_data.sh

# 查看更新日志
tail -f /var/log/nasdaq-update.log

# 查看后端日志
journalctl -u nasdaq-backend -f

# 重启服务
systemctl restart nasdaq-backend
```

### 故障排查

**Q: GitHub Actions 显示 Gitee 推送失败？**
- 检查 `GITEE_PASSWORD` 是否正确。
- 检查 Gitee 仓库是否已存在。

**Q: 服务器没有自动更新？**
- 运行 `cat /var/log/nasdaq-update.log` 查看错误原因。
- 检查 Gitee 仓库中 `backend/macro_weather_v3.db` 是否为最新时间。
