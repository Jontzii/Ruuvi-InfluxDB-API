module.exports = {
  apps : [
      {
        name: "RuuviAPI",
        script: "./server.js",
        watch: true,
        env: {
            "PORT": 8300,
            "NODE_ENV": "development"
        },
        env_production: {
            "PORT": 8300,
            "NODE_ENV": "production",
        }
      }
  ]
}
