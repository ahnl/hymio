const Discord = require('discord.js-selfbot');
const credentials = require('./credentials.json');
const client = new Discord.Client();
const fs = require('fs');

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  fs.writeFile('dump.json', JSON.stringify(client.emojis), (err) => {
    if (!err) {
      console.log('Saved dump file!');
    } 
  });
});

client.login(credentials.token);