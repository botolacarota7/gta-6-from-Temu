// ===== Mondo 3D: scena Three.js, mesh città, giorno/notte, minimappa, bolle =====
const World3 = {
  renderer: null, scene: null, camera: null,
  sun: null, hemi: null,
  lampMats: [], doorMarkers: [], neonMats: [],
  bubbleMap: new Map(),
  minimapBase: null, mmScale: 1,
  ready: false,

  init(canvas) {
    if (this.ready) return;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 900);

    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x54483a, 0.9);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d9, 1.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -70;
    this.sun.shadow.camera.right = 70;
    this.sun.shadow.camera.top = 70;
    this.sun.shadow.camera.bottom = -70;
    this.sun.shadow.camera.far = 400;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    this.buildCity();
    this.buildMinimapBase();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.ready = true;
  },

  resize() {
    if (!this.renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },

  // ---------- materiali condivisi ----------
  matCache: {},
  basicMat(color) {
    if (!this.matCache[color]) this.matCache[color] = new THREE.MeshBasicMaterial({ color });
    return this.matCache[color];
  },
  lambertMat(color) {
    const k = 'l' + color;
    if (!this.matCache[k]) this.matCache[k] = new THREE.MeshLambertMaterial({ color });
    return this.matCache[k];
  },

  makeWindowTexture(baseColor) {
    const cv = document.createElement('canvas');
    cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = baseColor;
    g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const lit = Math.random() < 0.35;
        g.fillStyle = lit ? '#ffd98a' : 'rgba(20,26,40,0.85)';
        g.fillRect(14 + x * 28, 12 + y * 30, 16, 18);
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  },

  // ---------- costruzione città ----------
  buildCity() {
    const S = City3.size;
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(S + 400, S + 400),
      new THREE.MeshLambertMaterial({ color: 0x4a7d4a })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(S / 2, -0.05, S / 2);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const roadMat = new THREE.MeshLambertMaterial({ color: 0x2e2e34 });
    for (let i = 0; i <= City3.GRID; i++) {
      const c = City3.laneCoords[i];
      const rh = new THREE.Mesh(new THREE.PlaneGeometry(S, City3.ROAD), roadMat);
      rh.rotation.x = -Math.PI / 2;
      rh.position.set(S / 2, 0, c);
      rh.receiveShadow = true;
      this.scene.add(rh);
      const rv = new THREE.Mesh(new THREE.PlaneGeometry(City3.ROAD, S), roadMat);
      rv.rotation.x = -Math.PI / 2;
      rv.position.set(c, 0, S / 2);
      rv.receiveShadow = true;
      this.scene.add(rv);
    }

    const sideMat = new THREE.MeshLambertMaterial({ color: 0x9aa0a6 });
    for (const px of [0, 1]) {
      for (const bx of Array(City3.GRID).keys()) {
        for (const bz of Array(City3.GRID).keys()) {
          const x0 = bx * City3.CELL + City3.ROAD;
          const z0 = bz * City3.CELL + City3.ROAD;
          const sw = new THREE.Mesh(new THREE.PlaneGeometry(City3.BLOCK + 4, City3.BLOCK + 4), sideMat);
          sw.rotation.x = -Math.PI / 2;
          sw.position.set(x0 + City3.BLOCK / 2, 0.02, z0 + City3.BLOCK / 2);
          sw.receiveShadow = true;
          this.scene.add(sw);
        }
      }
    }

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    for (const b of City3.buildings) {
      const tex = this.makeWindowTexture(b.color);
      tex.repeat.set(Math.max(1, Math.round(b.w / 10)), Math.max(1, Math.round(b.h / 8)));
      const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, map: tex });
      const m = new THREE.Mesh(boxGeo, mat);
      m.scale.set(b.w, b.h, b.d);
      m.position.set(b.x + b.w / 2, b.h / 2, b.z + b.d / 2);
      m.castShadow = true;
      m.receiveShadow = true;
      this.scene.add(m);
      if (b.special) {
        const spec = SPECIAL_BUILDINGS.find((s) => s.key === b.special);
        const neon = new THREE.Mesh(
          new THREE.PlaneGeometry(b.w * 0.7, 4),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(spec.blip) })
        );
        neon.position.set(b.door.x, b.h + 2, b.z + b.d + 0.3);
        this.scene.add(neon);
        this.neonMats.push(neon.material);
        const marker = new THREE.Mesh(
          new THREE.CylinderGeometry(1.1, 1.1, 0.25, 16),
          new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85 })
        );
        marker.position.set(b.door.x, 0.15, b.door.z);
        this.scene.add(marker);
        this.doorMarkers.push(marker);
      }
    }

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, 6, 6);
    const poleMat = this.lambertMat('#3a3a3a');
    const bulbGeo = new THREE.SphereGeometry(0.35, 8, 8);
    for (const l of City3.lamps) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(l.x, 3, l.z);
      this.scene.add(pole);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0x554d33 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(l.x, 6.1, l.z);
      this.scene.add(bulb);
      this.lampMats.push(bulbMat);
    }

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.4, 6);
    const trunkMat = this.lambertMat('#5a4632');
    const leafGeo = new THREE.SphereGeometry(1.6, 8, 8);
    const leafMat = this.lambertMat('#3f7d3f');
    for (const t of City3.trees) {
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(t.x, 1.2, t.z);
      trunk.castShadow = true;
      this.scene.add(trunk);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.scale.setScalar(t.s);
      leaf.position.set(t.x, 3 + t.s, t.z);
      leaf.castShadow = true;
      this.scene.add(leaf);
    }
  },

  // ---------- mesh personaggi ----------
  buildPersonMesh(o) {
    const g = new THREE.Group();
    const mk = (w, h, d, color, x, y, z, parent) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.lambertMat(color));
      m.position.set(x, y, z);
      m.castShadow = true;
      (parent || g).add(m);
      return m;
    };

    const body = mk(0.52, 0.6, 0.3, o.shirt, 0, 1.18, 0);
    const hips = mk(0.46, 0.16, 0.28, o.pants, 0, 0.84, 0);

    // arti con perno su fianco/spalla: ruotano dall'estremità superiore, non dal centro
    const mkLimb = (x, y, w, len, d, color, withHand) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, 0);
      g.add(pivot);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, d), this.lambertMat(color));
      m.position.y = -len / 2;
      m.castShadow = true;
      pivot.add(m);
      if (withHand) {
        const hand = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.12, d * 0.9), this.lambertMat(o.skin || '#e0ac69'));
        hand.position.y = -len + 0.04;
        pivot.add(hand);
      } else {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, w + 0.04), this.lambertMat('#1c1c1c'));
        foot.position.set(0.05, -len + 0.03, 0);
        pivot.add(foot);
      }
      return pivot;
    };
    const legL = mkLimb(-0.13, 0.78, 0.2, 0.72, 0.22, o.pants, false);
    const legR = mkLimb(0.13, 0.78, 0.2, 0.72, 0.22, o.pants, false);
    const armL = mkLimb(-0.34, 1.42, 0.14, 0.56, 0.16, o.shirt, true);
    const armR = mkLimb(0.34, 1.42, 0.14, 0.56, 0.16, o.shirt, true);

    const head = mk(0.34, 0.34, 0.32, o.skin, 0, 1.68, 0);
    const eyeMat = this.basicMat('#20232b');
    for (const ez of [0.075, -0.075]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.06), eyeMat);
      eye.position.set(0.17, 1.72, ez);
      g.add(eye);
    }
    const hair = mk(0.37, 0.13, 0.35, o.hair, -0.02, 1.88, 0);
    const back = mk(0.16, 0.3, 0.35, o.hair, -0.14, 1.72, 0);

    if (o.hat === 'cap') {
      mk(0.38, 0.12, 0.37, o.shirt, -0.01, 1.9, 0);
      mk(0.18, 0.04, 0.3, o.shirt, 0.24, 1.87, 0);
    } else if (o.hat === 'top hat') {
      mk(0.5, 0.05, 0.48, '#111111', 0, 1.88, 0);
      mk(0.3, 0.3, 0.3, '#111111', -0.02, 2.04, 0);
    } else if (o.hat === 'bandana') {
      mk(0.36, 0.09, 0.34, '#c1121f', -0.01, 1.8, 0);
    }

    // armi in mano destra, nascoste di default (visibili solo per chi le porta)
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.09), this.basicMat('#141414'));
    gun.position.set(0.08, -0.56, 0);
    gun.visible = false;
    armR.add(gun);
    const bat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.09), this.lambertMat('#7a5a30'));
    bat.position.set(0.14, -0.6, 0);
    bat.rotation.z = 0.4;
    bat.visible = false;
    armR.add(bat);

    g.userData.parts = { legL, legR, armL, armR, body, head, gun, bat };
    return g;
  },

  buildCopMesh() {
    return this.buildPersonMesh({ skin: '#e0ac69', shirt: '#1f4e8c', pants: '#16283f', hair: '#2b2b2b', hat: 'cap' });
  },

  buildCarMesh(color, len, wid) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(len, 0.6, wid), this.lambertMat(color));
    body.position.y = 0.55;
    body.castShadow = true;
    g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(len * 0.45, 0.5, wid * 0.85), this.lambertMat('#222831'));
    cabin.position.set(-len * 0.08, 1.05, 0);
    g.add(cabin);
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10);
    const wheelMat = this.lambertMat('#151515');
    for (const [wx, wz] of [[len * 0.32, wid / 2], [len * 0.32, -wid / 2], [-len * 0.32, wid / 2], [-len * 0.32, -wid / 2]]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.32, wz);
      g.add(w);
    }
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x554d33 });
    for (const wz of [wid * 0.3, -wid * 0.3]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.25), lightMat);
      hl.position.set(len / 2, 0.6, wz);
      g.add(hl);
    }
    g.userData.lightMat = lightMat;
    return g;
  },

  addTracerViews() {
    for (const ch of [...this.scene.children]) {
      if (ch.userData && ch.userData._bulletRec && (ch.userData._bulletRec._dead || ch.userData._bulletRec.t <= 0)) {
        this.scene.remove(ch);
        ch.geometry.dispose();
        ch.material.dispose();
      }
    }
    for (const b of Entities.bullets) {
      if (b._line) continue;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(b.x1, b.y1, b.z1),
        new THREE.Vector3(b.x2, b.y2, b.z2),
      ]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9 }));
      line.userData._bulletRec = b;
      this.scene.add(line);
      b._line = line;
    }
  },

  updateDayNight(timeMin) {
    const h = timeMin / 60;
    let night;
    if (h < 5.5) night = 1;
    else if (h < 7) night = 1 - (h - 5.5) / 1.5;
    else if (h > 20.5) night = 1;
    else if (h > 19) night = (h - 19) / 1.5;
    else night = 0;
    night = clamp(night, 0, 1);

    const day = new THREE.Color(0x87ceeb), nightC = new THREE.Color(0x0a0e2a);
    const sky = day.clone().lerp(nightC, night);
    this.scene.background = sky;
    if (this.scene.fog) this.scene.fog.color = sky;
    else this.scene.fog = new THREE.Fog(sky.getHex(), 140, 520);
    this.sun.intensity = 1.0 - night * 0.85;
    this.hemi.intensity = 0.9 - night * 0.5;
    for (const m of this.lampMats) m.color.setHex(night > 0.4 ? 0xffe08a : 0x554d33);
    for (const m of this.neonMats) m.color.multiplyScalar(1);
    for (const c of Entities.cars) {
      if (c.view && c.view.userData.lightMat) c.view.userData.lightMat.color.setHex(night > 0.3 ? 0xffe08a : 0x554d33);
    }
    const S = City3.size;
    const px = Game.player ? Game.player.x : S / 2;
    const pz = Game.player ? Game.player.z : S / 2;
    this.sun.position.set(px + 60, 120, pz + 30);
    this.sun.target.position.set(px, 0, pz);
  },

  // ---------- sincronizzazione mesh ----------
  syncPersonView(e, mesh) {
    const parts = mesh.userData.parts;
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = -e.angle;
    if (e.state === 'dead') {
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = 0;
      mesh.position.set(e.x, 0.25, e.z);
      return;
    }
    mesh.rotation.x = 0;
    mesh.rotation.z = 0;
    const moving = e.state !== 'react';
    const ph = moving ? Math.sin(e.walkPhase) : 0;
    if (parts.legL) parts.legL.rotation.x = ph * 0.55;
    if (parts.legR) parts.legR.rotation.x = -ph * 0.55;
    if (parts.armL) parts.armL.rotation.x = -ph * 0.45;
    if (parts.armR) parts.armR.rotation.x = ph * 0.45;
    mesh.position.set(e.x, moving ? Math.abs(Math.sin(e.walkPhase)) * 0.05 : 0, e.z);
  },

  syncViews(dt) {
    const seen = new Set();

    const syncList = (list, build) => {
      for (const e of list) {
        seen.add(e);
        if (!e.view) {
          e.view = build(e);
          e.view.userData._entity = e;
          this.scene.add(e.view);
        }
      }
    };
    syncList(Entities.peds, (e) => this.buildPersonMesh(e));
    syncList(Entities.cops, () => this.buildCopMesh());
    syncList(Entities.cars, (c) => this.buildCarMesh(c.color, c.len, c.wid));
    syncList(Entities.pickups, () => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), this.basicMat('#2c8f2c'));
      m.userData.isPickup = true;
      return m;
    });
    syncList(Entities.particles, (p) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.basicMat(p.color));
      m.scale.setScalar(p.size);
      m.userData.isParticle = true;
      return m;
    });
    syncList(Entities.corpses, (c) => {
      const m = this.buildPersonMesh({ skin: c.skin, shirt: c.shirt, pants: '#333', hair: '#222', hat: 'none' });
      m.rotation.order = 'YXZ';
      m.rotation.x = -Math.PI / 2;
      return m;
    });

    const pl = Game.player;
    seen.add(pl);
    if (!pl.view) { pl.view = this.buildPersonMesh(pl.custom); pl.view.userData._entity = pl; this.scene.add(pl.view); }
    if (!pl.inCar && !pl.dead) {
      this.syncPersonView(pl, pl.view);
      const pp = pl.view.userData.parts;
      if (pp.gun) pp.gun.visible = !!WEAPONS[pl.curWeapon].bullet;
      if (pp.bat) pp.bat.visible = pl.curWeapon === 'bat';
      pl.view.visible = true;
    } else pl.view.visible = false;

    for (const p of Entities.peds) {
      if (p.state === 'dead') { p.view.visible = false; continue; }
      p.view.visible = true;
      this.syncPersonView(p, p.view);
    }
    for (const c of Entities.cops) this.syncPersonView(c, c.view);
    for (const c of Entities.cars) {
      c.view.position.set(c.x, 0, c.z);
      c.view.rotation.y = -c.angle;
      if (c.state === 'wreck') c.view.children[0].material = this.lambertMat('#2a2a2a');
    }
    for (const p of Entities.pickups) {
      p.view.position.set(p.x, 0.6 + Math.sin(Game.elapsed * 6) * 0.12, p.y);
      p.view.rotation.y += dt * 3;
    }
    for (const p of Entities.particles) {
      p.view.position.set(p.x, p.y, p.z);
      const s = clamp(p.life / p.maxLife, 0, 1);
      p.view.scale.setScalar(p.size * (0.5 + s));
      p.view.visible = true;
    }
    for (const c of Entities.corpses) {
      c.view.position.set(c.x, 0.25, c.z);
      c.view.rotation.y = -c.angle;
      c.view.visible = c.t > 2;
    }

    this.addTracerViews();
    for (const b of Entities.bullets) {
      if (b._line) b._line.material.opacity = clamp(b.t / 0.1, 0, 1) * 0.9;
    }

    for (const m of this.doorMarkers) {
      const s = 1 + Math.sin(Game.elapsed * 5) * 0.2;
      m.scale.set(s, 1, s);
    }

    this.syncBubbles();
    this.pruneViews(seen);
  },

  pruneViews(seen) {
    for (const e of [...this.scene.children]) {
      if (!e.userData || !e.userData._entity) continue;
      if (!seen.has(e.userData._entity)) {
        this.scene.remove(e);
        const div = this.bubbleMap.get(e.userData._entity);
        if (div) { div.remove(); this.bubbleMap.delete(e.userData._entity); }
      }
    }
  },

  syncBubbles() {
    const container = document.getElementById('bubbles');
    const seen = new Set();
    const handle = (e, h) => {
      if (!e.bubble) {
        const old = this.bubbleMap.get(e);
        if (old) { old.remove(); this.bubbleMap.delete(e); }
        return;
      }
      seen.add(e);
      let div = this.bubbleMap.get(e);
      if (!div) {
        div = document.createElement('div');
        div.className = 'bubble3d';
        container.appendChild(div);
        this.bubbleMap.set(e, div);
      }
      const v = new THREE.Vector3(e.x, 2.3, e.z).project(this.camera);
      if (v.z > 1) { div.style.display = 'none'; return; }
      div.style.display = 'block';
      div.style.left = ((v.x + 1) / 2 * window.innerWidth) + 'px';
      div.style.top = ((-v.y + 1) / 2 * window.innerHeight) + 'px';
      if (div.textContent !== e.bubble) div.textContent = e.bubble;
    };
    for (const p of Entities.peds) if (p.state !== 'dead') handle(p);
    for (const c of Entities.cops) handle(c);
    for (const [e, div] of [...this.bubbleMap]) {
      if (!seen.has(e)) { div.remove(); this.bubbleMap.delete(e); }
    }
  },

  // ---------- minimappa ----------
  buildMinimapBase() {
    const cv = document.createElement('canvas');
    cv.width = 170; cv.height = 170;
    const m = cv.getContext('2d');
    const s = 170 / City3.size;
    this.mmScale = s;
    m.fillStyle = '#3f6f3f';
    m.fillRect(0, 0, 170, 170);
    m.fillStyle = '#2e2e34';
    for (let i = 0; i <= City3.GRID; i++) {
      const c = City3.laneCoords[i] * s;
      m.fillRect(0, c - City3.ROAD * s / 2, 170, City3.ROAD * s);
      m.fillRect(c - City3.ROAD * s / 2, 0, City3.ROAD * s, 170);
    }
    for (const b of City3.buildings) {
      m.fillStyle = b.special ? SPECIAL_BUILDINGS.find((sp) => sp.key === b.special).blip : '#777';
      m.fillRect(b.x * s, b.z * s, b.w * s, b.d * s);
    }
    this.minimapBase = cv;
  },

  drawMinimap() {
    const mm = document.getElementById('minimap');
    const m = mm.getContext('2d');
    m.drawImage(this.minimapBase, 0, 0);
    const s = this.mmScale;
    const blink = Math.sin(Game.elapsed * 6) > 0;

    const job = Systems.activeJob;
    if (job && blink) {
      m.fillStyle = '#ffd23f';
      m.beginPath(); m.arc(job.objective.x * s, job.objective.y * s, 4, 0, Math.PI * 2); m.fill();
    }
    if (Systems.tempObjective && blink) {
      m.fillStyle = '#69f069';
      m.beginPath(); m.arc(Systems.tempObjective.x * s, Systems.tempObjective.y * s, 3.5, 0, Math.PI * 2); m.fill();
    }
    m.fillStyle = '#4fc3f7';
    for (const c of Entities.cops) { m.beginPath(); m.arc(c.x * s, c.z * s, 2, 0, Math.PI * 2); m.fill(); }
    m.fillStyle = '#7dd87d';
    for (const c of Game.player.ownedCars) { m.fillRect(c.x * s - 2, c.z * s - 2, 4, 4); }
    m.fillStyle = '#ff5252';
    for (const p of Entities.peds) {
      if (p.gang === 'rival' && p.state !== 'dead') { m.beginPath(); m.arc(p.x * s, p.z * s, 2.5, 0, Math.PI * 2); m.fill(); }
    }
    const pl = Game.player;
    m.fillStyle = '#fff';
    m.strokeStyle = '#000';
    m.lineWidth = 1;
    m.beginPath(); m.arc(pl.x * s, pl.z * s, 3, 0, Math.PI * 2); m.fill(); m.stroke();
  },
};
