module.exports = {
  apps: [{
    name: 'dreamcms',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/candvisam.ro/htdocs/dreamcms',
    instances: 'max',
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3001 },
    error_file: '/home/candvisam.ro/logs/dreamcms-error.log',
    out_file: '/home/candvisam.ro/logs/dreamcms-out.log',
    time: true,
  }]
};

