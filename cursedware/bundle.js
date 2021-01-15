(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const FREE_RANDOM_ALBUM = require('./tools').FREE_RANDOM_ALBUM
const WHEEL_SPIN_TIME_MS = 12000;
const WHEEL_AUDIO_URL = 'https://www.myinstants.com/media/sounds/sonic.mp3';

const sleep = require('./tools').sleep

let shuffle = function (o) {
    for (let j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

const wheel = {
    angleCurrent: 0,
    angleDelta: 0,
    canvasContext: null,
    canvasElement: null,
    centerX: 300,
    centerY: 300,
    colorCache: [],
    downTime: WHEEL_SPIN_TIME_MS,
    frames: 0,
    maxSpeed: Math.PI / 16,
    segments: [],
    size: 290,
    spinStart: 0,
    timerDelay: 7,
    timerHandle: 0,
    upTime: 1000,

    spin: function () {
        // Start the wheel only if it's not already spinning
        if (wheel.timerHandle === 0) {
            wheel.spinStart = new Date().getTime();
            wheel.maxSpeed = Math.PI / (16 + (Math.random() * 10)); // Randomly vary how hard the spin is
            wheel.frames = 0;
            wheel.timerHandle = setInterval(wheel.onTimerTick, wheel.timerDelay);
            wheel.canvasElement.dispatchEvent(new Event('wheel-start'));
        }
    },

    onTimerTick: function () {
        wheel.frames++;
        wheel.draw();

        let duration = (new Date().getTime() - wheel.spinStart);
        let progress = 0;
        let finished = false;

        if (duration < wheel.upTime) {
            progress = duration / wheel.upTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2);
        } else {
            progress = duration / wheel.downTime;
            wheel.angleDelta = wheel.maxSpeed * Math.sin(progress * Math.PI / 2 + Math.PI / 2);
            if (progress >= 1) {
                finished = true;
            }
        }

        wheel.angleCurrent += wheel.angleDelta;
        while (wheel.angleCurrent >= Math.PI * 2)
            // Keep the angle in a reasonable range
            wheel.angleCurrent -= Math.PI * 2;

        if (finished) {
            clearInterval(wheel.timerHandle);
            wheel.timerHandle = 0;
            wheel.angleDelta = 0;
            let i = wheel.segments.length - Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) - 1;
            wheel.canvasElement.dispatchEvent(new CustomEvent('wheel-finished', {detail:wheel.segments[i]}));
        }
    },

    init: function () {
        try {
            wheel.initWheel();
            wheel.initCanvas();
            wheel.draw();
        } catch (exceptionData) {
            console.error('Wheel is not loaded ' + exceptionData);
        }
    },

    initCanvas: function () {
        let canvas = document.getElementById('canvas');
        wheel.canvasElement = canvas;
        wheel.canvasContext = canvas.getContext('2d');
    },

    initWheel: function () {
        shuffle(spectrum);
    },

    update: function () {
        // Ensure we start mid way on a item
        let r = Math.floor(Math.random() * wheel.segments.length);
        //let r = 0;
        wheel.angleCurrent = ((r + 0.5) / wheel.segments.length) * Math.PI * 2;

        let segments = wheel.segments;
        let len = segments.length;
        let colorLen = spectrum.length;

        let colorCache = [];
        for (let i = 0; i < len; i++) {
            let color = spectrum[i % colorLen];
            colorCache.push(color);
        }
        wheel.colorCache = colorCache;
        wheel.draw();
    },

    draw: function () {
        wheel.clear();
        wheel.drawWheel();
        wheel.drawNeedle();
    },

    clear: function () {
        let ctx = wheel.canvasContext;
        ctx.clearRect(0, 0, 1600, 800);
    },

    drawNeedle: function () {
        let ctx = wheel.canvasContext;
        let centerX = wheel.centerX;
        let centerY = wheel.centerY;
        let size = wheel.size;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.fileStyle = '#ffffff';

        ctx.beginPath();

        ctx.moveTo(centerX + size - 40, centerY);
        ctx.lineTo(centerX + size + 20, centerY - 10);
        ctx.lineTo(centerX + size + 20, centerY + 10);
        ctx.closePath();

        ctx.stroke();
        ctx.fill();

        // Which segment is being pointed to?
        let i = wheel.segments.length - Math.floor((wheel.angleCurrent / (Math.PI * 2)) * wheel.segments.length) - 1;

        // Now draw the winning name
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.font = '2em Arial';
        ctx.fillText(wheel.segments[i], centerX + size + 25, centerY);
    },

    drawSegment: function (key, lastAngle, angle) {
        let ctx = wheel.canvasContext;
        let centerX = wheel.centerX;
        let centerY = wheel.centerY;
        let size = wheel.size;
        let value = wheel.segments[key];

        ctx.save();
        ctx.beginPath();

        // Start in the centre
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, size, lastAngle, angle, false); // Draw a arc around the edge
        ctx.lineTo(centerX, centerY); // Now draw a line back to the centre
        // Clip anything that follows to this area
        //ctx.clip(); // It would be best to clip, but we can double performance without it
        ctx.closePath();

        ctx.fillStyle = wheel.colorCache[key];
        ctx.fill();
        ctx.stroke();

        // Now draw the text
        ctx.save(); // The save ensures this works on Android devices
        ctx.translate(centerX, centerY);
        ctx.rotate((lastAngle + angle) / 2);

        ctx.fillStyle = '#000000';
        ctx.fillText(value.substr(0, 20), size / 2 + 20, 0);
        ctx.restore();

        ctx.restore();
    },

    drawWheel: function () {
        let ctx = wheel.canvasContext;

        let angleCurrent = wheel.angleCurrent;
        let lastAngle = angleCurrent;

        let len = wheel.segments.length;

        let centerX = wheel.centerX;
        let centerY = wheel.centerY;
        let size = wheel.size;

        let PI2 = Math.PI * 2;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = '1.4em fantasy';

        for (let i = 1; i <= len; i++) {
            let angle = PI2 * (i / len) + angleCurrent;
            wheel.drawSegment(i - 1, lastAngle, angle);
            lastAngle = angle;
        }
        // Draw a center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20, 0, PI2, false);
        ctx.closePath();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.fill();
        ctx.stroke();

        // Draw outer circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, PI2, false);
        ctx.closePath();

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
    }
};

let spectrum = ['#0074D9', '#2ECC40', '#FFDC00', '#FF4136', '#FF851B', '#B10DC9'];

class FreeRandomAlbum {
    constructor(settings, albums) {
        this.settings = settings;
        this.albums = albums;
        this.audioUrl = WHEEL_AUDIO_URL;
        this.container = document.getElementById('wheel');
        this.winner = document.getElementById('wheel-winner');
        this.player = null

        this.init();
    }

    init() {
        wheel.segments = this.albums;
        wheel.init();
        wheel.update();
        wheel.canvasElement.addEventListener('wheel-finished', this.wheelFinishedEvent.bind(this));
        this.winner.setAttribute("style", `color: ${this.settings.titleColor};font-size: ${this.settings.titleSize};${this.settings.titleStyle}`);

        setTimeout(function () {
            window.scrollTo(0, 1);
        }, 0);

        return this;
    }

    canHandle(message) {
        return (
            message &&
            message.type &&
            message.type === 'reward-redeemed' &&
            message['data'] &&
            message['data']['redemption'] &&
            message['data']['redemption']['user'] &&
            message['data']['redemption']['user']['display_name'] &&
            message['data']['redemption']['reward'] &&
            message['data']['redemption']['reward']['id'] &&
            message['data']['redemption']['reward']['id'] === FREE_RANDOM_ALBUM // do handle a specific reward
        )
    }

    async handle(message) {
        let reward = message.data['redemption']['reward'];
        this.player = message.data['redemption']['user']['display_name'];
        this.winner.innerText = `${this.player} claque ${reward['cost']} lolicoins pour gagner !`
        this.container.setAttribute("class", "");
        console.log("Playing audio", this.audioUrl);
        try {
            let audio = new Audio();
            audio.src = this.audioUrl;
            audio.volume = 0.5;
            audio.play();
            new Promise((res) => {
                audio.onended = res;
                audio.onerror = (e) => {
                    console.log(e);
                    res()
                };
            });
        } catch (e) {
            console.log("Audio playback error:", e);
        }
        await sleep(1000);
        wheel.spin();
    }

    async wheelFinishedEvent (event) {
        this.winner.innerText = `${this.player} gagne "${event.detail}"`;
        await sleep(3000);
        this.container.setAttribute("class", "hide");
    }
}

module.exports = FreeRandomAlbum
},{"./tools":4}],2:[function(require,module,exports){
const Reward = require('./reward')
const FreeRandomAlbum = require('./freeRandomAlbum')
const sleep = require('./tools').sleep
const CHANNEL_ID = 484329372;
const SETTINGS = {
    textSize: '35px',
    textStyle: 'color:white;',
    showTime: 7500,
    imageHeight: '250px',
    imageStyle: '',
    titleColor: 'purple',
    titleSize: '50px',
    titleStyle: 'font-family:fantasy;',
    title: '{user} claque {price} lolicoins pour {reward}', //{user} for user / {price} for price / {reward} for reward
    audioUrl: 'https://www.myinstants.com/media/sounds/asus-yamete-kudasai-mp3cut_HkI6gb8.mp3',
    tts: true,
    ttsLang: 'fr',
    showPrices: false, //comma separated values or false
    audioPrices: false, //comma separated values or false
    ttsPrices: false, //comma separated values or false
    botChannelName: false,
    highlightTitle: false,
    highlightPrice: false,
    audioVolume: 1, // value between 0 and 1
    defaultImage: false, // url for default displayed image on reward
};

const FreeAlbums = [
    'The Bad Meteor - PsykoJay',
    'The Digital Rainbow - PsykoJay',
    "La nuit j'en creve - EMMETT",
    "Fighting Fate B-Side - EMMETT",
    "Blood - PsykoJay",
    "Fighting Fate - EMMETT",
    "Fiction Featuring - PsykoJay",
    "Paradox - PsykoJay",
    "Dawn - AANOD",
    "Dream Thief - Dream Thief",
    "Halloween - PsykoJay",
    "Angel-Faced Darkness - PsykoJay",
    "Psyko-J - PsykoJay",
    "Psykotik Stranger - PsykoJay",
    "No Limit (Limited Edition) - Monsters Ahead",
    "Bass Booster - PsykoJay",
    "The Morning After - T.M.A",
    "I've seen enough hentai to know where all of this is going to end - CuteCore",
    "Demo 2009 - Fewze",
    "Yesterday Comes Tomorrow - AANOD",
    "Mental Disorder - PsykoJay",
    "Oxidation EP - AANOD",
];

window.onload = () => {
    const loadedModules = [
        new Reward(SETTINGS),
        new FreeRandomAlbum(SETTINGS, FreeAlbums),
    ]

    let ws = undefined;
    let pong = false;
    let interval = false;

    function connect() {
        ws = new WebSocket("wss://pubsub-edge.twitch.tv");
        listen();
    }

    function disconnect() {
        if (interval) {
            clearInterval(interval);
            interval = false;
        }
        ws.close();
    }

    function listen() {
        ws.onmessage = (a) => {
            let o = JSON.parse(a.data);
            switch (o.type) {
                case "PING":
                    ws.send(JSON.stringify({
                        "type": "PONG"
                    }));
                    break;
                case "PONG":
                    pong = true;
                    break;
                case "RECONNECT":
                    disconnect();
                    connect();
                    break;
                case "MESSAGE":
                    switch (o.data['topic']) {
                        case `community-points-channel-v1.${CHANNEL_ID}`:
                            let msg = JSON.parse(o.data.message);
                            console.log(msg);
                            loadedModules.forEach(module => module.canHandle(msg) && module.handle(msg))
                            break;
                    }
                    break;
            }
        }
        ws.onopen = () => {
            ws.send(JSON.stringify({
                "type": "LISTEN",
                "nonce": "pepega",
                "data": {"topics": ["community-points-channel-v1." + CHANNEL_ID], "auth_token": ""}
            }));
            interval = setInterval(async () => {
                ws.send(JSON.stringify({
                    "type": "PING"
                }));
                await sleep(5000);
                if (pong) {
                    pong = false;
                    return
                }
                pong = false;
                disconnect();
                connect();
            }, 5 * 60 * 1000)
        }
    }

    connect();
}

},{"./freeRandomAlbum":1,"./reward":3,"./tools":4}],3:[function(require,module,exports){
const GoogleTTS = require('./tts')
const sleep = require('./tools').sleep
const FREE_RANDOM_ALBUM = require('./tools').FREE_RANDOM_ALBUM

class Reward {
    constructor(settings) {
        this.settings = settings;
        this.container = document.getElementById("points-notification-container");
        this.image = document.getElementById("points-notification-image");
        this.title = document.getElementById("points-notification-title");
        this.message = document.getElementById("points-notification-message");
        this.showPrices = [];
        this.audioPrices = [];
        this.ttsPrices = [];
        this.notifications = [];

        this.init()
            .initDisplay()
    }

    _replaceAll(text, find, replaceWith) {
        let re = new RegExp(find, "g");
        return text.replace(re, replaceWith);
    }
    
    init() {
        this.message.setAttribute("style", `font-size: ${this.settings.textSize};${this.settings.textStyle}`);
        this.title.setAttribute("style", `color: ${this.settings.titleColor};font-size: ${this.settings.titleSize};${this.settings.titleStyle}`);
        this.image.setAttribute("style", `height: ${this.settings.imageHeight};${this.settings.imageStyle}`);
        
        if (this.settings.showPrices) {
            let items = this.settings.showPrices.split(",");
            for (let item of items) {
                this.showPrices.push(parseInt(item));
            }
        }

        if (this.settings.audioPrices) {
            let items = this.settings.audioPrices.split(",");
            for (let item of items) {
                this.audioPrices.push(parseInt(item));
            }
        }

        if (this.settings.ttsPrices) {
            let items = this.settings.ttsPrices.split(",");
            for (let item of items) {
                this.ttsPrices.push(parseInt(item));
            }
        }
        return this;
    }

    /**
     * Daemon to display reward
     * @returns {Promise<void>}
     */
    async initDisplay() {
        while (true) {
            if (this.notifications.length > 0) {
                let currentNotification = this.notifications.pop();
                console.log("Notification showing", currentNotification);
                if (this.showPrices.length !== 0 && this.showPrices.indexOf(currentNotification.price) === -1)
                    return;
                console.log("Price check passed");
                this.image.setAttribute("src", currentNotification.image);
                this.title.innerText = this._replaceAll(this.settings.title, "{user}", currentNotification.user);
                this.title.innerText = this._replaceAll(this.title.innerText, "{reward}", currentNotification.title);
                this.title.innerText = this._replaceAll(this.title.innerText, "{price}", currentNotification.price);
                this.message.innerText = currentNotification.text || "";
                this.container.setAttribute("class", "");
                if (this.settings.audioUrl && (this.audioPrices.length === 0 || this.audioPrices.indexOf(currentNotification.price) !== -1)) {
                    console.log("Playing audio", this.settings.audioUrl);
                    try {
                        let audio = new Audio();
                        audio.src = this.settings.audioUrl;
                        audio.volume = this.settings.audioVolume ? parseFloat(this.settings.audioVolume) : 1;
                        await audio.play();
                        await new Promise((res) => {
                            audio.onended = res;
                            audio.onerror = (e) => {
                                console.log(e);
                                res()
                            };
                        });
                    } catch (e) {
                        console.log("Audio playback error:", e);
                    }
                }
                if (currentNotification.text && this.settings.tts && (this.ttsPrices.length === 0 || this.ttsPrices.indexOf(currentNotification.price) !== -1)) {
                    console.log("Playing TTS");
                    try {
                        await GoogleTTS.textToSpeech(currentNotification.text, this.settings.ttsLang ? this.settings.ttsLang : "en");
                        console.log("TTS ended");
                    } catch (e) {
                        console.log("TTS error:", e)
                    }
                }
                await sleep(parseInt(this.settings.showTime ? this.settings.showTime : 7500));
                this.container.setAttribute("class", "hide");
                console.log("Notification ended");
            }
            await sleep(1000);
        }
    }

    canHandle(message) {
        return (
            message &&
            message.type &&
            message.type === 'reward-redeemed' &&
            message['data'] &&
            message['data']['redemption'] &&
            message['data']['redemption']['user'] &&
            message['data']['redemption']['user']['display_name'] &&
            message['data']['redemption']['reward'] &&
            message['data']['redemption']['reward']['id'] &&
            message['data']['redemption']['reward']['id'] !== FREE_RANDOM_ALBUM // do not handle a specific reward
        )
    }

    handle(message) {
        let reward = message.data['redemption']['reward'];
        let imageUrl = undefined;
        let image = reward.image;
        let defaultImage = reward['default_image'];

        if (image) {
            if (image['url_4x']) {
                imageUrl = image['url_4x'];
            } else if (image['url_2x']) {
                imageUrl = image['url_2x'];
            } else if (image['url_1x']) {
                imageUrl = image['url_1x'];
            }
        } else if (defaultImage) {
            if (defaultImage['url_4x']) {
                imageUrl = defaultImage['url_4x'];
            } else if (defaultImage['url_2x']) {
                imageUrl = defaultImage['url_2x'];
            } else if (defaultImage['url_1x']) {
                imageUrl = defaultImage['url_1x'];
            }
        } else {
            imageUrl = this.settings.defaultImage ? this.settings.defaultImage : "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png"
        }
        let notification = {
            image: imageUrl,
            title: reward.title,
            price: reward['cost'],
            user: message.data['redemption']['user']['display_name'],
            text: message.data['redemption']['user_input'],
        };
        console.log("Notification queued", notification);
        this.notifications.push(notification);
    }
}

module.exports = Reward
},{"./tools":4,"./tts":5}],4:[function(require,module,exports){
module.exports = {
    sleep: function (milliseconds) {
        return new Promise(res => {
            setTimeout(res, milliseconds)
        });
    },
    FREE_RANDOM_ALBUM: '655c3a9a-ef36-4203-bc29-2833cbc3759d'
}
},{}],5:[function(require,module,exports){
const TTS = {
    async playAudios(audioUrls) {
        let audios = [];
        for (let url of audioUrls) {
            audios.push(new Audio(url));
        }
        for (let audio of audios) {
            await new Promise((resolve, reject) => {
                audio.onerror = reject;
                audio.onended = resolve;
                audio.play();
            });
            audio.remove();
        }
    },
    splitSentence(text) {
        let words = text.split(" ");
        let result = [];
        let current = "";
        let i = 0;
        while (words.length > -1) {
            let word = words[0];
            if (!word) {
                result.push(current);
                current = "";
                break;
            }
            if (current.length + word.length <= 199) {
                current += word + " ";
                words.shift();
            } else if (current.length > 0) {
                result.push(current);
                current = "";
            } else {
                current = word.substring(0, 198);
                result.push(current);
                current = "";
                words.shift();
                words.unshift(word.substring(198, word.length - 1));
            }
        }
        return result;
    },
    async textToSpeech(text, language) {
        let parts = this.splitSentence(text);
        let urls = [];
        for (let part of parts) {
            urls.push(this.getTTSUrl(part, language));
        }
        await this.playAudios(urls)
    },
    getTTSUrl(text, language) {
        return `https://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=${text.length}&client=tw-ob&q=${text}&tl=${language}`
    }
}

module.exports = TTS

},{}]},{},[2]);
