# 🚀 阿里云部署完整指南

## 📋 目录

- [方案选择](#方案选择)
- [方案一：ECS + Docker（推荐）](#方案一ecs--docker推荐)
- [方案二：ECS 传统部署](#方案二ecs-传统部署)
- [方案三：容器服务 ACK](#方案三容器服务-ack)
- [方案四：Serverless（函数计算）](#方案四serverless函数计算)
- [域名和SSL配置](#域名和ssl配置)
- [监控和日志](#监控和日志)
- [性能优化](#性能优化)
- [故障排查](#故障排查)

---

## 方案选择

### 快速对比

| 方案 | 成本 | 难度 | 性能 | 适用场景 |
|------|------|------|------|----------|
| **ECS + Docker** | 💰💰 | ⭐⭐ | 🚀🚀🚀 | 中小型项目（推荐） |
| **ECS 传统** | 💰💰 | ⭐ | 🚀🚀 | 快速上线 |
| **ACK** | 💰💰💰 | ⭐⭐⭐⭐ | 🚀🚀🚀🚀 | 大型项目 |
| **Serverless** | 💰 | ⭐⭐⭐ | 🚀🚀 | 低成本试用 |

### 推荐方案

**🎯 推荐：ECS + Docker**
- ✅ 环境一致性好
- ✅ 易于维护和扩展
- ✅ 成本可控
- ✅ 适合中小型项目

---

## 方案一：ECS + Docker（推荐）

### 1️⃣ 购买和配置ECS

#### 推荐配置

**基础配置**（适合测试和小型项目）：
- **CPU**: 2核
- **内存**: 4GB
- **系统盘**: 40GB（SSD）
- **网络**: 按使用流量计费
- **操作系统**: Ubuntu 22.04 / CentOS 8
- **预估成本**: ¥100-150/月

**生产配置**（适合中型项目）：
- **CPU**: 4核
- **内存**: 8GB
- **系统盘**: 80GB（SSD）
- **网络**: 固定带宽 5Mbps
- **操作系统**: Ubuntu 22.04
- **预估成本**: ¥300-400/月

#### 购买步骤

1. **登录阿里云控制台**
   - 访问：https://ecs.console.aliyun.com
   - 点击"创建实例"

2. **选择配置**
   - 地域：选择离用户近的（如华东-上海）
   - 实例规格：选择上述推荐配置
   - 镜像：Ubuntu 22.04 64位
   - 网络：专有网络VPC
   - 安全组：开放端口 80、443、22

3. **配置安全组规则**
   ```
   入方向规则：
   - 22/TCP    0.0.0.0/0   SSH访问
   - 80/TCP    0.0.0.0/0   HTTP
   - 443/TCP   0.0.0.0/0   HTTPS
   - 5000/TCP  0.0.0.0/0   应用端口（可选）
   ```

### 2️⃣ 服务器初始化

#### 连接服务器

```bash
# 使用SSH连接（替换为你的ECS公网IP）
ssh root@your-ecs-ip
```

#### 安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com | sh

# 启动Docker服务
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

# 安装Git
apt install -y git

# 安装其他工具
apt install -y curl wget vim
```

### 3️⃣ 部署应用

#### 克隆代码

```bash
# 创建项目目录
mkdir -p /www/apps
cd /www/apps

# 克隆代码（替换为你的仓库地址）
git clone https://your-git-repo/ai_news_hub.git
cd ai_news_hub
```

#### 配置环境变量

```bash
# 创建环境变量文件
cat > server/.env << 'EOF'
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/ai_programming_coach

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
BCRYPT_ROUNDS=12

# 阿里云百炼AI
ALIYUN_BAILIAN_API_KEY=your_api_key
ALIYUN_BAILIAN_MODEL=qwen-max

# Brave搜索（可选）
BRAVE_API_KEY=your_brave_api_key

# 微信公众号（可选）
WECHAT_APPID=your_appid
WECHAT_APPSECRET=your_appsecret

# Node环境
NODE_ENV=production
PORT=5000
EOF

# 设置权限
chmod 600 server/.env
```

#### 启动服务

```bash
# 使用Docker Compose启动
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

#### 初始化数据

```bash
# 进入应用容器
docker-compose exec app sh

# 运行数据同步脚本
node server/scripts/syncData.js

# 退出容器
exit
```

### 4️⃣ 配置Nginx和SSL

#### 安装Certbot（Let's Encrypt免费SSL）

```bash
# 安装Certbot
apt install -y certbot

# 申请SSL证书（替换为你的域名）
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 证书会保存在：
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### 更新nginx配置

```bash
# 创建SSL证书软链接
mkdir -p ssl
ln -s /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
ln -s /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem

# 更新nginx.conf（见下文完整配置）
vim nginx.conf

# 重启nginx
docker-compose restart nginx
```

**nginx.conf 完整配置**：

```nginx
events {
    worker_connections 2048;
}

http {
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    # 上游服务器
    upstream backend {
        server app:5000;
        keepalive 32;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL证书
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # SSL优化
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 安全头
        add_header Strict-Transport-Security "max-age=31536000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # 静态文件缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://backend;
            proxy_cache_valid 200 7d;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }

        # API接口
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置（AI解读需要更长时间）
            proxy_connect_timeout 300s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
        }

        # 前端页面
        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 健康检查
        location /health {
            proxy_pass http://backend/api/health;
            access_log off;
        }
    }
}
```

### 5️⃣ 设置自动更新

#### 创建更新脚本

```bash
cat > /www/apps/ai_news_hub/update.sh << 'EOF'
#!/bin/bash

echo "🔄 开始更新AI News Hub..."

cd /www/apps/ai_news_hub

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 重新构建镜像
echo "🔨 重新构建Docker镜像..."
docker-compose build --no-cache

# 重启服务
echo "🔄 重启服务..."
docker-compose down
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "✅ 检查服务状态..."
docker-compose ps

echo "✅ 更新完成！"
EOF

chmod +x update.sh
```

#### 使用更新脚本

```bash
# 手动更新
./update.sh

# 或设置定时更新（每天凌晨2点）
crontab -e
# 添加：
0 2 * * * cd /www/apps/ai_news_hub && ./update.sh >> /var/log/update.log 2>&1
```

### 6️⃣ 设置定时任务

```bash
# 编辑crontab
crontab -e

# 添加以下任务：

# 每6小时同步数据
0 */6 * * * docker-compose -f /www/apps/ai_news_hub/docker-compose.yml exec -T app node server/scripts/syncData.js >> /var/log/sync.log 2>&1

# 每天凌晨2点清理旧数据
0 2 * * * docker-compose -f /www/apps/ai_news_hub/docker-compose.yml exec -T app node server/scripts/syncData.js --cleanup >> /var/log/cleanup.log 2>&1

# 每周日凌晨3点备份数据库
0 3 * * 0 docker exec ai-coach-mongodb mongodump --out /backup/mongodb/$(date +\%Y\%m\%d) >> /var/log/backup.log 2>&1

# 每月1号删除30天前的备份
0 4 1 * * find /backup/mongodb -type d -mtime +30 -exec rm -rf {} \; >> /var/log/backup-cleanup.log 2>&1

# SSL证书自动续期
0 3 * * * certbot renew --quiet && docker-compose -f /www/apps/ai_news_hub/docker-compose.yml restart nginx
```

---

## 方案二：ECS 传统部署

### 1️⃣ 服务器准备

```bash
# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装PM2
npm install -g pm2

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# 安装Nginx
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 2️⃣ 部署应用

```bash
# 克隆代码
cd /www/apps
git clone your-repo/ai_news_hub.git
cd ai_news_hub

# 安装依赖
cd client && npm install && npm run build && cd ..
cd server && npm install --production && cd ..

# 配置环境变量
cp server/.env.example server/.env
vim server/.env  # 修改配置

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3️⃣ 配置Nginx

```bash
# 创建配置文件
cat > /etc/nginx/sites-available/ai-news-hub << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/ai-news-hub /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 方案三：容器服务 ACK

### 1️⃣ 创建ACK集群

1. 登录阿里云容器服务控制台
2. 创建Kubernetes集群
3. 选择标准版或Pro版
4. 配置节点规格

### 2️⃣ 准备Docker镜像

```bash
# 构建镜像
docker build -t ai-news-hub:latest .

# 推送到阿里云容器镜像服务
docker tag ai-news-hub:latest registry.cn-shanghai.aliyuncs.com/your-namespace/ai-news-hub:latest
docker push registry.cn-shanghai.aliyuncs.com/your-namespace/ai-news-hub:latest
```

### 3️⃣ 创建Kubernetes配置

**deployment.yaml**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-news-hub
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-news-hub
  template:
    metadata:
      labels:
        app: ai-news-hub
    spec:
      containers:
      - name: app
        image: registry.cn-shanghai.aliyuncs.com/your-namespace/ai-news-hub:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: mongodb-uri
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: ai-news-hub-service
spec:
  selector:
    app: ai-news-hub
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

### 4️⃣ 部署应用

```bash
# 应用配置
kubectl apply -f deployment.yaml

# 查看状态
kubectl get pods
kubectl get services

# 查看日志
kubectl logs -f deployment/ai-news-hub
```

---

## 方案四：Serverless（函数计算）

### 适用场景

- 低成本试用
- 低流量应用
- 按需付费

### 限制

- 冷启动延迟
- 无法长期保持连接
- 需要改造代码

**（详细配置请参考阿里云函数计算文档）**

---

## 域名和SSL配置

### 1️⃣ 域名解析

1. 登录阿里云DNS控制台
2. 添加域名解析记录：

```
类型    主机记录    记录值
A       @          ECS公网IP
A       www        ECS公网IP
CNAME   *          your-domain.com
```

### 2️⃣ SSL证书申请

#### 免费证书（Let's Encrypt）

```bash
# 安装Certbot
apt install -y certbot

# 申请证书
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# 自动续期
echo "0 3 * * * certbot renew --quiet && docker-compose restart nginx" | crontab -
```

#### 阿里云SSL证书

1. 登录SSL证书管理控制台
2. 购买免费证书或付费证书
3. 申请证书
4. 下载Nginx证书文件
5. 上传到服务器 `/etc/nginx/ssl/`

---

## 监控和日志

### 1️⃣ 应用监控

```bash
# 查看Docker容器状态
docker-compose ps

# 查看容器资源使用
docker stats

# PM2监控（传统部署）
pm2 monit
```

### 2️⃣ 日志查看

```bash
# Docker日志
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f nginx

# 应用日志
tail -f /var/log/sync.log
tail -f /var/log/update.log
```

### 3️⃣ 阿里云云监控

1. 登录云监控控制台
2. 添加ECS实例监控
3. 配置告警规则：
   - CPU使用率 > 80%
   - 内存使用率 > 85%
   - 磁盘使用率 > 85%
   - 应用不可用

---

## 性能优化

### 1️⃣ CDN加速

1. 开通阿里云CDN
2. 添加加速域名
3. 配置源站（ECS IP）
4. 开启HTTPS
5. 配置缓存规则

### 2️⃣ Redis缓存

```yaml
# docker-compose.yml添加Redis
redis:
  image: redis:7-alpine
  container_name: ai-coach-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  networks:
    - ai-coach-network
```

### 3️⃣ OSS存储

将静态资源（图片、CSS、JS）上传到OSS：

1. 创建OSS Bucket
2. 配置公共读权限
3. 开启CDN加速
4. 修改前端配置使用OSS URL

---

## 故障排查

### 服务无法访问

```bash
# 检查Docker服务
docker-compose ps

# 检查端口监听
netstat -tlnp | grep 5000
netstat -tlnp | grep 80

# 检查防火墙
ufw status
firewall-cmd --list-all

# 检查安全组
# 在阿里云控制台查看ECS安全组规则
```

### 数据库连接失败

```bash
# 检查MongoDB状态
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# 查看MongoDB日志
docker-compose logs mongodb
```

### 内存不足

```bash
# 清理Docker镜像
docker system prune -a

# 清理日志
find /var/log -name "*.log" -mtime +30 -delete
docker-compose exec mongodb mongosh --eval "db.news.deleteMany({publishedAt: {\$lt: new Date(Date.now() - 30*24*60*60*1000)}})"
```

---

## 📊 成本估算

### 基础配置（测试环境）

| 服务 | 配置 | 月费用 |
|------|------|--------|
| ECS | 2核4G | ¥120 |
| 流量 | 100GB | ¥80 |
| 域名 | .com | ¥55/年 ≈ ¥5 |
| SSL | Let's Encrypt | 免费 |
| **总计** | - | **≈¥205/月** |

### 生产配置（中型项目）

| 服务 | 配置 | 月费用 |
|------|------|--------|
| ECS | 4核8G | ¥350 |
| 带宽 | 5Mbps | 包含 |
| CDN | 100GB流量 | ¥20 |
| OSS | 50GB存储 | ¥10 |
| 域名 | .com | ¥55/年 ≈ ¥5 |
| SSL | 免费证书 | 免费 |
| **总计** | - | **≈¥385/月** |

---

## 🎯 部署检查清单

部署完成后，检查以下项目：

- [ ] 服务器可以访问
- [ ] 域名解析正确
- [ ] SSL证书有效
- [ ] 网站可以打开
- [ ] API正常响应
- [ ] 数据库连接成功
- [ ] 数据同步正常
- [ ] 日志正常输出
- [ ] 监控告警配置
- [ ] 定时任务正常
- [ ] 备份策略配置
- [ ] 安全组规则正确

---

## 📚 相关文档

- [Docker文档](https://docs.docker.com/)
- [阿里云ECS文档](https://help.aliyun.com/product/25365.html)
- [阿里云容器服务文档](https://help.aliyun.com/product/85222.html)
- [Let's Encrypt文档](https://letsencrypt.org/docs/)

---

**🎉 部署完成后，访问你的域名即可使用AI News Hub！**

更新时间：2025-10-16

