# 🚀 阿里云部署指南

## 📋 目录

- [准备工作](#准备工作)
- [方式一：Docker部署（推荐）](#方式一docker部署推荐)
- [方式二：直接部署](#方式二直接部署)
- [域名和SSL配置](#域名和ssl配置)
- [环境变量配置](#环境变量配置)
- [监控和维护](#监控和维护)
- [故障排查](#故障排查)

---

## 准备工作

### 1. 购买阿里云ECS服务器

**推荐配置**：
- **CPU**: 4核
- **内存**: 8GB
- **系统盘**: 40GB（SSD）
- **数据盘**: 100GB（用于数据库和日志）
- **操作系统**: Ubuntu 22.04 LTS 或 CentOS 7.9
- **带宽**: 5Mbps以上（按流量计费）

**安全组规则**：
```
入方向规则:
- 22/TCP    (SSH)       - 限制为你的IP
- 80/TCP    (HTTP)      - 0.0.0.0/0
- 443/TCP   (HTTPS)     - 0.0.0.0/0
- 5000/TCP  (API)       - 可选，用于调试

出方向规则:
- 全部允许
```

### 2. 购买阿里云OSS

**用途**: 存储PDF转换的图片

**配置步骤**:
1. 创建Bucket（公共读权限）
2. 获取AccessKey和SecretKey
3. 记录Bucket名称和Region

**参考**: [OSS_SETUP.md](./OSS_SETUP.md)

### 3. 购买域名（可选）

**推荐**:
- 在阿里云购买域名
- 配置域名解析到ECS公网IP
- 申请免费SSL证书

---

## 方式一：Docker部署（推荐）

### 优点
- ✅ 环境隔离，避免依赖冲突
- ✅ 一键部署，快速上线
- ✅ 易于扩展和迁移
- ✅ 统一的运行环境

### 步骤

#### 1. 连接服务器

```bash
ssh root@your-server-ip
```

#### 2. 安装Docker和Docker Compose

**Ubuntu/Debian**:
```bash
# 更新软件包
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com | bash

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

**CentOS/RHEL**:
```bash
# 更新软件包
sudo yum update -y

# 安装Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

#### 3. 安装Python和依赖（PDF转换需要）

```bash
# Ubuntu
sudo apt install -y python3 python3-pip python3-venv poppler-utils

# CentOS
sudo yum install -y python3 python3-pip poppler-utils

# 安装Python库
python3 -m pip install --user pdf2image Pillow requests "urllib3<2"
```

#### 4. 克隆代码

```bash
# 创建应用目录
mkdir -p /opt/ai_news_hub
cd /opt/ai_news_hub

# 克隆代码（或上传代码）
git clone <your-repo-url> .

# 或使用scp上传
# scp -r /path/to/ai_news_hub root@your-server-ip:/opt/
```

#### 5. 配置环境变量

```bash
# 创建服务器端环境变量文件
cd /opt/ai_news_hub/server
cat > .env << 'EOF'
# 服务器配置
NODE_ENV=production
PORT=5000

# MongoDB配置
MONGODB_URI=mongodb://mongodb:27017/ai_news_hub

# JWT密钥（请修改为复杂密钥）
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024

# OpenAI API配置（如果使用）
OPENAI_API_KEY=sk-your-openai-api-key

# 阿里云百炼配置
ALIYUN_BAILIAN_API_KEY=your_aliyun_bailian_api_key
ALIYUN_BAILIAN_APP_ID=your_app_id
ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max
ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max

# 阿里云OSS配置
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name

# 新闻API配置（可选）
NEWS_API_KEY=your_news_api_key

# 加密轮数
BCRYPT_ROUNDS=12
EOF

# 设置权限
chmod 600 .env
```

#### 6. 构建并启动服务

```bash
cd /opt/ai_news_hub

# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

#### 7. 验证部署

```bash
# 检查服务状态
curl http://localhost:5000/api/health

# 预期返回
# {"status":"ok","timestamp":"..."}

# 检查MongoDB连接
docker-compose exec mongodb mongo --eval "db.adminCommand('ping')"
```

#### 8. 配置自动启动

```bash
# 设置Docker开机自启
sudo systemctl enable docker

# Docker Compose会自动重启容器（restart: unless-stopped）
```

---

## 方式二：直接部署

### 优点
- ✅ 更直接的控制
- ✅ 性能略好
- ✅ 调试方便

### 步骤

#### 1. 安装Node.js

```bash
# 使用nvm安装Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

nvm install 18
nvm use 18
nvm alias default 18

# 验证
node --version  # v18.x.x
npm --version   # 9.x.x
```

#### 2. 安装MongoDB

**Ubuntu**:
```bash
# 导入MongoDB公钥
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# 添加MongoDB源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 安装MongoDB
sudo apt update
sudo apt install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证
sudo systemctl status mongod
```

**CentOS**:
```bash
# 创建MongoDB源文件
cat > /etc/yum.repos.d/mongodb-org-6.0.repo << 'EOF'
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

# 安装MongoDB
sudo yum install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证
sudo systemctl status mongod
```

#### 3. 安装Python依赖

```bash
# 安装Python和pip
sudo apt install -y python3 python3-pip python3-venv  # Ubuntu
sudo yum install -y python3 python3-pip                # CentOS

# 安装poppler（PDF转换需要）
sudo apt install -y poppler-utils  # Ubuntu
sudo yum install -y poppler-utils  # CentOS

# 安装Python库
python3 -m pip install --user pdf2image Pillow requests "urllib3<2"

# 验证
python3 -c "import pdf2image; print('pdf2image installed')"
```

#### 4. 克隆并构建项目

```bash
# 创建应用目录
mkdir -p /opt/ai_news_hub
cd /opt/ai_news_hub

# 克隆代码
git clone <your-repo-url> .

# 配置环境变量
cd server
cp .env.example .env
nano .env  # 编辑环境变量

# 安装依赖
npm install

# 构建前端
cd ../client
npm install
npm run build

# 返回根目录
cd ..
```

#### 5. 安装PM2

```bash
# 全局安装PM2
npm install -g pm2

# 验证
pm2 --version
```

#### 6. 启动应用

```bash
cd /opt/ai_news_hub

# 使用PM2启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs ai-coach-server

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
# 执行输出的命令
```

#### 7. 配置Nginx

```bash
# 安装Nginx
sudo apt install -y nginx  # Ubuntu
sudo yum install -y nginx  # CentOS

# 创建配置文件
sudo nano /etc/nginx/sites-available/ai-news-hub

# 添加以下内容：
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /opt/ai_news_hub/client/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存控制
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE支持（用于实时进度）
        proxy_buffering off;
        proxy_read_timeout 600s;
    }

    # 访问日志
    access_log /var/log/nginx/ai-news-hub-access.log;
    error_log /var/log/nginx/ai-news-hub-error.log;

    # 文件上传大小限制
    client_max_body_size 50M;
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/ai-news-hub /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 域名和SSL配置

### 1. 配置域名解析

在阿里云域名控制台添加A记录：
```
类型: A
主机记录: @ 或 www
记录值: your-ecs-public-ip
TTL: 600
```

### 2. 申请SSL证书

**方式一：使用阿里云免费证书**

1. 登录阿里云控制台
2. 进入SSL证书服务
3. 申请免费证书（DV证书）
4. 下载Nginx证书文件

**方式二：使用Let's Encrypt（免费）**

```bash
# 安装certbot
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu
sudo yum install -y certbot python3-certbot-nginx  # CentOS

# 申请证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 配置HTTPS

**使用阿里云证书**：
```bash
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl

# 上传证书文件
# your-domain.pem (证书文件)
# your-domain.key (私钥文件)

# 修改Nginx配置
sudo nano /etc/nginx/sites-available/ai-news-hub
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/your-domain.pem;
    ssl_certificate_key /etc/nginx/ssl/your-domain.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 其他配置同上...
}
```

```bash
# 重启Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## 环境变量配置

### 服务器端 (.env)

```bash
# 基础配置
NODE_ENV=production
PORT=5000

# 数据库
MONGODB_URI=mongodb://localhost:27017/ai_news_hub

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024

# 阿里云百炼
ALIYUN_BAILIAN_API_KEY=sk-xxxxxxxxxxxxxxxx
ALIYUN_BAILIAN_APP_ID=xxxxxxxxxxxxxxxx
ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max
ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max

# 阿里云OSS
ALIYUN_OSS_ACCESS_KEY_ID=LTAI5xxxxxxxxxxxxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name

# 其他API（可选）
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# 安全配置
BCRYPT_ROUNDS=12
```

### 前端环境变量

**生产环境** (`client/.env.production`):
```bash
VITE_API_URL=https://your-domain.com/api
VITE_APP_TITLE=AI资讯中心
```

---

## 监控和维护

### 1. PM2监控（直接部署）

```bash
# 查看状态
pm2 status

# 查看详细信息
pm2 show ai-coach-server

# 查看日志
pm2 logs ai-coach-server

# 查看CPU和内存
pm2 monit

# 重启服务
pm2 restart ai-coach-server

# 重载服务（无缝重启）
pm2 reload ai-coach-server
```

### 2. Docker监控

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f nginx

# 查看资源使用
docker stats

# 重启服务
docker-compose restart app
```

### 3. 系统监控

```bash
# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看MongoDB状态
mongosh --eval "db.adminCommand('serverStatus')"

# 查看Nginx日志
sudo tail -f /var/log/nginx/ai-news-hub-access.log
sudo tail -f /var/log/nginx/ai-news-hub-error.log
```

### 4. 数据备份

**MongoDB备份**：
```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份
mongodump --out $BACKUP_DIR/$DATE

# 压缩
tar -czf $BACKUP_DIR/$DATE.tar.gz $BACKUP_DIR/$DATE
rm -rf $BACKUP_DIR/$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ MongoDB备份完成: $DATE"
```

**设置定时备份**：
```bash
# 添加到crontab
crontab -e

# 每天凌晨3点备份
0 3 * * * /opt/ai_news_hub/backup-mongodb.sh >> /var/log/mongodb-backup.log 2>&1
```

### 5. 日志轮转

```bash
# 创建logrotate配置
sudo nano /etc/logrotate.d/ai-news-hub
```

```
/var/log/nginx/ai-news-hub-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}

/opt/ai_news_hub/server/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
}
```

---

## 故障排查

### 问题1: 无法访问网站

**检查步骤**：
```bash
# 1. 检查Nginx状态
sudo systemctl status nginx

# 2. 检查端口监听
sudo netstat -tlnp | grep -E '80|443|5000'

# 3. 检查防火墙
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS

# 4. 检查阿里云安全组
# 确保80、443端口开放

# 5. 测试Nginx配置
sudo nginx -t
```

### 问题2: API请求失败

**检查步骤**：
```bash
# 1. 检查后端服务
pm2 status  # 或 docker-compose ps

# 2. 查看后端日志
pm2 logs ai-coach-server  # 或 docker-compose logs app

# 3. 测试API
curl http://localhost:5000/api/health

# 4. 检查MongoDB连接
mongosh --eval "db.adminCommand('ping')"
```

### 问题3: PDF转换失败

**检查步骤**：
```bash
# 1. 检查Python环境
python3 --version
python3 -m pip list | grep -E "pdf2image|Pillow|urllib3"

# 2. 检查poppler
pdftoppm -v

# 3. 测试PDF转换
python3 server/scripts/pdf_converter.py "https://arxiv.org/pdf/1706.03762.pdf" 1

# 4. 检查Python脚本权限
ls -l server/scripts/pdf_converter.py
chmod +x server/scripts/pdf_converter.py
```

### 问题4: OSS上传失败

**检查步骤**：
```bash
# 1. 检查环境变量
cat server/.env | grep OSS

# 2. 检查OSS权限
# 登录阿里云控制台验证AccessKey权限

# 3. 测试OSS连接
node -e "const OSS = require('ali-oss'); const client = new OSS({...}); client.list().then(console.log).catch(console.error);"

# 4. 检查网络连接
ping your-bucket-name.oss-cn-hangzhou.aliyuncs.com
```

### 问题5: MongoDB连接失败

**检查步骤**：
```bash
# 1. 检查MongoDB状态
sudo systemctl status mongod

# 2. 检查MongoDB日志
sudo tail -f /var/log/mongodb/mongod.log

# 3. 测试连接
mongosh --eval "db.serverStatus()"

# 4. 重启MongoDB
sudo systemctl restart mongod
```

---

## 性能优化

### 1. Nginx优化

```nginx
# 在nginx.conf的http块中添加
worker_processes auto;
worker_connections 1024;

# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

# 缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;
```

### 2. MongoDB优化

```bash
# 编辑MongoDB配置
sudo nano /etc/mongod.conf
```

```yaml
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 2  # 设置为内存的25-50%

net:
  maxIncomingConnections: 1000

operationProfiling:
  mode: slowOp
  slowOpThresholdMs: 100
```

```bash
# 重启MongoDB
sudo systemctl restart mongod
```

### 3. Node.js优化

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ai-coach-server',
    script: 'server/index.js',
    instances: 'max',  // 使用所有CPU核心
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      UV_THREADPOOL_SIZE: 128  // 增加线程池大小
    }
  }]
}
```

---

## 快速部署脚本

创建一键部署脚本：

```bash
#!/bin/bash
# quick-deploy.sh

set -e

echo "🚀 开始部署AI资讯中心..."

# 1. 更新代码
echo "📦 更新代码..."
git pull origin main

# 2. 构建前端
echo "🔨 构建前端..."
cd client
npm install
npm run build
cd ..

# 3. 更新后端依赖
echo "📦 更新后端依赖..."
cd server
npm install
cd ..

# 4. 重启服务
echo "🔄 重启服务..."
if command -v docker-compose &> /dev/null; then
    docker-compose build app
    docker-compose up -d
    echo "✅ Docker服务已重启"
else
    pm2 reload ecosystem.config.js
    echo "✅ PM2服务已重启"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "查看状态: pm2 status 或 docker-compose ps"
echo "查看日志: pm2 logs 或 docker-compose logs -f"
echo ""
```

```bash
# 设置执行权限
chmod +x quick-deploy.sh

# 使用
./quick-deploy.sh
```

---

## 安全建议

### 1. 服务器安全

```bash
# 修改SSH端口
sudo nano /etc/ssh/sshd_config
# Port 22 改为 Port 2222
sudo systemctl restart sshd

# 禁用root登录
# PermitRootLogin no

# 配置防火墙
sudo ufw allow 2222/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. 应用安全

- ✅ 使用强JWT密钥
- ✅ 定期更新依赖包
- ✅ 限制API请求频率
- ✅ 启用HTTPS
- ✅ 定期备份数据

### 3. MongoDB安全

```bash
# 启用认证
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password",
  roles: ["root"]
})

# 修改配置启用认证
sudo nano /etc/mongod.conf
security:
  authorization: enabled
```

---

## 更新检查清单

部署前确认：
- [ ] 环境变量已正确配置
- [ ] OSS已配置并测试
- [ ] MongoDB连接正常
- [ ] Python依赖已安装
- [ ] 域名解析正确
- [ ] SSL证书有效
- [ ] 防火墙规则正确
- [ ] 日志目录可写
- [ ] 备份脚本已配置

---

## 技术支持

- 文档：查看项目根目录的其他MD文档
- 日志：`/var/log/nginx/` 和 `pm2 logs`
- 监控：`pm2 monit` 或 `docker stats`

---

**最后更新**: 2025-10-20  
**版本**: 1.0.0

