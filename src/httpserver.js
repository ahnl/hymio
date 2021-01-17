const express = require('express');
const { resolveKey } = require('./utils');

const app = express();
const data = require('../data.json');

app.set('view engine', 'ejs');
app.use(express.static('public'))

app.get('/', async function(req, res) {
    res.end();
});

app.get('/dashboard/:key/', async function(req, res, next) {
    let [ts, writeOnly] = await resolveKey(req.params.key.trim());

    res.render('emojiManager', {
        server: {
            icon: ts.iconURL(),
            name: ts.name,
            emojiSlots: {
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
    let [ts] = await resolveKey(req.params.key.trim());
    let emoji = data.find(e => e.id == req.query.id);
    if (!emoji) {
        res.status(404).json({'status': 'not found'}); 
        return;
    }

    ts.emojis.create(emoji.url, emoji.name).then((resi) => {
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
    let itemsPerPage = 100; /* move this later to somewhere*/
    let page = req.query.page - 1;
    let min = itemsPerPage * page;
    let max = min + itemsPerPage;
    let pageData = data.slice(min, max);
    if (pageData.length > 0) {
        res.json(pageData);
    } else {
        res.json({status: 'end'})
    }
});

app.get('/api/randomEmoji', async function(req, res) {
    let animated = req.query.type == 'animated';
    let emoji;
    /* Recursively pick more until correct type is found hehe */
    function chooseEmoji() {
        emoji = data[Math.floor(Math.random() * data.length)];
        if ((animated && !emoji.url.includes('.gif')) || (req.query.type && (!animated && emoji.url.includes('.gif')))) {
            chooseEmoji();
        } 
    }
    chooseEmoji();
    res.json(emoji);
});

module.exports = app;