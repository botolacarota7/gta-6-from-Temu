// ===== Gioco principale 3D: loop, camera, spari, interazioni, avvio =====
const Game = {
  canvas: null,
  player: null,
  camYaw: 0, camPitch: 0.32, camDist: 5.6,
  elapsed: 0,
  timeMin: 8 * 60,
  state: 'menu',      // menu | custom | play
  paused: false,
  prevMouseDown: false,
  lastFrame: 0,
};

// alias per i moduli condivisi: World.doors resta la porta d'ingresso dei dati città
const World = {
  get doors() { return City3.doors; },
};

function nightAmount() {
  const h = Game.timeMin / 60;
  if (h < 5.5) return 0.55;
  if (h < 7) return 0.55 * (7 - h) / 1.5;
  if (h > 20.5) return 0.55;
  if (h > 19) return 0.55 * (h - 19) / 1.5;
  return 0;
}

// ---------- movimento giocatore ----------
function updatePlayer(dt) {
  const pl = Game.player;
  if (pl.inCar) { pl.syncWithCar(); return; }
  let mx = 0, mz = 0;
  const fx = Math.cos(Game.camYaw), fz = Math.sin(Game.camYaw);
  if (Input.down('w', 'arrowup')) { mx += fx; mz += fz; }
  if (Input.down('s', 'arrowdown')) { mx -= fx; mz -= fz; }
  if (Input.down('a', 'arrowleft')) { mx += fz; mz -= fx; }
  if (Input.down('d', 'arrowright')) { mx -= fz; mz += fx; }
  const l = Math.sqrt(mx * mx + mz * mz);
  const running = Input.down('shift');
  const spd = running ? 10.5 : 6;
  if (l > 0.01) {
    pl.x += (mx / l) * spd * dt;
    pl.z += (mz / l) * spd * dt;
    pl.walkPhase += dt * (running ? 13 : 9);
  }
  pl.angle = Game.camYaw;
  Systems.collidePoint(pl);
}

// ---------- camera terza persona ----------
function updateCamera(dt) {
  const pl = Game.player;
  if (!pl) return;
  // in auto la camera si allinea dolcemente dietro il veicolo (solo quando si muove)
  if (pl.inCar && Math.abs(pl.inCar.speed || 0) > 2) {
    const diff = normAngle(pl.inCar.angle - Game.camYaw);
    Game.camYaw = pl.inCar.angle - diff * Math.max(0, 1 - dt * 2.4);
  }
  const cp = Math.cos(Game.camPitch), sp = Math.sin(Game.camPitch);
  const fx = Math.cos(Game.camYaw), fz = Math.sin(Game.camYaw);
  let d = Game.camDist;
  for (; d > 1.2; d -= 0.4) {
    const cx = pl.x - fx * d * cp;
    const cz = pl.z - fz * d * cp;
    const cy = 1.6 + d * sp;
    const b = City3.buildingAt(cx, cz);
    if (!b || b.h < cy) break;
  }
  World3.camera.position.set(pl.x - fx * d * cp, 1.6 + d * sp, pl.z - fz * d * cp);
  World3.camera.lookAt(pl.x, 1.4, pl.z);
}

// ---------- spari ----------
function fireHitscan(shooter, angle, range, dmg) {
  let maxT = range;
  for (let t = 1; t < range; t += 2) {
    if (City3.buildingAt(shooter.x + Math.cos(angle) * t, shooter.z + Math.sin(angle) * t)) { maxT = t; break; }
  }
  let best = null, bestT = maxT;
  const test = (list, radius) => {
    for (const e of list) {
      if (e.state === 'dead') continue;
      const dx = e.x - shooter.x, dz = e.z - shooter.z;
      const t = dx * Math.cos(angle) + dz * Math.sin(angle);
      if (t < 0.5 || t > bestT) continue;
      const perp = Math.abs(dx * Math.sin(angle) - dz * Math.cos(angle));
      if (perp < radius) { best = e; bestT = t; }
    }
  };
  test(Entities.peds, 1.1);
  test(Entities.cops, 1.1);
  let hitCar = null;
  for (const c of Entities.cars) {
    if (c.state === 'wreck' || c === shooter.inCar) continue;
    const dx = c.x - shooter.x, dz = c.z - shooter.z;
    const t = dx * Math.cos(angle) + dz * Math.sin(angle);
    if (t < 0.5 || t > bestT) continue;
    const perp = Math.abs(dx * Math.sin(angle) - dz * Math.cos(angle));
    if (perp < 1.4) { hitCar = c; best = null; bestT = t; }
  }
  const ex = shooter.x + Math.cos(angle) * bestT;
  const ez = shooter.z + Math.sin(angle) * bestT;
  Entities.bullets.push({
    x1: shooter.x + Math.cos(angle) * 0.6, y1: 1.4, z1: shooter.z + Math.sin(angle) * 0.6,
    x2: ex, y2: 1.2, z2: ez, t: 0.08, vx: 0, vy: 0,
  });
  if (best) {
    best.hit(dmg, shooter, true);
    return true;
  }
  if (hitCar) {
    hitCar.damage(dmg * 0.6);
    spawnParticles3(ex, ez, '#ffd23f', 4, { power: 2, up: 2, size: 0.08, life: 0.3 });
  }
  return false;
}

function playerAttack() {
  const pl = Game.player;
  const w = WEAPONS[pl.curWeapon];
  if (Game.elapsed - pl.lastShot < w.rate / 1000) return;
  if (w.bullet && pl.ammo[pl.curWeapon] <= 0) {
    UI.toast('Senza munizioni! Comprane all\'Ammu-Nazione.', 'bad');
    return;
  }
  pl.lastShot = Game.elapsed;
  pl.angle = Game.camYaw;
  const range = w.range / 5;
  const pellets = w.pellets || 1;
  if (w.bullet) pl.ammo[pl.curWeapon]--;
  sfx(w.melee ? 'punch' : 'shot');
  let hitAny = false;
  for (let pi = 0; pi < pellets; pi++) {
    const spread = w.spread || 0.03;
    const ang = Game.camYaw + rand(-spread, spread);
    if (fireHitscan(pl, ang, range, w.dmg)) hitAny = true;
  }
  if (w.melee && hitAny) Systems.crime(1, 'aggressione');
  if (!w.melee) Systems.gunfire(pl.x, pl.z);
  UI.updateHUD();
}

// ---------- interazioni ----------
function updateInteractions() {
  const pl = Game.player;
  if (Input.hit('escape')) {
    if (Phone.open) { Phone.close(); return; }
    if (UI.dialogOpen) { UI.closeDialog(); return; }
    togglePause();
    return;
  }

  if (Input.hit('p') && !UI.dialogOpen && !pl.dead) {
    Phone.toggle();
    if (Phone.open && document.exitPointerLock) document.exitPointerLock();
  }
  if (UI.dialogOpen || Phone.open || pl.dead) return;

  if (Input.hit('f')) {
    if (pl.inCar) {
      Systems.exitCar();
    } else {
      const car = Systems.nearestCar(5);
      if (car) Systems.enterCar(car);
    }
  }

  if (Input.hit('e') && !pl.inCar) {
    const door = City3.nearestDoor(pl.x, pl.z, 4);
    if (door) { sfx('door'); Systems.interactDoor(door); }
  }

  if (Input.hit('t') && !pl.inCar) {
    Systems.talkToNearestPed();
  }

  for (let i = 0; i < WEAPON_ORDER.length; i++) {
    if (Input.hit(String(i + 1))) {
      const id = WEAPON_ORDER[i];
      if (pl.weapons[id]) { pl.curWeapon = id; UI.updateHUD(); }
      else UI.toast('Non possiedi: ' + WEAPONS[id].name, 'bad');
    }
  }
  if (Input.wheel !== 0) {
    const owned = WEAPON_ORDER.filter((id) => pl.weapons[id]);
    let idx = owned.indexOf(pl.curWeapon);
    idx = (idx + Input.wheel + owned.length) % owned.length;
    pl.curWeapon = owned[idx];
    UI.updateHUD();
  }

  const w = WEAPONS[pl.curWeapon];
  if (Input.mouse.down && !pl.inCar) {
    if (w.auto || !Game.prevMouseDown) playerAttack();
  }
  Game.prevMouseDown = Input.mouse.down;
}

function updateHint() {
  const pl = Game.player;
  const job = Systems.activeJob;
  if (job && job.objective && dist(pl.x, pl.y, job.objective.x, job.objective.y) < 11) return;
  if (pl.inCar) { UI.setHint('[F] Scendi · [Esc] Pausa'); return; }
  const door = City3.nearestDoor(pl.x, pl.z, 4);
  if (door) { UI.setHint('[E] Entra: ' + door.label); return; }
  const car = Systems.nearestCar(5);
  if (car) { UI.setHint('[F] Sali su: ' + car.label()); return; }
  const ped = Systems.nearestTalkablePed();
  if (ped) { UI.setHint('[T] Parla con ' + ped.name + ' · [P] Telefono'); return; }
  UI.setHint('[P] Telefono · Click per guardarti intorno');
}

// ---------- pausa ----------
function togglePause() {
  Game.paused = !Game.paused;
  document.getElementById('screen-pause').classList.toggle('hidden', !Game.paused);
  if (Game.paused && document.exitPointerLock) document.exitPointerLock();
}

// ---------- avvio partita ----------
function startGame(save) {
  document.getElementById('screen-menu').classList.add('hidden');
  document.getElementById('screen-custom').classList.add('hidden');
  document.getElementById('screen-pause').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');

  if (!City3.buildings.length) City3.generate();
  if (!World3.ready) World3.init(Game.canvas);

  for (const b of Entities.bullets) b._dead = true;
  Entities.peds.length = 0;
  Entities.cars.length = 0;
  Entities.cops.length = 0;
  Entities.bullets.length = 0;
  Entities.particles.length = 0;
  Entities.corpses.length = 0;
  Entities.pickups.length = 0;
  Entities.tracers.length = 0;
  Systems.activeJob = null;
  Systems.tempObjective = null;
  Systems.gangPedsSpawned = false;

  let custom;
  if (save) {
    custom = save.custom;
  } else {
    custom = CustomScreen.collect();
  }
  Game.player = new Player3(custom);
  Game.timeMin = save ? save.timeMin : 8 * 60;
  Game.elapsed = 0;
  Game.camYaw = 0; Game.camPitch = 0.32; Game.camDist = 5.6;

  const pizzeria = City3.doors.find((d) => d.type === 'pizzeria');
  if (save) {
    Game.player.x = save.x; Game.player.y = save.y;
    const inB = City3.buildingAt(save.x, save.z, 0.5);
    if (inB) {
      const dd = City3.doors.find((d) => d.building === inB) || City3.doors[0];
      Game.player.x = dd.x; Game.player.z = dd.y + 4;
    }
    Game.player.money = save.money;
    Game.player.health = save.health;
    Game.player.armor = save.armor;
    Game.player.weapons = save.weapons;
    Game.player.ammo = save.ammo;
    Game.player.curWeapon = save.curWeapon;
    Game.player.gangRep = save.gangRep;
    Game.player.weapons.fists = true;
  } else {
    Game.player.x = pizzeria.x;
    Game.player.z = pizzeria.y + 18;
  }

  const spawnOwned = (carId, nearX, nearZ) => {
    const spec = SHOP_CARS.find((c) => c.id === carId);
    if (!spec) return null;
    const car = new Car3(nearX + rand(-14, 14), nearZ + 12, rand(0, Math.PI * 2), { ...spec }, 'parked');
    car.owner = Game.player.custom.name;
    Entities.cars.push(car);
    Game.player.ownedCars.push(car);
    return car;
  };
  Game.player.ownedCars = [];
  if (save) {
    for (const id of save.ownedCarIds || []) spawnOwned(id, Game.player.x, Game.player.z);
  } else {
    const carChoice = document.getElementById('custom-car').value;
    if (carChoice !== 'none') spawnOwned(carChoice, Game.player.x, Game.player.z);
  }

  Systems.spawnAntonio();
  for (let i = 0; i < 30; i++) Systems.spawnPedNear(Game.player);
  for (let i = 0; i < 8; i++) Systems.spawnTrafficCar(Game.player);
  for (let i = 0; i < 6; i++) Systems.spawnParkedCar(Game.player);

  Game.state = 'play';
  Game.paused = false;
  UI.updateHUD();
  UI.toast('Benvenuto a Citt\u00e0 Temu 3D, ' + custom.name + '!', 'good');
  UI.toast('Click sullo schermo per guardarti intorno col mouse.', '');
  UI.toast('Premi P per lo smartphone: chiamate, SMS, Instagrim e browser.', '');
}

// ---------- loop ----------
function loop(now) {
  requestAnimationFrame(loop);
  const dt = clamp((now - Game.lastFrame) / 1000, 0, 0.05);
  Game.lastFrame = now;

  if (Game.state !== 'play') { Input.endFrame(); return; }

  if (!Game.paused && !UI.dialogOpen && !Game.player.dead) {
    Game.elapsed += dt;
    updatePlayer(dt);
    Systems.update(dt);
    updateInteractions();
    updateHint();
    Game.camDist = clamp(Game.camDist + Input.wheel, 3, 14);
  }
  Input.endFrame();

  if (Game.player && World3.ready) {
    updateCamera(dt);
    World3.updateDayNight(Game.timeMin);
    Touch.refreshWeapon();
    World3.syncViews(dt);
    World3.renderer.render(World3.scene, World3.camera);
    World3.drawMinimap();
  }
  if (Phone.open && Game.player) {
    document.getElementById('phone-clock').textContent = fmtTime(Game.timeMin);
    document.getElementById('phone-money').textContent = fmtMoney(Game.player.money);
  }
}

// ---------- errori visibili in pagina ----------
function showFatal(msg) {
  const el = document.getElementById('err-overlay');
  if (!el) return;
  el.classList.remove('hidden');
  el.textContent = msg;
}

// ---------- boot ----------
function boot() {
  if (typeof THREE === 'undefined') {
    showFatal('Three.js non \u00e8 stato caricato (controlla la connessione e ricarica la pagina).');
    return;
  }
  Game.canvas = document.getElementById('game');
  Input.init(Game.canvas);

  window.addEventListener('error', (e) => {
    if (Game.state === 'play') showFatal('Errore di gioco: ' + (e.message || 'sconosciuto'));
  });

  Game.canvas.addEventListener('click', () => {
    if (Touch.enabled || Game.state !== 'play' || UI.dialogOpen || Phone.open || Game.paused) return;
    if (document.pointerLockElement !== Game.canvas && Game.canvas.requestPointerLock) {
      try { Game.canvas.requestPointerLock(); } catch (err) {}
    }
  });
  Touch.init();
  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== Game.canvas) return;
    Game.camYaw -= (e.movementX || 0) * 0.0026;
    Game.camPitch = clamp(Game.camPitch + (e.movementY || 0) * 0.002, 0.05, 1.15);
  });

  document.getElementById('btn-new').onclick = () => {
    sfx('click');
    document.getElementById('screen-menu').classList.add('hidden');
    document.getElementById('screen-custom').classList.remove('hidden');
    CustomScreen.init();
    CustomScreen.drawPreview();
  };
  document.getElementById('btn-start').onclick = () => { sfx('click'); startGame(null); };
  document.getElementById('btn-continue').onclick = () => {
    sfx('click');
    const save = Systems.loadSave();
    if (save) startGame(save);
  };
  document.getElementById('btn-help').onclick = () => document.getElementById('screen-help').classList.remove('hidden');
  document.getElementById('btn-help2').onclick = () => document.getElementById('screen-help').classList.remove('hidden');
  document.getElementById('btn-help-close').onclick = () => document.getElementById('screen-help').classList.add('hidden');
  document.getElementById('btn-ai').onclick = () => { sfx('click'); UI.openAISettings(); };
  document.getElementById('btn-ai2').onclick = () => { sfx('click'); UI.openAISettings(); };
  document.getElementById('btn-2d').onclick = () => { location.href = 'index2d.html'; };
  document.getElementById('hud-phone').onclick = () => Phone.toggle();
  document.getElementById('btn-resume').onclick = () => togglePause();
  document.getElementById('btn-save').onclick = () => Systems.save();
  document.getElementById('btn-quit').onclick = () => {
    Systems.save();
    Game.state = 'menu';
    Game.paused = false;
    document.getElementById('screen-pause').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('screen-menu').classList.remove('hidden');
    refreshContinue();
  };

  document.getElementById('phone').addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'home') {
      if (Phone.app === 'home' && !Phone.calling) Phone.close();
      else { Phone.app = 'home'; Phone.thread = null; Phone.site = null; Phone.photo = null; Phone.calling = null; Phone.render(); }
      return;
    }
    Phone.handleAction(el.dataset.action, el);
  });

  if (Systems.hasSave()) document.getElementById('btn-continue').classList.remove('hidden');

  window.addEventListener('beforeunload', () => { if (Game.state === 'play') Systems.save(); });
  setInterval(() => { if (Game.state === 'play' && !Game.paused && !Game.player.dead) Systems.save(); }, 20000);

  requestAnimationFrame((t) => { Game.lastFrame = t; loop(t); });
}

function refreshContinue() {
  document.getElementById('btn-continue').classList.toggle('hidden', !Systems.hasSave());
}

boot();
