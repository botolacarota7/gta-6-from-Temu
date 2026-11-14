// ===== Entità: giocatore, pedoni, poliziotti, auto, proiettili =====
const Entities = {
  peds: [], cars: [], cops: [], bullets: [],
  pickups: [], particles: [], corpses: [],
};

// ---------- Disegno persona (usato anche dal menu di personalizzazione) ----------
function drawPerson(ctx, x, y, angle, o) {
  const moving = o.walkPhase !== undefined && o.walkPhase !== null;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(2, 4, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(angle + Math.PI / 2);

  const ph = moving ? Math.sin(o.walkPhase) : 0;
  // piedi
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-5, 6 + ph * 5, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5, 6 - ph * 5, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  // gambe
  ctx.fillStyle = o.pants;
  ctx.fillRect(-7, -2 + ph * 3, 5, 12);
  ctx.fillRect(2, -2 - ph * 3, 5, 12);
  // corpo
  ctx.fillStyle = o.shirt;
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
  // braccia
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(-10, -2 - ph * 3, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -2 + ph * 3, 3.5, 0, Math.PI * 2); ctx.fill();
  // arma in mano
  if (o.weapon && o.weapon !== 'fists') {
    ctx.fillStyle = '#111';
    if (o.weapon === 'bat') ctx.fillRect(9, -14, 4, 22);
    else ctx.fillRect(8, -16, 5, 12);
  }
  // testa
  ctx.fillStyle = o.skin;
  ctx.beginPath(); ctx.arc(0, -9, 7, 0, Math.PI * 2); ctx.fill();
  // capelli
  ctx.fillStyle = o.hair;
  ctx.beginPath(); ctx.arc(0, -10, 7, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
  // cappello
  if (o.hat === 'cap') {
    ctx.fillStyle = o.shirt;
    ctx.beginPath(); ctx.arc(0, -10, 7.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-3, -18, 6, 5);
  } else if (o.hat === 'top hat') {
    ctx.fillStyle = '#111';
    ctx.fillRect(-9, -14, 18, 4);
    ctx.fillRect(-6, -24, 12, 11);
  } else if (o.hat === 'bandana') {
    ctx.fillStyle = '#c1121f';
    ctx.fillRect(-7, -13, 14, 4);
  }
  ctx.restore();
}

// ---------- Giocatore ----------
class Player {
  constructor(custom) {
    this.custom = custom;
    this.x = 0; this.y = 0; this.angle = 0;
    this.speed = 0; this.walkPhase = 0;
    this.health = 100; this.maxHealth = 100;
    this.armor = 0;
    this.money = 500;
    this.weapons = { fists: true };
    this.ammo = { bat: Infinity, pistol: 0, smg: 0, shotgun: 0 };
    this.curWeapon = 'fists';
    this.lastShot = 0;
    this.inCar = null;
    this.wanted = 0;
    this.lastCrime = 0;
    this.gangRep = 0;
    this.ownedCars = [];
    this.dead = false;
    this.radius = 12;
  }

  worldAngle() {
    if (this.inCar) return this.inCar.angle;
    return this.angle;
  }

  update(dt) {
    if (this.inCar) { this.syncWithCar(); return; }
    let mx = 0, my = 0;
    if (Input.down('w', 'arrowup')) my -= 1;
    if (Input.down('s', 'arrowdown')) my += 1;
    if (Input.down('a', 'arrowleft')) mx -= 1;
    if (Input.down('d', 'arrowright')) mx += 1;
    const running = Input.down('shift');
    const spd = running ? 210 : 120;
    if (mx || my) {
      const l = Math.sqrt(mx * mx + my * my);
      this.x += (mx / l) * spd * dt;
      this.y += (my / l) * spd * dt;
      this.walkPhase += dt * (running ? 14 : 9);
      if (!Input.mouse.down) this.angle = Math.atan2(my, mx);
    }
    this.collide();
  }

  collide() {
    if (typeof Interiors !== 'undefined' && Interiors.active) {
      Interiors.clampPlayer(this);
      return;
    }
    for (const b of World.buildings) {
      if (circleRect(this.x, this.y, this.radius, b.x, b.y, b.w, b.h)) {
        const cx = clamp(this.x, b.x, b.x + b.w);
        const cy = clamp(this.y, b.y, b.y + b.h);
        const d = dist(this.x, this.y, cx, cy) || 0.001;
        this.x = cx + (this.x - cx) / d * this.radius;
        this.y = cy + (this.y - cy) / d * this.radius;
      }
    }
    this.x = clamp(this.x, 10, WORLD_W - 10);
    this.y = clamp(this.y, 10, WORLD_W - 10);
  }

  syncWithCar() {
    this.x = this.inCar.x;
    this.y = this.inCar.y;
  }

  giveWeapon(id, ammo) {
    this.weapons[id] = true;
    if (id !== 'fists' && id !== 'bat' && ammo) this.ammo[id] = (this.ammo[id] || 0) + ammo;
  }
}

// ---------- Pedone ----------
class Ped {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.angle = rand(0, Math.PI * 2);
    this.speed = rand(45, 70);
    this.state = 'walk';
    this.stateT = 0;
    this.bubble = null; this.bubbleT = 0;
    this.walkPhase = rand(0, 6);
    this.hp = 30;
    this.skin = choice(['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac']);
    this.shirt = opts.shirt || choice(['#5b8bd0', '#c9744a', '#7aa860', '#b05aa0', '#d9c34a', '#888', '#4aa3a2']);
    this.pants = choice(['#33475b', '#555', '#6b4a3a']);
    this.hair = choice(['#2b2b2b', '#4a3626', '#7a5a30', '#999']);
    this.hat = Math.random() < 0.2 ? 'cap' : 'none';
    this.gang = opts.gang || null;   // 'rival' | 'pepes'
    this.target = null;
    this.dropMoney = randInt(5, 40);
    this.radius = 11;
    this.name = opts.name || choice(PED_NAMES);
    this.isAntonio = !!opts.isAntonio;
    this.mood = opts.mood || choice(['friendly', 'neutral', 'neutral', 'grumpy', 'gangster']);
    this.gaveMoney = false;
    this.pendingSay = null;
  }

  say(text, t = 2.6) { this.bubble = text; this.bubbleT = t; }

  update(dt, player) {
    if (this.state === 'dead') return;
    this.stateT -= dt;
    if (this.bubbleT > 0) { this.bubbleT -= dt; if (this.bubbleT <= 0) this.bubble = null; }
    if (this.pendingSay) {
      this.pendingSay.t -= dt;
      if (this.pendingSay.t <= 0) { this.say(this.pendingSay.text); this.pendingSay = null; }
    }

    if (this.state === 'flee') {
      this.runFrom(this.fleeFrom, dt, 135);
      if (this.stateT <= 0) { this.state = 'walk'; this.target = null; }
    } else if (this.state === 'react') {
      if (this.stateT <= 0) this.state = 'walk';
    } else {
      // vagabonda verso un obiettivo sul marciapiede
      if (!this.target || dist(this.x, this.y, this.target.x, this.target.y) < 20) {
        this.target = this.pickSidewalkTarget();
      }
      this.moveToward(this.target.x, this.target.y, dt, this.speed);
      if (this.gang === 'pepes' && player.gangRep >= 3 && Math.random() < 0.001) {
        this.say(choice(PED_GREET_BOSS));
      } else if (Math.random() < 0.0006) {
        this.say(choice(PED_IDLE));
      }
    }
    this.walkPhase += dt * 9;
  }

  pickSidewalkTarget() {
    for (let i = 0; i < 12; i++) {
      const tx = clamp(Math.floor(this.x / TILE) + randInt(-6, 6), 1, MAP_TILES - 2);
      const ty = clamp(Math.floor(this.y / TILE) + randInt(-6, 6), 1, MAP_TILES - 2);
      if (World.isSidewalkTile(tx, ty)) return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
    }
    return { x: this.x + rand(-100, 100), y: this.y + rand(-100, 100) };
  }

  moveToward(tx, ty, dt, spd) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 2) return;
    this.angle = angleTo(this.x, this.y, tx, ty);
    const nx = this.x + Math.cos(this.angle) * spd * dt;
    const ny = this.y + Math.sin(this.angle) * spd * dt;
    if (World.buildingAt(nx, ny, 6)) { this.target = null; return; }
    this.x = clamp(nx, 8, WORLD_W - 8);
    this.y = clamp(ny, 8, WORLD_W - 8);
  }

  runFrom(from, dt, spd) {
    const a = angleTo(from.x, from.y, this.x, this.y) + Math.sin(this.walkPhase) * 0.3;
    this.angle = a;
    const nx = this.x + Math.cos(a) * spd * dt;
    const ny = this.y + Math.sin(a) * spd * dt;
    if (World.buildingAt(nx, ny, 6)) {
      this.angle += Math.PI / 2;
      this.x += Math.cos(this.angle) * spd * dt;
      this.y += Math.sin(this.angle) * spd * dt;
    } else {
      this.x = clamp(nx, 8, WORLD_W - 8);
      this.y = clamp(ny, 8, WORLD_W - 8);
    }
  }

  scare(from, t = 8) {
    if (this.state === 'dead') return;
    this.state = 'flee';
    this.fleeFrom = from;
    this.stateT = t;
    if (Math.random() < 0.5) this.say(choice(PED_FLEE));
  }

  bump(from) {
    if (this.state === 'dead' || this.state === 'flee') return;
    this.state = 'react'; this.stateT = 1.2;
    this.say(choice(PED_BUMP));
    this.runFrom(from, 0.016, 60);
  }

  hit(dmg, from, isPlayerSource) {
    if (this.state === 'dead') return false;
    this.hp -= dmg;
    this.scare(from, 8);
    if (this.hp <= 0) {
      this.die();
      if (isPlayerSource) Systems.onPedKilled(this);
      return true;
    }
    if (isPlayerSource) Systems.onPedHurt(this);
    return false;
  }

  die() {
    this.state = 'dead';
    Entities.corpses.push({ x: this.x, y: this.y, t: 25, shirt: this.shirt, skin: this.skin });
    Entities.pickups.push({ x: this.x + rand(-14, 14), y: this.y + rand(-14, 14), amount: this.dropMoney, t: 30 });
    spawnBlood(this.x, this.y);
  }
}

// ---------- Poliziotto ----------
class Cop {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.angle = 0;
    this.hp = 60;
    this.walkPhase = rand(0, 6);
    this.shootT = 0;
    this.bubble = null; this.bubbleT = 0;
    this.radius = 12;
  }

  say(text, t = 2.2) { this.bubble = text; this.bubbleT = t; }

  update(dt, player) {
    if (this.bubbleT > 0) { this.bubbleT -= dt; if (this.bubbleT <= 0) this.bubble = null; }
    const tx = player.x, ty = player.y;
    const d = dist(this.x, this.y, tx, ty);
    this.angle = angleTo(this.x, this.y, tx, ty);
    this.shootT -= dt;

    if (d > 170) {
      const spd = 150;
      const nx = this.x + Math.cos(this.angle) * spd * dt;
      const ny = this.y + Math.sin(this.angle) * spd * dt;
      if (World.buildingAt(nx, ny, 8)) {
        const side = this.angle + Math.PI / 2;
        this.x += Math.cos(side) * spd * dt;
        this.y += Math.sin(side) * spd * dt;
      } else {
        this.x = nx; this.y = ny;
      }
      this.walkPhase += dt * 12;
      if (Math.random() < 0.004) this.say(choice(COP_CHATTER));
    } else if (this.shootT <= 0) {
      this.shootT = 0.8;
      if (Game.player.wanted >= 2) {
        fireBullet(this, this.angle + rand(-0.12, 0.12), 800, 10, false);
        sfx('copshot');
      } else if (d < 40) {
        player.damage(6, this);
      }
    }
  }

  hit(dmg, from, isPlayerSource) {
    this.hp -= dmg;
    spawnBlood(this.x, this.y, 3);
    if (this.hp <= 0) {
      Entities.corpses.push({ x: this.x, y: this.y, t: 25, shirt: '#1f4e8c', skin: '#e0ac69' });
      const i = Entities.cops.indexOf(this);
      if (i >= 0) Entities.cops.splice(i, 1);
      if (isPlayerSource) Systems.onCopKilled();
      return true;
    }
    return false;
  }
}

// ---------- Auto ----------
let CAR_ID = 1;
class Car {
  constructor(x, y, angle, spec, state = 'parked') {
    this.id = CAR_ID++;
    this.x = x; this.y = y; this.angle = angle;
    this.spec = spec;
    this.color = spec.color;
    this.speed = 0;
    this.hp = 100;
    this.state = state;          // parked | traffic | player | wreck
    this.w = spec.w; this.h = spec.h;
    this.axis = null; this.dir = 1; this.lane = 0; this.turnKey = null;
    this.owner = null;           // nome del proprietario
    this.smokeT = 0;
  }

  update(dt, player) {
    if (this.state === 'wreck') { this.smokeT -= dt; if (this.smokeT < 0) { this.smokeT = 0.12; spawnSmoke(this.x, this.y); } return; }
    if (this.state === 'player') this.updatePlayerDriven(dt);
    else if (this.state === 'traffic') this.updateTraffic(dt);
  }

  updatePlayerDriven(dt) {
    const spec = this.spec;
    let throttle = 0, steer = 0;
    if (Input.down('w', 'arrowup')) throttle = 1;
    if (Input.down('s', 'arrowdown')) throttle = -1;
    if (Input.down('a', 'arrowleft')) steer = -1;
    if (Input.down('d', 'arrowright')) steer = 1;
    this.speed += throttle * spec.accel * dt;
    if (throttle === 0) this.speed *= Math.max(0, 1 - 1.4 * dt);
    this.speed = clamp(this.speed, -spec.maxSpeed * 0.45, spec.maxSpeed);
    const grip = clamp(Math.abs(this.speed) / 130, 0, 1);
    this.angle += steer * 2.1 * dt * grip * Math.sign(this.speed || 1);
    this.moveWithCollision(dt);
    this.checkPedHits();
  }

  updateTraffic(dt) {
    const target = 150;
    // frena se qualcosa davanti
    const aheadX = this.x + Math.cos(this.angle) * 85;
    const aheadY = this.y + Math.sin(this.angle) * 85;
    let blocked = false;
    for (const c of Entities.cars) {
      if (c === this || c.state === 'parked') continue;
      if (dist2(aheadX, aheadY, c.x, c.y) < 55 * 55) { blocked = true; break; }
    }
    if (!blocked && !Game.player.inCar && dist2(aheadX, aheadY, Game.player.x, Game.player.y) < 48 * 48) blocked = true;
    if (!blocked && dist2(aheadX, aheadY, Game.player.x, Game.player.y) < 70 * 70 && Game.player.inCar) blocked = true;
    this.speed = lerp(this.speed, blocked ? 0 : target, dt * 3);

    const along = this.axis === 'h' ? this.x : this.y;
    // incroci: centri a (k*14+1.5)*TILE
    const k = Math.floor(along / (ROAD_PERIOD * TILE));
    const center = (k * ROAD_PERIOD + 1.5) * TILE;
    const key = this.axis + k;
    if (Math.abs(along - center) < 8 && this.turnKey !== key) {
      this.turnKey = key;
      if (Math.random() < 0.45) this.turn(k);
    }
    if (this.axis === 'h') this.x += this.dir * this.speed * dt;
    else this.y += this.dir * this.speed * dt;
    this.angle = this.axis === 'h' ? (this.dir > 0 ? 0 : Math.PI) : (this.dir > 0 ? Math.PI / 2 : -Math.PI / 2);

    if (this.x < -100 || this.y < -100 || this.x > WORLD_W + 100 || this.y > WORLD_W + 100) this.remove();
    this.checkPedHits();
  }

  turn(k) {
    const newAxis = this.axis === 'h' ? 'v' : 'h';
    const newDir = Math.random() < 0.5 ? 1 : -1;
    const center = (k * ROAD_PERIOD + 1.5) * TILE;
    const base = Math.floor(center / TILE) - 1;
    const lane = newAxis === 'h'
      ? (newDir > 0 ? (base + 2 + 0.5) * TILE : (base + 0.5) * TILE)
      : (newDir > 0 ? (base + 0.5) * TILE : (base + 2 + 0.5) * TILE);
    this.axis = newAxis; this.dir = newDir; this.lane = lane;
    if (newAxis === 'h') { this.y = lane; this.x = center; }
    else { this.x = lane; this.y = center; }
  }

  moveWithCollision(dt) {
    const nx = this.x + Math.cos(this.angle) * this.speed * dt;
    const ny = this.y + Math.sin(this.angle) * this.speed * dt;
    const r = Math.max(this.w, this.h) / 2 * 0.75;
    let hit = false;
    for (const b of World.buildings) {
      if (circleRect(nx, ny, r, b.x, b.y, b.w, b.h)) { hit = true; break; }
    }
    if (nx < 30 || ny < 30 || nx > WORLD_W - 30 || ny > WORLD_W - 30) hit = true;
    if (hit) {
      if (Math.abs(this.speed) > 180) this.damage(8);
      this.speed *= -0.35;
      sfx('crash');
    } else {
      this.x = nx; this.y = ny;
    }
  }

  checkPedHits() {
    if (Math.abs(this.speed) < 90) return;
    for (const p of Entities.peds) {
      if (p.state === 'dead') continue;
      if (dist2(this.x, this.y, p.x, p.y) < 26 * 26) {
        p.hit(999, { x: this.x, y: this.y }, this.state === 'player');
        if (this.state === 'player') { this.speed *= 0.7; sfx('thud'); }
      }
    }
  }

  damage(d) {
    this.hp -= d;
    if (this.hp <= 0 && this.state !== 'wreck') this.explode();
  }

  explode() {
    this.state = 'wreck';
    this.hp = 0;
    this.color = '#2a2a2a';
    this.speed = 0;
    spawnExplosion(this.x, this.y);
    sfx('boom');
    // danni area
    for (const p of Entities.peds) {
      if (p.state !== 'dead' && dist(this.x, this.y, p.x, p.y) < 90) p.hit(999, { x: this.x, y: this.y }, true);
    }
    for (const c of [...Entities.cops]) {
      if (dist(this.x, this.y, c.x, c.y) < 90) c.hit(80, { x: this.x, y: this.y }, true);
    }
    const pl = Game.player;
    if (!pl.dead && dist(this.x, this.y, pl.x, pl.y) < 100 && pl.inCar !== this) pl.damage(60, this);
    if (pl.inCar === this) { pl.exitCar(); pl.damage(45, this); }
    Systems.onExplosion(this);
  }

  remove() {
    const i = Entities.cars.indexOf(this);
    if (i >= 0) Entities.cars.splice(i, 1);
  }

  label() {
    if (this.owner) return this.spec.name + ' (tua)';
    return this.spec.name;
  }
}

// ---------- Proiettili ----------
function fireBullet(shooter, angle, speed, dmg, fromPlayer) {
  Entities.bullets.push({
    x: shooter.x + Math.cos(angle) * 18,
    y: shooter.y + Math.sin(angle) * 18,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    dmg, fromPlayer, life: 0.9,
  });
  Entities.particles.push({ x: shooter.x + Math.cos(angle) * 20, y: shooter.y + Math.sin(angle) * 20, vx: 0, vy: 0, life: 0.06, maxLife: 0.06, color: '#ffe08a', size: 7 });
}

function updateBullets(dt) {
  const pl = Game.player;
  for (let i = Entities.bullets.length - 1; i >= 0; i--) {
    const b = Entities.bullets[i];
    b.life -= dt;
    const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
    let dead = b.life <= 0;
    if (World.buildingAt(nx, ny, 0)) { dead = true; spawnSpark(nx, ny); }
    if (!dead) {
      if (b.fromPlayer) {
        for (const p of Entities.peds) {
          if (p.state !== 'dead' && dist2(nx, ny, p.x, p.y) < 13 * 13) { p.hit(b.dmg, pl, true); dead = true; break; }
        }
        if (!dead) for (const c of [...Entities.cops]) {
          if (dist2(nx, ny, c.x, c.y) < 13 * 13) { c.hit(b.dmg, pl, true); dead = true; break; }
        }
        if (!dead) for (const c of Entities.cars) {
          if (c.state !== 'wreck' && dist2(nx, ny, c.x, c.y) < 22 * 22) { c.damage(b.dmg * 0.8); spawnSpark(nx, ny); dead = true; break; }
        }
      } else {
        if (!pl.dead && dist2(nx, ny, pl.x, pl.y) < 13 * 13) { pl.damage(b.dmg, null); dead = true; }
        if (!dead) for (const p of Entities.peds) {
          if (p.state !== 'dead' && dist2(nx, ny, p.x, p.y) < 13 * 13) { p.hit(b.dmg, b, false); dead = true; break; }
        }
      }
    }
    if (dead) Entities.bullets.splice(i, 1);
    else { b.x = nx; b.y = ny; }
  }
}

// ---------- Particelle ----------
function spawnBlood(x, y, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(20, 90);
    Entities.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.7), maxLife: 0.7, color: '#a4161a', size: rand(2, 4), drag: 4 });
  }
}
function spawnSpark(x, y) {
  for (let i = 0; i < 4; i++) {
    const a = rand(0, Math.PI * 2), s = rand(30, 120);
    Entities.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.2, maxLife: 0.2, color: '#ffd23f', size: 2, drag: 5 });
  }
}
function spawnSmoke(x, y) {
  Entities.particles.push({ x: x + rand(-8, 8), y: y + rand(-8, 8), vx: rand(-8, 8), vy: rand(-40, -15), life: rand(0.7, 1.4), maxLife: 1.4, color: 'rgba(60,60,60,.7)', size: rand(5, 10), grow: 14 });
}
function spawnExplosion(x, y) {
  for (let i = 0; i < 26; i++) {
    const a = rand(0, Math.PI * 2), s = rand(40, 260);
    Entities.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.9), maxLife: 0.9, color: choice(['#ff6b35', '#ffd23f', '#ff9e1b', '#555']), size: rand(3, 8), drag: 3 });
  }
}

function updateParticles(dt) {
  for (let i = Entities.particles.length - 1; i >= 0; i--) {
    const p = Entities.particles[i];
    p.life -= dt;
    if (p.life <= 0) { Entities.particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.drag) { p.vx -= p.vx * p.drag * dt; p.vy -= p.vy * p.drag * dt; }
    if (p.grow) p.size += p.grow * dt;
  }
  for (let i = Entities.corpses.length - 1; i >= 0; i--) {
    Entities.corpses[i].t -= dt;
    if (Entities.corpses[i].t <= 0) Entities.corpses.splice(i, 1);
  }
  for (let i = Entities.pickups.length - 1; i >= 0; i--) {
    const p = Entities.pickups[i];
    p.t -= dt;
    if (p.t <= 0) Entities.pickups.splice(i, 1);
  }
}
