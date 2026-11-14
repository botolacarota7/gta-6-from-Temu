// Smoke test 3D: logica di gioco senza THREE (city, entità, sistemi, phone, dialoghi, AI)
const fs = require('fs');
const vm = require('vm');

let failures = 0;
function check(name, cond) {
  if (cond) console.log('PASS ' + name);
  else { console.log('FAIL ' + name); failures++; }
}

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
    toDataURL() { return 'data:image/jpeg;base64,TEST'; },
    onclick: null,
    setAttribute() {},
    closest() { return null; },
    dataset: {},
    focus() {},
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._html || ''; },
    set(v) { el._html = v; el.children = []; },
    configurable: true,
  });
  return el;
}

const elements = {};
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
  addEventListener() {},
  removeEventListener() {},
  AudioContext: null,
  webkitAudioContext: null,
};

const sandbox = {
  console,
  document: documentStub,
  window: windowStub,
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
  setInterval: () => 0,
  setTimeout: (fn) => { sandbox._timers.push(fn); return sandbox._timers.length; },
  clearTimeout: () => {},
  AbortController: class { constructor() { this.signal = {}; } abort() {} },
  fetch: async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: 'Notizia fresca dalla redazione Temu!' } }] }),
  }),
  localStorage: { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } },
  Math, JSON, Date, Set, String, Number, Array, Object, Infinity, isNaN, parseInt, parseFloat,
  Uint8ClampedArray,
};
sandbox._timers = [];
sandbox.window.document = documentStub;
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
const files = [
  'js/config.js', 'js/utils.js', 'js/input.js',
  'js/dialogue.js', 'js/memories.js', 'js/phone.js', 'js/ai.js',
  'js3d/city.js', 'js3d/entities3d.js', 'js3d/systems3d.js', 'js3d/ui3d.js', 'js3d/main3d.js',
];
for (const f of files) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });
}

function flushTimers(maxLoops = 20) {
  for (let i = 0; i < maxLoops && sandbox._timers.length; i++) {
    const t = sandbox._timers.splice(0);
    for (const fn of t) fn();
  }
}

const run = (code) => vm.runInContext(code, sandbox);

// ===== 1. Città =====
run('City3.generate()');
check('city: size corretta', run('City3.size') === 8 * 80 + 18);
check('city: 7 edifici speciali', run('City3.specials.length') === 7);
check('city: porte speciali con y', run('City3.doors.filter(d => d.y > 0 && d.label).length') === 7);
check('city: abbastanza edifici', run('City3.buildings.length') > 60);
check('city: laneCoords', run('City3.laneCoords.length') === 9);
check('city: lampioni e alberi', run('City3.lamps.length') > 50 && run('City3.trees.length') > 20);
check('city: isOnRoad', run('City3.isOnRoad(5, 300)') === true && run('City3.isOnRoad(300, 300)') === false);
check('city: buildingAt trova un edificio', !!run('City3.buildingAt(City3.buildings[0].x + 1, City3.buildings[0].z + 1)'));
check('city: randomSidewalkPoint fuori dagli edifici', (() => {
  for (let i = 0; i < 30; i++) {
    const p = run('City3.randomSidewalkPoint()');
    if (run(`City3.buildingAt(${p.x}, ${p.z}, 1)`)) return false;
  }
  return true;
})());
check('city: World.doors alias', run('World.doors') === run('City3.doors'));

// ===== 2. Alias y/z e giocatore =====
run('Game.player = new Player3({name:"T", skin:"#fff", shirt:"#f00", pants:"#00f", hair:"#000", hat:"none"})');
check('player: alias y===z', run('Game.player.y') === run('Game.player.z'));
run('Game.player.y = 42');
check('player: set y aggiorna z', run('Game.player.z') === 42);
check('player: stato iniziale', run('Game.player.money') === 500 && run('Game.player.health') === 100);

// ===== 3. Pedoni =====
run('const p = new Person3(100, 100, {name: "Rosetta"}); Entities.peds.push(p)');
check('ped: alias y', run('p.y') === 100);
run('p.update(0.5, Game.player)');
check('ped: cammina (si muove)', Math.abs(run('p.x') - 100) + Math.abs(run('p.z') - 100) > 0.01);
run('p.scare({x: 100, y: 100}, 5)');
check('ped: scappa quando spaventato', run('p.state') === 'flee');
run('p.hit(999, Game.player, true)');
check('ped: muore e lascia cadere soldi', run('p.state') === 'dead' && run('Entities.pickups.length') >= 1 && run('Entities.corpses.length') >= 1);
check('ped: Systems.onPedKilled ha aumento il ricercato', run('Game.player.wanted') >= 1);

// ===== 4. Poliziotti =====
run('Game.player.wanted = 3; Systems.spawnCop(Game.player)');
check('cop: spawn', run('Entities.cops.length') === 1);
run('Game.player.x = Entities.cops[0].x + 20; Game.player.z = Entities.cops[0].z; Entities.cops[0].shootT = 0; Entities.cops[0].update(0.1, Game.player)');
check('cop: insegue e spara (tracciante)', run('Entities.bullets.length') >= 1);
run('const hpBefore = Game.player.health; Game.player.damage(10, null)');
check('player: damage riduce la salute', run('Game.player.health') === run('hpBefore') - 10);

// ===== 5. Auto =====
run('Entities.cars.length = 0');
run('const car = new Car3(100, 100, 0, {...SHOP_CARS[2]}, "player"); Entities.cars.push(car); Game.player.inCar = car');
run('Input.keys.add("w"); car.update(1, Game.player); Input.keys.delete("w")');
check('car: accelera', run('car.speed') > 0 && run('car.x') > 100);
check('car: alias y', run('car.y') === run('car.z'));
run('car.update(2, Game.player)');
check('car: continua a muoversi', run('car.x') > 101);
run('car.damage(999)');
check('car: esplode', run('car.state') === 'wreck' && run('Game.player.inCar') === null);
check('car: esplosione ha dato wanted', run('Game.player.wanted') >= 1);

// ===== 6. Traffico =====
run('const tc = new Car3(80 + 9, 80 + 9, 0, {color:"#888", maxSpeed:250, accel:160, w:44, h:20, name:"Auto"}, "traffic"); Entities.cars.push(tc); tc.initTraffic()');
check('traffic: init imposta un target', isFinite(run('tc.tx')) && isFinite(run('tc.tz')));
run('tc.update(0.5, Game.player)');
check('traffic: si muove verso il target', run('tc.speed') > 0.1);

// ===== 7. Lavori e negozi =====
run('Game.player.money = 10000; Game.player.wanted = 0; Entities.cops.length = 0');
run('Systems.startPizzaJob()');
check('job pizza: attivo con obiettivo', run('Systems.activeJob && Systems.activeJob.type') === 'pizza');
check('job pizza: obiettivo con x/y', run('Systems.activeJob.objective.x') > 0 && run('Systems.activeJob.objective.y') > 0);
run('Game.player.x = Systems.activeJob.objective.x; Game.player.y = Systems.activeJob.objective.y');
run('Systems.completeJobStage()');
check('job pizza: completato e pagato', run('Systems.activeJob') === null && run('Game.player.money') > 10000);

run('Systems.openGunShop()');
const gunBtn = run('(document.getElementById("dialog-buttons").children[0])');
run('Game.player.money = 10000');
if (gunBtn && gunBtn.onclick) { gunBtn.onclick(); }
check('gunshop: mazza comprata', run('Game.player.weapons.bat') === true && run('Game.player.money') < 10000);
run('UI.closeDialog()');

run('Systems.openDealer()');
const carBtn = run('(document.getElementById("dialog-buttons").children[0])');
run('Game.player.money = 10000; Game.player.ownedCars = []');
if (carBtn && carBtn.onclick) { carBtn.onclick(); }
check('dealer: auto comprata e spawnata', run('Game.player.ownedCars.length') === 1);
check('dealer: auto ha coordinate valide', isFinite(run('Game.player.ownedCars[0].x')) && isFinite(run('Game.player.ownedCars[0].y')));

// ===== 8. Conversazioni con memoria =====
run('const npcd = Entities.peds.find(p => !p.isAntonio && p.state !== "dead") || new Person3(120, 120, {}); if (!Entities.peds.includes(npcd)) Entities.peds.push(npcd); Game.player.x = npcd.x + 1; Game.player.z = npcd.z; window.__npc = npcd');
run('Systems.talkToNearestPed()');
check('conv: conversazione aperta', run('UI._conv !== null && UI._conv !== undefined') && run('UI.dialogOpen') === true);
check('conv: memoria creata', run('!!UI._conv.mem') === true);
(async () => {
  await run('UI.convRespond("Ciao, come va?", null)');
  check('conv: risposta registrata', run('UI._conv.history.filter(h => h.who === "Tu").length') >= 1);
  check('conv: il NPC ha risposto', run('UI._conv.history.filter(h => h.who === window.__npc.name).length') >= 1);
  run('UI.closeDialog()');

  // ===== 9. Telefono =====
  run('Phone.toggle()');
  check('phone: si apre', run('Phone.open') === true);
  run('Phone.toggle()');
  check('phone: si chiude', run('Phone.open') === false);
  run('Phone.open = true; Phone.render()');
  check('phone: render scrive sullo schermo', run('document.getElementById("phone-screen").innerHTML.length') > 10);
  run('Phone.open = false; Phone.calling = null');

  run('Phone.calling = {contact: Phone.contacts.find(c => c.id === "gino"), stage: "live"}; Phone.callOutcome({id: "gino"})');
  flushTimers();
  check('phone: chiamata a Gino avvia il lavoro pizza', run('Systems.activeJob && Systems.activeJob.type') === 'pizza');
  run('Systems.activeJob = null');

  run('Game.canvas = document.getElementById("game"); Phone.calling = null; Phone.snap()');
  check('phone: foto scattata', run('!!Phone.photo && Phone.photo.img.indexOf("data:image") === 0') === true);

  // ===== 10. AI news =====
  run('AIChat.settings.enabled = true; AIChat.settings.provider = "custom"; AIChat.settings.apiKey = "k"; AIChat.settings.model = "test"; AIChat.settings.baseUrl = "https://example.test/v1/chat/completions"; AIChat.save()');
  check('ai: configurata', run('AIChat.configured()') === true);
  run('Phone.genNews(true)');
  await new Promise((r) => setTimeout(r, 50));
  flushTimers();
  check('ai: articoli generati', run('(Phone.aiNews && Phone.aiNews.items && Phone.aiNews.items.length) || 0') > 0);

  // ===== 11. Salvataggio =====
  run('Game.player.x = 200; Game.player.z = 210; Systems.save()');
  check('save: dati scritti', !!run('Systems.loadSave()'));
  check('save: y salvata = z', run('Systems.loadSave().y') === 210);

  // ===== 12. Loop di sistema =====
  run('Game.state = "play"; Game.player.dead = false; Game.player.wanted = 0; Entities.cops.length = 0');
  run('Input.init(document.getElementById("game"))');
  let threw = null;
  try {
    run('for (let i = 0; i < 120; i++) { Systems.update(0.05); updatePlayer(0.05); }');
  } catch (e) { threw = e; }
  check('systems: 120 tick senza errori', threw === null);
  if (threw) console.log('   errore: ' + threw.message);
  check('systems: popolazione generata', run('Entities.peds.length') > 5 && run('Entities.cars.length') > 3);
  check('systems: tempo avanza', run('Game.timeMin') > 8 * 60);

  console.log(failures === 0 ? '\nTUTTI I TEST PASSANO' : '\n' + failures + ' TEST FALLITI');
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('ERRORE ASYNC: ' + e.stack); process.exit(1); });
