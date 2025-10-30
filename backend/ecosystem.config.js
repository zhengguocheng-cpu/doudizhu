// PM2 进程管理配置文件
module.exports = {
  apps: [{
    name: 'doudizhu-backend',
    script: './dist/src/app.js',
    
    // 实例数量（单核服务器用1，多核可以用'max'）
    instances: 1,
    
    // 自动重启
    autorestart: true,
    
    // 不监听文件变化（生产环境）
    watch: false,
    
    // 内存超过500M自动重启
    max_memory_restart: '500M',
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // 日志配置
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    
    // 合并日志
    merge_logs: true,
    
    // 最小运行时间（避免频繁重启）
    min_uptime: '10s',
    
    // 最大重启次数
    max_restarts: 10,
    
    // 重启延迟
    restart_delay: 4000
  }]
};
