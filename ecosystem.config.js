module.exports = {
  apps: [{
    name: 'dreamcms',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/home/dreamcms/htdocs/app',
    instances: 1,          // single instance — saves RAM, no cluster needed for low traffic
    exec_mode: 'fork',     // fork, not cluster — avoids shared memory issues
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    max_memory_restart: '512M',
    error_file: '/home/dreamcms/logs/error.log',
    out_file: '/home/dreamcms/logs/out.log',
    time: true,
    kill_timeout: 5000,
    autorestart: true,
    watch: false,
  }]
};
