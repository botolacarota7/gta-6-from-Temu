// ===== Entità 3D: giocatore, pedoni, poliziotti, auto (logica pura, alias y/z) =====
const Entities = {
  peds: [], cars: [], cops: [], bullets: [],
  pickups: [], particles: [], corpses: [], tracers: [],
};

// alias y<->z: i moduli condivisi (phone, dialogue) usano y come coordinata a terra
function yzAlias(proto) {
  Object.defineProperty(proto, 'y', {
    get() { return this.z; },
    set(v) { this.z = v; },
    configurable: true,
  });
}

function spawnParticles3(x, z, color, n, opts = {}) {
  for (let i = 0; i < n; i++) {
    if (Entities.particles.length > 150) break;
    const a = rand(0, Math.PI * 2);
    const sp = rand(1, opts.power || 4);
    Entities.particles.push({
      x, y: opts.h || 0.8, z,
      vx: Math.cos(a) * sp, vy: rand(1, opts.up || 4), vz: Math.sin(a) * sp,
      life: opts.life || 0.6, maxLife: opts.life || 0.6,
      color, size: opts.size || 0.16,
    });
  }
}

// ---------- Giocatore ----------
class Player3 {
  constructor(custom) {
    this.custom = custom;
    this.x = 0; this.z = 0; this.angle = 0;
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
    this.radius = 0.5;
  }

  worldAngle() {
    if (this.inCar) return this.inCar.angle;
    return this.angle;
  }

  syncWithCar() {
    this.x = this.inCar.x;
    this.z = this.inCar.z;
  }

  giveWeapon(id, ammo) {
    this.weapons[id] = true;
    if (id !== 'fists' && id !== 'bat' && ammo) this.ammo[id] = (this.ammo[id] || 0) + ammo;
  }

  damage(dmg, from) {
    if (this.dead) return;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, dmg * 0.65);
      this.armor -= absorbed;
      dmg -= absorbed;
    }
    this.health -= dmg;
    if (from) spawnParticles3(this.x, this.z, '#b01818', 4, { power: 2, up: 2, size: 0.1, life: 0.4 });
    if (this.health <= 0) {
      this.health = 0;
      Systems.playerDied();
    }
    UI.updateHUD();
  }
}
yzAlias(Player3.prototype);

// ---------- Pedone ----------
class Person3 {
  constructor(x, z, opts = {}) {
    this.x = x; this.z = z;
    this.angle = rand(0, Math.PI * 2);
    this.speed = rand(1.7, 2.5);
    this.state = 'walk';
    this.stateT = 0;
    this.bubble = null; this.bubbleT = 0;
    this.walkPhase = rand(0, 6);
    this.hp = opts.hp || 30;
    this.skin = choice(['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac']);
    this.shirt = opts.shirt || choice(['#5b8bd0', '#c9744a', '#7aa860', '#b05aa0', '#d9c34a', '#888', '#4aa3a2']);
    this.pants = choice(['#33475b', '#555', '#6b4a3a']);
    this.hair = choice(['#2b2b2b', '#4a3626', '#7a5a30', '#999']);
    this.hat = Math.random() < 0.2 ? 'cap' : 'none';
    this.gang = opts.gang || null;
    this.target = null;
    this.dest = null;
    this.blockT = 0;
    this.sideDir = 1;
    this.dropMoney = randInt(5, 40);
    this.radius = 0.5;
    this.name = opts.name || choice(PED_NAMES);
    this.isAntonio = !!opts.isAntonio;
    this.mood = opts.mood || choice(['friendly', 'neutral', 'neutral', 'grumpy', 'gangster']);
    this.gaveMoney = false;
    this.pendingSay = null;
    this.shootT = 0;
    this.view = null;
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
      this.runFrom(this.fleeFrom, dt, 6.5);
      if (this.stateT <= 0) { this.state = 'walk'; this.dest = null; }
    } else if (this.state === 'react') {
      if (this.stateT <= 0) this.state = 'walk';
    } else if (this.state === 'idle') {
      if (this.stateT <= 0) { this.state = 'walk'; this.dest = null; }
    } else {
      if (!this.dest) this.pickDestination();
      if (dist(this.x, this.z, this.dest.x, this.dest.z) < 5) {
        this.state = 'idle';
        this.stateT = rand(2, 6);
        this.dest = null;
      } else {
        this.moveToward(this.dest.x, this.dest.z, dt, this.speed);
        if (this.gang === 'pepes' && player.gangRep >= 3 && Math.random() < 0.001) {
          this.say(choice(PED_GREET_BOSS));
        } else if (Math.random() < 0.0006) {
          this.say(choice(PED_IDLE));
        }
      }
    }
    this.walkPhase += dt * 9;
  }

  pickDestination() {
    this.blockT = 0;
    this.sideDir = Math.random() < 0.5 ? 1 : -1;
    if (City3.doors.length && Math.random() < 0.4) {
      const d = choice(City3.doors);
      if (dist(this.x, this.z, d.x, d.y) > 60) {
        this.dest = { x: d.x + rand(-6, 6), z: d.y + rand(-6, 6) };
        return;
      }
    }
    let best = null;
    let bestD = -1;
    for (let i = 0; i < 6; i++) {
      const p = City3.randomSidewalkPoint();
      const dd = dist(this.x, this.z, p.x, p.z);
      if (dd > bestD) { bestD = dd; best = p; }
    }
    this.dest = best;
  }

  moveToward(tx, tz, dt, spd) {
    const d = dist(this.x, this.z, tx, tz);
    if (d < 0.5) return;
    this.angle = angleTo(this.x, this.z, tx, tz);
    const nx = this.x + Math.cos(this.angle) * spd * dt;
    const nz = this.z + Math.sin(this.angle) * spd * dt;
    if (City3.buildingAt(nx, nz, 0.8)) {
      this.blockT += dt;
      if (this.blockT > 2) { this.blockT = 0; this.dest = null; return; }
      this.angle += this.sideDir * Math.PI / 2;
      this.sideDir = -this.sideDir;
      this.x = clamp(this.x + Math.cos(this.angle) * spd * dt, 3, City3.size - 3);
      this.z = clamp(this.z + Math.sin(this.angle) * spd * dt, 3, City3.size - 3);
      return;
    }
    this.blockT = 0;
    this.x = clamp(nx, 3, City3.size - 3);
    this.z = clamp(nz, 3, City3.size - 3);
  }

  runFrom(from, dt, spd) {
    const a = angleTo(from.x, from.y !== undefined ? from.y : from.z, this.x, this.z) + Math.sin(this.walkPhase) * 0.3;
    this.angle = a;
    const nx = this.x + Math.cos(a) * spd * dt;
    const nz = this.z + Math.sin(a) * spd * dt;
    if (City3.buildingAt(nx, nz, 0.8)) {
      this.angle += Math.PI / 2;
      this.x += Math.cos(this.angle) * spd * dt;
      this.z += Math.sin(this.angle) * spd * dt;
    } else {
      this.x = clamp(nx, 3, City3.size - 3);
      this.z = clamp(nz, 3, City3.size - 3);
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
    this.runFrom(from, 0.016, 3);
  }

  hit(dmg, from, isPlayerSource) {
    if (this.state === 'dead') return false;
    this.hp -= dmg;
    this.scare(from, 8);
    spawnParticles3(this.x, this.z, '#b01818', 5, { power: 2, up: 2.5, size: 0.1, life: 0.45 });
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
    this.bubble = null;
    Entities.corpses.push({ x: this.x, z: this.z, t: 20, shirt: this.shirt, skin: this.skin, angle: this.angle });
    Entities.pickups.push({ x: this.x + rand(-1.5, 1.5), y: this.z + rand(-1.5, 1.5), amount: this.dropMoney, t: 30 });
    spawnParticles3(this.x, this.z, '#b01818', 10, { power: 3, up: 3 });
  }
}
yzAlias(Person3.prototype);

// ---------- Poliziotto ----------
class Cop3 {
  constructor(x, z) {
    this.x = x; this.z = z;
    this.angle = 0;
    this.hp = 60;
    this.walkPhase = rand(0, 6);
    this.shootT = rand(0.5, 1.5);
    this.bubble = null; this.bubbleT = 0;
    this.radius = 0.5;
    this.view = null;
  }

  say(text, t = 2.2) { this.bubble = text; this.bubbleT = t; }

  update(dt, player) {
    if (this.bubbleT > 0) { this.bubbleT -= dt; if (this.bubbleT <= 0) this.bubble = null; }
    const d = dist(this.x, this.z, player.x, player.z);
    this.angle = angleTo(this.x, this.z, player.x, player.z);
    this.aiming = d <= 40 && !player.dead;
    this.shootT -= dt;

    if (d > 30) {
      const spd = 9;
      const nx = this.x + Math.cos(this.angle) * spd * dt;
      const nz = this.z + Math.sin(this.angle) * spd * dt;
      if (City3.buildingAt(nx, nz, 0.8)) {
        const side = this.angle + Math.PI / 2;
        this.x += Math.cos(side) * spd * dt;
        this.z += Math.sin(side) * spd * dt;
      } else {
        this.x = nx; this.z = nz;
      }
      this.walkPhase += dt * 12;
      if (Math.random() < 0.004) this.say(choice(COP_CHATTER));
    } else if (this.shootT <= 0 && !player.dead) {
      this.shootT = 1.2;
      const spread = 0.1;
      const a = this.angle + rand(-spread, spread);
      const range = 55;
      let ex = this.x + Math.cos(a) * range;
      let ez = this.z + Math.sin(a) * range;
      const acc = clamp(0.7 - d / 70, 0.15, 0.7);
      if (Math.random() < acc) {
        ex = player.x; ez = player.z;
        player.damage(6, this);
      } else {
        ex = player.x + rand(-3, 3); ez = player.z + rand(-3, 3);
      }
      Entities.bullets.push({
        x1: this.x + Math.cos(a) * 0.8, y1: 1.4, z1: this.z + Math.sin(a) * 0.8,
        x2: ex, y2: 1.2, z2: ez, t: 0.1, vx: 0, vy: 0,
      });
      sfx('copshot');
    }
  }

  hit(dmg, from, isPlayerSource) {
    this.hp -= dmg;
    spawnParticles3(this.x, this.z, '#b01818', 4, { power: 2, up: 2 });
    if (this.hp <= 0) {
      Entities.corpses.push({ x: this.x, z: this.z, t: 20, shirt: '#1f4e8c', skin: '#e0ac69', angle: this.angle });
      const i = Entities.cops.indexOf(this);
      if (i >= 0) Entities.cops.splice(i, 1);
      if (isPlayerSource) Systems.onCopKilled();
      return true;
    }
    return false;
  }
}
yzAlias(Cop3.prototype);

// ---------- Auto ----------
let CAR3_ID = 1;
const CAR3_DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

class Car3 {
  constructor(x, z, angle, spec, state = 'parked') {
    this.id = CAR3_ID++;
    this.x = x; this.z = z; this.angle = angle;
    this.spec = spec;
    this.color = spec.color;
    this.speed = 0;
    this.hp = 100;
    this.state = state;          // parked | traffic | player | wreck
    this.len = spec.w / 10;
    this.wid = spec.h / 10;
    this.maxSpeed = spec.maxSpeed * 0.12;
    this.accel = spec.accel * 0.12;
    this.owner = null;
    this.ii = 0; this.jj = 0; this.dir = 0;
    this.tx = 0; this.tz = 0;
    this.cruise = rand(10, 16);
    this.smokeT = 0;
    this.view = null;
  }

  update(dt, player) {
    if (this.state === 'wreck') {
      this.smokeT -= dt;
      if (this.smokeT < 0) {
        this.smokeT = 0.15;
        spawnParticles3(this.x, this.z, '#555', 2, { h: 1, up: 3, power: 0.5, size: 0.3, life: 1 });
      }
      return;
    }
    if (this.state === 'player') this.updatePlayerDriven(dt);
    else if (this.state === 'traffic') this.updateTraffic(dt);
  }

  updatePlayerDriven(dt) {
    let throttle = 0, steer = 0;
    if (Input.down('w', 'arrowup')) throttle = 1;
    if (Input.down('s', 'arrowdown')) throttle = -1;
    if (Input.down('a', 'arrowleft')) steer = -1;
    if (Input.down('d', 'arrowright')) steer = 1;
    this.speed += throttle * this.accel * dt;
    if (throttle === 0) this.speed *= Math.max(0, 1 - 1.4 * dt);
    this.speed = clamp(this.speed, -this.maxSpeed * 0.45, this.maxSpeed);
    const grip = clamp(Math.abs(this.speed) / 12, 0, 1);
    this.angle += steer * 2.0 * dt * grip * Math.sign(this.speed || 1);
    this.moveWithCollision(dt);
    this.checkPedHits();
  }

  laneTarget() {
    const [dx, dz] = CAR3_DIRS[this.dir];
    const rx = -dz, rz = dx;
    const cx = City3.laneCoords[this.ii] + rx * 4.5;
    const cz = City3.laneCoords[this.jj] + rz * 4.5;
    return { x: cx, z: cz };
  }

  initTraffic() {
    this.ii = clamp(Math.round((this.x - City3.ROAD / 2) / City3.CELL), 0, City3.GRID);
    this.jj = clamp(Math.round((this.z - City3.ROAD / 2) / City3.CELL), 0, City3.GRID);
    const options = [];
    for (let d = 0; d < 4; d++) {
      const [dx, dz] = CAR3_DIRS[d];
      const ni = this.ii + dx, nj = this.jj + dz;
      if (ni >= 0 && ni <= City3.GRID && nj >= 0 && nj <= City3.GRID) options.push(d);
    }
    this.dir = options.length ? choice(options) : 0;
    const t = this.laneTarget();
    this.tx = t.x; this.tz = t.z;
    this.angle = Math.atan2(t.z - this.z, t.x - this.x);
  }

  updateTraffic(dt) {
    const aheadX = this.x + Math.cos(this.angle) * 9;
    const aheadZ = this.z + Math.sin(this.angle) * 9;
    let blocked = false;
    for (const c of Entities.cars) {
      if (c === this || c.state === 'parked') continue;
      if (dist2(aheadX, aheadZ, c.x, c.z) < 36) { blocked = true; break; }
    }
    if (!blocked && !Game.player.inCar && dist2(aheadX, aheadZ, Game.player.x, Game.player.z) < 25) blocked = true;
    this.speed = lerp(this.speed, blocked ? 0 : this.cruise, dt * 3);

    const dx = this.tx - this.x, dz = this.tz - this.z;
    const dd = Math.sqrt(dx * dx + dz * dz);
    if (dd < 4) {
      this.atIntersection();
    } else {
      const desired = Math.atan2(dz, dx);
      this.angle = this.angle + normAngle(desired - this.angle) * clamp(dt * 6, 0, 1);
    }
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.z += Math.sin(this.angle) * this.speed * dt;
    this.checkPedHits();
  }

  atIntersection() {
    const [dx, dz] = CAR3_DIRS[this.dir];
    const straightOk = this.ii + dx >= 0 && this.ii + dx <= City3.GRID && this.jj + dz >= 0 && this.jj + dz <= City3.GRID;
    const roll = Math.random();
    let newDir = this.dir;
    if (!straightOk || roll < 0.35) {
      const left = (this.dir + 3) % 4;
      const right = (this.dir + 1) % 4;
      const opts = [];
      const [lx, lz] = CAR3_DIRS[left];
      if (this.ii + lx >= 0 && this.ii + lx <= City3.GRID && this.jj + lz >= 0 && this.jj + lz <= City3.GRID) opts.push(left);
      const [rx2, rz2] = CAR3_DIRS[right];
      if (this.ii + rx2 >= 0 && this.ii + rx2 <= City3.GRID && this.jj + rz2 >= 0 && this.jj + rz2 <= City3.GRID) opts.push(right);
      if (opts.length) newDir = choice(opts);
      else newDir = (this.dir + 2) % 4;
    }
    this.dir = newDir;
    this.ii = clamp(this.ii + CAR3_DIRS[newDir][0], 0, City3.GRID);
    this.jj = clamp(this.jj + CAR3_DIRS[newDir][1], 0, City3.GRID);
    const t = this.laneTarget();
    this.tx = t.x; this.tz = t.z;
  }

  moveWithCollision(dt) {
    const nx = this.x + Math.cos(this.angle) * this.speed * dt;
    const nz = this.z + Math.sin(this.angle) * this.speed * dt;
    const r = Math.max(this.len, this.wid) / 2 * 0.75;
    let hit = City3.buildingAt(nx, nz, r) !== null;
    if (nx < 6 || nz < 6 || nx > City3.size - 6 || nz > City3.size - 6) hit = true;
    if (hit) {
      if (Math.abs(this.speed) > 14) this.damage(8);
      this.speed *= -0.35;
      sfx('crash');
    } else {
      this.x = nx; this.z = nz;
    }
  }

  checkPedHits() {
    if (Math.abs(this.speed) < 6) return;
    for (const p of Entities.peds) {
      if (p.state === 'dead') continue;
      if (dist2(this.x, this.z, p.x, p.z) < 7) {
        p.hit(999, { x: this.x, y: this.z }, this.state === 'player');
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
    spawnParticles3(this.x, this.z, '#ff8c3a', 24, { h: 1, power: 7, up: 8, size: 0.35, life: 0.9 });
    sfx('boom');
    for (const p of Entities.peds) {
      if (p.state !== 'dead' && dist(this.x, this.z, p.x, p.z) < 14) p.hit(999, { x: this.x, y: this.z }, true);
    }
    for (const c of [...Entities.cops]) {
      if (dist(this.x, this.z, c.x, c.z) < 14) c.hit(80, { x: this.x, y: this.z }, true);
    }
    const pl = Game.player;
    if (!pl.dead && dist(this.x, this.z, pl.x, pl.z) < 16 && pl.inCar !== this) pl.damage(60, this);
    if (pl.inCar === this) {
      pl.inCar = null;
      pl.x = this.x + Math.cos(this.angle + Math.PI / 2) * 2.4;
      pl.z = this.z + Math.sin(this.angle + Math.PI / 2) * 2.4;
      pl.damage(45, this);
    }
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
yzAlias(Car3.prototype);

// ---------- Spari NPC: hitscan con tracciante ----------
function npcShoot(shooter, angle, dmg) {
  const pl = Game.player;
  const range = 55;
  const acc = 0.5;
  let ex = shooter.x + Math.cos(angle) * range;
  let ez = shooter.z + Math.sin(angle) * range;
  if (Math.random() < acc && !pl.dead) {
    ex = pl.x; ez = pl.z;
    pl.damage(dmg, shooter);
  } else {
    ex = pl.x + rand(-3, 3); ez = pl.z + rand(-3, 3);
  }
  Entities.bullets.push({
    x1: shooter.x + Math.cos(angle) * 0.8, y1: 1.4, z1: shooter.z + Math.sin(angle) * 0.8,
    x2: ex, y2: 1.2, z2: ez, t: 0.1, vx: 0, vy: 0,
  });
  sfx('copshot');
}
