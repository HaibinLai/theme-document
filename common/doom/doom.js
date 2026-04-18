/**
 * Doom-Style FPS Game - Raycasting Engine
 * Pure Canvas 2D, no external dependencies
 * @author Haibin
 * @date 2026-04-18
 */
(function () {
    'use strict';

    // ======================== CONFIG ========================
    var SCREEN_W = 960, SCREEN_H = 540;
    var FOV = Math.PI / 3; // 60 degrees
    var HALF_FOV = FOV / 2;
    var BASE_FOV = FOV;
    var MOVE_SPEED = 3.0;
    var ROT_SPEED = 2.5;
    var MOUSE_SENS = 0.003;
    var PLAYER_RADIUS = 0.25;
    var MAX_DEPTH = 24;
    var TILE = 1;

    // ======================== LEVELS ========================
    // Each level: { map, entities, spawn: {x,y,angle} }
    // Map tiles: 0=empty, 1-4=wall types, 5=locked door, 8=exit door, 9=thin wall
    var LEVELS = [
        // === LEVEL 1 ===
        {
            name: 'Level 1 - The Bunker',
            spawn: { x: 1.5, y: 1.5, angle: 0 },
            map: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,2,2,2,0,0,0,0,3,0,3,0,0,0,0,0,4,4,4,0,0,1],
                [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,4,0,0,1],
                [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
                [1,1,1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,1],
                [1,1,1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,1,1,1,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,3,0,3,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,1],
                [1,0,0,3,0,3,0,0,0,0,4,4,4,0,0,0,0,0,2,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,4,0,4,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            entities: [
                { type: 'guard', x: 5.5, y: 5.5 },
                { type: 'guard', x: 10.5, y: 2.5 },
                { type: 'guard', x: 18.5, y: 5.5 },
                { type: 'guard', x: 3.5, y: 17.5 },
                { type: 'guard', x: 15.5, y: 18.5 },
                { type: 'soldier', x: 10.5, y: 10.5 },
                { type: 'soldier', x: 20.5, y: 20.5 },
                { type: 'soldier', x: 5.5, y: 14.5 },
                { type: 'shotgun', x: 7.5, y: 3.5 },
                { type: 'machinegun', x: 19.5, y: 19.5 },
                { type: 'health', x: 11.5, y: 11.5 },
                { type: 'health', x: 3.5, y: 21.5 },
                { type: 'ammo', x: 15.5, y: 3.5 },
                { type: 'ammo', x: 20.5, y: 14.5 },
            ]
        },
        // === LEVEL 2 === The Fortress: complex corridors, locked doors, more enemies
        {
            name: 'Level 2 - The Fortress',
            spawn: { x: 1.5, y: 22.5, angle: 0 },
            map: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,3,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,8,1],
                [1,0,0,0,0,3,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,3,0,2,2,2,2,0,3,0,4,4,4,4,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,2,0,0,2,0,0,0,4,0,0,4,0,0,0,0,0,1],
                [1,3,3,3,3,3,0,2,0,0,2,0,3,3,4,0,0,4,0,3,3,3,3,1],
                [1,0,0,0,0,0,0,2,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,2,2,5,2,2,0,0,4,4,5,4,0,0,0,0,0,1],
                [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1],
                [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1],
                [1,1,1,5,1,1,0,0,1,1,1,1,1,1,1,1,0,0,1,1,5,1,1,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
                [1,1,1,0,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,1,1,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
                [1,0,2,2,2,0,0,0,1,1,1,0,0,1,1,1,0,0,0,4,4,4,0,1],
                [1,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,4,0,1],
                [1,0,2,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,4,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
            entities: [
                // Guards — more numerous
                { type: 'guard', x: 2.5, y: 2.5 },
                { type: 'guard', x: 10.5, y: 2.5 },
                { type: 'guard', x: 16.5, y: 4.5 },
                { type: 'guard', x: 2.5, y: 8.5 },
                { type: 'guard', x: 21.5, y: 8.5 },
                { type: 'guard', x: 5.5, y: 15.5 },
                { type: 'guard', x: 18.5, y: 15.5 },
                // Soldiers — tougher
                { type: 'soldier', x: 9.5, y: 5.5 },
                { type: 'soldier', x: 15.5, y: 5.5 },
                { type: 'soldier', x: 11.5, y: 12.5 },
                { type: 'soldier', x: 3.5, y: 18.5 },
                { type: 'soldier', x: 20.5, y: 18.5 },
                { type: 'soldier', x: 20.5, y: 2.5 },
                // Pickups
                { type: 'health', x: 1.5, y: 6.5 },
                { type: 'health', x: 22.5, y: 20.5 },
                { type: 'health', x: 11.5, y: 15.5 },
                { type: 'ammo', x: 9.5, y: 9.5 },
                { type: 'ammo', x: 18.5, y: 9.5 },
                { type: 'ammo', x: 12.5, y: 18.5 },
                { type: 'shotgun', x: 3.5, y: 11.5 },
                { type: 'machinegun', x: 20.5, y: 11.5 },
                { type: 'sniper', x: 9.5, y: 12.5 },
                { type: 'm4a1', x: 14.5, y: 12.5 },
            ]
        }
    ];

    // Active map data (loaded from current level)
    var MAP, MAP_H, MAP_W, ENTITIES_DEF;
    var currentLevel = 0;
    var levelScore = 0; // accumulated score from previous levels

    function loadLevel(levelIdx) {
        var lvl = LEVELS[levelIdx];
        MAP = lvl.map;
        MAP_H = MAP.length;
        MAP_W = MAP[0].length;
        ENTITIES_DEF = lvl.entities;
    }

    // Wall colors by type
    var WALL_COLORS = {
        1: { r: 120, g: 120, b: 120 }, // grey concrete
        2: { r: 140, g: 60,  b: 60  }, // dark red brick
        3: { r: 60,  g: 100, b: 140 }, // blue steel
        4: { r: 80,  g: 130, b: 60  }, // green moss
        5: { r: 100, g: 70,  b: 40  }, // locked door (brown)
        8: { r: 180, g: 140, b: 40  }, // gold exit door
        9: { r: 100, g: 100, b: 100 }, // thin wall
    };

    var CEIL_COLOR = '#222233';
    var FLOOR_COLOR = '#444433';

    // ======================== WEAPONS ========================
    var WEAPONS = {
        knife:      { name: 'Knife',       damage: 50, fireRate: 500, ammo: Infinity, spread: 0,    color: '#ccc', auto: false, melee: true, range: 1.0 },
        pistol:     { name: 'Pistol',      damage: 15, fireRate: 400, ammo: Infinity, spread: 0,    color: '#aaa', auto: false },
        shotgun:    { name: 'Shotgun',      damage: 80, fireRate: 800, ammo: 20,       spread: 0.15, color: '#c84', auto: false },
        machinegun: { name: 'Machine Gun',  damage: 15, fireRate: 100, ammo: 100,      spread: 0.05, color: '#4a4', auto: true  },
        sniper:     { name: 'Sniper',       damage: 150, fireRate: 1200, ammo: 10,     spread: 0,    color: '#448', auto: false },
        m4a1:       { name: 'M4A1',         damage: 25, fireRate: 120, ammo: 120,      spread: 0.04, color: '#886', auto: true  },
    };

    // ======================== STATE ========================
    var canvas, ctx, miniCanvas, miniCtx;
    var audioCtx = null; // Web Audio context, created on first user interaction
    var gameState = 'MENU'; // MENU, PLAYING, WIN, GAMEOVER
    var player, entities, depthBuf;
    var keys = {};
    var mouseMovX = 0;
    var pointerLocked = false;
    var lastTime = 0, dt = 0, gameTime = 0;
    var kills = 0, totalEnemies = 0, coins = 0;
    var currentWeapon = 'pistol';
    var weaponAmmo = {};
    var hasWeapon = {};
    var lastFireTime = 0;
    var weaponAnim = 0; // 0-1 fire animation progress
    var showMinimap = true;
    var playerName = '';
    var damageFlash = 0;
    var isFiring = false;
    var projectiles = []; // enemy bullet projectiles
    var floatingTexts = []; // damage numbers {x, y, z, text, life, color}
    var shakeIntensity = 0; // screen shake
    var grenadeCount = 0;
    var grenades = []; // active grenade projectiles {x, y, dx, dy, life}
    var sniperZoom = false;

    // Leaderboard
    var leaderboardData = [];
    var leaderboardType = 'alltime';

    // ======================== MD5 (for anti-cheat) ========================
    function md5(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d)return(x^2147483648^F^H);if(I|d){if(x&1073741824)return(x^3221225472^F^H);else return(x^1073741824^F^H)}else return(x^F^H)}function w(a,b,c){return(a&b)|((~a)&c)}function v(a,b,c){return(a&c)|(b&(~c))}function u(a,b,c){return(a^b^c)}function t(a,b,c){return(b^(a|(~c)))}function C(a,b,c,d,e,f,g){a=K(a,K(K(w(b,c,d),e),g));return K(L(a,f),b)}function B(a,b,c,d,e,f,g){a=K(a,K(K(v(b,c,d),e),g));return K(L(a,f),b)}function A(a,b,c,d,e,f,g){a=K(a,K(K(u(b,c,d),e),g));return K(L(a,f),b)}function z(a,b,c,d,e,f,g){a=K(a,K(K(t(b,c,d),e),g));return K(L(a,f),b)}function D(str){var r='',i,c;for(i=0;i<str.length;i++){c=str.charCodeAt(i);r+=String.fromCharCode(c&0xFF,(c>>8)&0xFF)}return r}function E(str){var arr=[],len=str.length*8,i;for(i=0;i<len;i+=8)arr[i>>5]|=(str.charCodeAt(i/8)&0xFF)<<(i%32);return arr}function F(arr,len){arr[len>>5]|=0x80<<(len%32);arr[(((len+64)>>>9)<<4)+14]=len;var a=1732584193,b=-271733879,c=-1732584194,d=271733878,i;for(i=0;i<arr.length;i+=16){var p=a,q=b,r=c,s=d;a=C(a,b,c,d,arr[i+0],7,-680876936);d=C(d,a,b,c,arr[i+1],12,-389564586);c=C(c,d,a,b,arr[i+2],17,606105819);b=C(b,c,d,a,arr[i+3],22,-1044525330);a=C(a,b,c,d,arr[i+4],7,-176418897);d=C(d,a,b,c,arr[i+5],12,1200080426);c=C(c,d,a,b,arr[i+6],17,-1473231341);b=C(b,c,d,a,arr[i+7],22,-45705983);a=C(a,b,c,d,arr[i+8],7,1770035416);d=C(d,a,b,c,arr[i+9],12,-1958414417);c=C(c,d,a,b,arr[i+10],17,-42063);b=C(b,c,d,a,arr[i+11],22,-1990404162);a=C(a,b,c,d,arr[i+12],7,1804603682);d=C(d,a,b,c,arr[i+13],12,-40341101);c=C(c,d,a,b,arr[i+14],17,-1502002290);b=C(b,c,d,a,arr[i+15],22,1236535329);a=B(a,b,c,d,arr[i+1],5,-165796510);d=B(d,a,b,c,arr[i+6],9,-1069501632);c=B(c,d,a,b,arr[i+11],14,643717713);b=B(b,c,d,a,arr[i+0],20,-373897302);a=B(a,b,c,d,arr[i+5],5,-701558691);d=B(d,a,b,c,arr[i+10],9,38016083);c=B(c,d,a,b,arr[i+15],14,-660478335);b=B(b,c,d,a,arr[i+4],20,-405537848);a=B(a,b,c,d,arr[i+9],5,568446438);d=B(d,a,b,c,arr[i+14],9,-1019803690);c=B(c,d,a,b,arr[i+3],14,-187363961);b=B(b,c,d,a,arr[i+8],20,1163531501);a=B(a,b,c,d,arr[i+13],5,-1444681467);d=B(d,a,b,c,arr[i+2],9,-51403784);c=B(c,d,a,b,arr[i+7],14,1735328473);b=B(b,c,d,a,arr[i+12],20,-1926607734);a=A(a,b,c,d,arr[i+5],4,-378558);d=A(d,a,b,c,arr[i+8],11,-2022574463);c=A(c,d,a,b,arr[i+11],16,1839030562);b=A(b,c,d,a,arr[i+14],23,-35309556);a=A(a,b,c,d,arr[i+1],4,-1530992060);d=A(d,a,b,c,arr[i+4],11,1272893353);c=A(c,d,a,b,arr[i+7],16,-155497632);b=A(b,c,d,a,arr[i+10],23,-1094730640);a=A(a,b,c,d,arr[i+13],4,681279174);d=A(d,a,b,c,arr[i+0],11,-358537222);c=A(c,d,a,b,arr[i+3],16,-722521979);b=A(b,c,d,a,arr[i+6],23,76029189);a=A(a,b,c,d,arr[i+9],4,-640364487);d=A(d,a,b,c,arr[i+12],11,-421815835);c=A(c,d,a,b,arr[i+15],16,530742520);b=A(b,c,d,a,arr[i+2],23,-995338651);a=z(a,b,c,d,arr[i+0],6,-198630844);d=z(d,a,b,c,arr[i+7],10,1126891415);c=z(c,d,a,b,arr[i+14],15,-1416354905);b=z(b,c,d,a,arr[i+5],21,-57434055);a=z(a,b,c,d,arr[i+12],6,1700485571);d=z(d,a,b,c,arr[i+3],10,-1894986606);c=z(c,d,a,b,arr[i+10],15,-1051523);b=z(b,c,d,a,arr[i+1],21,-2054922799);a=z(a,b,c,d,arr[i+8],6,1873313359);d=z(d,a,b,c,arr[i+15],10,-30611744);c=z(c,d,a,b,arr[i+6],15,-1560198380);b=z(b,c,d,a,arr[i+13],21,1309151649);a=z(a,b,c,d,arr[i+4],6,-145523070);d=z(d,a,b,c,arr[i+11],10,-1120210379);c=z(c,d,a,b,arr[i+2],15,718787259);b=z(b,c,d,a,arr[i+9],21,-343485551);a=K(a,p);b=K(b,q);c=K(c,r);d=K(d,s)}var hex='0123456789abcdef',out='',i;var arr2=[a,b,c,d];for(i=0;i<4;i++){var n=arr2[i],j;for(j=0;j<4;j++)out+=hex.charAt((n>>(j*8+4))&0x0F)+hex.charAt((n>>(j*8))&0x0F)}return out}var utf8=[];for(var i=0;i<s.length;i++){var code=s.charCodeAt(i);if(code<0x80)utf8.push(code);else if(code<0x800){utf8.push(0xC0|(code>>6));utf8.push(0x80|(code&0x3F))}else{utf8.push(0xE0|(code>>12));utf8.push(0x80|((code>>6)&0x3F));utf8.push(0x80|(code&0x3F))}}var str='';for(var i=0;i<utf8.length;i++)str+=String.fromCharCode(utf8[i]);return F(E(str),utf8.length*8)}

    // ======================== SOUND SYSTEM ========================
    function initAudio() {
        if (audioCtx) return;
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch(e) { audioCtx = null; }
    }

    // Procedural sound effect generator — no external audio files needed
    function playSound(type) {
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var osc, gain, osc2, noise, bufferSize, buffer, output, filter;

        switch (type) {
            case 'knife':
                // Quick slash/swoosh
                bufferSize = audioCtx.sampleRate * 0.12;
                buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                output = buffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
                noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                filter = audioCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 3000;
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                noise.start(now);
                break;

            case 'pistol':
                // Sharp snap
                gain = audioCtx.createGain();
                gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                // Noise burst
                bufferSize = audioCtx.sampleRate * 0.15;
                buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                output = buffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
                noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1500;
                noise.connect(filter);
                filter.connect(gain);
                noise.start(now);
                // Low thump
                osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
                var g2 = audioCtx.createGain();
                g2.gain.setValueAtTime(0.4, now);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(g2);
                g2.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'shotgun':
                // Loud boom + longer noise
                gain = audioCtx.createGain();
                gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                bufferSize = audioCtx.sampleRate * 0.3;
                buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                output = buffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
                noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 800;
                noise.connect(filter);
                filter.connect(gain);
                noise.start(now);
                // Deep thump
                osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
                g2 = audioCtx.createGain();
                g2.gain.setValueAtTime(0.5, now);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(g2);
                g2.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'machinegun':
                // Quick tick
                gain = audioCtx.createGain();
                gain.connect(audioCtx.destination);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                bufferSize = audioCtx.sampleRate * 0.06;
                buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                output = buffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
                noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 2000;
                noise.connect(filter);
                filter.connect(gain);
                noise.start(now);
                osc = audioCtx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
                g2 = audioCtx.createGain();
                g2.gain.setValueAtTime(0.15, now);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(g2);
                g2.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'hit':
                // Meaty impact
                osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
                break;

            case 'hurt':
                // Player pain — descending tone
                osc = audioCtx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
                break;

            case 'step':
                // Soft footstep thud
                osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(80 + Math.random() * 40, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.06);
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
                break;

            case 'pickup':
                // Happy ascending chime
                osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.linearRampToValueAtTime(900, now + 0.15);
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'kill':
                // Enemy death — descending buzz
                osc = audioCtx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
                break;

            case 'door':
                // Heavy door sliding open
                osc = audioCtx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.4);
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 400;
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.5);
                break;

            case 'explosion':
                // Deep boom
                bufferSize = audioCtx.sampleRate * 0.6;
                buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                output = buffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
                noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 300;
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                noise.start(now);
                break;

            case 'sniper':
                // Heavy rifle crack
                osc = audioCtx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                filter = audioCtx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 800;
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
                break;

            case 'm4a1':
                // Rapid fire pop
                bufferSize = audioCtx.sampleRate * 0.08;
                buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                output = buffer.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
                noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 1200;
                gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                noise.start(now);
                break;
        }
    }

    var lastStepTime = 0;

    // ======================== INIT ========================
    function init() {
        canvas = document.getElementById('doom-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        canvas.width = SCREEN_W;
        canvas.height = SCREEN_H;

        // Load default level data
        loadLevel(0);

        // Minimap canvas
        miniCanvas = document.createElement('canvas');
        miniCanvas.width = 160;
        miniCanvas.height = 160;
        miniCtx = miniCanvas.getContext('2d');

        depthBuf = new Float32Array(SCREEN_W);

        // Load saved name
        playerName = localStorage.getItem('doom_player_name') || '';
        var nameInput = document.getElementById('doom-name-input');
        if (nameInput && playerName) nameInput.value = playerName;

        // Events
        document.addEventListener('keydown', function (e) {
            keys[e.code] = true;
            // Weapon switch
            if (e.code === 'Digit1' && hasWeapon.knife) switchWeapon('knife');
            if (e.code === 'Digit2' && hasWeapon.pistol) switchWeapon('pistol');
            if (e.code === 'Digit3' && hasWeapon.shotgun) switchWeapon('shotgun');
            if (e.code === 'Digit4' && hasWeapon.machinegun) switchWeapon('machinegun');
            if (e.code === 'Digit5' && hasWeapon.sniper) switchWeapon('sniper');
            if (e.code === 'Digit6' && hasWeapon.m4a1) switchWeapon('m4a1');
            if (e.code === 'KeyQ') cycleWeapon();
            if (e.code === 'KeyM') showMinimap = !showMinimap;
            if (e.code === 'KeyE' && gameState === 'PLAYING') tryOpenDoor();
            if (e.code === 'KeyG' && gameState === 'PLAYING') throwGrenade();
            if (e.code === 'Space' || e.code === 'Enter') {
                if (gameState === 'MENU') return;
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', function (e) { keys[e.code] = false; });

        // Mouse
        canvas.addEventListener('click', function () {
            if (gameState === 'PLAYING' && !pointerLocked) {
                canvas.requestPointerLock();
            }
        });
        document.addEventListener('pointerlockchange', function () {
            pointerLocked = document.pointerLockElement === canvas;
        });
        document.addEventListener('mousemove', function (e) {
            if (pointerLocked) {
                // Discard abnormally large values (browser pointer lock bug)
                var mx = e.movementX;
                if (mx > -200 && mx < 200) {
                    mouseMovX += mx;
                }
            }
        });
        document.addEventListener('mousedown', function (e) {
            if (pointerLocked && e.button === 0) isFiring = true;
            if (pointerLocked && e.button === 2 && gameState === 'PLAYING') {
                if (currentWeapon === 'sniper') {
                    sniperZoom = !sniperZoom;
                }
            }
        });
        document.addEventListener('mouseup', function (e) {
            if (e.button === 0) isFiring = false;
        });
        // Prevent context menu
        canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

        // Scroll wheel weapon cycle
        canvas.addEventListener('wheel', function (e) {
            if (gameState !== 'PLAYING') return;
            e.preventDefault();
            var order = ['knife', 'pistol', 'shotgun', 'machinegun', 'sniper', 'm4a1'];
            var owned = order.filter(function (w) { return hasWeapon[w]; });
            var idx = owned.indexOf(currentWeapon);
            if (e.deltaY > 0) idx = (idx + 1) % owned.length;
            else idx = (idx - 1 + owned.length) % owned.length;
            switchWeapon(owned[idx]);
        }, { passive: false });

        // UI buttons
        var startBtn = document.getElementById('doom-start-btn');
        if (startBtn) startBtn.addEventListener('click', startGame);

        var replayBtn = document.getElementById('doom-replay-btn');
        if (replayBtn) replayBtn.addEventListener('click', startGame);

        var replayBtn2 = document.getElementById('doom-replay-btn2');
        if (replayBtn2) replayBtn2.addEventListener('click', startGame);

        // Leaderboard tabs
        document.querySelectorAll('.doom-tab-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                leaderboardType = btn.dataset.type;
                document.querySelectorAll('.doom-tab-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                loadLeaderboard();
            });
        });

        loadLeaderboard();
        requestAnimationFrame(gameLoop);
    }

    function startGame() {
        var nameInput = document.getElementById('doom-name-input');
        if (nameInput) {
            playerName = nameInput.value.trim().substring(0, 20);
            if (!playerName) { alert('Please enter your name'); return; }
            localStorage.setItem('doom_player_name', playerName);
        }

        currentLevel = 0;
        levelScore = 0;
        initLevel(currentLevel, true);

        initAudio();
        gameState = 'PLAYING';
        hideOverlays();
        canvas.requestPointerLock();
    }

    // Initialize a level. fullReset=true resets weapons/ammo (new game), false=keep (level transition)
    function initLevel(levelIdx, fullReset) {
        loadLevel(levelIdx);
        var lvl = LEVELS[levelIdx];

        // Reset player position
        player = { x: lvl.spawn.x, y: lvl.spawn.y, angle: lvl.spawn.angle, hp: fullReset ? 100 : player.hp };

        if (fullReset) {
            currentWeapon = 'pistol';
            hasWeapon = { knife: true, pistol: true, shotgun: false, machinegun: false, sniper: false, m4a1: false };
            weaponAmmo = { knife: Infinity, pistol: Infinity, shotgun: 0, machinegun: 0, sniper: 0, m4a1: 0 };
            kills = 0;
            coins = 0;
            gameTime = 0;
        }
        lastFireTime = 0;
        weaponAnim = 0;
        damageFlash = 0;
        isFiring = false;
        projectiles = [];
        floatingTexts = [];
        grenades = [];
        // Give grenades on level 2+
        if (fullReset) grenadeCount = 0;
        if (levelIdx >= 1) grenadeCount += 3;

        // Clone entities
        entities = [];
        totalEnemies = 0;
        ENTITIES_DEF.forEach(function (e) {
            // Skip entities placed inside walls
            var gx = Math.floor(e.x), gy = Math.floor(e.y);
            if (gx < 0 || gy < 0 || gx >= MAP_W || gy >= MAP_H || MAP[gy][gx] !== 0) return;
            var ent = { type: e.type, x: e.x, y: e.y, alive: true };
            if (e.type === 'guard') {
                ent.hp = 50; ent.speed = 1.5; ent.damage = 8; ent.range = 8;
                ent.fireRate = 1000; ent.lastFire = 0;
                ent.color = '#c44'; ent.alertColor = '#f66';
                ent.state = 'IDLE'; ent.alertTimer = 0;
                ent.patrolAngle = Math.random() * Math.PI * 2;
                totalEnemies++;
            } else if (e.type === 'soldier') {
                ent.hp = 100; ent.speed = 2.2; ent.damage = 12; ent.range = 12;
                ent.fireRate = 700; ent.lastFire = 0;
                ent.color = '#66c'; ent.alertColor = '#88f';
                ent.state = 'IDLE'; ent.alertTimer = 0;
                ent.patrolAngle = Math.random() * Math.PI * 2;
                totalEnemies++;
            } else if (e.type === 'shotgun') {
                ent.pickupType = 'shotgun'; ent.color = '#c84';
            } else if (e.type === 'machinegun') {
                ent.pickupType = 'machinegun'; ent.color = '#4a4';
            } else if (e.type === 'sniper') {
                ent.pickupType = 'sniper'; ent.color = '#448';
            } else if (e.type === 'm4a1') {
                ent.pickupType = 'm4a1'; ent.color = '#886';
            } else if (e.type === 'health') {
                ent.pickupType = 'health'; ent.color = '#f44';
            } else if (e.type === 'ammo') {
                ent.pickupType = 'ammo'; ent.color = '#fa0';
            }
            entities.push(ent);
        });
    }

    function switchWeapon(w) {
        if (hasWeapon[w] && currentWeapon !== w) {
            currentWeapon = w;
            weaponAnim = 0;
            if (w !== 'sniper') sniperZoom = false;
        }
    }

    function cycleWeapon() {
        var order = ['knife', 'pistol', 'shotgun', 'machinegun', 'sniper', 'm4a1'];
        var owned = order.filter(function (w) { return hasWeapon[w]; });
        if (owned.length <= 1) return;
        var idx = (owned.indexOf(currentWeapon) + 1) % owned.length;
        switchWeapon(owned[idx]);
    }

    function hideOverlays() {
        var ids = ['doom-start-overlay', 'doom-gameover-overlay', 'doom-win-overlay'];
        ids.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    function showOverlay(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    }

    // ======================== GAME LOOP ========================
    function gameLoop(timestamp) {
        dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        if (gameState === 'PLAYING') {
            gameTime += dt;
            processInput();
            updateEntities();
            updateProjectiles();
            checkPickups();
            checkWin();
            updateFloatingTexts(dt);
            updateGrenades();
        }

        render();
        requestAnimationFrame(gameLoop);
    }

    // ======================== INPUT ========================
    function processInput() {
        var moveX = 0, moveY = 0;
        var cos = Math.cos(player.angle), sin = Math.sin(player.angle);

        // Forward / back
        if (keys['KeyW'] || keys['ArrowUp']) { moveX += cos * MOVE_SPEED * dt; moveY += sin * MOVE_SPEED * dt; }
        if (keys['KeyS'] || keys['ArrowDown']) { moveX -= cos * MOVE_SPEED * dt; moveY -= sin * MOVE_SPEED * dt; }
        // Strafe
        if (keys['KeyA']) { moveX += sin * MOVE_SPEED * dt; moveY -= cos * MOVE_SPEED * dt; }
        if (keys['KeyD']) { moveX -= sin * MOVE_SPEED * dt; moveY += cos * MOVE_SPEED * dt; }

        // Rotation via keyboard
        if (keys['ArrowLeft']) player.angle -= ROT_SPEED * dt;
        if (keys['ArrowRight']) player.angle += ROT_SPEED * dt;

        // Mouse rotation — direct apply, outliers already filtered in mousemove
        if (pointerLocked) {
            player.angle += mouseMovX * MOUSE_SENS;
            mouseMovX = 0;
        }

        // Normalize angle to prevent jumps
        player.angle = player.angle % (2 * Math.PI);
        if (player.angle < 0) player.angle += 2 * Math.PI;

        // Collision-checked movement
        if (moveX !== 0 || moveY !== 0) {
            var newX = player.x + moveX;
            var newY = player.y + moveY;
            // Slide along walls
            if (!isWall(newX, player.y)) player.x = newX;
            if (!isWall(player.x, newY)) player.y = newY;

            // Footstep sound every 0.35s while moving
            var now2 = performance.now();
            if (now2 - lastStepTime > 350) {
                playSound('step');
                lastStepTime = now2;
            }
        }

        // Shooting
        var now = performance.now();
        var wp = WEAPONS[currentWeapon];
        var wantShoot = isFiring || keys['Space'];
        if (wantShoot && now - lastFireTime > wp.fireRate && weaponAmmo[currentWeapon] > 0) {
            shoot();
            lastFireTime = now;
            if (weaponAmmo[currentWeapon] !== Infinity) weaponAmmo[currentWeapon]--;
        }

        // Weapon animation decay
        if (weaponAnim > 0) weaponAnim = Math.max(0, weaponAnim - dt * 6);
        if (damageFlash > 0) damageFlash = Math.max(0, damageFlash - dt * 4);
    }

    function isWall(x, y) {
        // Check with player radius
        var checks = [
            [x - PLAYER_RADIUS, y - PLAYER_RADIUS],
            [x + PLAYER_RADIUS, y - PLAYER_RADIUS],
            [x - PLAYER_RADIUS, y + PLAYER_RADIUS],
            [x + PLAYER_RADIUS, y + PLAYER_RADIUS],
        ];
        for (var i = 0; i < checks.length; i++) {
            var mx = Math.floor(checks[i][0]), my = Math.floor(checks[i][1]);
            if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return true;
            if (MAP[my][mx] !== 0) return true;
        }
        // Check enemy collision
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (!e.alive || e.pickupType) continue;
            var dx = x - e.x, dy = y - e.y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.7) return true;
        }
        return false;
    }

    // ======================== SHOOTING ========================
    function shoot() {
        weaponAnim = 1.0;
        var wp = WEAPONS[currentWeapon];
        playSound(currentWeapon);
        if (currentWeapon === 'shotgun') shakeIntensity = Math.max(shakeIntensity, 0.3);
        // Alert nearby enemies
        alertNearbyEnemies(player.x, player.y, wp.melee ? 5 : 10);

        if (wp.melee) {
            // Melee attack: hit closest enemy within range and in front of player
            knifeStab(wp.damage, wp.range);
        } else if (currentWeapon === 'shotgun') {
            // Shotgun: multiple pellets
            for (var p = 0; p < 5; p++) {
                var spread = (Math.random() - 0.5) * wp.spread * 2;
                castBullet(player.angle + spread, wp.damage / 5);
            }
        } else {
            var spread = (Math.random() - 0.5) * wp.spread * 2;
            castBullet(player.angle + spread, wp.damage);
        }
    }

    // Spawn a floating damage number at world position
    function spawnFloatText(x, y, text, color) {
        floatingTexts.push({ x: x, y: y, z: 0.5, text: String(text), life: 1.0, color: color || '#ff0' });
    }

    function updateFloatingTexts(dt) {
        for (var i = floatingTexts.length - 1; i >= 0; i--) {
            var ft = floatingTexts[i];
            ft.z += dt * 1.2; // float upward
            ft.life -= dt;
            if (ft.life <= 0) floatingTexts.splice(i, 1);
        }
    }

    function knifeStab(damage, range) {
        var best = null, bestDist = range + 0.1;
        var cos = Math.cos(player.angle), sin = Math.sin(player.angle);
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (!e.alive || e.pickupType || e.hp <= 0) continue;
            var dx = e.x - player.x, dy = e.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > range) continue;
            // Must be roughly in front (within ~90 degrees)
            var dot = dx * cos + dy * sin;
            if (dot < 0) continue;
            if (dist < bestDist) { bestDist = dist; best = e; }
        }
        if (best) {
            best.hp -= damage;
            spawnFloatText(best.x, best.y, damage, '#ff0');
            best.state = 'CHASE';
            best.alertTimer = 5;
            if (best.hp <= 0) {
                best.alive = false;
                best.state = 'DEAD';
                kills++;
                playSound('kill');
                // Drop a coin
                entities.push({ type: 'coin', x: best.x, y: best.y, alive: true, pickupType: 'coin', color: '#fc0' });
            } else {
                playSound('hit');
            }
        }
    }

    function castBullet(angle, damage) {
        // Raycast to find first enemy hit
        var rayX = Math.cos(angle), rayY = Math.sin(angle);
        var best = null, bestDist = MAX_DEPTH;

        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (!e.alive || e.pickupType || e.hp <= 0) continue;

            var dx = e.x - player.x, dy = e.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > bestDist) continue;

            // Project enemy onto ray
            var dot = dx * rayX + dy * rayY;
            if (dot < 0.1) continue; // behind player

            // Perpendicular distance from ray to enemy center
            var perpDist = Math.abs(dx * rayY - dy * rayX);
            var hitRadius = dist < 1.5 ? 0.6 : 0.4; // larger hitbox at close range

            if (perpDist < hitRadius) {
                // Check wall between player and enemy
                if (!wallBetween(player.x, player.y, e.x, e.y, dot)) {
                    bestDist = dot;
                    best = e;
                }
            }
        }

        if (best) {
            best.hp -= damage;
            spawnFloatText(best.x, best.y, damage, '#ff0');
            best.state = 'CHASE';
            best.alertTimer = 5;
            if (best.hp <= 0) {
                best.alive = false;
                best.state = 'DEAD';
                kills++;
                playSound('kill');
                // Drop a coin
                entities.push({ type: 'coin', x: best.x, y: best.y, alive: true, pickupType: 'coin', color: '#fc0' });
            } else {
                playSound('hit');
            }
        }
    }

    function wallBetween(x1, y1, x2, y2, maxDist) {
        var dx = x2 - x1, dy = y2 - y1;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var steps = Math.ceil(dist * 3);
        for (var i = 1; i < steps; i++) {
            var t = i / steps;
            var cx = x1 + dx * t, cy = y1 + dy * t;
            var mx = Math.floor(cx), my = Math.floor(cy);
            if (mx >= 0 && my >= 0 && mx < MAP_W && my < MAP_H && MAP[my][mx] !== 0 && MAP[my][mx] !== 8) return true;
        }
        return false;
    }

    function alertNearbyEnemies(x, y, radius) {
        entities.forEach(function (e) {
            if (!e.alive || e.pickupType) return;
            var dx = e.x - x, dy = e.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < radius) {
                if (e.state === 'IDLE') {
                    e.state = 'ALERT';
                    e.alertTimer = 3;
                }
            }
        });
    }

    // ======================== ENTITIES ========================
    function updateEntities() {
        entities.forEach(function (e) {
            if (!e.alive || e.pickupType) return;

            var dx = player.x - e.x, dy = player.y - e.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            var angleToPlayer = Math.atan2(dy, dx);
            var now = performance.now();

            // Line of sight check
            var canSee = dist < e.range && !wallBetween(e.x, e.y, player.x, player.y, dist);

            switch (e.state) {
                case 'IDLE':
                    // Slow patrol movement
                    e.patrolAngle += (Math.random() - 0.5) * dt;
                    var px = e.x + Math.cos(e.patrolAngle) * e.speed * 0.3 * dt;
                    var py = e.y + Math.sin(e.patrolAngle) * e.speed * 0.3 * dt;
                    if (!isWallForEnemy(px, py, e)) { e.x = px; e.y = py; }
                    else e.patrolAngle += Math.PI / 2;

                    if (canSee) { e.state = 'CHASE'; e.alertTimer = 5; }
                    break;

                case 'ALERT':
                    e.alertTimer -= dt;
                    if (canSee) { e.state = 'CHASE'; e.alertTimer = 5; }
                    else if (e.alertTimer <= 0) e.state = 'IDLE';
                    break;

                case 'CHASE':
                    e.alertTimer -= dt;
                    // Move toward player
                    var mx = e.x + Math.cos(angleToPlayer) * e.speed * dt;
                    var my = e.y + Math.sin(angleToPlayer) * e.speed * dt;
                    if (!isWallForEnemy(mx, my, e)) { e.x = mx; e.y = my; }

                    // Melee attack when very close
                    if (dist < 0.8 && now - e.lastFire > e.fireRate) {
                        player.hp -= e.damage * 1.5;
                        damageFlash = 1.0;
                        playSound('hurt');
                        shakeIntensity = Math.max(shakeIntensity, 0.5);
                        if (player.hp <= 0) {
                            player.hp = 0;
                            gameState = 'GAMEOVER';
                            var goScore = document.getElementById('doom-go-score');
                            if (goScore) goScore.textContent = levelScore + calcScore();
                            var goKills = document.getElementById('doom-go-kills');
                            if (goKills) goKills.textContent = kills + '/' + totalEnemies;
                            var goTime = document.getElementById('doom-go-time');
                            if (goTime) goTime.textContent = formatTime(gameTime);
                            showOverlay('doom-gameover-overlay');
                            document.exitPointerLock();
                            submitScore();
                        }
                    }
                    // Ranged attack if in range and can see
                    else if (canSee && dist < e.range && now - e.lastFire > e.fireRate) {
                        // Spawn a projectile toward player
                        var spread = (Math.random() - 0.5) * 0.15;
                        projectiles.push({
                            x: e.x, y: e.y,
                            dx: Math.cos(angleToPlayer + spread) * 6,
                            dy: Math.sin(angleToPlayer + spread) * 6,
                            damage: e.damage,
                            life: 3, // seconds before despawn
                            color: e.type === 'soldier' ? '#88f' : '#fa0',
                        });
                        e.lastFire = now;
                    }

                    if (!canSee && e.alertTimer <= 0) e.state = 'IDLE';
                    else if (canSee) e.alertTimer = 5;
                    break;
            }
        });
    }

    function isWallForEnemy(x, y, self) {
        // Check with radius (0.3) to prevent clipping into walls
        var r = 0.3;
        var checks = [[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r],[x,y]];
        for (var c = 0; c < checks.length; c++) {
            var mx = Math.floor(checks[c][0]), my = Math.floor(checks[c][1]);
            if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H) return true;
            if (MAP[my][mx] !== 0 && MAP[my][mx] !== 8) return true;
        }
        // Don't overlap other enemies
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (e === self || !e.alive || e.pickupType) continue;
            var dx = x - e.x, dy = y - e.y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.6) return true;
        }
        // Don't walk into player
        var pdx = x - player.x, pdy = y - player.y;
        if (Math.sqrt(pdx * pdx + pdy * pdy) < 0.7) return true;
        return false;
    }

    // ======================== PROJECTILES ========================
    function updateProjectiles() {
        for (var i = projectiles.length - 1; i >= 0; i--) {
            var p = projectiles[i];
            p.life -= dt;
            if (p.life <= 0) { projectiles.splice(i, 1); continue; }

            p.x += p.dx * dt;
            p.y += p.dy * dt;

            // Hit wall?
            var mx = Math.floor(p.x), my = Math.floor(p.y);
            if (mx < 0 || my < 0 || mx >= MAP_W || my >= MAP_H || MAP[my][mx] !== 0) {
                projectiles.splice(i, 1);
                continue;
            }

            // Hit player?
            var dx = p.x - player.x, dy = p.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.4) {
                player.hp -= p.damage;
                damageFlash = 1.0;
                playSound('hurt');
                shakeIntensity = Math.max(shakeIntensity, 0.5);
                projectiles.splice(i, 1);
                if (player.hp <= 0) {
                    player.hp = 0;
                    gameState = 'GAMEOVER';
                    var goScore = document.getElementById('doom-go-score');
                    if (goScore) goScore.textContent = levelScore + calcScore();
                    var goKills = document.getElementById('doom-go-kills');
                    if (goKills) goKills.textContent = kills + '/' + totalEnemies;
                    var goTime = document.getElementById('doom-go-time');
                    if (goTime) goTime.textContent = formatTime(gameTime);
                    showOverlay('doom-gameover-overlay');
                    document.exitPointerLock();
                    submitScore();
                    return;
                }
            }
        }
    }

    function checkPickups() {
        entities.forEach(function (e) {
            if (!e.alive || !e.pickupType) return;
            var dx = player.x - e.x, dy = player.y - e.y;
            if (Math.sqrt(dx * dx + dy * dy) < 0.6) {
                var picked = false;
                if (e.pickupType === 'shotgun') {
                    hasWeapon.shotgun = true;
                    weaponAmmo.shotgun += 20;
                    switchWeapon('shotgun');
                    e.alive = false; picked = true;
                } else if (e.pickupType === 'machinegun') {
                    hasWeapon.machinegun = true;
                    weaponAmmo.machinegun += 100;
                    switchWeapon('machinegun');
                    e.alive = false; picked = true;
                } else if (e.pickupType === 'health') {
                    if (player.hp < 100) {
                        player.hp = Math.min(100, player.hp + 30);
                        e.alive = false; picked = true;
                    }
                } else if (e.pickupType === 'ammo') {
                    if (hasWeapon.shotgun) weaponAmmo.shotgun += 10;
                    if (hasWeapon.machinegun) weaponAmmo.machinegun += 50;
                    if (hasWeapon.sniper) weaponAmmo.sniper += 5;
                    if (hasWeapon.m4a1) weaponAmmo.m4a1 += 60;
                    e.alive = false; picked = true;
                } else if (e.pickupType === 'sniper') {
                    hasWeapon.sniper = true;
                    weaponAmmo.sniper += 10;
                    switchWeapon('sniper');
                    e.alive = false; picked = true;
                } else if (e.pickupType === 'm4a1') {
                    hasWeapon.m4a1 = true;
                    weaponAmmo.m4a1 += 120;
                    switchWeapon('m4a1');
                    e.alive = false; picked = true;
                } else if (e.pickupType === 'coin') {
                    coins++;
                    levelScore += 50;
                    spawnFloatText(e.x, e.y, '+50 🪙', '#fc0');
                    e.alive = false; picked = true;
                }
                if (picked) playSound('pickup');
            }
        });
    }

    // Try to open a locked door (tile 5) near the player
    function tryOpenDoor() {
        var px = Math.floor(player.x), py = Math.floor(player.y);
        var checks = [[px,py],[px+1,py],[px-1,py],[px,py+1],[px,py-1],
                       [px+1,py+1],[px-1,py-1],[px+1,py-1],[px-1,py+1]];
        for (var i = 0; i < checks.length; i++) {
            var cx = checks[i][0], cy = checks[i][1];
            if (cx >= 0 && cy >= 0 && cx < MAP_W && cy < MAP_H && MAP[cy][cx] === 5) {
                var dx = (cx + 0.5) - player.x, dy = (cy + 0.5) - player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 1.5) {
                    MAP[cy][cx] = 0; // open the door
                    playSound('door');
                    return;
                }
            }
        }
    }

    // Throw a grenade
    function throwGrenade() {
        if (grenadeCount <= 0) return;
        grenadeCount--;
        var cos = Math.cos(player.angle), sin = Math.sin(player.angle);
        grenades.push({
            x: player.x + cos * 0.5,
            y: player.y + sin * 0.5,
            dx: cos * 6,
            dy: sin * 6,
            z: 0.5,       // vertical height (0 = ground, 1 = eye level)
            dz: 3.0,      // upward throw velocity
            life: 3.0,    // longer fuse since it bounces
            bounces: 0
        });
        playSound('door'); // reuse door sound as throw sound
    }

    function updateGrenades() {
        var GRAVITY = 9.8;
        var BOUNCE_DAMPEN = 0.45;  // energy retained on bounce
        var FRICTION = 0.97;       // ground friction per frame
        var WALL_BOUNCE = 0.5;     // wall bounce energy

        for (var i = grenades.length - 1; i >= 0; i--) {
            var g = grenades[i];
            g.life -= dt;

            // Apply gravity to vertical velocity
            g.dz -= GRAVITY * dt;
            g.z += g.dz * dt;

            // Ground bounce
            if (g.z <= 0) {
                g.z = 0;
                if (Math.abs(g.dz) > 0.5) {
                    // Bounce!
                    g.dz = -g.dz * BOUNCE_DAMPEN;
                    g.bounces++;
                    // Reduce horizontal speed on bounce
                    g.dx *= 0.7;
                    g.dy *= 0.7;
                    // Bounce sound (quieter each time)
                    if (g.bounces <= 3) playSound('step');
                } else {
                    // Settled on ground
                    g.dz = 0;
                    g.z = 0;
                    // Rolling friction
                    g.dx *= 0.92;
                    g.dy *= 0.92;
                }
            }

            // Horizontal movement with wall collision/bounce
            var nx = g.x + g.dx * dt;
            var ny = g.y + g.dy * dt;

            var mxN = Math.floor(nx), myN = Math.floor(ny);
            var mxO = Math.floor(g.x), myO = Math.floor(g.y);

            // Check X axis wall collision
            var hitX = false, hitY = false;
            if (mxN < 0 || mxN >= MAP_W || MAP[myO][mxN] !== 0) {
                g.dx = -g.dx * WALL_BOUNCE;
                nx = g.x;
                hitX = true;
            }
            // Check Y axis wall collision
            if (myN < 0 || myN >= MAP_H || MAP[myN][Math.floor(nx)] !== 0) {
                g.dy = -g.dy * WALL_BOUNCE;
                ny = g.y;
                hitY = true;
            }
            if (hitX || hitY) {
                g.bounces++;
                if (g.bounces <= 3) playSound('step');
            }

            g.x = nx;
            g.y = ny;

            // Air friction
            if (g.z > 0.01) {
                g.dx *= FRICTION;
                g.dy *= FRICTION;
            }

            if (g.life <= 0) {
                explodeGrenade(g.x, g.y);
                grenades.splice(i, 1);
            }
        }
    }

    function explodeGrenade(ex, ey) {
        var radius = 2.5;
        shakeIntensity = Math.max(shakeIntensity, 0.8);
        damageFlash = 0.3;
        playSound('explosion');
        // Damage all enemies in radius
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (!e.alive || e.pickupType || e.hp === undefined) continue;
            var dx = e.x - ex, dy = e.y - ey;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
                var dmg = Math.floor(120 * (1 - dist / radius));
                e.hp -= dmg;
                spawnFloatText(e.x, e.y, dmg, '#f80');
                e.state = 'CHASE';
                e.alertTimer = 5;
                if (e.hp <= 0) {
                    e.alive = false;
                    e.state = 'DEAD';
                    kills++;
                    playSound('kill');
                    entities.push({ type: 'coin', x: e.x, y: e.y, alive: true, pickupType: 'coin', color: '#fc0' });
                }
            }
        }
        // Damage player if close
        var pd = Math.sqrt((player.x - ex) * (player.x - ex) + (player.y - ey) * (player.y - ey));
        if (pd < radius) {
            var pdmg = Math.floor(60 * (1 - pd / radius));
            player.hp -= pdmg;
            damageFlash = 1.0;
        }
    }

    function checkWin() {
        // Check if player is near exit door (tile 8)
        var mx = Math.floor(player.x), my = Math.floor(player.y);
        // Check adjacent tiles for exit door
        var checks = [[mx,my],[mx+1,my],[mx-1,my],[mx,my+1],[mx,my-1]];
        for (var i = 0; i < checks.length; i++) {
            var cx = checks[i][0], cy = checks[i][1];
            if (cx >= 0 && cy >= 0 && cx < MAP_W && cy < MAP_H && MAP[cy][cx] === 8) {
                var dx = (cx + 0.5) - player.x, dy = (cy + 0.5) - player.y;
                if (Math.sqrt(dx * dx + dy * dy) < 0.8) {
                    // Check if there are more levels
                    if (currentLevel < LEVELS.length - 1) {
                        // Transition to next level — keep weapons, hp, accumulate score
                        levelScore += calcScore();
                        currentLevel++;
                        initLevel(currentLevel, false);
                        return;
                    }
                    // Final level — win!
                    gameState = 'WIN';
                    var score = levelScore + calcScore();
                    var scoreEl = document.getElementById('doom-win-score');
                    if (scoreEl) scoreEl.textContent = score;
                    var killsEl = document.getElementById('doom-win-kills');
                    if (killsEl) killsEl.textContent = kills + '/' + totalEnemies;
                    var timeEl = document.getElementById('doom-win-time');
                    if (timeEl) timeEl.textContent = formatTime(gameTime);
                    showOverlay('doom-win-overlay');
                    document.exitPointerLock();
                    submitScore();
                }
            }
        }
    }

    function calcScore() {
        var timeBonus = Math.max(0, 3000 - Math.floor(gameTime) * 10);
        return kills * 100 + Math.floor(player.hp) * 10 + timeBonus;
    }

    function formatTime(t) {
        var m = Math.floor(t / 60), s = Math.floor(t % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // ======================== RENDERING ========================
    function render() {
        // Sniper zoom FOV
        FOV = (sniperZoom && currentWeapon === 'sniper') ? BASE_FOV / 2 : BASE_FOV;
        HALF_FOV = FOV / 2;

        // Screen shake
        var shakeX = 0, shakeY = 0;
        if (shakeIntensity > 0) {
            shakeX = (Math.random() - 0.5) * shakeIntensity * 20;
            shakeY = (Math.random() - 0.5) * shakeIntensity * 20;
            shakeIntensity = Math.max(0, shakeIntensity - dt * 5);
            ctx.save();
            ctx.translate(shakeX, shakeY);
        }

        // Clear
        ctx.fillStyle = CEIL_COLOR;
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H / 2);
        ctx.fillStyle = FLOOR_COLOR;
        ctx.fillRect(0, SCREEN_H / 2, SCREEN_W, SCREEN_H / 2);

        if (gameState === 'MENU') {
            drawMenuScreen();
            return;
        }

        // Raycasting
        castRays();
        // Sprites
        drawSprites();
        // Projectiles
        drawProjectiles();
        // Floating damage numbers
        drawFloatingTexts();
        // Weapon
        drawWeapon();
        // HUD
        drawHUD();
        // Damage flash
        if (damageFlash > 0) {
            ctx.fillStyle = 'rgba(255,0,0,' + (damageFlash * 0.35) + ')';
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        }
        // Sniper scope overlay
        if (sniperZoom && currentWeapon === 'sniper') {
            var cx = SCREEN_W / 2, cy = SCREEN_H / 2;
            var scopeR = Math.min(SCREEN_W, SCREEN_H) * 0.4;
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.beginPath();
            ctx.rect(0, 0, SCREEN_W, SCREEN_H);
            ctx.arc(cx, cy, scopeR, 0, Math.PI * 2, true);
            ctx.fill();
            // Crosshair lines
            ctx.strokeStyle = 'rgba(0,255,0,0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - scopeR, cy); ctx.lineTo(cx + scopeR, cy);
            ctx.moveTo(cx, cy - scopeR); ctx.lineTo(cx, cy + scopeR);
            ctx.stroke();
            // Scope ring
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, scopeR, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Minimap
        if (showMinimap) drawMinimap();

        // Restore shake transform
        if (shakeX !== 0 || shakeY !== 0) ctx.restore();
    }

    function drawMenuScreen() {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        ctx.fillStyle = '#c33';
        ctx.font = 'bold 60px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DOOM FPS', SCREEN_W / 2, SCREEN_H / 2 - 60);
        ctx.fillStyle = '#888';
        ctx.font = '16px monospace';
        ctx.fillText('Enter your name and click START', SCREEN_W / 2, SCREEN_H / 2);
        ctx.textAlign = 'left';
    }

    // ======================== RAYCASTING ========================
    function castRays() {
        for (var col = 0; col < SCREEN_W; col++) {
            var rayAngle = player.angle - HALF_FOV + (col / SCREEN_W) * FOV;
            var rayCos = Math.cos(rayAngle), raySin = Math.sin(rayAngle);

            // DDA setup
            var mapX = Math.floor(player.x), mapY = Math.floor(player.y);
            var deltaDistX = Math.abs(1 / rayCos), deltaDistY = Math.abs(1 / raySin);
            var stepX, stepY, sideDistX, sideDistY;

            if (rayCos < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
            else { stepX = 1; sideDistX = (mapX + 1 - player.x) * deltaDistX; }
            if (raySin < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
            else { stepY = 1; sideDistY = (mapY + 1 - player.y) * deltaDistY; }

            // DDA loop
            var hit = false, side = 0, wallType = 1;
            for (var d = 0; d < MAX_DEPTH * 2; d++) {
                if (sideDistX < sideDistY) {
                    sideDistX += deltaDistX;
                    mapX += stepX;
                    side = 0;
                } else {
                    sideDistY += deltaDistY;
                    mapY += stepY;
                    side = 1;
                }
                if (mapX < 0 || mapY < 0 || mapX >= MAP_W || mapY >= MAP_H) break;
                if (MAP[mapY][mapX] > 0) {
                    hit = true;
                    wallType = MAP[mapY][mapX];
                    break;
                }
            }

            if (!hit) { depthBuf[col] = MAX_DEPTH; continue; }

            // Perpendicular distance (fish-eye correction)
            var perpDist;
            if (side === 0) perpDist = sideDistX - deltaDistX;
            else perpDist = sideDistY - deltaDistY;
            if (perpDist < 0.01) perpDist = 0.01;

            depthBuf[col] = perpDist;

            // Wall height
            var wallH = Math.floor(SCREEN_H / perpDist);
            var drawStart = Math.floor((SCREEN_H - wallH) / 2);
            var drawEnd = drawStart + wallH;

            // Wall color with distance shading
            var wc = WALL_COLORS[wallType] || WALL_COLORS[1];
            var shade = Math.max(0.15, 1 - perpDist / MAX_DEPTH);
            // Side shading (N/S darker)
            if (side === 1) shade *= 0.7;

            var r = Math.floor(wc.r * shade);
            var g = Math.floor(wc.g * shade);
            var b = Math.floor(wc.b * shade);

            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(col, Math.max(0, drawStart), 1, Math.min(SCREEN_H, drawEnd) - Math.max(0, drawStart));
        }
    }

    // ======================== SPRITES ========================
    function drawSprites() {
        // Collect visible sprites with distance
        var sprites = [];
        entities.forEach(function (e) {
            if (!e.alive) return;
            var dx = e.x - player.x, dy = e.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.3 || dist > MAX_DEPTH) return;
            sprites.push({ e: e, dist: dist, dx: dx, dy: dy });
        });

        // Sort far to near
        sprites.sort(function (a, b) { return b.dist - a.dist; });

        sprites.forEach(function (s) {
            var e = s.e, dx = s.dx, dy = s.dy, dist = s.dist;

            // Angle relative to player
            var spriteAngle = Math.atan2(dy, dx) - player.angle;
            // Normalize to -PI..PI
            while (spriteAngle > Math.PI) spriteAngle -= 2 * Math.PI;
            while (spriteAngle < -Math.PI) spriteAngle += 2 * Math.PI;

            // Check if in FOV (with some margin)
            if (Math.abs(spriteAngle) > HALF_FOV + 0.2) return;

            // Screen position
            var screenX = Math.floor(SCREEN_W / 2 * (1 + spriteAngle / HALF_FOV));
            var spriteH = Math.floor(SCREEN_H / dist);
            var spriteW = spriteH * 0.6;
            var drawStartY = Math.floor((SCREEN_H - spriteH) / 2);

            // Determine sprite color and shape
            var color, isEnemy = !e.pickupType;
            if (isEnemy) {
                color = e.state === 'CHASE' || e.state === 'ALERT' ? e.alertColor : e.color;
            } else {
                color = e.color;
            }

            // Draw sprite column by column (respecting depth buffer)
            var startX = Math.floor(screenX - spriteW / 2);
            var endX = Math.floor(screenX + spriteW / 2);

            for (var col = startX; col < endX; col++) {
                if (col < 0 || col >= SCREEN_W) continue;
                if (dist >= depthBuf[col]) continue; // behind wall

                var tx = (col - startX) / spriteW; // 0..1 across sprite

                if (isEnemy) {
                    // Draw humanoid shape
                    drawEnemyColumn(col, drawStartY, spriteH, tx, color, e);
                } else {
                    // Draw pickup as diamond/circle
                    drawPickupColumn(col, drawStartY, spriteH, tx, color, e);
                }
            }
        });
    }

    function drawEnemyColumn(col, startY, height, tx, color, enemy) {
        // Simple humanoid: head (top 20%), body (middle 50%), legs (bottom 30%)
        var headEnd = startY + height * 0.2;
        var bodyEnd = startY + height * 0.7;
        var legEnd = startY + height;

        // Only draw within a rough silhouette
        var centerDist = Math.abs(tx - 0.5) * 2; // 0 at center, 1 at edges

        // Head (narrower)
        if (centerDist < 0.5) {
            ctx.fillStyle = '#fda'; // skin tone
            ctx.fillRect(col, Math.max(0, startY), 1, Math.max(0, headEnd - startY));
        }

        // Body
        if (centerDist < 0.8) {
            ctx.fillStyle = color;
            ctx.fillRect(col, Math.max(0, headEnd), 1, Math.max(0, bodyEnd - headEnd));
        }

        // Legs (two separate)
        if ((tx < 0.4 && tx > 0.15) || (tx > 0.6 && tx < 0.85)) {
            ctx.fillStyle = '#555';
            ctx.fillRect(col, Math.max(0, bodyEnd), 1, Math.max(0, legEnd - bodyEnd));
        }
    }

    function drawPickupColumn(col, startY, height, tx, color, entity) {
        var centerDist = Math.abs(tx - 0.5) * 2;
        // Diamond shape
        var top = startY + height * 0.3;
        var bot = startY + height * 0.7;
        var mid = (top + bot) / 2;
        var halfH = (bot - top) / 2;

        // Only draw if within diamond
        var maxWidth = 1 - centerDist;
        if (maxWidth > 0) {
            var drawTop = mid - halfH * maxWidth;
            var drawBot = mid + halfH * maxWidth;
            // Glow effect
            ctx.fillStyle = color;
            ctx.fillRect(col, Math.max(0, drawTop), 1, Math.max(0, drawBot - drawTop));
        }
    }

    // ======================== PROJECTILE RENDERING ========================
    function drawProjectiles() {
        projectiles.forEach(function (p) {
            var dx = p.x - player.x, dy = p.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.2 || dist > MAX_DEPTH) return;

            var spriteAngle = Math.atan2(dy, dx) - player.angle;
            while (spriteAngle > Math.PI) spriteAngle -= 2 * Math.PI;
            while (spriteAngle < -Math.PI) spriteAngle += 2 * Math.PI;
            if (Math.abs(spriteAngle) > HALF_FOV + 0.1) return;

            var screenX = Math.floor(SCREEN_W / 2 * (1 + spriteAngle / HALF_FOV));
            var size = Math.floor(SCREEN_H / dist * 0.15);
            if (size < 2) size = 2;
            var screenY = Math.floor(SCREEN_H / 2);

            // Check depth buffer at center column
            if (screenX >= 0 && screenX < SCREEN_W && dist < depthBuf[screenX]) {
                // Glowing orb
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.fill();
                // Glow
                ctx.fillStyle = 'rgba(255,255,200,0.4)';
                ctx.beginPath();
                ctx.arc(screenX, screenY, size * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Draw grenades
        grenades.forEach(function (g) {
            var dx = g.x - player.x, dy = g.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.2 || dist > MAX_DEPTH) return;
            var spriteAngle = Math.atan2(dy, dx) - player.angle;
            while (spriteAngle > Math.PI) spriteAngle -= 2 * Math.PI;
            while (spriteAngle < -Math.PI) spriteAngle += 2 * Math.PI;
            if (Math.abs(spriteAngle) > HALF_FOV + 0.1) return;
            var screenX = Math.floor(SCREEN_W / 2 * (1 + spriteAngle / HALF_FOV));
            var scale = SCREEN_H / dist;
            var size = Math.max(2, Math.floor(scale * 0.08));
            // g.z controls vertical position: 0=ground, higher=up
            var screenY = Math.floor(SCREEN_H / 2 + scale * 0.5 - g.z * scale);
            if (screenX >= 0 && screenX < SCREEN_W && dist < depthBuf[screenX]) {
                // Grenade body
                ctx.fillStyle = '#4a4';
                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.fill();
                // Blinking fuse
                if (Math.floor(g.life * 6) % 2 === 0) {
                    ctx.fillStyle = '#f80';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY - size, size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
                // Shadow on ground
                var groundY = Math.floor(SCREEN_H / 2 + scale * 0.5);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(screenX, groundY, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    // ======================== WEAPON ========================
    function drawWeapon() {
        var wp = WEAPONS[currentWeapon];
        var bobX = 0, bobY = 0;

        // Walking bob
        if (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) {
            bobX = Math.sin(gameTime * 8) * 5;
            bobY = Math.abs(Math.cos(gameTime * 8)) * 8;
        }

        // Fire recoil
        var recoilY = weaponAnim * 20;

        var cx = SCREEN_W / 2 + bobX;
        var cy = SCREEN_H - 80 + bobY - recoilY;

        ctx.save();

        if (currentWeapon === 'knife') {
            // Knife — blade + handle, slash animation
            var slashAngle = weaponAnim * 0.8;
            ctx.save();
            ctx.translate(cx, cy + 20);
            ctx.rotate(-0.3 + slashAngle);
            // Handle
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(-5, 0, 10, 30);
            // Guard
            ctx.fillStyle = '#888';
            ctx.fillRect(-10, -2, 20, 5);
            // Blade
            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(-4, -2);
            ctx.lineTo(0, -50);
            ctx.lineTo(4, -2);
            ctx.fill();
            // Edge highlight
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(1, -45);
            ctx.lineTo(2, -2);
            ctx.fill();
            ctx.restore();
        } else if (currentWeapon === 'pistol') {
            // Simple pistol shape
            ctx.fillStyle = '#888';
            ctx.fillRect(cx - 6, cy, 12, 50);   // barrel
            ctx.fillStyle = '#666';
            ctx.fillRect(cx - 10, cy + 30, 20, 30); // grip
            ctx.fillStyle = '#555';
            ctx.fillRect(cx - 4, cy - 5, 8, 10);    // sight
        } else if (currentWeapon === 'shotgun') {
            // Double barrel shotgun
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(cx - 8, cy + 30, 16, 40); // stock
            ctx.fillStyle = '#777';
            ctx.fillRect(cx - 10, cy - 10, 8, 45); // barrel 1
            ctx.fillRect(cx + 2, cy - 10, 8, 45);  // barrel 2
            ctx.fillStyle = '#555';
            ctx.fillRect(cx - 12, cy + 20, 24, 8); // pump
        } else if (currentWeapon === 'machinegun') {
            // Machine gun
            ctx.fillStyle = '#555';
            ctx.fillRect(cx - 5, cy - 15, 10, 60); // long barrel
            ctx.fillStyle = '#666';
            ctx.fillRect(cx - 12, cy + 25, 24, 25); // body
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(cx - 8, cy + 40, 16, 25);  // grip
            ctx.fillStyle = '#444';
            ctx.fillRect(cx + 8, cy + 10, 6, 20);   // magazine
        } else if (currentWeapon === 'sniper') {
            // Sniper rifle — long barrel, scope, stock
            ctx.fillStyle = '#4a4a5a';
            ctx.fillRect(cx - 4, cy - 30, 8, 75);   // long barrel
            ctx.fillStyle = '#3a3a48';
            ctx.fillRect(cx - 8, cy + 25, 16, 12);   // receiver
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(cx - 6, cy + 37, 12, 30);   // stock
            ctx.fillRect(cx + 5, cy + 42, 8, 22);    // cheek rest
            // Scope
            ctx.fillStyle = '#222';
            ctx.fillRect(cx - 3, cy - 10, 6, 18);    // scope mount
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx, cy - 15, 6, 0, Math.PI * 2); // scope front lens
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy + 5, 5, 0, Math.PI * 2);  // scope rear lens
            ctx.fill();
            ctx.fillStyle = '#2a2a38';
            ctx.fillRect(cx - 2, cy - 15, 4, 20);    // scope tube
            // Bipod legs
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 3, cy + 20); ctx.lineTo(cx - 14, cy + 50);
            ctx.moveTo(cx + 3, cy + 20); ctx.lineTo(cx + 14, cy + 50);
            ctx.stroke();
            // Bolt handle
            ctx.fillStyle = '#666';
            ctx.fillRect(cx + 6, cy + 15, 10, 4);
        } else if (currentWeapon === 'm4a1') {
            // M4A1 assault rifle — barrel, handguard, stock, magazine
            ctx.fillStyle = '#555';
            ctx.fillRect(cx - 4, cy - 20, 8, 65);    // barrel + handguard
            // Handguard rails
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(cx - 7, cy - 10, 3, 30);
            ctx.fillRect(cx + 4, cy - 10, 3, 30);
            // Upper receiver
            ctx.fillStyle = '#606060';
            ctx.fillRect(cx - 9, cy + 20, 18, 15);
            // Carry handle / sight
            ctx.fillStyle = '#444';
            ctx.fillRect(cx - 3, cy - 8, 6, 5);
            ctx.fillRect(cx - 2, cy - 13, 4, 5);     // front sight post
            // Magazine (curved)
            ctx.fillStyle = '#3a3a3a';
            ctx.save();
            ctx.translate(cx + 2, cy + 35);
            ctx.rotate(0.1);
            ctx.fillRect(-5, 0, 10, 22);
            ctx.restore();
            // Stock (collapsible)
            ctx.fillStyle = '#666';
            ctx.fillRect(cx - 5, cy + 35, 10, 8);
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(cx - 6, cy + 43, 12, 22);
            // Buffer tube
            ctx.fillStyle = '#555';
            ctx.fillRect(cx - 3, cy + 33, 6, 12);
            // Trigger guard
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy + 38, 6, 0, Math.PI);
            ctx.stroke();
        }

        // Muzzle flash (not for knife)
        if (weaponAnim > 0.6 && currentWeapon !== 'knife') {
            var flashSize = weaponAnim * 30;
            ctx.fillStyle = 'rgba(255,200,50,' + weaponAnim + ')';
            ctx.beginPath();
            ctx.arc(cx, cy - 10, flashSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,200,' + weaponAnim * 0.5 + ')';
            ctx.beginPath();
            ctx.arc(cx, cy - 10, flashSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // ======================== FLOATING DAMAGE NUMBERS ========================
    function drawFloatingTexts() {
        for (var i = 0; i < floatingTexts.length; i++) {
            var ft = floatingTexts[i];
            // Project world position to screen
            var dx = ft.x - player.x, dy = ft.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.1) continue;
            var angle = Math.atan2(dy, dx) - player.angle;
            // Normalize angle
            while (angle < -Math.PI) angle += Math.PI * 2;
            while (angle > Math.PI) angle -= Math.PI * 2;
            if (Math.abs(angle) > HALF_FOV + 0.1) continue;

            var screenX = Math.floor((1 + angle / HALF_FOV) * SCREEN_W / 2);
            var scale = SCREEN_H / dist;
            // ft.z is the height offset (floats upward from 0.5)
            var screenY = Math.floor(SCREEN_H / 2 - ft.z * scale + scale * 0.3);

            var alpha = Math.min(1, ft.life * 2); // fade out in last 0.5s
            var fontSize = Math.max(12, Math.min(32, Math.floor(scale * 0.25)));
            ctx.font = 'bold ' + fontSize + 'px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = ft.color.replace(')', ',' + alpha + ')').replace('rgb', 'rgba');
            // Simple color with alpha
            ctx.globalAlpha = alpha;
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, screenX, screenY);
            ctx.globalAlpha = 1;
        }
    }

    // ======================== HUD ========================
    function drawHUD() {
        ctx.save();

        // Crosshair
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        var cx = SCREEN_W / 2, cy = SCREEN_H / 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 4, cy);
        ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy - 4);
        ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 10);
        ctx.stroke();

        // Health bar (bottom left)
        var barX = 20, barY = SCREEN_H - 40, barW = 150, barH = 20;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
        var hpPct = Math.max(0, player.hp / 100);
        var hpColor = hpPct > 0.5 ? '#4c4' : hpPct > 0.25 ? '#cc4' : '#c44';
        ctx.fillStyle = hpColor;
        ctx.fillRect(barX, barY, barW * hpPct, barH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('HP: ' + Math.ceil(player.hp), barX + 4, barY + 15);

        // Ammo (bottom right)
        var ammoStr = weaponAmmo[currentWeapon] === Infinity ? 'INF' : weaponAmmo[currentWeapon];
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(WEAPONS[currentWeapon].name, SCREEN_W - 20, SCREEN_H - 50);
        ctx.font = 'bold 22px monospace';
        ctx.fillText(ammoStr, SCREEN_W - 20, SCREEN_H - 25);

        // Kill count (top left)
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('KILLS: ' + kills + '/' + totalEnemies, 20, 30);

        // Time (top center)
        ctx.textAlign = 'center';
        ctx.fillText(formatTime(gameTime), SCREEN_W / 2, 30);

        // Score
        ctx.textAlign = 'right';
        ctx.fillText('SCORE: ' + (levelScore + calcScore()), SCREEN_W - 20, 30);

        // Level indicator (top left, below kills)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#aaa';
        ctx.fillText('LEVEL ' + (currentLevel + 1), 20, 50);

        // Coins (top left, below level)
        if (coins > 0) {
            ctx.fillStyle = '#fc0';
            ctx.fillText('COINS: ' + coins, 20, 70);
        }

        // Grenade count (above ammo, bottom right)
        if (grenadeCount > 0) {
            ctx.textAlign = 'right';
            ctx.fillStyle = '#4a4';
            ctx.font = 'bold 12px monospace';
            ctx.fillText('GRENADES: ' + grenadeCount, SCREEN_W - 20, SCREEN_H - 70);
        }

        ctx.restore();
    }

    // ======================== MINIMAP ========================
    function drawMinimap() {
        var mw = miniCanvas.width, mh = miniCanvas.height;
        var scale = mw / 12; // Show ~12 tiles around player
        var ox = player.x - 6, oy = player.y - 6;

        miniCtx.fillStyle = 'rgba(0,0,0,0.7)';
        miniCtx.fillRect(0, 0, mw, mh);

        // Draw walls
        for (var y = 0; y < MAP_H; y++) {
            for (var x = 0; x < MAP_W; x++) {
                if (MAP[y][x] === 0) continue;
                var sx = (x - ox) * scale, sy = (y - oy) * scale;
                if (sx < -scale || sy < -scale || sx > mw || sy > mh) continue;
                var wc = WALL_COLORS[MAP[y][x]] || WALL_COLORS[1];
                miniCtx.fillStyle = 'rgb(' + wc.r + ',' + wc.g + ',' + wc.b + ')';
                miniCtx.fillRect(sx, sy, scale, scale);
            }
        }

        // Draw entities
        entities.forEach(function (e) {
            if (!e.alive) return;
            var sx = (e.x - ox) * scale, sy = (e.y - oy) * scale;
            if (sx < 0 || sy < 0 || sx > mw || sy > mh) return;
            miniCtx.fillStyle = e.pickupType ? '#ff0' : (e.state === 'CHASE' ? '#f00' : '#f88');
            miniCtx.beginPath();
            miniCtx.arc(sx, sy, e.pickupType ? 2 : 3, 0, Math.PI * 2);
            miniCtx.fill();
        });

        // Draw player
        var px = (player.x - ox) * scale, py = (player.y - oy) * scale;
        miniCtx.fillStyle = '#0f0';
        miniCtx.beginPath();
        miniCtx.arc(px, py, 4, 0, Math.PI * 2);
        miniCtx.fill();

        // Player direction
        miniCtx.strokeStyle = '#0f0';
        miniCtx.lineWidth = 2;
        miniCtx.beginPath();
        miniCtx.moveTo(px, py);
        miniCtx.lineTo(px + Math.cos(player.angle) * 15, py + Math.sin(player.angle) * 15);
        miniCtx.stroke();

        // Draw minimap on main canvas
        ctx.drawImage(miniCanvas, SCREEN_W - mw - 10, 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.strokeRect(SCREEN_W - mw - 10, 10, mw, mh);
    }

    // ======================== LEADERBOARD & AJAX ========================
    function ajax(action, data, cb) {
        var url = window.DOOM_AJAX || (window.HOME ? window.HOME + '/wp-admin/admin-ajax.php' : '/wp-admin/admin-ajax.php');
        var fd = new FormData();
        fd.append('action', action);
        for (var k in data) fd.append(k, data[k]);
        fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (res) { if (cb) cb(res); })
            .catch(function () {});
    }

    function submitScore() {
        var score = levelScore + calcScore();
        var duration = Math.floor(gameTime);
        var salt = window.DOOM_DAY_SALT || '';
        var token = md5(score + '_' + duration + '_' + salt);
        ajax('doom_submit', { name: playerName, score: score, kills: kills, duration: duration, token: token }, function (res) {
            if (res.success && res.data) {
                var rankEl = document.getElementById('doom-rank');
                var rankEl2 = document.getElementById('doom-rank2');
                if (rankEl) rankEl.textContent = '#' + res.data.rank;
                if (rankEl2) rankEl2.textContent = '#' + res.data.rank;
            }
            loadLeaderboard();
        });
    }

    function loadLeaderboard() {
        ajax('doom_leaderboard', { type: leaderboardType }, function (res) {
            if (!res.success) return;
            leaderboardData = res.data || [];
            renderLeaderboard();
        });
    }

    function renderLeaderboard() {
        var list = document.getElementById('doom-lb-list');
        if (!list) return;
        if (leaderboardData.length === 0) {
            list.innerHTML = '<div class="doom-lb-empty">No scores yet. Be the first!</div>';
            return;
        }
        var medals = ['&#129351;', '&#129352;', '&#129353;']; // gold, silver, bronze
        var html = '';
        leaderboardData.forEach(function (row, i) {
            var isMine = row.player_name === playerName;
            var medal = i < 3 ? medals[i] : '<span class="doom-lb-num">' + (i + 1) + '</span>';
            var m = Math.floor(row.duration / 60), s = row.duration % 60;
            var timeStr = m + ':' + (s < 10 ? '0' : '') + s;
            html += '<div class="doom-lb-row' + (isMine ? ' doom-lb-mine' : '') + (i < 3 ? ' doom-lb-medal-' + (i + 1) : '') + '">'
                + '<span class="doom-lb-rank">' + medal + '</span>'
                + '<span class="doom-lb-name">' + escHtml(row.player_name) + '</span>'
                + '<span class="doom-lb-score">' + row.score + '</span>'
                + '<span class="doom-lb-kills">' + row.kills + 'K</span>'
                + '<span class="doom-lb-time">' + timeStr + '</span>'
                + '</div>';
        });
        list.innerHTML = html;
    }

    function escHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // ======================== BOOT ========================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
