# 🚀 快速部署指南

## 5分钟部署到阿里云ECS

### 前提条件

1. ✅ 已购买阿里云ECS（推荐：2核4G，Ubuntu 22.04）
2. ✅ 已获取阿里云百炼API Key
3. ✅ 已配置安全组（开放端口：22, 80, 443）

---

## 方法一：一键部署脚本（推荐）

### 步骤1：连接服务器

```bash
ssh root@your-ecs-ip
```

### 步骤2：下载并运行部署脚本

```bash
# 下载脚本
wget https://raw.githubusercontent.com/your-repo/ai_news_hub/main/deploy-aliyun.sh

# 添加执行权限
chmod +x deploy-aliyun.sh

# 运行脚本
./deploy-aliyun.sh
```

### 步骤3：配置环境变量

```bash
# 编辑配置文件
vim /www/apps/ai_news_hub/server/.env

# 必须填写：
ALIYUN_BAILIAN_API_KEY=your_api_key_here

# 保存退出（按ESC，输入:wq）
```

### 步骤4：重启服务

```bash
cd /www/apps/ai_news_hub
docker-compose restart
```

### 步骤5：访问网站

```bash
# 打开浏览器访问
http://your-ecs-ip
```

**🎉 完成！**

---

## 方法二：手动部署

### 步骤1：安装依赖

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 步骤2：上传代码

```bash
# 方法1：Git克隆
mkdir -p /www/apps && cd /www/apps
git clone your-repo/ai_news_hub.git
cd ai_news_hub

# 方法2：手动上传（本地执行）
scp -r ./ai_news_hub root@your-ecs-ip:/www/apps/
```

### 步骤3：配置环境

```bash
cd /www/apps/ai_news_hub

# 创建环境变量文件
cat > server/.env << 'EOF'
MONGODB_URI=mongodb://mongodb:27017/ai_programming_coach
JWT_SECRET=$(openssl rand -base64 32)
ALIYUN_BAILIAN_API_KEY=your_api_key
ALIYUN_BAILIAN_MODEL=qwen-max
NODE_ENV=production
PORT=5000
EOF
```

### 步骤4：启动服务

```bash
docker-compose up -d
```

### 步骤5：初始化数据

```bash
# 同步新闻、论文、博客数据
docker-compose exec app node server/scripts/syncData.js
```

---

## 配置域名和SSL（可选）

### 申请免费SSL证书

```bash
# 安装Certbot
apt install -y certbot

# 申请证书（替换为你的域名）
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 创建软链接
cd /www/apps/ai_news_hub
mkdir -p ssl
ln -s /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
ln -s /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem

# 更新nginx配置
sed -i 's/your-domain.com/your-actual-domain.com/g' nginx.conf

# 重启nginx
docker-compose restart nginx
```

### 配置域名解析

在阿里云DNS控制台添加：

```
类型    主机记录    记录值
A       @          ECS公网IP
A       www        ECS公网IP
```

---

## 常用命令

```bash
# 进入项目目录
cd /www/apps/ai_news_hub

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新代码并重启
git pull
docker-compose up -d --build

# 同步数据
docker-compose exec app node server/scripts/syncData.js

# 进入容器
docker-compose exec app sh

# 查看MongoDB数据
docker-compose exec mongodb mongosh
```

---

## 配置定时任务

```bash
# 编辑crontab
crontab -e

# 添加以下内容：

# 每6小时同步数据
0 */6 * * * cd /www/apps/ai_news_hub && docker-compose exec -T app node server/scripts/syncData.js >> /var/log/sync.log 2>&1

# 每天凌晨2点清理旧数据
0 2 * * * cd /www/apps/ai_news_hub && docker-compose exec -T app node server/scripts/syncData.js --cleanup >> /var/log/cleanup.log 2>&1

# SSL证书自动续期
0 3 * * * certbot renew --quiet && cd /www/apps/ai_news_hub && docker-compose restart nginx
```

---

## 故障排查

### 无法访问网站

```bash
# 1. 检查服务状态
docker-compose ps

# 2. 检查日志
docker-compose logs app

# 3. 检查端口
netstat -tlnp | grep 80
netstat -tlnp | grep 5000

# 4. 检查防火墙
ufw status

# 5. 检查安全组（阿里云控制台）
# 确保开放端口：22, 80, 443
```

### 数据库连接失败

```bash
# 检查MongoDB状态
docker-compose ps mongodb

# 查看MongoDB日志
docker-compose logs mongodb

# 测试连接
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### AI解读超时

```bash
# 检查环境变量
docker-compose exec app env | grep ALIYUN

# 重启服务
docker-compose restart app

# 查看日志
docker-compose logs -f app
```

---

## 性能优化

### 1. 启用CDN

1. 登录阿里云CDN控制台
2. 添加加速域名
3. 配置源站（ECS IP）
4. 开启HTTPS

### 2. 升级服务器配置

建议配置：
- CPU: 4核
- 内存: 8GB
- 带宽: 5Mbps

### 3. 数据库优化

```bash
# 定期清理旧数据
docker-compose exec app node server/scripts/syncData.js --cleanup

# 备份数据库
docker exec ai-coach-mongodb mongodump --out /backup/mongodb/$(date +%Y%m%d)
```

---

## 监控和告警

### 查看资源使用

```bash
# 系统资源
htop

# Docker资源
docker stats

# 磁盘使用
df -h

# 内存使用
free -h
```

### 配置阿里云监控

1. 登录云监控控制台
2. 添加ECS实例
3. 配置告警规则

---

## 备份策略

### 自动备份脚本

```bash
cat > /root/backup.sh << 'EOF'
#!/bin/bash
# 备份目录
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d)

# 创建备份
docker exec ai-coach-mongodb mongodump --out $BACKUP_DIR/$DATE

# 删除30天前的备份
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup.sh

# 添加到crontab
echo "0 3 * * * /root/backup.sh >> /var/log/backup.log 2>&1" | crontab -
```

---

## 安全加固

### 1. 更改SSH端口

```bash
# 编辑SSH配置
vim /etc/ssh/sshd_config

# 修改端口
Port 2222

# 重启SSH
systemctl restart sshd
```

### 2. 配置防火墙

```bash
# 安装UFW
apt install -y ufw

# 允许SSH、HTTP、HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙
ufw enable
```

### 3. 定期更新

```bash
# 系统更新
apt update && apt upgrade -y

# Docker镜像更新
cd /www/apps/ai_news_hub
docker-compose pull
docker-compose up -d
```

---

## 📞 获取帮助

- 📖 [完整部署文档](./ALIYUN_DEPLOYMENT_GUIDE.md)
- 🐛 遇到问题？提交Issue
- 💬 技术交流群

---

## 🎯 检查清单

部署完成后，请检查：

- [ ] 网站可以正常访问
- [ ] API正常响应
- [ ] 数据库连接成功
- [ ] 数据同步正常
- [ ] SSL证书有效（如果配置）
- [ ] 定时任务配置
- [ ] 日志正常输出
- [ ] 监控告警配置

---

**🎉 恭喜！你的AI News Hub已成功部署到阿里云！**

更新时间：2025-10-16

