// ===== Sistemi: traffico, folla, polizia, lavori, negozi, salvataggio =====
const Systems = {
  activeJob: null,
  gangPedsSpawned: false,
  evadeTimer: 0,
  gunTimer: 0,

  // ---------- popolazione ----------
  updatePopulation(dt) {
    const pl = Game.player;

    // pedoni
    for (let i = Entities.peds.length - 1; i >= 0; i--) {
      const p = Entities.peds[i];
      p.update(dt, pl);
      const d = dist(p.x, p.y, pl.x, pl.y);
      if (p.isAntonio) {
        if (d > 2200) { p.x = pl.x + rand(-400, 400); p.y = pl.y + rand(-400, 400); }
      } else if (d > 1500 && p.gang !== 'rival') Entities.peds.splice(i, 1);
      else if (p.state === 'dead') Entities.peds.splice(i, 1);
    }
    const wantPeds = 32;
    let alive = 0;
    for (const p of Entities.peds) if (p.state !== 'dead') alive++;
    if (alive < wantPeds) this.spawnPedNear(pl);

    // rivali ostili
    for (const p of Entities.peds) {
      if (p.gang === 'rival' && p.state !== 'dead') {
        const d = dist(p.x, p.y, pl.x, pl.y);
        p.shootT = (p.shootT || 0) - dt;
        if (d < 300) {
          p.angle = angleTo(p.x, p.y, pl.x, pl.y);
          if (p.shootT <= 0 && !pl.dead) {
            p.shootT = 1.0;
            fireBullet(p, p.angle + rand(-0.15, 0.15), 750, 9, false);
          }
          if (d > 120) p.moveToward(pl.x, pl.y, dt, 100);
        }
      }
    }

    // auto
    for (let i = Entities.cars.length - 1; i >= 0; i--) {
      const c = Entities.cars[i];
      c.update(dt, pl);
      if (c !== pl.inCar && dist(c.x, c.y, pl.x, pl.y) > 1700 && c.state !== 'player') {
        if (c.owner) continue;
        Entities.cars.splice(i, 1);
      }
    }
    let traffic = 0, parked = 0;
    for (const c of Entities.cars) {
      if (c.state === 'traffic') traffic++;
      if (c.state === 'parked') parked++;
    }
    if (traffic < 10) this.spawnTrafficCar(pl);
    if (parked < 8) this.spawnParkedCar(pl);

    // gangster Los Pepes alla base
    const gangDoor = World.doors.find((d) => d.type === 'gang');
    if (gangDoor) {
      const near = dist(pl.x, pl.y, gangDoor.x, gangDoor.y) < 700;
      if (near && !this.gangPedsSpawned) {
        this.gangPedsSpawned = true;
        for (let i = 0; i < 4; i++) {
          const p = new Ped(gangDoor.x + rand(-120, 120), gangDoor.y + rand(30, 140), { shirt: '#8e3b46', gang: 'pepes' });
          Entities.peds.push(p);
        }
      } else if (!near) this.gangPedsSpawned = false;
    }

    // Antonio ti fermA quando passi
    this.antonioCd = Math.max(0, (this.antonioCd || 0) - dt);
    const antonio = Entities.peds.find((p) => p.isAntonio && p.state !== 'dead');
    if (antonio && !UI.dialogOpen && !pl.inCar && !pl.dead && this.antonioCd <= 0 && dist(antonio.x, antonio.y, pl.x, pl.y) < 90) {
      this.antonioCd = 45;
      UI.startConversation(antonio);
    }

    // battute ambientali contestuali
    this.ambientT = Math.max(0, (this.ambientT || 0) - dt);
    if (this.ambientT <= 0 && Entities.peds.length) {
      this.ambientT = rand(4, 8);
      const near = Entities.peds.filter((p) => p.state === 'walk' && dist(p.x, p.y, pl.x, pl.y) < 350);
      if (near.length) {
        const p = choice(near);
        const hour = Game.timeMin / 60;
        let pool = Dialogue.ambient.idle;
        if (pl.wanted > 0) pool = Dialogue.ambient.wanted;
        else if (hour > 20.5 || hour < 6) pool = Dialogue.ambient.night;
        else if (pl.money > 8000 && Math.random() < 0.6) pool = Dialogue.ambient.rich;
        else if (WEAPONS[pl.curWeapon].bullet && Math.random() < 0.6) pool = Dialogue.ambient.gun;
        p.say(choice(pool));
      }
      // chiacchiere tra pedoni
      if (Entities.peds.length > 4 && Math.random() < 0.5) {
        const a = choice(Entities.peds.filter((p) => p.state === 'walk'));
        const b = Entities.peds.filter((p) => p !== a && p.state === 'walk' && dist(p.x, p.y, a.x, a.y) < 160);
        if (b.length) {
          const pair = choice(Dialogue.pairChatter);
          a.say(pair[0]);
          b[0].pendingSay = { text: pair[1], t: 1.6 };
        }
      }
    }

    // marker temporaneo dalle indicazioni stradali
    if (this.tempObjective) {
      this.tempObjective.t -= dt;
      if (this.tempObjective.t <= 0) this.tempObjective = null;
    }

    // poliziotti
    for (const c of [...Entities.cops]) c.update(dt, pl);
    const desiredCops = pl.wanted === 0 ? 0 : Math.min(6, pl.wanted + 1);
    if (Entities.cops.length < desiredCops && !pl.dead) this.spawnCop(pl);

    // evasione: senza polizia vicina le stelle scendono
    if (pl.wanted > 0) {
      let copNear = false;
      for (const c of Entities.cops) if (dist(c.x, c.y, pl.x, pl.y) < 550) { copNear = true; break; }
      if (!copNear) {
        this.evadeTimer += dt;
        if (this.evadeTimer > 12) {
          this.evadeTimer = 0;
          pl.wanted--;
          UI.toast(pl.wanted === 0 ? 'Sei pulito! La polizia ti ha perso.' : 'Livello ricercato ridotto.', 'good');
          if (pl.wanted === 0) Entities.cops.length = 0;
        }
      } else this.evadeTimer = 0;
    }
  },

  spawnPedNear(pl) {
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), d = rand(500, 1000);
      const x = clamp(pl.x + Math.cos(a) * d, 40, WORLD_W - 40);
      const y = clamp(pl.y + Math.sin(a) * d, 40, WORLD_W - 40);
      if (World.isSidewalkTile(Math.floor(x / TILE), Math.floor(y / TILE)) && !World.buildingAt(x, y, 10)) {
        Entities.peds.push(new Ped(x, y));
        return;
      }
    }
  },

  randomLaneNear(pl, minD, maxD) {
    for (let i = 0; i < 20; i++) {
      const axis = Math.random() < 0.5 ? 'h' : 'v';
      const k = randInt(0, Math.floor(MAP_TILES / ROAD_PERIOD) - 1);
      const base = k * ROAD_PERIOD;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const lane = axis === 'h'
        ? (dir > 0 ? (base + 2 + 0.5) * TILE : (base + 0.5) * TILE)
        : (dir > 0 ? (base + 0.5) * TILE : (base + 2 + 0.5) * TILE);
      const along = rand(100, WORLD_W - 100);
      const x = axis === 'h' ? along : lane;
      const y = axis === 'h' ? lane : along;
      const d = dist(x, y, pl.x, pl.y);
      if (d >= minD && d <= maxD) {
        return { x, y, axis, dir, lane };
      }
    }
    return null;
  },

  spawnTrafficCar(pl) {
    const s = this.randomLaneNear(pl, 600, 1200);
    if (!s) return;
    const spec = {
      color: choice(TRAFFIC_COLORS),
      maxSpeed: 250, accel: 160,
      w: randInt(38, 48), h: randInt(19, 23),
      name: 'Auto',
    };
    const car = new Car(s.x, s.y, 0, spec, 'traffic');
    car.axis = s.axis; car.dir = s.dir; car.lane = s.lane;
    Entities.cars.push(car);
  },

  spawnParkedCar(pl) {
    const spots = World.parkingSpots.filter((s) => {
      const d = dist(s.x, s.y, pl.x, pl.y);
      return d > 300 && d < 1100 && !World.buildingAt(s.x, s.y, 20);
    });
    if (!spots.length) return;
    const s = choice(spots);
    for (const c of Entities.cars) if (dist(c.x, c.y, s.x, s.y) < 60) return;
    const spec = {
      color: choice(TRAFFIC_COLORS), maxSpeed: 280, accel: 180,
      w: randInt(38, 48), h: randInt(19, 23), name: 'Auto',
    };
    Entities.cars.push(new Car(s.x, s.y, s.angle, spec, 'parked'));
  },

  spawnCop(pl) {
    for (let i = 0; i < 12; i++) {
      const a = rand(0, Math.PI * 2), d = rand(500, 750);
      const x = clamp(pl.x + Math.cos(a) * d, 40, WORLD_W - 40);
      const y = clamp(pl.y + Math.sin(a) * d, 40, WORLD_W - 40);
      if (!World.buildingAt(x, y, 10)) { Entities.cops.push(new Cop(x, y)); return; }
    }
  },

  // ---------- crimine e ricercato ----------
  crime(stars, why) {
    const pl = Game.player;
    const before = pl.wanted;
    pl.wanted = Math.min(5, pl.wanted + stars);
    pl.lastCrime = Game.elapsed;
    if (pl.wanted > before) UI.toast('Ricercato! ' + '★'.repeat(pl.wanted) + (why ? ' (' + why + ')' : ''), 'bad');
  },

  gunfire(x, y) {
    for (const p of Entities.peds) {
      const d = dist(x, y, p.x, p.y);
      if (d < 320 && p.state !== 'dead') p.scare({ x, y });
      else if (d < 320) p.scare({ x, y });
    }
    if (this.gunTimer <= 0) {
      let witness = false;
      for (const p of Entities.peds) if (dist(x, y, p.x, p.y) < 300 && p.state !== 'dead') { witness = true; if (Math.random() < 0.3) p.say(choice(PED_WITNESS)); break; }
      if (witness) { this.crime(1, 'spari in pubblico'); this.gunTimer = 25; }
    }
  },

  onPedHurt(ped) {
    for (const p of Entities.peds) {
      if (p !== ped && dist(ped.x, ped.y, p.x, p.y) < 220 && p.state !== 'dead') p.scare({ x: ped.x, y: ped.y }, 5);
    }
  },

  onPedKilled(ped) {
    this.onPedHurt(ped);
    for (const p of Entities.peds) {
      if (dist(ped.x, ped.y, p.x, p.y) < 300 && p.state !== 'dead' && Math.random() < 0.4) p.say(choice(PED_WITNESS));
    }
    if (ped.gang !== 'rival') this.crime(2, 'omicidio');
    sfx('thud');
  },

  onCopKilled() {
    this.crime(2, 'poliziotto ucciso');
  },

  onExplosion(car) {
    this.gunfire(car.x, car.y);
    this.crime(1, 'esplosione');
  },

  // ---------- interazioni con auto ----------
  nearestCar(range) {
    const pl = Game.player;
    let best = null, bd = range;
    for (const c of Entities.cars) {
      if (c.state === 'wreck') continue;
      const d = dist(pl.x, pl.y, c.x, c.y);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  },

  enterCar(car) {
    const pl = Game.player;
    if (car.state === 'traffic') {
      const driver = new Ped(car.x + rand(-30, 30), car.y + 34, {});
      driver.say(choice(['Aiuto! Ladro!!', 'Hanno rubato la mia macchina!', 'Il mio prelaziatooo!']));
      Entities.peds.push(driver);
      this.crime(1, 'furto d\'auto');
    } else if (car.state === 'parked' && !car.owner) {
      let witness = false;
      for (const p of Entities.peds) if (dist(car.x, car.y, p.x, p.y) < 250 && p.state !== 'dead') { witness = true; break; }
      if (witness) this.crime(1, 'furto d\'auto');
    }
    pl.inCar = car;
    car.state = 'player';
    sfx('door');
  },

  exitCar() {
    const pl = Game.player;
    const car = pl.inCar;
    if (!car) return;
    pl.inCar = null;
    car.state = car.owner ? 'parked' : 'parked';
    car.speed = 0;
    pl.x = car.x + Math.cos(car.angle + Math.PI / 2) * 34;
    pl.y = car.y + Math.sin(car.angle + Math.PI / 2) * 34;
    pl.collide();
  },

  nearestTalkablePed() {
    const pl = Game.player;
    let best = null, bd = 70;
    for (const p of Entities.peds) {
      if (p.state === 'dead' || p.gang === 'rival') continue;
      const d = dist(pl.x, pl.y, p.x, p.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  },

  talkToNearestPed() {
    const best = this.nearestTalkablePed();
    if (best) UI.startConversation(best);
    else UI.toast('Non c\u00e8 nessuno abbastanza vicino per parlare.', 'bad');
  },

  spawnAntonio() {
    const pizzeria = World.doors.find((d) => d.type === 'pizzeria');
    const antonio = new Ped(pizzeria.x + 80, pizzeria.y + 140, {
      name: 'Antonio', isAntonio: true, mood: 'friendly', shirt: '#2a9d8f',
    });
    antonio.hp = 120;
    Entities.peds.push(antonio);
    return antonio;
  },

  // ---------- morte giocatore ----------
  playerDied() {
    const pl = Game.player;
    pl.dead = true;
    UI.toast('Sei morto! L\'ospedale ti è costato ' + fmtMoney(HOSPITAL_RESPAWN_FEE), 'bad');
    setTimeout(() => {
      const hosp = World.doors.find((d) => d.type === 'hospital');
      pl.dead = false;
      pl.health = pl.maxHealth;
      pl.armor = 0;
      pl.inCar = null;
      pl.wanted = 0;
      pl.money = Math.max(0, pl.money - HOSPITAL_RESPAWN_FEE);
      Entities.cops.length = 0;
      Entities.bullets.length = 0;
      if (hosp) { pl.x = hosp.x; pl.y = hosp.y + 40; }
      UI.updateHUD();
      UI.fadeFlash();
    }, 1600);
  },

  // ---------- lavori ----------
  updateJob(dt) {
    const job = this.activeJob;
    if (!job) return;
    if (job.timer !== null) {
      job.timer -= dt;
      if (job.timer <= 0) {
        UI.toast('Lavoro fallito: tempo scaduto!', 'bad');
        this.activeJob = null;
        this.cleanupJob();
        return;
      }
    }
    const pl = Game.player;
    const obj = job.objective;
    if (obj && dist(pl.x, pl.y, obj.x, obj.y) < 55) {
      UI.setHint('Premi [E] per ' + obj.action);
      if (Input.hit('e')) this.completeJobStage();
    }
  },

  cleanupJob() {
    for (let i = Entities.peds.length - 1; i >= 0; i--) {
      if (Entities.peds[i].jobCustomer) Entities.peds.splice(i, 1);
    }
    for (let i = Entities.peds.length - 1; i >= 0; i--) {
      if (Entities.peds[i].gang === 'rival') Entities.peds.splice(i, 1);
    }
  },

  completeJobStage() {
    const job = this.activeJob;
    const pl = Game.player;
    sfx('cash');
    if (job.type === 'pizza') {
      const tip = Math.max(10, Math.round(60 - (job.elapsed || 0) * 0.7));
      pl.money += 50 + tip;
      UI.toast('Pizza consegnata! +' + fmtMoney(50 + tip) + ' (mancia ' + fmtMoney(tip) + ')', 'money');
      this.activeJob = null;
    } else if (job.type === 'waiter') {
      pl.money += 25;
      job.served++;
      UI.toast('Ordine servito! +' + fmtMoney(25) + ' (' + job.served + '/3)', 'money');
      job.customers.shift();
      if (job.served >= 3 || job.customers.length === 0) this.activeJob = null;
      else job.objective = job.customers[0];
    } else if (job.type === 'extort') {
      const pay = Math.round(150 * (1 + pl.gangRep * 0.12));
      pl.money += pay;
      pl.gangRep++;
      this.crime(1, 'estorsione');
      UI.toast('Estorsione riuscita! Il bottegaio ha pagato +' + fmtMoney(pay), 'money');
      this.activeJob = null;
    } else if (job.type === 'deal') {
      const pay = Math.round(250 * (1 + pl.gangRep * 0.12));
      pl.money += pay;
      pl.gangRep++;
      this.crime(1, 'spaccio');
      UI.toast('Spaccio concluso! +' + fmtMoney(pay), 'money');
      this.activeJob = null;
    } else if (job.type === 'rivals') {
      job.killed++;
      if (job.killed >= job.total) {
        const pay = Math.round(400 * (1 + pl.gangRep * 0.12));
        pl.money += pay;
        pl.gangRep += 2;
        this.crime(1, 'guerra di gang');
        UI.toast('Territorio difeso! +' + fmtMoney(pay) + ' e rispetto cresciuto', 'money');
        this.activeJob = null;
        this.cleanupJob();
      } else {
        UI.toast('Rivale eliminato (' + job.killed + '/' + job.total + ')', 'good');
      }
    }
    UI.updateHUD();
  },

  randomHouseDoor(minD, maxD) {
    const pl = Game.player;
    const opts = World.doors.filter((d) => {
      const dd = dist(d.x, d.y, pl.x, pl.y);
      return dd >= minD && dd <= maxD;
    });
    if (opts.length) return choice(opts);
    return choice(World.doors);
  },

  startPizzaJob() {
    const target = this.randomHouseDoor(400, 1600);
    this.activeJob = {
      type: 'pizza', timer: 100, elapsed: 0,
      objective: { x: target.x, y: target.y, action: 'consegnare la pizza', label: 'Consegna pizza' },
    };
    UI.closeDialog();
    UI.toast('Consegna la pizza prima che si freddi!', 'good');
  },

  startWaiterJob() {
    const rest = World.doors.find((d) => d.type === 'restaurant');
    const customers = [];
    for (let i = 0; i < 3; i++) {
      const a = rand(0, Math.PI * 2), d = rand(120, 320);
      const x = clamp(rest.x + Math.cos(a) * d, 60, WORLD_W - 60);
      const y = clamp(rest.y + Math.sin(a) * d, 60, WORLD_W - 60);
      const p = new Ped(x, y, {});
      p.jobCustomer = true;
      p.say('Ordino io! Aspetto qui.');
      Entities.peds.push(p);
      customers.push({ x, y, action: 'servire il cliente', label: 'Cliente' });
    }
    this.activeJob = { type: 'waiter', timer: 90, customers, served: 0, objective: customers[0] };
    UI.closeDialog();
    UI.toast('Servi 3 clienti entro 90 secondi!', 'good');
  },

  startGangMission(kind) {
    const pl = Game.player;
    UI.closeDialog();
    if (kind === 'extort') {
      const t = this.randomHouseDoor(500, 1500);
      this.activeJob = { type: 'extort', timer: null, objective: { x: t.x, y: t.y, action: 'riscuotere il pizzo', label: 'Bottega' } };
      UI.toast('Vai a riscuotere il pizzo. La polizia ti sta già giudicando male.', 'bad');
    } else if (kind === 'deal') {
      const t = this.randomHouseDoor(900, 2000);
      this.activeJob = { type: 'deal', timer: 120, objective: { x: t.x, y: t.y, action: 'consegnare il pacchetto', label: 'Consegna' } };
      UI.toast('Consegna il pacchetto. Evita la polizia!', 'bad');
    } else if (kind === 'rivals') {
      const base = this.randomHouseDoor(600, 1200);
      const total = 3;
      for (let i = 0; i < total; i++) {
        const p = new Ped(base.x + rand(-100, 100), base.y + rand(-100, 100), { shirt: '#c1121f', gang: 'rival' });
        p.hp = 45;
        Entities.peds.push(p);
      }
      this.activeJob = { type: 'rivals', timer: null, total, killed: 0, objective: { x: base.x, y: base.y, action: 'eliminare i rivali', label: 'Rivali' } };
      UI.toast('Tre rivali ti aspettano. Falli fuori!', 'bad');
    }
  },

  // ---------- negozi ----------
  openGunShop() {
    const pl = Game.player;
    const rows = [];
    const buttons = [];
    for (const id of WEAPON_ORDER) {
      const w = WEAPONS[id];
      if (!w.price) continue;
      const owned = pl.weapons[id];
      buttons.push({
        label: owned ? w.name + ' (già tuo)' : w.name,
        sub: fmtMoney(w.price),
        disabled: owned || pl.money < w.price,
        action: () => {
          pl.money -= w.price;
          pl.giveWeapon(id, 0);
          UI.toast(w.name + ' comprata!', 'good');
          UI.updateHUD();
          this.openGunShop();
        },
      });
      if (owned && w.ammoPrice) {
        buttons.push({
          label: 'Munizioni ' + w.name + ' (x' + w.ammoPack + ')',
          sub: fmtMoney(w.ammoPrice),
          disabled: pl.money < w.ammoPrice,
          action: () => {
            pl.money -= w.ammoPrice;
            pl.ammo[id] += w.ammoPack;
            UI.toast('+' + w.ammoPack + ' colpi per ' + w.name, 'good');
            UI.updateHUD();
            this.openGunShop();
          },
        });
      }
    }
    buttons.push({
      label: 'Giubbotto antiproiettile', sub: fmtMoney(ARMOR_PRICE),
      disabled: pl.armor >= 100 || pl.money < ARMOR_PRICE,
      action: () => { pl.money -= ARMOR_PRICE; pl.armor = 100; UI.toast('Ora sei un grugnito inarmaturato.', 'good'); UI.updateHUD(); this.openGunShop(); },
    });
    rows.push(choice(Dialogue.shopGreetings.gunshop));
    rows.push('(Il negozio non è responsabile per uso creativo dei prodotti.)');
    UI.dialog('Ammu-Nazione', rows.join('\n'), buttons);
  },

  openDealer() {
    const pl = Game.player;
    const buttons = [];
    for (const c of SHOP_CARS) {
      const owned = pl.ownedCars.some((oc) => oc.spec.id === c.id);
      buttons.push({
        label: c.name + (owned ? ' (già tua)' : ''),
        sub: fmtMoney(c.price),
        disabled: owned || pl.money < c.price,
        action: () => {
          pl.money -= c.price;
          const door = World.doors.find((d) => d.type === 'dealer');
          const car = new Car(door.x + rand(-60, 60), door.y + 70, 0, { ...c }, 'parked');
          car.owner = pl.custom.name;
          Entities.cars.push(car);
          pl.ownedCars.push(car);
          UI.toast(c.name + ' è tua! È parcheggiata fuori.', 'money');
          UI.updateHUD();
          this.openDealer();
        },
      });
    }
    const lost = pl.ownedCars.length;
    if (lost) {
      buttons.push({
        label: 'Recupera le tue auto (riportale qui)', sub: 'Gratis',
        action: () => {
          const door = World.doors.find((d) => d.type === 'dealer');
          for (const car of pl.ownedCars) {
            car.x = door.x + rand(-80, 80);
            car.y = door.y + 80 + rand(0, 60);
            if (car.state === 'wreck') { car.state = 'parked'; car.hp = 100; car.color = car.spec.color; }
          }
          UI.toast('Le tue auto sono in concessionaria.', 'good');
          UI.closeDialog();
        },
      });
    }
    UI.dialog('Concessionaria Temu', choice(Dialogue.shopGreetings.dealer) + '\nAuto "originali" a prezzi sospettosamente bassi.', buttons);
  },

  openPolice() {
    const pl = Game.player;
    if (pl.wanted === 0) {
      UI.dialog('Polizia', 'Non hai nessun mandato. Vai a lavorare, cittadino modello.', [
        { label: 'Esci', action: () => UI.closeDialog() },
      ]);
      return;
    }
    const cost = pl.wanted * 250;
    UI.dialog('Polizia — Cauzione', 'Stelle ricercato: ' + '★'.repeat(pl.wanted) + '\nCauzione: ' + fmtMoney(cost), [
      { label: 'Paga la cauzione', sub: fmtMoney(cost), disabled: pl.money < cost, action: () => { pl.money -= cost; pl.wanted = 0; Entities.cops.length = 0; UI.toast('Cauzione pagata. Sei pulito.', 'good'); UI.updateHUD(); UI.closeDialog(); } },
      { label: 'Esci', action: () => UI.closeDialog() },
    ]);
  },

  openHospital() {
    const pl = Game.player;
    const cost = 100;
    UI.dialog('Ospedale', 'Salute: ' + Math.round(pl.health) + '/100', [
      { label: 'Curati', sub: fmtMoney(cost), disabled: pl.health >= pl.maxHealth || pl.money < cost, action: () => { pl.money -= cost; pl.health = pl.maxHealth; UI.toast('Di nuovo in forma!', 'good'); UI.updateHUD(); UI.closeDialog(); } },
      { label: 'Esci', action: () => UI.closeDialog() },
    ]);
  },

  openPizzeria() {
    const job = this.activeJob;
    const buttons = [
      { label: 'Consegna una pizza', sub: 'fino a ' + fmtMoney(110), disabled: !!job, action: () => this.startPizzaJob() },
      { label: 'Esci', action: () => UI.closeDialog() },
    ];
    UI.dialog('Pizzeria "Da Gino"', choice(Dialogue.shopGreetings.pizzeria) + '\nGino: "Il forno è caldo e le pizze pure. Portale ai clienti prima che si raffreddino!"', buttons);
  },

  openRestaurant() {
    const job = this.activeJob;
    UI.dialog('Ristorante "Bella Napoli"', choice(Dialogue.shopGreetings.restaurant), [
      { label: 'Lavora come Chef', sub: 'minigioco, fino a ' + fmtMoney(90), disabled: !!job, action: () => { UI.closeDialog(); UI.startChefMinigame(); } },
      { label: 'Lavora come Cameriere', sub: '3 ordini, ' + fmtMoney(75), disabled: !!job, action: () => this.startWaiterJob() },
      { label: 'Esci', action: () => UI.closeDialog() },
    ]);
  },

  openGang() {
    const pl = Game.player;
    const rep = pl.gangRep;
    const job = this.activeJob;
    UI.dialog('Base Los Pepes',
      'Il boss ti fissa sopra gli occhiali da sole.\nRispetto nella gang: ' + rep + ' (' + (rep >= 6 ? 'LEGENDA' : rep >= 3 ? 'Uomo fidato' : 'Recluta') + ')',
      [
        { label: 'Estorsione', sub: fmtMoney(Math.round(150 * (1 + rep * 0.12))) + ' · +1★', disabled: !!job, action: () => this.startGangMission('extort') },
        { label: 'Spaccio', sub: fmtMoney(Math.round(250 * (1 + rep * 0.12))) + ' · +1★', disabled: !!job, action: () => this.startGangMission('deal') },
        { label: 'Guerra di territorio', sub: fmtMoney(Math.round(400 * (1 + rep * 0.12))) + ' · +2★', disabled: !!job, action: () => this.startGangMission('rivals') },
        { label: 'Esci', action: () => UI.closeDialog() },
      ]);
  },

  interactDoor(door) {
    switch (door.type) {
      case 'pizzeria': this.openPizzeria(); break;
      case 'restaurant': this.openRestaurant(); break;
      case 'gunshop': this.openGunShop(); break;
      case 'dealer': this.openDealer(); break;
      case 'gang': this.openGang(); break;
      case 'police': this.openPolice(); break;
      case 'hospital': this.openHospital(); break;
      default: UI.toast(door.label);
    }
  },

  // ---------- salvataggio ----------
  save() {
    const pl = Game.player;
    if (!pl) return;
    const data = {
      custom: pl.custom,
      money: pl.money,
      health: pl.health,
      armor: pl.armor,
      weapons: pl.weapons,
      ammo: pl.ammo,
      curWeapon: pl.curWeapon,
      gangRep: pl.gangRep,
      ownedCarIds: pl.ownedCars.map((c) => c.spec.id),
      x: pl.x, y: pl.y,
      timeMin: Game.timeMin,
      savedAt: Date.now(),
    };
    try { localStorage.setItem('gta-temu-save', JSON.stringify(data)); } catch (e) { /* storage non disponibile */ }
    UI.toast('Partita salvata.', 'good');
  },

  hasSave() {
    try { return !!localStorage.getItem('gta-temu-save'); } catch (e) { return false; }
  },

  loadSave() {
    try { return JSON.parse(localStorage.getItem('gta-temu-save')); } catch (e) { return null; }
  },

  clearSave() {
    try { localStorage.removeItem('gta-temu-save'); } catch (e) { /* noop */ }
  },

  // ---------- ciclo principale ----------
  update(dt) {
    const pl = Game.player;
    this.gunTimer = Math.max(0, this.gunTimer - dt);
    if (this.activeJob && this.activeJob.timer !== null && this.activeJob.type === 'pizza') this.activeJob.elapsed = (this.activeJob.elapsed || 0) + dt;

    pl.update(dt);
    this.updatePopulation(dt);
    updateBullets(dt);
    updateParticles(dt);
    this.updateJob(dt);

    // raccogli soldi
    for (let i = Entities.pickups.length - 1; i >= 0; i--) {
      const p = Entities.pickups[i];
      if (dist(pl.x, pl.y, p.x, p.y) < 26) {
        pl.money += p.amount;
        UI.toast('+' + fmtMoney(p.amount), 'money');
        sfx('cash');
        Entities.pickups.splice(i, 1);
        UI.updateHUD();
      }
    }

    // tempo di gioco: 1 ora = 30 secondi reali
    Game.timeMin = (Game.timeMin + dt * 2) % 1440;

    // consegne Temu
    Phone.updateDelivery();

    // SMS in arrivo (spam e consigli di Antonio)
    this.smsT = Math.max(0, (this.smsT === undefined ? 90 : this.smsT) - dt);
    if (this.smsT <= 0) {
      this.smsT = rand(150, 300);
      if (Math.random() < 0.6) Phone.receiveSMS('spam', choice(Phone.spamPool));
      else Phone.receiveSMS('antonio', choice(Phone.antonioTips));
    }
  },
};
