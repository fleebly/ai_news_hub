module.exports = {
  apps: [{
    name: 'ai-news-hub-server',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000
    }
  }]
}

