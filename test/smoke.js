// Harness di smoke test: simula DOM/canvas e fa girare il gioco per qualche centinaio di frame.
const fs = require('fs');
const vm = require('vm');

function makeCtx() {
  const gradient = { addColorStop: () => {} };
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'measureText') return () => ({ width: 50 });
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient;
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (typeof prop === 'string') return (...args) => undefined;
      return undefined;
    },
    set() { return true; },
  });
}

function makeElement(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    style: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      toggle(c, force) { if (force === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); } else if (force) this._set.add(c); else this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    },
    children: [],
    listeners: {},
    innerHTML: '',
    textContent: '',
    value: 'none',
    width: tag === 'canvas' ? 1280 : 170,
    height: tag === 'canvas' ? 720 : 170,
    appendChild(child) { this.children.push(child); return child; },
    remove() {},
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    getContext() { return makeCtx(); },
    onclick: null,
    setAttribute() {},
  };
  if (tag === 'canvas') {
    // minimap base canvas creato in world.js: drawImage con canvas
  }
  return el;
}

const elements = {};
const knownIds = [
  'game', 'minimap', 'hud', 'hud-money', 'hud-wanted', 'hud-health', 'hud-armor',
  'hud-health-wrap', 'hud-armor-wrap', 'hud-weapon', 'hud-objective', 'hud-timer',
  'toasts', 'hud-hint', 'hud-clock', 'screen-menu', 'screen-custom', 'screen-pause',
  'screen-help', 'dialog', 'dialog-panel', 'dialog-title', 'dialog-body', 'dialog-buttons',
  'fade', 'btn-new', 'btn-continue', 'btn-help', 'btn-help2', 'btn-help-close',
  'btn-resume', 'btn-save', 'btn-quit', 'btn-start', 'custom-name', 'custom-hat', 'custom-car',
  'sw-skin', 'sw-shirt', 'sw-pants', 'sw-hair', 'preview', 'cookbar', 'cookzone', 'cookmark', 'cookscore',
];

const documentStub = {
  getElementById(id) {
    if (!elements[id]) {
      const tag = (id === 'game' || id === 'minimap' || id === 'preview') ? 'canvas' : 'div';
      elements[id] = makeElement(tag);
      if (id === 'custom-name') elements[id].value = 'Test';
      if (id === 'custom-car') elements[id].value = 'none';
      if (id === 'custom-hat') elements[id].value = 'none';
    }
    return elements[id];
  },
  createElement(tag) { return makeElement(tag); },
  addEventListener() {},
  removeEventListener() {},
};

const windowStub = {
  addEventListener(type, fn) {
    if (type === 'keydown') windowStub._keydown = fn;
    if (type === 'keyup') windowStub._keyup = fn;
  },
  removeEventListener() {},
  AudioContext: null,
  webkitAudioContext: null,
};

let rafQueue = [];
const sandbox = {
  console,
  document: documentStub,
  window: windowStub,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (fn) => { rafQueue.push(fn); return rafQueue.length; },
  cancelAnimationFrame: () => {},
  setInterval: () => 0,
  setTimeout: (fn) => 0,
  localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } },
  Math, JSON, Date, Set, String, Number, Array, Object, Infinity, isNaN, parseInt, parseFloat,
  Uint8ClampedArray,
};
sandbox.window.document = documentStub;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
const files = ['js/config.js', 'js/utils.js', 'js/input.js', 'js/world.js', 'js/entities.js', 'js/dialogue.js', 'js/systems.js', 'js/main.js'];
for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}

function pumpFrames(n) {
  for (let i = 0; i < n; i++) {
    const q = rafQueue;
    rafQueue = [];
    const t = Date.now() + i * 16;
    for (const fn of q) fn(t);
  }
}

// avvio: boot() è già girato; simula click su Nuova Partita + start
vm.runInContext('this.__T = { Input, Game, Systems, Entities, World, UI, Dialogue, startGame };', sandbox);
const T = sandbox.__T;

T.Input.keys.add('w');
elements['btn-new'].onclick();
elements['btn-start'].onclick();
console.log('stato:', T.Game.state, 'player:', !!T.Game.player);

// 600 frame (~10s) con movimento e sparo
T.Input.mouse.down = true;
pumpFrames(600);
console.log('frame 1 ok — peds:', T.Entities.peds.length, 'cars:', T.Entities.cars.length, 'bullets:', T.Entities.bullets.length);

// entra in auto e guida
T.Input.mouse.down = false;
const car = T.Systems.nearestCar(100000);
if (car) T.Systems.enterCar(car);
T.Input.keys.add('d');
pumpFrames(300);
console.log('guida ok — player in car:', T.Game.player.inCar !== null, 'car state:', car && car.state);
T.Input.keys.delete('d');
T.Systems.exitCar();

// interazioni con porte
for (const d of T.World.doors) T.Systems.interactDoor(d);
T.UI.closeDialog();
console.log('porte ok — dialogOpen:', T.UI.dialogOpen);

// lavoro pizza
T.Systems.startPizzaJob();
pumpFrames(120);
T.Systems.completeJobStage();
console.log('pizza ok — money:', T.Game.player.money);

// minigioco chef (senza DOM reale: chiama start e stop)
T.UI.startChefMinigame();
if (T.UI._chefStop) T.UI._chefStop();
T.UI.closeDialog();
console.log('chef ok');

// missione gang
T.Systems.startGangMission('rivals');
pumpFrames(120);
console.log('gang ok — wanted:', T.Game.player.wanted);

// danno e morte
T.Game.player.damage(999, null);
pumpFrames(10);
console.log('morte ok — dead:', T.Game.player.dead);

// salvataggio
T.Systems.save();
const sv = T.Systems.loadSave();
console.log('save ok — money salvato:', sv && sv.money);

// fase combattimento: pistola, spari, polizia
const P = T.Game.player;
P.dead = false; P.health = 100; P.wanted = 0;
P.giveWeapon('pistol', 24);
T.Game.player.curWeapon = 'pistol';
T.Input.mouse.down = true;
pumpFrames(240);
console.log('spari ok — bullets:', T.Entities.bullets.length, 'colpi:', P.ammo.pistol, 'wanted:', P.wanted, 'cops:', T.Entities.cops.length);

// esplosione auto
const c2 = T.Entities.cars.find(c => c.state !== 'player');
if (c2) { c2.damage(999); }
pumpFrames(30);
console.log('esplosione ok — wreck:', c2 ? c2.state : 'n/a');

// fase conversazioni: Antonio + testi liberi + anti-ripetizione
const AN = T.Entities.peds.find(x => x.isAntonio);
console.log('antonio spawnato:', !!AN, AN && AN.name);
if (AN) {
  T.UI.startConversation(AN);
  console.log('conversazione aperta — dialogOpen:', T.UI.dialogOpen);
  const seen = [];
  const inputs = ['ciao come va?', 'hai soldi per me?', 'dove compro una pistola?', 'qualcosa su GTA 6 da temu', 'e adesso che ore sono?', 'parliamo di pizza napoletana', 'dove trovo lavoro onesto?', 'che tempo fa oggi?', 'conosci la polizia di qui?', 'addio amico mio'];
  for (const t of inputs) {
    if (!T.UI.dialogOpen) T.UI.startConversation(AN);
    if (AN.state === 'flee') { AN.state = 'walk'; AN.stateT = 0; }
    T.UI.convRespond(t, null);
    const last = T.UI._conv ? T.UI._conv.history[T.UI._conv.history.length - 1].text : '(chiusa)';
    seen.push(last);
  }
  const uniq = new Set(seen);
  console.log('risposte uniche:', uniq.size, '/', seen.length);
  T.UI.closeDialog();
}
// conversazione con pedone qualunque + minaccia (teletrasporto vicino a un pedone)
const ped = T.Entities.peds.find(x => !x.isAntonio && x.state === 'walk');
if (ped) {
  T.Game.player.x = ped.x + 30; T.Game.player.y = ped.y;
  T.UI.startConversation(ped);
  T.UI.convRespond('dammi i soldi o faccio un male', null);
  console.log('minaccia ok — dialogOpen:', T.UI.dialogOpen, 'pickup a terra:', T.Entities.pickups.length > 0);
  T.UI.closeDialog();
}
// indicazioni stradali -> marker verde
T.Dialogue.sideEffects(ped || AN, 'directions');
console.log('marker indicazioni:', !!T.Systems.tempObjective);

console.log('SMOKE TEST PASSATO');
