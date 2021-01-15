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
