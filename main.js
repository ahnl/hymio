const mysql = require('mysql2');

global.config = (process.env.NODE_ENV != 'production' ? require('./config') : require('./config_prod'));

const discordBot = require('./src/discordBot');
const httpServer = require('./src/httpServer');

global.db = mysql.createConnection(config.credentials.mysql).promise(); // promise me baby <3
global.db.config.namedPlaceholders = true;

discordBot.on('ready', async () => {
    console.log(`[DISCORD] Bot logged in as ${client.user.tag}!`);
});
discordBot.login(config.credentials.discord.token);

httpServer.listen(config.httpPort, () => {
    console.log(`[HTTP] Server running on port ${config.httpPort}`);
})