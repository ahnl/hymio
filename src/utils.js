const crypto = require('crypto');

Array.prototype.template = function() {
    let i = 0;
    return this.join('\n').replace(/%s/g, () => arguments[i++]);
}

async function randomKey(bytes) {
    return await crypto.randomBytes(bytes).toString('hex');
}

async function resolveKey(key) {
    let [rows] = await db.execute('SELECT `id`, `wKey` FROM guilds WHERE `rwKey`=? OR `wKey`=?', [key, key]);
    let row = rows[0];
    if (!row) { next(); return; }
    let writeOnly = row.wKey == key;
    let ts = await client.guilds.fetch(row.id);
    return [ts, writeOnly]
}

async function resolveEmoji(id) {
    let [rows] = await db.execute('SELECT `id`, `name`, `url` FROM emojis WHERE `id`=?', [id]);
    let row = rows[0];
    return row;
}

module.exports = { randomKey, resolveKey, resolveEmoji };