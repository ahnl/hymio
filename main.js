const mysql = require('mysql2');
const Discord = require('discord.js');
const fs = require('fs');

global.config = {
    httpPort: 80,
    ui: {
        itemsPerPage: 100,
    },
    credentials: require('./credentials.json')
}

const messageTemplates = require('./src/messageTemplates');
const { randomKey } = require('./src/utils');
const httpserver = require('./src/httpserver');

global.db = mysql.createConnection(config.credentials.mysql).promise(); // promise me baby <3
global.db.config.namedPlaceholders = true;
global.client = new Discord.Client();

client.on('ready', async () => {
    console.log(`[DISCORD] Bot logged in as ${client.user.tag}!`);
    //let guild = await client.guilds.fetch('697710787636101202');
});

function newGuild(guild) {
    return new Promise(async (resolve, reject) => {
        let owner = await client.users.fetch(guild.ownerID);  
        let keys = {
            rw: await randomKey(32),
            w: await randomKey(32),
        };
        await db.execute('INSERT INTO guilds SET ? ON DUPLICATE KEY UPDATE name = VALUES(`name`), ownerId = VALUES(`ownerId`), ownerTag = VALUES(`ownerTag`), rwKey = VALUES(`rwKey`), wKey = VALUES(`wKey`);', {
            id: guild.id,
            name: guild.name,
            ownerId: owner.id,
            ownerTag: owner.tag,
            rwKey: keys.rw,
            wKey: keys.w
        }).catch(reason => { reject(reason) });
        resolve({keys});
    });
}

client.on('guildCreate', async (guild) => {
    let owner = await client.users.fetch(guild.ownerID);
    newGuild(guild).then(({keys}) => {
        owner.send(messageTemplates.guildCreateSuccess.template(owner.username, guild.name, keys.rw))
        console.log(`[DISCORD] New guild ${guild.name} (owned by ${owner.tag})`);
    }).catch(reason => {
        console.log('[DISCORD] Could not create new guild. ', reason.message)
        owner.send(messageTemplates.guildCreateFail.template(owner.username))
    })
});

client.on('message', msg => {
    //console.log(msg.content)
});

client.login(config.credentials.discord.token);
httpserver.listen(config.httpPort, () => {
    console.log(`[HTTP] Server running on port ${config.httpPort}`);
})