const deleteEmojiAction = {
    icon: 'deleteEmojiAction',
    func: deleteEmojiClick
}
const addEmojiAction = {
    icon: 'addEmojiAction',
    func: addEmojiClick
};

let loadedPage = 1;
let pageEnd = false; // flag for "no more pages"
let publicEmojis = [];
let slotsUsed = {
    still: 0,
    animated: 0
}

function updateCounts() {
    slotsUsed.still = document.querySelector('#emojiListStill').childElementCount;
    slotsUsed.animated = document.querySelector('#emojiListAnimated').childElementCount;

    // progress bar
    document.querySelector('#gradientRight').style.width = Math.floor(100 - ((slotsUsed.still + slotsUsed.animated) / (slots.still + slots.animated)) * 100) + '%';

    // counters
    document.querySelector('#stillEmojiSlotsCount').innerHTML = `${slotsUsed.still} / ${slots.still}`;
    document.querySelector('#animatedEmojiSlotsCount').innerHTML = `${slotsUsed.animated} / ${slots.animated}`;
}

function addEmoji(emoji, target, action, options) {
    let el = document.createElement('div');
    el.classList.add('emoji');
    el.classList.add(action.icon);
    el.style.backgroundImage = `url('${emoji.url}')`;
    el.dataset.id = emoji.id;    
    el.onclick = action.func;

    if (options.includeObject) el.dataset.emoji = JSON.stringify(emoji);
    if (options.append) {
        document.querySelector(target).append(el);
    } else {
        document.querySelector(target).prepend(el);
    }
    updateCounts();
}

function deleteEmojiClick(event) {
    event.target.style.display = 'none';
    fetch('/api/' +key + '/deleteEmoji?id=' + event.target.dataset.id)
    .then(response => {
        event.target.parentNode.removeChild(event.target);
        updateCounts();
        checkNoEmojis();
    })
    .catch(reason => {
        event.target.style.display = 'inline-block';
        console.log('Error while deleting emoji from guild', reason);
        alert('Could not delete this emoji :/');
    });   
}

function addEmojiClick(event) {
    // [].slice.call(document.querySelector('#emojiListStill').children).map(el => el.dataset.id)
    let emoji = publicEmojis.find(e => e.id == event.target.dataset.id);
    if (!emoji) {
        emoji = JSON.parse(event.target.dataset.emoji);
    }
    let animated = emoji.url.includes('.gif');
    if ((animated && slotsUsed.animated >= slots.animated) || (!animated && slotsUsed.still >= slots.still)) {
        alert((animated ? 'Animated emoji' : 'Emoji') + ' slots are full!\n\nYou need to free up some emoji slots first before adding more.');
        return;
    }
    event.target.style.display = 'none';
    
    fetch('/api/' +key + '/addEmoji?id=' + event.target.dataset.id)
    .then(async (data) => {
        data = await data.json();
        event.target.parentNode.removeChild(event.target);
        let target = (data.emoji.animated ? '#emojiListAnimated' : '#emojiListStill');
        addEmoji(data.emoji, target, deleteEmojiAction);
        updateCounts();
        checkNoEmojis();
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

function renderPublicEmojis(page) {
    fetch('/api/emojis?page=' + page)
    .then(response => response.json())
    .then(data => {
        if (data.status && data.status == 'end') {
            pageEnd = true;
            console.log('No more pages after ' + loadedPage);
            return;
        }
        publicEmojis = publicEmojis.concat(data).unique();
        data.forEach(emoji => addEmoji(emoji, '#emojiListAll', addEmojiAction, { append: true }));
    })
    .catch(reason => {
        throw reason;
    }); 
}

renderServerEmojis();
renderPublicEmojis(1);

window.addEventListener('scroll', function() {
    if (pageEnd) return;
    let body = document.body,
    html = document.documentElement;

    let height = Math.max( body.scrollHeight, body.offsetHeight, 
                        html.clientHeight, html.scrollHeight, html.offsetHeight );

    let windowEnd = window.scrollY + window.innerHeight;

    if (height - windowEnd < 700) {
        loadedPage++;
        console.log('Loading page', loadedPage, window.scrollY);
        renderPublicEmojis(loadedPage);
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