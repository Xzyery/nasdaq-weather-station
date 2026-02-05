#!/bin/bash
# 网络连接测试脚本 - 在阿里云服务器上运行

echo "======================================"
echo "   网络连接测试"
echo "======================================"
echo ""

# 测试 GitHub 连接
echo "1. 测试 GitHub 连接..."
timeout 5 curl -I https://github.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ GitHub 可访问"
    GITHUB_SPEED=$(timeout 5 curl -o /dev/null -s -w '%{speed_download}' https://github.com | awk '{print int($1/1024)}')
    echo "   速度: ${GITHUB_SPEED} KB/s"
else
    echo "   ✗ GitHub 无法访问或超时"
fi
echo ""

# 测试 Gitee 连接
echo "2. 测试 Gitee 连接..."
timeout 5 curl -I https://gitee.com > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Gitee 可访问"
    GITEE_SPEED=$(timeout 5 curl -o /dev/null -s -w '%{speed_download}' https://gitee.com | awk '{print int($1/1024)}')
    echo "   速度: ${GITEE_SPEED} KB/s"
else
    echo "   ✗ Gitee 无法访问"
fi
echo ""

# 测试 Git 克隆速度（如果已有仓库地址）
if [ -n "$1" ]; then
    echo "3. 测试 Git 克隆速度..."
    echo "   正在测试: $1"
    
    TEMP_DIR=$(mktemp -d)
    cd $TEMP_DIR
    
    START_TIME=$(date +%s)
    timeout 30 git clone --depth 1 "$1" test_repo > /dev/null 2>&1
    END_TIME=$(date +%s)
    
    if [ -d "test_repo" ]; then
        ELAPSED=$((END_TIME - START_TIME))
        echo "   ✓ 克隆成功，耗时: ${ELAPSED}秒"
    else
        echo "   ✗ 克隆失败或超时"
    fi
    
    rm -rf $TEMP_DIR
    echo ""
fi

# 推荐方案
echo "======================================"
echo "   部署建议"
echo "======================================"
echo ""

if [ $? -eq 0 ]; then
    if [ -z "$GITEE_SPEED" ] || [ "$GITEE_SPEED" -gt 1000 ]; then
        echo "✅ 推荐使用 Gitee 镜像方案"
        echo "   参考文档: CHINA_DEPLOYMENT.md 方案一"
    fi
    
    if [ -z "$GITHUB_SPEED" ] && [ -z "$GITEE_SPEED" ]; then
        echo "⚠️  GitHub 和 Gitee 都无法访问"
        echo "   推荐使用 OSS 方案"
        echo "   参考文档: CHINA_DEPLOYMENT.md 方案二"
    fi
fi

echo ""
echo "完成测试！"
