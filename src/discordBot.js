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