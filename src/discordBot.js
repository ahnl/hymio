const Discord = require('discord.js');
const messageTemplates = require('./messageTemplates');
const { randomKey } = require('./utils');

global.client = new Discord.Client();

function newGuild(guild) {
    return new Promise(async (resolve, reject) => {
        let owner = await client.users.fetch(guild.ownerID);  
        let keys = {
            rw: await randomKey(32),
            w: await randomKey(32),
        };
        // We used to pass an object with key-value pairs to be inserted, but the namedPlaceholders db configuration option broke it - here's a traditional workaround
        await db.query('INSERT INTO guilds SET `id` = ?, `name` = ?, `ownerId` = ?, `ownerTag` = ?, `rwKey` = ?, `wKey` = ? ON DUPLICATE KEY UPDATE name = VALUES(`name`), ownerId = VALUES(`ownerId`), ownerTag = VALUES(`ownerTag`), rwKey = VALUES(`rwKey`), wKey = VALUES(`wKey`);', [ guild.id, guild.name, owner.id, owner.tag, keys.rw, keys.w ]).catch(reason => { reject(reason) });
        resolve({keys});
    });
}

client.on('guildCreate', async (guild) => {
    let owner = await client.users.fetch(guild.ownerID);
    newGuild(guild).then(({keys}) => {
        owner.send(messageTemplates.guildCreateSuccess.template(owner.username, guild.name, config.url + '/dashboard/' + keys.rw + '/'))
        console.log(`[DISCORD] New guild ${guild.name} (owned by ${owner.tag})`);
    }).catch(reason => {
        console.log('[DISCORD] Could not create new guild. ', reason.message)
        owner.send(messageTemplates.guildCreateFail.template(owner.username))
    })
});

client.on('message', msg => {
    //console.log(msg.content)
});

module.exports = client;