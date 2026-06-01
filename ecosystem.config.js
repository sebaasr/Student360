module.exports = {
  apps: [
    {
      name: "student360",
      script: "node_modules/.bin/next",
      args: "start",
      env_production: { NODE_ENV: "production", PORT: 3000 },
    },
    {
      name: "student360-scheduler",
      script: "workers/scheduler.ts",
      interpreter: "tsx",
      env_production: { NODE_ENV: "production" },
    },
  ],
};
