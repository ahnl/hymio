const express = require('express');
const { resolveKey, resolveEmoji } = require('./utils');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'))

app.get('/', async function(req, res) {
    res.end();
});

app.get('/add', async function (req, res) {
    res.redirect('https://discord.com/oauth2/authorize?client_id=799344765300768808&permissions=1074128960&scope=bot');
});

app.get('/dashboard/:key/', async function(req, res, next) {
    let [ts, writeOnly] = await resolveKey(req.params.key.trim());

    res.render('emojiManager', {
        server: {
            icon: ts.iconURL(),
            name: ts.name,
            emojiSlots: {// hardcoded values for now since i don't understand where to take them
                animated: 50, 
                still: 50
            }
        },
        key: req.params.key.trim()
    });
});

app.get('/api/:key/getServerEmojis', async function(req, res) {
    let [ts] = await resolveKey(req.params.key.trim());
    function cleanEmojis(emojis) {
        return emojis.map(({id, name, url}) => { 
            return {id, name, url}; 
        })
    }
    res.json({
        still: cleanEmojis(ts.emojis.cache.filter(emoji => emoji.animated != true)),
        animated: cleanEmojis(ts.emojis.cache.filter(emoji => emoji.animated))
    });
});

app.get('/api/:key/deleteEmoji', async function(req, res) {
    if (!req.query.id) {
        res.status(400).json({'status': 'bad request'});
        return;
    }
    let [ts] = await resolveKey(req.params.key.trim());
    ts.emojis.resolve(req.query.id).delete('deleted on hymio management panel').then(() => {
        console.log('[DISCORD] Deleted emoji (' + req.query.id + ')')
        res.json({'status': 'ok'});
    }).catch(reason => {
        console.log('[DISCORD] Couldn\'t delete emoji (' + req.query.id + ') ', reason.message)
    });
});

app.get('/api/:key/addEmoji', async function(req, res) {
    if (!req.query.id) {
        res.status(400).json({'status': 'bad request'});
        return;
    }
    let [guild] = await resolveKey(req.params.key.trim());
    let emoji = await resolveEmoji(req.query.id);

    if (!emoji) {
        res.status(404).json({'status': 'not found'}); 
        return;
    }
    emoji.name = emoji.name + '_hymio';

    guild.emojis.create(emoji.url, emoji.name).then((resi) => {
        console.log('[DISCORD] Added emoji (' + emoji.name + ')');
        res.json({'status': 'ok', 'emoji': {
            'id': resi.id, 
            'animated': resi.animated,
            'url': emoji.url, 
            'name': resi.name
        }});
    }).catch(reason => {
        console.log('[DISCORD] Couldn\'t add emoji (' + emoji.name + ') ', reason.message)
    });
});

app.get('/api/emojis', async function(req, res) {
    if (!req.query.page) {
        res.status(400).json({'status': 'bad request'});
        return;
    }
    // ?page=1&seed=1&q=pepe
    
    let page = parseInt(req.query.page) - 1;

    let sql = "SELECT `id`, `name`, `url` FROM emojis " + (req.query.q ? "WHERE `name` LIKE :name " : "") + "ORDER BY RAND(:seed) LIMIT :limit OFFSET :offset";
    // to-do: get rid of the dumbfuck random ordering and make it go random by server order

    db.execute(sql, {
        name: (req.query.q ? '%' + req.query.q.toLowerCase() + '%' : ''),
        seed: (req.query.seed ? Math.min(parseInt(req.query.seed), 10000) : 1), // max seed is 10000
        offset: config.ui.itemsPerPage * page,
        limit: config.ui.itemsPerPage
    }).then(([data])=> {
        if (data.length > 0) {
            let result = data.map(data => {
                data.name = data.name + '_hymio';
                return data;
            });
            res.json(result);
        } else {
            res.json({status: 'end'}) // no pages left -> send end flag
        }
    }).catch(reason => {
        console.log('[API] Database query failed', reason.message)
        res.status(500).json({status: 'error'});
    });

});

app.get('/api/randomEmoji', async function(req, res) {
    let animated = req.query.type == 'animated';
    /* Recursively pick more until correct type is found hehe */
    let [rows] = await db.execute('SELECT `id`, `name`, `url` FROM emojis WHERE `url` ' + (animated ? '' : 'NOT') + ' LIKE \'%.gif%\' ORDER BY RAND() LIMIT 1');
    let emoji = rows[0];

    if (emoji) {
        res.json(emoji);
    } else {
        res.status(404).json({status: 'error'});
    }
});

module.exports = app;