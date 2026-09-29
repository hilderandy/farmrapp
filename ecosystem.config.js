// PM2 process manager config. On the server: `pm2 start ecosystem.config.js`.
module.exports = {
  apps: [
    {
      name: "farmrapp",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
    },
  ],
};
