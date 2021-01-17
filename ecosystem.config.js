/**
 * You don't need to worry about this file
 * It's used for configuring PM2 
 */

module.exports = {
    apps : [{
      name: 'hymio',
      script: 'main.js',
      env: {
        "NODE_ENV": "PRODUCTION",
      },
      env_hook: {
        command: 'pm2 pull hymio'
      }
    }]
  };