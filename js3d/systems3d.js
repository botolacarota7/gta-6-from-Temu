// ===== Sistemi 3D: popolazione, polizia, lavori, negozi, salvataggio =====
const Systems = {
  activeJob: null,
  gangPedsSpawned: false,
  evadeTimer: 0,
  gunTimer: 0,
  smsT: rand(40, 80),
  tempObjective: null,

  // ---------- popolazione ----------
  updatePopulation(dt) {
    const pl = Game.player;

    for (let i = Entities.peds.length - 1; i >= 0; i--) {
      const p = Entities.peds[i];
      p.update(dt, pl);
      const d = dist(p.x, p.z, pl.x, pl.z);
      if (p.isAntonio) {
        if (d > 460) { p.x = pl.x + rand(-80, 80); p.z = pl.z + rand(-80, 80); }
      } else if (d > 320 && p.gang !== 'rival') Entities.peds.splice(i, 1);
      else if (p.state === 'dead') Entities.peds.splice(i, 1);
    }
    const wantPeds = 30;
    let alive = 0;
    for (const p of Entities.peds) if (p.state !== 'dead') alive++;
    if (alive < wantPeds) this.spawnPedNear(pl);

    for (const p of Entities.peds) {
      if (p.gang === 'rival' && p.state !== 'dead') {
        const d = dist(p.x, p.z, pl.x, pl.z);
        p.shootT = (p.shootT || 0) - dt;
        if (d < 60 && !pl.dead) {
          p.angle = angleTo(p.x, p.z, pl.x, pl.z);
          if (p.shootT <= 0) {
            p.shootT = 1.0;
            npcShoot(p, p.angle + rand(-0.15, 0.15), 9);
          }
          if (d > 24) p.moveToward(pl.x, pl.z, dt, 5);
        }
      }
    }

    for (let i = Entities.cars.length - 1; i >= 0; i--) {
      const c = Entities.cars[i];
      c.update(dt, pl);
      if (c !== pl.inCar && dist(c.x, c.z, pl.x, pl.z) > 340 && c.state !== 'player') {
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

    const gangDoor = City3.doors.find((d) => d.type === 'gang');
    if (gangDoor) {
      const near = dist(pl.x, pl.z, gangDoor.x, gangDoor.y) < 140;
      if (near && !this.gangPedsSpawned) {
        this.gangPedsSpawned = true;
        for (let i = 0; i < 4; i++) {
          const p = new Person3(gangDoor.x + rand(-25, 25), gangDoor.y + rand(6, 30), { shirt: '#8e3b46', gang: 'pepes' });
          Entities.peds.push(p);
        }
      } else if (!near) this.gangPedsSpawned = false;
    }

    this.antonioCd = Math.max(0, (this.antonioCd || 0) - dt);
    const antonio = Entities.peds.find((p) => p.isAntonio && p.state !== 'dead');
    if (antonio && !UI.dialogOpen && !pl.inCar && !pl.dead && this.antonioCd <= 0 && dist(antonio.x, antonio.z, pl.x, pl.z) < 18) {
      this.antonioCd = 45;
      UI.startConversation(antonio);
    }

    this.ambientT = Math.max(0, (this.ambientT || 0) - dt);
    if (this.ambientT <= 0 && Entities.peds.length) {
      this.ambientT = rand(4, 8);
      const near = Entities.peds.filter((p) => p.state === 'walk' && dist(p.x, p.z, pl.x, pl.z) < 70);
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
      if (Entities.peds.length > 4 && Math.random() < 0.5) {
        const walkers = Entities.peds.filter((p) => p.state === 'walk');
        const a = choice(walkers);
        const b = walkers.filter((p) => p !== a && dist(p.x, p.z, a.x, a.z) < 32);
        if (b.length) {
          const pair = choice(Dialogue.pairChatter);
          a.say(pair[0]);
          b[0].pendingSay = { text: pair[1], t: 1.6 };
        }
      }
    }

    for (const c of [...Entities.cops]) c.update(dt, pl);
    const desiredCops = pl.wanted === 0 ? 0 : Math.min(6, pl.wanted + 1);
    if (Entities.cops.length < desiredCops && !pl.dead) this.spawnCop(pl);

    if (pl.wanted > 0) {
      let copNear = false;
      for (const c of Entities.cops) if (dist(c.x, c.z, pl.x, pl.z) < 110) { copNear = true; break; }
      if (!copNear) {
        this.evadeTimer += dt;
        if (this.evadeTimer > 12) {
          this.evadeTimer = 0;
          pl.wanted--;
          UI.toast(pl.wanted === 0 ? 'Sei pulito! La polizia ti ha perso.' : 'Livello ricercato ridotto.', 'good');
          UI.updateHUD();
          if (pl.wanted === 0) Entities.cops.length = 0;
        }
      } else this.evadeTimer = 0;
    }
  },

  spawnPedNear(pl) {
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), d = rand(100, 200);
      const x = clamp(pl.x + Math.cos(a) * d, 10, City3.size - 10);
      const z = clamp(pl.z + Math.sin(a) * d, 10, City3.size - 10);
      if (!City3.isOnRoad(x, z) && !City3.buildingAt(x, z, 1)) {
        Entities.peds.push(new Person3(x, z));
        return;
      }
    }
  },

  spawnTrafficCar(pl) {
    for (let i = 0; i < 20; i++) {
      const pt = City3.randomRoadPoint();
      const d = dist(pt.x, pt.z, pl.x, pl.z);
      if (d < 120 || d > 260) continue;
      const spec = {
        color: choice(TRAFFIC_COLORS),
        maxSpeed: 250, accel: 160,
        w: randInt(38, 48), h: randInt(19, 23),
        name: 'Auto',
      };
      const car = new Car3(pt.x, pt.z, 0, spec, 'traffic');
      car.initTraffic();
      Entities.cars.push(car);
      return;
    }
  },

  spawnParkedCar(pl) {
    for (let i = 0; i < 20; i++) {
      const pt = City3.randomSidewalkPoint();
      const d = dist(pt.x, pt.z, pl.x, pl.z);
      if (d < 60 || d > 220) continue;
      let occupied = false;
      for (const c of Entities.cars) if (dist(c.x, c.z, pt.x, pt.z) < 8) { occupied = true; break; }
      if (occupied) continue;
      const spec = {
        color: choice(TRAFFIC_COLORS), maxSpeed: 280, accel: 180,
        w: randInt(38, 48), h: randInt(19, 23), name: 'Auto',
      };
      Entities.cars.push(new Car3(pt.x, pt.z, rand(0, Math.PI * 2), spec, 'parked'));
      return;
    }
  },

  spawnCop(pl) {
    for (let i = 0; i < 12; i++) {
      const a = rand(0, Math.PI * 2), d = rand(100, 150);
      const x = clamp(pl.x + Math.cos(a) * d, 10, City3.size - 10);
      const z = clamp(pl.z + Math.sin(a) * d, 10, City3.size - 10);
      if (!City3.buildingAt(x, z, 2)) { Entities.cops.push(new Cop3(x, z)); return; }
    }
  },

  // ---------- crimine e ricercato ----------
  crime(stars, why) {
    const pl = Game.player;
    const before = pl.wanted;
    pl.wanted = Math.min(5, pl.wanted + stars);
    pl.lastCrime = Game.elapsed;
    if (pl.wanted > before) UI.toast('Ricercato! ' + '\u2605'.repeat(pl.wanted) + (why ? ' (' + why + ')' : ''), 'bad');
    UI.updateHUD();
  },

  gunfire(x, z) {
    for (const p of Entities.peds) {
      if (dist(x, z, p.x, p.z) < 65) p.scare({ x, y: z });
    }
    if (this.gunTimer <= 0) {
      let witness = false;
      for (const p of Entities.peds) if (dist(x, z, p.x, p.z) < 60 && p.state !== 'dead') { witness = true; if (Math.random() < 0.3) p.say(choice(PED_WITNESS)); break; }
      if (witness) { this.crime(1, 'spari in pubblico'); this.gunTimer = 25; }
    }
  },

  onPedHurt(ped) {
    for (const p of Entities.peds) {
      if (p !== ped && dist(ped.x, ped.z, p.x, p.z) < 45 && p.state !== 'dead') p.scare({ x: ped.x, y: ped.z }, 5);
    }
  },

  onPedKilled(ped) {
    this.onPedHurt(ped);
    for (const p of Entities.peds) {
      if (dist(ped.x, ped.z, p.x, p.z) < 60 && p.state !== 'dead' && Math.random() < 0.4) p.say(choice(PED_WITNESS));
    }
    if (ped.gang !== 'rival') this.crime(2, 'omicidio');
    sfx('thud');
  },

  onCopKilled() {
    this.crime(2, 'poliziotto ucciso');
  },

  onExplosion(car) {
    this.gunfire(car.x, car.z);
    this.crime(1, 'esplosione');
  },

  // ---------- interazioni con auto ----------
  nearestCar(range) {
    const pl = Game.player;
    let best = null, bd = range;
    for (const c of Entities.cars) {
      if (c.state === 'wreck') continue;
      const d = dist(pl.x, pl.z, c.x, c.z);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  },

  enterCar(car) {
    const pl = Game.player;
    if (car.state === 'traffic') {
      const driver = new Person3(car.x + rand(-3, 3), car.z + 3, {});
      driver.say(choice(['Aiuto! Ladro!!', 'Hanno rubato la mia macchina!', 'Il mio prelaziatooo!']));
      Entities.peds.push(driver);
      this.crime(1, 'furto d\'auto');
    } else if (car.state === 'parked' && !car.owner) {
      let witness = false;
      for (const p of Entities.peds) if (dist(car.x, car.z, p.x, p.z) < 50 && p.state !== 'dead') { witness = true; break; }
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
    car.state = 'parked';
    car.speed = 0;
    pl.x = car.x + Math.cos(car.angle + Math.PI / 2) * 2.4;
    pl.z = car.z + Math.sin(car.angle + Math.PI / 2) * 2.4;
    this.collidePoint(pl);
  },

  collidePoint(pl) {
    for (const b of City3.buildings) {
      if (pl.x > b.x - pl.radius && pl.x < b.x + b.w + pl.radius && pl.z > b.z - pl.radius && pl.z < b.z + b.d + pl.radius) {
        const cx = clamp(pl.x, b.x, b.x + b.w);
        const cz = clamp(pl.z, b.z, b.z + b.d);
        const d = dist(pl.x, pl.z, cx, cz) || 0.001;
        pl.x = cx + (pl.x - cx) / d * pl.radius;
        pl.z = cz + (pl.z - cz) / d * pl.radius;
      }
    }
    pl.x = clamp(pl.x, 3, City3.size - 3);
    pl.z = clamp(pl.z, 3, City3.size - 3);
  },

  nearestTalkablePed() {
    const pl = Game.player;
    let best = null, bd = 14;
    for (const p of Entities.peds) {
      if (p.state === 'dead' || p.gang === 'rival') continue;
      const d = dist(pl.x, pl.z, p.x, p.z);
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
    const pizzeria = City3.doors.find((d) => d.type === 'pizzeria');
    const antonio = new Person3(pizzeria.x + 16, pizzeria.y + 28, {
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
    UI.toast('Sei morto! L\'ospedale ti \u00e8 costato ' + fmtMoney(HOSPITAL_RESPAWN_FEE), 'bad');
    setTimeout(() => {
      const hosp = City3.doors.find((d) => d.type === 'hospital');
      pl.dead = false;
      pl.health = pl.maxHealth;
      pl.armor = 0;
      pl.inCar = null;
      pl.wanted = 0;
      pl.money = Math.max(0, pl.money - HOSPITAL_RESPAWN_FEE);
      Entities.cops.length = 0;
      Entities.bullets.length = 0;
      if (hosp) { pl.x = hosp.x; pl.z = hosp.y + 8; }
      UI.updateHUD();
      UI.fadeFlash();
    }, 1600);
  },

  // ---------- lavori ----------
  updateJob(dt) {
    const job = this.activeJob;
    if (!job) return;
    job.elapsed = (job.elapsed || 0) + dt;
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
    if (obj && dist(pl.x, pl.y, obj.x, obj.y) < 11) {
      UI.setHint('Premi [E] per ' + obj.action);
      if (Input.hit('e')) this.completeJobStage();
    }
  },

  cleanupJob() {
    for (let i = Entities.peds.length - 1; i >= 0; i--) {
      if (Entities.peds[i].jobCustomer || Entities.peds[i].gang === 'rival') Entities.peds.splice(i, 1);
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

  randomDoor(minD, maxD) {
    const pl = Game.player;
    const opts = City3.doors.filter((d) => {
      const dd = dist(d.x, d.y, pl.x, pl.y);
      return dd >= minD && dd <= maxD;
    });
    if (opts.length) return choice(opts);
    return choice(City3.doors);
  },

  startPizzaJob() {
    const target = this.randomDoor(80, 320);
    this.activeJob = {
      type: 'pizza', timer: 100, elapsed: 0,
      objective: { x: target.x, y: target.y, action: 'consegnare la pizza', label: 'Consegna pizza' },
    };
    UI.closeDialog();
    UI.toast('Consegna la pizza prima che si freddi!', 'good');
  },

  startWaiterJob() {
    const rest = City3.doors.find((d) => d.type === 'restaurant');
    const customers = [];
    for (let i = 0; i < 3; i++) {
      const pt = City3.randomSidewalkPoint();
      const x = clamp(pt.x, rest.x - 65, rest.x + 65);
      const z = clamp(pt.z, rest.y - 65, rest.y + 65);
      const p = new Person3(x, z, {});
      p.jobCustomer = true;
      p.say('Ordino io! Aspetto qui.');
      Entities.peds.push(p);
      customers.push({ x, y: z, action: 'servire il cliente', label: 'Cliente' });
    }
    this.activeJob = { type: 'waiter', timer: 90, customers, served: 0, objective: customers[0] };
    UI.closeDialog();
    UI.toast('Servi 3 clienti entro 90 secondi!', 'good');
  },

  startGangMission(kind) {
    const pl = Game.player;
    UI.closeDialog();
    if (kind === 'extort') {
      const t = this.randomDoor(100, 300);
      this.activeJob = { type: 'extort', timer: null, objective: { x: t.x, y: t.y, action: 'riscuotere il pizzo', label: 'Bottega' } };
      UI.toast('Vai a riscuotere il pizzo. La polizia ti sta gi\u00e0 giudicando male.', 'bad');
    } else if (kind === 'deal') {
      const t = this.randomDoor(180, 400);
      this.activeJob = { type: 'deal', timer: 120, objective: { x: t.x, y: t.y, action: 'consegnare il pacchetto', label: 'Consegna' } };
      UI.toast('Consegna il pacchetto. Evita la polizia!', 'bad');
    } else if (kind === 'rivals') {
      const base = this.randomDoor(120, 240);
      const total = 3;
      for (let i = 0; i < total; i++) {
        const p = new Person3(base.x + rand(-20, 20), base.y + rand(-20, 20), { shirt: '#c1121f', gang: 'rival' });
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
        label: owned ? w.name + ' (gi\u00e0 tuo)' : w.name,
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
    rows.push('(Il negozio non \u00e8 responsabile per uso creativo dei prodotti.)');
    UI.dialog('Ammu-Nazione', rows.join('\n'), buttons);
  },

  openDealer() {
    const pl = Game.player;
    const buttons = [];
    for (const c of SHOP_CARS) {
      const owned = pl.ownedCars.some((oc) => oc.spec.id === c.id);
      buttons.push({
        label: c.name + (owned ? ' (gi\u00e0 tua)' : ''),
        sub: fmtMoney(c.price),
        disabled: owned || pl.money < c.price,
        action: () => {
          pl.money -= c.price;
          const door = City3.doors.find((d) => d.type === 'dealer');
          const car = new Car3(door.x + rand(-12, 12), door.y + 14, 0, { ...c }, 'parked');
          car.owner = pl.custom.name;
          Entities.cars.push(car);
          pl.ownedCars.push(car);
          UI.toast(c.name + ' \u00e8 tua! \u00c8 parcheggiata fuori.', 'money');
          UI.updateHUD();
          this.openDealer();
        },
      });
    }
    if (pl.ownedCars.length) {
      buttons.push({
        label: 'Recupera le tue auto (riportale qui)', sub: 'Gratis',
        action: () => {
          const door = City3.doors.find((d) => d.type === 'dealer');
          for (const car of pl.ownedCars) {
            car.x = door.x + rand(-16, 16);
            car.z = door.y + 16 + rand(0, 12);
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
    UI.dialog('Polizia \u2014 Cauzione', 'Stelle ricercato: ' + '\u2605'.repeat(pl.wanted) + '\nCauzione: ' + fmtMoney(cost), [
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
    UI.dialog('Pizzeria "Da Gino"', choice(Dialogue.shopGreetings.pizzeria) + '\nGino: "Il forno \u00e8 caldo e le pizze pure. Portale ai clienti prima che si raffreddino!"', buttons);
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
        { label: 'Estorsione', sub: fmtMoney(Math.round(150 * (1 + rep * 0.12))) + ' \u00b7 +1\u2605', disabled: !!job, action: () => this.startGangMission('extort') },
        { label: 'Spaccio', sub: fmtMoney(Math.round(250 * (1 + rep * 0.12))) + ' \u00b7 +1\u2605', disabled: !!job, action: () => this.startGangMission('deal') },
        { label: 'Guerra di territorio', sub: fmtMoney(Math.round(400 * (1 + rep * 0.12))) + ' \u00b7 +2\u2605', disabled: !!job, action: () => this.startGangMission('rivals') },
        { label: 'Esci', action: () => UI.closeDialog() },
      ]);
  },

  interactDoor(door) {
    this.openShopFor(door.type);
  },

  openShopFor(type) {
    switch (type) {
      case 'pizzeria': this.openPizzeria(); break;
      case 'restaurant': this.openRestaurant(); break;
      case 'gunshop': this.openGunShop(); break;
      case 'dealer': this.openDealer(); break;
      case 'gang': this.openGang(); break;
      case 'police': this.openPolice(); break;
      case 'hospital': this.openHospital(); break;
      default: UI.toast('Qui non c\u00e8 servizio al banco.');
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

  // ---------- update principale ----------
  update(dt) {
    this.gunTimer = Math.max(0, this.gunTimer - dt);
    this.updatePopulation(dt);
    this.updateJob(dt);

    if (this.tempObjective) {
      this.tempObjective.t -= dt;
      if (this.tempObjective.t <= 0) this.tempObjective = null;
    }

    const pl = Game.player;
    for (let i = Entities.pickups.length - 1; i >= 0; i--) {
      const p = Entities.pickups[i];
      p.t -= dt;
      if (p.t <= 0) { Entities.pickups.splice(i, 1); continue; }
      if (dist(pl.x, pl.y, p.x, p.y) < 2.2 && !pl.inCar) {
        pl.money += p.amount;
        UI.toast('+' + fmtMoney(p.amount), 'money');
        sfx('cash');
        UI.updateHUD();
        Entities.pickups.splice(i, 1);
      }
    }

    for (let i = Entities.bullets.length - 1; i >= 0; i--) {
      const b = Entities.bullets[i];
      b.t -= dt;
      if (b.t <= 0) { b._dead = true; Entities.bullets.splice(i, 1); }
    }

    for (let i = Entities.particles.length - 1; i >= 0; i--) {
      const p = Entities.particles[i];
      p.life -= dt;
      if (p.life <= 0) { Entities.particles.splice(i, 1); continue; }
      p.vy -= 9 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.05) { p.y = 0.05; p.vy = 0; p.vx *= 0.8; p.vz *= 0.8; }
    }

    for (let i = Entities.corpses.length - 1; i >= 0; i--) {
      const c = Entities.corpses[i];
      c.t -= dt;
      if (c.t <= 0) Entities.corpses.splice(i, 1);
    }

    this.smsT -= dt;
    if (this.smsT <= 0) {
      this.smsT = rand(50, 110);
      if (Math.random() < 0.6) Phone.receiveSMS('antonio', choice(Phone.antonioTips));
      else Phone.receiveSMS('spam', '');
    }

    Phone.updateDelivery();

    Game.timeMin = (Game.timeMin + dt * 2) % 1440;
  },
};
