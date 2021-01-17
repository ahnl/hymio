const mysql = require('mysql2');
const emojis = require('./dump.json')
const credentials = require('../credentials.json');

let db = mysql.createConnection(credentials.mysql).promise(); 

console.log('Cache length', emojis.cache.length)

async function main() {
    for (let emoji of emojis.cache) {
        await db.query('INSERT INTO emojis SET ?', {
            id: emoji.id,
            name: emoji.name,
            url: emoji.url,
            meta: JSON.stringify({
                guildId: emoji.guildID
            })
        }).catch(reason => {
            console.log('Error', reason.message);
        });
    }
    console.log('Done!')
}

main()

