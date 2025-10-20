# 🚀 阿里云部署 - 5分钟快速开始

## 📋 前提条件

- [x] 阿里云ECS服务器（4核8G，Ubuntu 22.04）
- [x] 阿里云OSS（已创建Bucket）
- [x] 阿里云百炼API密钥
- [x] 域名（可选）

---

## 🎯 方式一：Docker部署（最简单）

### 1. 连接服务器

```bash
ssh root@your-server-ip
```

### 2. 安装Docker

```bash
curl -fsSL https://get.docker.com | bash
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. 安装Python依赖

```bash
apt update && apt install -y python3 python3-pip poppler-utils
python3 -m pip install --user pdf2image Pillow requests "urllib3<2"
```

### 4. 克隆代码

```bash
mkdir -p /opt/ai_news_hub
cd /opt/ai_news_hub
git clone <your-repo-url> .
```

### 5. 配置环境变量

```bash
cd server
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/ai_news_hub
JWT_SECRET=your_super_secret_jwt_key_2024

# 阿里云百炼
ALIYUN_BAILIAN_API_KEY=sk-xxxxxxxx
ALIYUN_BAILIAN_APP_ID=xxxxxxxx
ALIYUN_BAILIAN_TEXT_MODEL=qwen3-max
ALIYUN_BAILIAN_VISION_MODEL=qwen-vl-max

# 阿里云OSS
ALIYUN_OSS_ACCESS_KEY_ID=LTAI5xxxxxxxx
ALIYUN_OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxx
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name

BCRYPT_ROUNDS=12
EOF
chmod 600 .env
cd ..
```

### 6. 启动服务

```bash
docker-compose up -d
```

### 7. 验证部署

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 测试API
curl http://localhost:5000/api/health
```

**✅ 完成！访问 `http://your-server-ip` 查看网站**

---

## 🎯 方式二：一键部署脚本

### 1. 下载并运行脚本

```bash
# 在服务器上
cd /opt/ai_news_hub
git clone <your-repo-url> .

# 配置环境变量（同上）
cd server && nano .env && cd ..

# 运行一键部署
./aliyun-deploy.sh
```

**脚本会自动：**
- ✅ 检测部署环境
- ✅ 安装缺失依赖
- ✅ 构建前后端
- ✅ 启动服务
- ✅ 健康检查

---

## 🌐 配置域名（可选）

### 1. 域名解析

在阿里云控制台添加A记录：
```
类型: A
主机记录: @
记录值: your-ecs-ip
```

### 2. 安装SSL证书

```bash
# 安装certbot
apt install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d your-domain.com

# 自动续期（已自动配置）
```

### 3. Nginx配置（如使用PM2部署）

```bash
# Nginx已由脚本自动配置
# 手动配置参考: ALIYUN_DEPLOYMENT_GUIDE.md
```

---

## 🔧 常用命令

### Docker方式

```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f app
docker-compose logs -f mongodb

# 重启服务
docker-compose restart app

# 停止服务
docker-compose down

# 更新部署
git pull
docker-compose build app
docker-compose up -d
```

### PM2方式

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs ai-coach-server

# 重启服务
pm2 restart ai-coach-server

# 停止服务
pm2 stop ai-coach-server

# 更新部署
git pull
cd client && npm run build && cd ..
cd server && npm install && cd ..
pm2 reload ai-coach-server
```

---

## 📊 监控

### 查看资源使用

```bash
# Docker
docker stats

# PM2
pm2 monit

# 系统
htop
df -h
```

### 查看日志

```bash
# 应用日志
docker-compose logs -f    # Docker
pm2 logs                  # PM2

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# MongoDB日志
tail -f /var/log/mongodb/mongod.log
```

---

## 🐛 快速故障排查

### 无法访问网站

```bash
# 1. 检查服务状态
docker-compose ps  # 或 pm2 status

# 2. 检查端口
netstat -tlnp | grep -E '80|443|5000'

# 3. 检查防火墙
ufw status

# 4. 检查阿里云安全组
# 确保80、443端口开放
```

### API请求失败

```bash
# 1. 查看后端日志
docker-compose logs app  # 或 pm2 logs

# 2. 测试API
curl http://localhost:5000/api/health

# 3. 检查MongoDB
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### PDF转换失败

```bash
# 1. 检查Python
python3 --version
python3 -c "import pdf2image; print('OK')"

# 2. 检查poppler
pdftoppm -v

# 3. 测试转换
python3 server/scripts/pdf_converter.py "https://arxiv.org/pdf/1706.03762.pdf" 1
```

---

## 🔐 安全建议

1. **修改默认端口**
   ```bash
   nano /etc/ssh/sshd_config
   # Port 2222
   systemctl restart sshd
   ```

2. **配置防火墙**
   ```bash
   ufw allow 2222/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

3. **定期更新**
   ```bash
   apt update && apt upgrade -y
   ```

4. **设置自动备份**
   ```bash
   # 添加到crontab
   0 3 * * * /opt/ai_news_hub/backup-mongodb.sh
   ```

---

## 📚 更多信息

- 完整部署指南：[ALIYUN_DEPLOYMENT_GUIDE.md](./ALIYUN_DEPLOYMENT_GUIDE.md)
- OSS配置：[OSS_SETUP.md](./OSS_SETUP.md)
- 深度解读功能：[ENHANCED_ANALYSIS_FEATURE.md](./ENHANCED_ANALYSIS_FEATURE.md)
- PDF修复记录：[PDF_PARSE_FIX_COMPLETE.md](./PDF_PARSE_FIX_COMPLETE.md)

---

## ✅ 部署检查清单

部署完成后确认：

- [ ] 网站可以正常访问
- [ ] API接口工作正常
- [ ] MongoDB连接成功
- [ ] PDF转换功能正常
- [ ] OSS上传功能正常
- [ ] 日志正常输出
- [ ] 服务自动重启
- [ ] HTTPS证书有效（如配置）
- [ ] 定时备份已设置

---

**需要帮助？** 查看 [ALIYUN_DEPLOYMENT_GUIDE.md](./ALIYUN_DEPLOYMENT_GUIDE.md) 获取详细信息

**最后更新**: 2025-10-20

