const deleteEmojiAction = {
    icon: 'deleteEmojiAction',
    func: deleteEmojiClick
}
const addEmojiAction = {
    icon: 'addEmojiAction',
    func: addEmojiClick
};

let loadedPage = 1;
let outOfPagesFlag = false; 
let apiSeed = Math.floor(Math.random() * 5000);
let query = '';
let slotsUsed = {
    still: 0,
    animated: 0
}

document.querySelector('#search').addEventListener('input', (event) => {
    query = event.target.value;
    outOfPagesFlag = false;
    loadedPage = 1;
    
    renderPublicEmojis(1, {clear: true});
})

function countVisibleChildren(selector) {
    return [].slice.call(document.querySelector(selector).children).filter(el => el.dataset.ghost != 'true').length
}

function updateCounts() {
    slotsUsed.still = countVisibleChildren('#emojiListStill');
    slotsUsed.animated = countVisibleChildren('#emojiListAnimated');

    // progress bar
    document.querySelector('#gradientRight').style.width = Math.floor(100 - ((slotsUsed.still + slotsUsed.animated) / (slots.still + slots.animated)) * 100) + '%';

    // counters
    document.querySelector('#stillEmojiSlotsCount').innerHTML = `${slotsUsed.still} / ${slots.still}`;
    document.querySelector('#animatedEmojiSlotsCount').innerHTML = `${slotsUsed.animated} / ${slots.animated}`;
}

const hoverTipEl = document.querySelector('#hoverTip');

function emojiMouseOver(event) {
    hoverTipEl.classList.remove('hiddenHoverTip');
    hoverTipEl.innerHTML = event.target.dataset.name;
}

function emojiMouseOut(event) {
    //console.log(event.target.dataset.name)
    hoverTipEl.classList.add('hiddenHoverTip');
}

function addEmoji(emoji, target, action, options = {}) {
    let el = document.createElement('div');
    el.classList.add('emoji');
    el.classList.add(action.icon);
    el.style.backgroundImage = `url('${emoji.url}')`;
    el.dataset.id = emoji.id;    
    el.dataset.name = emoji.name;    
    el.onclick = action.func;
    el.onmouseover = emojiMouseOver;
    el.onmouseout = emojiMouseOut;

    if (options.includeObject) el.dataset.emoji = JSON.stringify(emoji);
    if (options.append) {
        document.querySelector(target).append(el);
    } else {
        document.querySelector(target).prepend(el);
    }
    updateCounts();

    return el;
}

async function deleteEmojiClick(event) {
    if (event.target.dataset.actionLock == 'true') return;
    event.target.dataset.actionLock = 'true';
    event.target.dataset.ghost = 'true';
    updateCounts();
    
    fetch('/api/' +key + '/deleteEmoji?id=' + event.target.dataset.id)
    .then(async (data) => {
        data = await data.json();
        if (data.status != 'ok') {
            throw 'Status not ok: ' + data.status;
        } else {
            event.target.parentNode.removeChild(event.target);
            checkNoEmojis();
        }
    })
    .catch(reason => {
        event.target.style.display = 'inline-block';
        console.log('Error while deleting emoji from guild', reason);
        alert('Could not delete this emoji :/');
    });   
}

function addEmojiClick(event) {
    // [].slice.call(document.querySelector('#emojiListStill').children).map(el => el.dataset.id)
    let emoji = JSON.parse(event.target.dataset.emoji);
    let animated = emoji.url.includes('.gif');
    if ((animated && slotsUsed.animated >= slots.animated) || (!animated && slotsUsed.still >= slots.still)) {
        alert((animated ? 'Animated emoji' : 'Emoji') + ' slots are full!\n\nYou need to free up some emoji slots first before adding more.');
        return;
    }

    event.target.parentNode.removeChild(event.target);
    let targetSelector = (animated ? '#emojiListAnimated' : '#emojiListStill');
    let el = addEmoji(emoji, targetSelector, deleteEmojiAction);
    el.dataset.actionLock = 'true'; // don't allow any actions before unlocked
    updateCounts();
    checkNoEmojis();

    fetch('/api/' +key + '/addEmoji?id=' + event.target.dataset.id)
    .then(async (data) => {
        data = await data.json();
        if (data.status != 'ok') {
            throw 'Status not ok';
        } else {
            el.dataset.actionLock = 'false'; 
            el.dataset.id = data.emoji.id;
        }
    })
    .catch(reason => {
        event.target.style.display = 'inline-block';
        console.log('Error while adding emoji to guild', reason);
        alert('Could not add this emoji :/');
    });   
}

function checkNoEmojis() {
    function checkContainer(container, type) {
        let emptyContainer = document.querySelector(".emptyEmojis[data-type='" + type + "']");
        let suggestionContainer = emptyContainer.querySelector('.emptyEmojisSuggestion');
        let emojiContainer = document.querySelector(container);

        if (emojiContainer.children.length == 0) {
            emptyContainer.style.display = 'block';
            emojiContainer.style.display = 'none';
            if (suggestionContainer.children.length == 0) {
                fetch('/api/randomEmoji?type=' + type)
                .then(response => response.json())
                .then(data => {
                    addEmoji(data, ".emptyEmojis[data-type='" + type + "'] .emptyEmojisSuggestion", addEmojiAction, { includeObject: true });
                });
            }
        } else {
            emptyContainer.style.display = 'none';
            suggestionContainer.innerHTML = '';
            emojiContainer.style.display = 'grid';
        }
    }
    checkContainer('#emojiListStill', 'still');
    checkContainer('#emojiListAnimated', 'animated');
}
function renderServerEmojis() {
    fetch('/api/' +key + '/getServerEmojis')
    .then(response => response.json())
    .then(data => {
        data.still.forEach(emoji => addEmoji(emoji, '#emojiListStill', deleteEmojiAction))
        data.animated.forEach(emoji => addEmoji(emoji, '#emojiListAnimated', deleteEmojiAction))
        checkNoEmojis();
    })
    .catch(reason => {
        throw reason;
    }); 
}

function renderPublicEmojis(page, options = {}) {
    return new Promise((resolve, reject) => {
        fetch('/api/emojis?seed=' + apiSeed + '&page=' + page + (query ? '&q=' + query : ''))
        .then(response => response.json())
        .then(data => {
            if (data.status && data.status == 'end') {
                outOfPagesFlag = true;
                console.log('No more pages after ' + loadedPage);
                return;
            }
            if (options.clear) document.querySelector('#emojiListAll').innerHTML = '';
            data.forEach(emoji => addEmoji(emoji, '#emojiListAll', addEmojiAction, { append: true, includeObject: true }));
            resolve(data.length);
        })
        .catch(reason => {
            reject(reason);
        }); 
    });
}

renderServerEmojis();
renderPublicEmojis(1);

let infiniteLoadLock = false;

window.addEventListener('scroll', function() {
    if (outOfPagesFlag || infiniteLoadLock) return;
    let body = document.body,
    html = document.documentElement;

    let height = Math.max( body.scrollHeight, body.offsetHeight, 
                        html.clientHeight, html.scrollHeight, html.offsetHeight );

    let windowEnd = window.scrollY + window.innerHeight;

    if (height - windowEnd < 700) {
        loadedPage++;
        console.log('Loading page', loadedPage, window.scrollY);
        infiniteLoadLock = true;
        renderPublicEmojis(loadedPage).then(() => {
            infiniteLoadLock = false;
        });
    }
});



/**
 * Dumb thing stolen again from the stackoverflow <3
 * https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
 */
Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
};