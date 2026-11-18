// ===== Mondo 3D: scena Three.js, mesh città, giorno/notte, minimappa, bolle =====
const World3 = {
  renderer: null, scene: null, camera: null,
  sun: null, hemi: null,
  lampMats: [], doorMarkers: [], neonMats: [],
  bubbleMap: new Map(),
  minimapBase: null, mmScale: 1,
  ready: false,
  avatarReady: false,
  avatarLib: {},
  flowClips: null,
  RPM_IDS: [
    '6185a4acfb622cf1cdc49348',
    '67be034c9fab1c21c486eb14',
    '62ea7bc28a6d28ec134bbcce',
  ],
  XBOT_URL: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Xbot.glb',
  SOLDIER_URL: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/models/gltf/Soldier.glb',
  // ondata 1: piccolo set essenziale caricato subito, poi avatarReady
  AVATAR_TIER1: {
    peds: [
      'https://gobkit.com/freebies/human001/Cashier.glb',
      'https://gobkit.com/freebies/human001/FoodCourier.glb',
      'https://gobkit.com/freebies/human001/GrandmaShopper.glb',
      'https://gobkit.com/freebies/human001/OfficeLady.glb',
      'https://gobkit.com/freebies/human001/Schoolkid.glb',
      'https://gobkit.com/freebies/human001/Shoplifter.glb',
      'https://gobkit.com/freebies/human002/ItEngineer.glb',
      'https://gobkit.com/freebies/human015/Student.glb',
      'https://gobkit.com/freebies/human015/HotDogVendor.glb',
      'https://gobkit.com/freebies/human015/OfficeWorker.glb',
      'https://gobkit.com/freebies/human021/RestaurantGuest.glb',
      'https://gobkit.com/freebies/human021/Bartender.glb',
    ],
    cops: [
      'https://gobkit.com/freebies/human012/PatrolConstable.glb',
      'https://gobkit.com/freebies/human012/HighwayPatrol.glb',
      'https://gobkit.com/freebies/human015/PoliceOfficer.glb',
    ],
    gang: [
      'https://gobkit.com/freebies/human012/ToughInmate.glb',
      'https://gobkit.com/freebies/human012/EscapedConvict.glb',
      'https://gobkit.com/freebies/human022/ConvictCommando.glb',
    ],
    antonio: ['https://gobkit.com/freebies/human021/Pizzaiolo.glb'],
    player: ['https://gobkit.com/freebies/human014/StreetBrawler.glb'],
  },
  // ondata 2: resto del roster, caricato in background a batch
  AVATAR_TIER2: {
    peds: [
      'https://gobkit.com/freebies/human001/StockClerk.glb',
      'https://gobkit.com/freebies/human001/StoreManager.glb',
      'https://gobkit.com/freebies/human002/Accountant.glb',
      'https://gobkit.com/freebies/human002/CompanyCeo.glb',
      'https://gobkit.com/freebies/human002/OfficeIntern.glb',
      'https://gobkit.com/freebies/human002/OfficeManager.glb',
      'https://gobkit.com/freebies/human002/Receptionist.glb',
      'https://gobkit.com/freebies/human002/SalesRep.glb',
      'https://gobkit.com/freebies/human008/CabinAttendant.glb',
      'https://gobkit.com/freebies/human008/AirlineCaptain.glb',
      'https://gobkit.com/freebies/human008/RampAgent.glb',
      'https://gobkit.com/freebies/human007/FireChief.glb',
      'https://gobkit.com/freebies/human007/LadderFirefighter.glb',
      'https://gobkit.com/freebies/human007/Probie.glb',
      'https://gobkit.com/freebies/human015/StreetMime.glb',
      'https://gobkit.com/freebies/human015/DeliveryRider.glb',
      'https://gobkit.com/freebies/human019/ArtTeacher.glb',
      'https://gobkit.com/freebies/human019/BandDrummer.glb',
      'https://gobkit.com/freebies/human019/Cheerleader.glb',
      'https://gobkit.com/freebies/human019/ClassTeacher.glb',
      'https://gobkit.com/freebies/human019/SchoolPrincipal.glb',
      'https://gobkit.com/freebies/human019/Schoolgirl.glb',
      'https://gobkit.com/freebies/human020/SiteBricklayer.glb',
      'https://gobkit.com/freebies/human020/SiteCarpenter.glb',
      'https://gobkit.com/freebies/human020/SiteEngineer.glb',
      'https://gobkit.com/freebies/human020/SiteForeman.glb',
      'https://gobkit.com/freebies/human020/SitePainter.glb',
      'https://gobkit.com/freebies/human020/SiteWelder.glb',
      'https://gobkit.com/freebies/human021/SousChef.glb',
      'https://gobkit.com/freebies/human021/Waitress.glb',
    ],
    cops: [
      'https://gobkit.com/freebies/human012/PoliceChief.glb',
      'https://gobkit.com/freebies/human012/RaidOfficer.glb',
      'https://gobkit.com/freebies/human012/StationDetective.glb',
    ],
    swat: [
      'https://gobkit.com/freebies/human022/BlackOpsOperator.glb',
      'https://gobkit.com/freebies/human022/AssaultTeamLeader.glb',
      'https://gobkit.com/freebies/human022/FrontlineRifleman.glb',
      'https://gobkit.com/freebies/human022/NightReconScout.glb',
      'https://gobkit.com/freebies/human004/Rifleman.glb',
      'https://gobkit.com/freebies/human004/CombatEngineer.glb',
      'https://gobkit.com/freebies/human004/MachineGunner.glb',
      'https://gobkit.com/freebies/human004/ArmyOfficer.glb',
    ],
    medics: [
      'https://gobkit.com/freebies/human005/WhiteCoatDoctor.glb',
      'https://gobkit.com/freebies/human005/ChiefSurgeon.glb',
      'https://gobkit.com/freebies/human005/Paramedic.glb',
      'https://gobkit.com/freebies/human005/WardNurse.glb',
      'https://gobkit.com/freebies/human005/Pharmacist.glb',
      'https://gobkit.com/freebies/human005/WardOrderly.glb',
      'https://gobkit.com/freebies/human005/HospitalDirector.glb',
    ],
  },

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
    this.loadAvatars();
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

    this.buildRoadMarkings();

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

  // ---------- mesh personaggi (corpo smussato, articolazioni con gomiti e ginocchia) ----------
  buildRoadMarkings() {
    const m4 = new THREE.Matrix4();
    const dashMats = [];
    const crossMats = [];
    for (let i = 0; i < City3.GRID; i++) {
      const a0 = City3.laneCoords[i] + City3.ROAD / 2 + 3;
      const a1 = City3.laneCoords[i + 1] - City3.ROAD / 2 - 3;
      for (let j = 0; j <= City3.GRID; j++) {
        const c = City3.laneCoords[j];
        for (let p = a0; p <= a1; p += 6) {
          dashMats.push(m4.identity().clone().setPosition(p, 0.035, c));
          dashMats.push(m4.makeRotationY(Math.PI / 2).clone().setPosition(c, 0.035, p));
        }
      }
    }
    for (const cx of City3.laneCoords) {
      for (const cz of City3.laneCoords) {
        for (const s of [-1, 1]) {
          for (let w = -7.5; w <= 7.5; w += 1.7) {
            crossMats.push(m4.identity().clone().setPosition(cx + s * 10.2, 0.035, cz + w));
            crossMats.push(m4.makeRotationY(Math.PI / 2).clone().setPosition(cx + w, 0.035, cz + s * 10.2));
          }
        }
      }
    }
    const dashes = new THREE.InstancedMesh(
      new THREE.BoxGeometry(2.2, 0.02, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xcccccc }),
      dashMats.length
    );
    dashMats.forEach((m, i) => dashes.setMatrixAt(i, m));
    dashes.instanceMatrix.needsUpdate = true;
    this.scene.add(dashes);
    const crosses = new THREE.InstancedMesh(
      new THREE.BoxGeometry(2.4, 0.02, 0.6),
      new THREE.MeshBasicMaterial({ color: 0xdddddd }),
      crossMats.length
    );
    crossMats.forEach((m, i) => crosses.setMatrixAt(i, m));
    crosses.instanceMatrix.needsUpdate = true;
    this.scene.add(crosses);
  },

  // ---------- personaggi animati (GLB CC0 via CDN, fallback primitivi) ----------
  loadAvatars() {
    if (typeof THREE.GLTFLoader !== 'function' || typeof THREE.SkeletonUtils !== 'function') return;
    const loader = new THREE.GLTFLoader();
    const loadOne = (kind, url) => new Promise((res) => {
      loader.load(url, (gltf) => {
        if (gltf && gltf.scene) {
          if (!this.avatarLib[kind]) this.avatarLib[kind] = [];
          this.avatarLib[kind].push({ scene: gltf.scene, clips: gltf.animations || [] });
        }
        res();
      }, undefined, () => res());
    });
    const boot = [];
    for (const kind of Object.keys(this.AVATAR_TIER1)) {
      if (!this.avatarLib[kind]) this.avatarLib[kind] = [];
      for (const url of this.AVATAR_TIER1[kind]) boot.push(loadOne(kind, url));
    }
    Promise.all(boot).then(() => {
      this.avatarReady = true;
      this.rebuildPeopleViews();
      this.loadRealisticAvatars(loader);
      this.loadAvatarTier2(loader, loadOne);
    }).catch(() => {});
  },

  loadRealisticAvatars(loader) {
    if (!this.flowClips) {
      loader.load(this.XBOT_URL, (gltf) => {
        this.flowClips = gltf && gltf.animations ? gltf.animations : null;
        this.rebuildPeopleViews();
      }, undefined, () => {});
    }
    if (!this.avatarLib.soldier) this.avatarLib.soldier = [];
    loader.load(this.SOLDIER_URL, (gltf) => {
      if (gltf && gltf.scene) this.avatarLib.soldier.push({ scene: gltf.scene, clips: gltf.animations || [] });
      this.rebuildPeopleViews();
    }, undefined, () => {});
    for (const id of this.RPM_IDS) {
      loader.load('https://models.readyplayer.me/' + id + '.glb?meshLod=1&textureAtlas=512', (gltf) => {
        if (gltf && gltf.scene) {
          if (!this.avatarLib.rpm) this.avatarLib.rpm = [];
          this.avatarLib.rpm.push({ scene: gltf.scene, clips: gltf.animations || [] });
        }
        this.rebuildPeopleViews();
      }, undefined, () => {});
    }
  },

  retargetFlow(model) {
    if (!this.flowClips) return [];
    const bones = new Set();
    model.traverse((m) => { if (m.isBone) bones.add(m.name); });
    const out = [];
    for (const src of this.flowClips) {
      const tracks = [];
      for (const t of src.tracks) {
        const m = /^\.bones\[(.+)\]\.(.+)$/.exec(t.name);
        if (!m) continue;
        let base = m[1].replace(/^mixamorig:?/i, '');
        if (!bones.has(base)) {
          base = base.replace(/^[^|]*\|/, '');
          if (!bones.has(base)) continue;
        }
        const nt = t.clone();
        nt.name = '.bones[' + base + '].' + m[2];
        tracks.push(nt);
      }
      if (tracks.length) {
        const c = new THREE.AnimationClip(src.name, src.duration, tracks);
        c._retargeted = true;
        out.push(c);
      }
    }
    return out;
  },

  loadAvatarTier2(loader, loadOne) {
    const queue = [];
    for (const kind of Object.keys(this.AVATAR_TIER2)) {
      if (!this.avatarLib[kind]) this.avatarLib[kind] = [];
      for (const url of this.AVATAR_TIER2[kind]) queue.push([kind, url]);
    }
    const next = () => {
      if (!queue.length) { this.rebuildPeopleViews(); return; }
      Promise.all(queue.splice(0, 4).map((kv) => loadOne(kv[0], kv[1]))).then(next).catch(next);
    };
    next();
  },

  rebuildPeopleViews() {
    if (!this.scene) return;
    for (const p of Entities.peds) { if (p.view) { this.scene.remove(p.view); p.view = null; } }
    for (const c of Entities.cops) { if (c.view) { this.scene.remove(c.view); c.view = null; } }
    if (Game.player && Game.player.view) { this.scene.remove(Game.player.view); Game.player.view = null; }
  },

  buildAvatar(kind) {
    let poolKey = kind;
    if (kind === 'peds' && this.avatarLib.rpm && this.avatarLib.rpm.length && Math.random() < 0.5) poolKey = 'rpm';
    if (kind === 'player' && this.avatarLib.rpm && this.avatarLib.rpm.length) poolKey = 'rpm';
    if ((kind === 'cops' || kind === 'swat') && this.avatarLib.soldier && this.avatarLib.soldier.length && Math.random() < 0.4) poolKey = 'soldier';
    const pool = this.avatarLib[poolKey];
    if (!pool || !pool.length) return null;
    const proto = choice(pool);
    let model;
    try {
      model = THREE.SkeletonUtils.clone(proto.scene);
    } catch (e) { return null; }
    const inner = new THREE.Group();
    inner.rotation.y = Math.PI / 2;
    inner.add(model);
    model.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } });
    const box = new THREE.Box3().setFromObject(model);
    const h = Math.max(0.1, box.max.y - box.min.y);
    const s = 1.9 / h;
    model.scale.setScalar(s);
    model.position.y = -box.min.y * s;
    const sourceClips = proto.clips.length ? proto.clips : (poolKey === 'rpm' ? this.retargetFlow(model) : []);
    const clipBy = (re) => sourceClips.find((c) => re.test(c.name)) || null;
    const mixer = new THREE.AnimationMixer(model);
    const acts = {};
    for (const [key, re] of [['idle', /idle/i], ['walk', /walk/i], ['run', /run/i], ['death', /death|die/i]]) {
      const c = clipBy(re);
      if (!c) continue;
      const a = mixer.clipAction(c);
      if (key === 'death') { a.loop = THREE.LoopOnce; a.clampWhenFinished = true; }
      a.setEffectiveWeight(key === 'idle' ? 1 : 0);
      a.play();
      acts[key] = a;
    }
    let hand = null;
    let hipBone = null;
    model.traverse((m) => {
      if (!m.isBone) return;
      const clean = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!hand && (/righthand|handright/.test(clean) || /handr$/.test(clean))) hand = m;
      if (!hipBone && /hips$|hips/.test(clean)) hipBone = m;
    });
    const parent = hand || hipBone || inner;
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.08), this.basicMat('#141414'));
    gun.position.set(0.12, 0, 0.06);
    gun.rotation.y = Math.PI / 2;
    gun.visible = false;
    parent.add(gun);
    const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.75, 8), this.lambertMat('#7a5a30'));
    bat.position.set(0.1, -0.05, 0);
    bat.rotation.x = Math.PI / 2.4;
    bat.visible = false;
    parent.add(bat);
    if (poolKey === 'rpm' && !Object.keys(acts).length) return null;
    const g = new THREE.Group();
    g.add(inner);
    g.userData.avatar = { mixer, acts, deadPlayed: false };
    g.userData.parts = { gun, bat };
    return g;
  },

  syncAvatarView(e, mesh, dt) {
    const av = mesh.userData.avatar;
    mesh.rotation.order = 'YXZ';
    if (av.mixer) av.mixer.update(dt);
    const dead = e.state === 'dead' || e.dead;
    if (dead) {
      if (av.acts.death && !av.deadPlayed) {
        av.deadPlayed = true;
        av.acts.death.reset();
        av.acts.death.setEffectiveWeight(1);
        av.acts.death.play();
      }
      if (av.acts.death) {
        mesh.rotation.y = -e.angle;
        mesh.position.set(e.x, 0.005, e.z);
      } else {
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(e.x, 0.28, e.z);
      }
      return;
    }
    mesh.rotation.y = -e.angle;
    mesh.rotation.z = 0;
    const running = e.state === 'flee' || (e === Game.player && Input.down('shift'));
    const moving = e.state !== 'react';
    let pick = null;
    if (moving) pick = running && av.acts.run ? 'run' : (av.acts.walk ? 'walk' : 'run');
    else pick = av.acts.idle ? 'idle' : (av.acts.walk ? 'walk' : null);
    for (const k of Object.keys(av.acts)) {
      if (k === 'death') continue;
      const a = av.acts[k];
      const w = k === pick ? 1 : 0;
      a.setEffectiveWeight(a.getEffectiveWeight() + (w - a.getEffectiveWeight()) * Math.min(1, dt * 9));
      a.timeScale = k === 'run' ? 1.3 : (k === 'walk' ? running ? 1.45 : 1.1 : 1);
    }
    if (pick && !av.acts[pick]) {
      for (const k of Object.keys(av.acts)) if (k !== 'death') av.acts[k].setEffectiveWeight(0);
    }
    mesh.position.set(e.x, 0.005, e.z);
  },

  buildPersonMesh(o, hint) {
    const kind = hint || (o && o.isAntonio ? 'antonio' : (o && o.medic ? 'medics' : (o && o.gang ? 'gang' : 'peds')));
    if (this.avatarReady) {
      const av = this.buildAvatar(kind);
      if (av) return av;
    }
    const g = new THREE.Group();
    const skin = o.skin || '#e0ac69';
    const mk = (geo, color, parent) => {
      const m = new THREE.Mesh(geo, this.lambertMat(color));
      m.castShadow = true;
      (parent || g).add(m);
      return m;
    };

    // torso a fuso umano: spalle larghe, vita stretta, petto in evidenza
    const body = new THREE.Group();
    body.position.y = 1.3;
    g.add(body);
    const profile = [
      new THREE.Vector2(0.02, -0.34),
      new THREE.Vector2(0.145, -0.34),
      new THREE.Vector2(0.16, -0.24),
      new THREE.Vector2(0.13, -0.06),
      new THREE.Vector2(0.185, 0.12),
      new THREE.Vector2(0.21, 0.26),
      new THREE.Vector2(0.15, 0.34),
      new THREE.Vector2(0.02, 0.37),
    ];
    const torsoMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(o.shirt), side: THREE.DoubleSide });
    const torso = new THREE.Mesh(new THREE.LatheGeometry(profile, 14), torsoMat);
    torso.scale.z = 0.78;
    torso.castShadow = true;
    body.add(torso);
    const belt = mk(new THREE.CylinderGeometry(0.165, 0.17, 0.07, 12), '#222', body);
    belt.position.y = -0.29;
    const pelvis = mk(new THREE.BoxGeometry(0.34, 0.18, 0.24), o.pants, g);
    pelvis.position.y = 0.92;
    for (const sx of [-0.26, 0.26]) mk(new THREE.SphereGeometry(0.105, 10, 8), o.shirt, body).position.set(sx, 0.27, 0);
    const neck = mk(new THREE.CylinderGeometry(0.062, 0.075, 0.14, 8), skin, body);
    neck.position.y = 0.4;

    // testa sferica con volto dettagliato: occhi con pupille, sopracciglia, naso e bocca
    const head = new THREE.Group();
    head.position.y = 1.84;
    g.add(head);
    const skull = mk(new THREE.SphereGeometry(0.17, 16, 14), skin, head);
    skull.scale.set(1, 1.08, 0.94);
    for (const ez of [0.168, -0.168]) mk(new THREE.SphereGeometry(0.042, 8, 6), skin, head).position.set(-0.01, -0.02, ez);
    const hairCap = mk(new THREE.SphereGeometry(0.183, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), o.hair, head);
    hairCap.rotation.z = -0.35;
    const backHair = mk(new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.8), o.hair, head);
    backHair.position.set(-0.058, 0, 0);
    backHair.rotation.z = Math.PI / 2;
    backHair.scale.set(1, 1, 0.85);
    const fringe = mk(new THREE.BoxGeometry(0.05, 0.055, 0.22), o.hair, head);
    fringe.position.set(0.13, 0.11, 0);
    const eyeWhite = this.basicMat('#f4f4f0');
    const pupilMat = this.basicMat('#20242c');
    for (const ez of [0.068, -0.068]) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), eyeWhite);
      ball.position.set(0.13, 0.02, ez);
      head.add(ball);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), pupilMat);
      pupil.position.set(0.156, 0.02, ez);
      head.add(pupil);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.016, 0.06), this.lambertMat(o.hair));
      brow.position.set(0.148, 0.085, ez);
      head.add(brow);
    }
    const nose = mk(new THREE.BoxGeometry(0.055, 0.06, 0.05), skin, head);
    nose.position.set(0.17, -0.03, 0);
    const mouth = mk(new THREE.BoxGeometry(0.015, 0.014, 0.065), this.basicMat('#7a3b3b'));
    mouth.position.set(0.163, -0.1, 0);

    if (o.hat === 'cap') {
      const crown = mk(new THREE.SphereGeometry(0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), o.shirt, head);
      crown.rotation.z = -0.15;
      const visor = mk(new THREE.CylinderGeometry(0.15, 0.15, 0.022, 12, 1, false, -Math.PI / 2.6, Math.PI / 1.3), o.shirt, head);
      visor.rotation.x = Math.PI / 2;
      visor.rotation.z = Math.PI / 2;
      visor.position.set(0.16, 0.04, 0);
    } else if (o.hat === 'top hat') {
      mk(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 14), '#111111', head).position.y = 0.16;
      mk(new THREE.CylinderGeometry(0.12, 0.13, 0.3, 14), '#111111', head).position.y = 0.32;
    } else if (o.hat === 'bandana') {
      mk(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 14), '#c1121f', head).position.y = 0.07;
    }

    // arti a due segmenti: anca->ginocchio->piede, spalla->gomito->mano
    const mkJoint = (parent, x, y) => {
      const j = new THREE.Group();
      j.position.set(x, y, 0);
      parent.add(j);
      return j;
    };
    const mkSeg = (parent, r1, r2, len, color) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 9), this.lambertMat(color));
      m.position.y = -len / 2;
      m.castShadow = true;
      parent.add(m);
      return m;
    };

    const mkLeg = (sx) => {
      const hip = mkJoint(g, sx, 0.93);
      mkSeg(hip, 0.095, 0.078, 0.45, o.pants);
      const knee = mkJoint(hip, 0, -0.45);
      mk(new THREE.SphereGeometry(0.08, 8, 6), o.pants, knee);
      mkSeg(knee, 0.072, 0.055, 0.4, o.pants);
      const shoe = mk(new THREE.BoxGeometry(0.28, 0.1, 0.14), '#1c1c1c', knee);
      shoe.position.set(0.06, -0.41, 0.01);
      return { hip, knee };
    };
    const legL = mkLeg(-0.12);
    const legR = mkLeg(0.12);

    const mkArm = (sx) => {
      const shoulder = mkJoint(g, sx, 1.54);
      mkSeg(shoulder, 0.068, 0.058, 0.32, o.shirt);
      const elbow = mkJoint(shoulder, 0, -0.32);
      mk(new THREE.SphereGeometry(0.058, 8, 6), o.shirt, elbow);
      mkSeg(elbow, 0.05, 0.042, 0.3, skin);
      const hand = mk(new THREE.SphereGeometry(0.06, 8, 6), skin, elbow);
      hand.position.y = -0.32;
      return { shoulder, elbow };
    };
    const armL = mkArm(-0.31);
    const armR = mkArm(0.31);

    // armi in mano destra, nascoste di default
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.08), this.basicMat('#141414'));
    gun.position.set(0.12, -0.34, 0);
    gun.visible = false;
    armR.elbow.add(gun);
    const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.75, 8), this.lambertMat('#7a5a30'));
    bat.position.set(0.1, -0.42, 0);
    bat.rotation.z = Math.PI / 2.4;
    bat.visible = false;
    armR.elbow.add(bat);

    g.userData.parts = {
      body, head,
      hipL: legL.hip, kneeL: legL.knee, hipR: legR.hip, kneeR: legR.knee,
      shoulderL: armL.shoulder, elbowL: armL.elbow, shoulderR: armR.shoulder, elbowR: armR.elbow,
      gun, bat,
    };
    return g;
  },

  buildCopMesh(c) {
    return this.buildPersonMesh(c && c.swat ? c : { skin: '#e0ac69', shirt: '#1f4e8c', pants: '#16283f', hair: '#2b2b2b', hat: 'cap' }, c && c.swat ? 'swat' : 'cops');
  },

  buildCarMesh(color, len, wid) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, wid), this.lambertMat(color));
    body.position.y = 0.52;
    body.castShadow = true;
    g.add(body);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(len * 0.92, 0.18, wid * 0.96), this.lambertMat('#26262b'));
    skirt.position.y = 0.28;
    g.add(skirt);
    const glass = this.lambertMat('#1c2a38');
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(len * 0.44, 0.4, wid * 0.84), glass);
    cabin.position.set(-len * 0.06, 0.97, 0);
    cabin.castShadow = true;
    g.add(cabin);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len * 0.46, 0.06, wid * 0.86), this.lambertMat(color));
    roof.position.set(-len * 0.06, 1.2, 0);
    g.add(roof);
    for (const bx of [1, -1]) {
      const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, wid * 0.98), this.lambertMat('#33343a'));
      bumper.position.set(bx * (len / 2 + 0.03), 0.38, 0);
      g.add(bumper);
    }
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.24, 12);
    const wheelMat = this.lambertMat('#151515');
    const hubGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.26, 8);
    const hubMat = this.lambertMat('#8a8f96');
    for (const [wx, wz] of [[len * 0.32, wid / 2], [len * 0.32, -wid / 2], [-len * 0.32, wid / 2], [-len * 0.32, -wid / 2]]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.32, wz);
      g.add(w);
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(wx, 0.32, wz);
      g.add(hub);
    }
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x554d33 });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0x7a1f1f });
    for (const wz of [wid * 0.3, -wid * 0.3]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.24), lightMat);
      hl.position.set(len / 2 + 0.02, 0.6, wz);
      g.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.2), tailMat);
      tl.position.set(-len / 2 - 0.02, 0.6, wz);
      g.add(tl);
    }
    g.userData.lightMat = lightMat;
    g.userData.tailMat = tailMat;
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
  syncPersonView(e, mesh, dt) {
    if (mesh.userData.avatar) return this.syncAvatarView(e, mesh, dt == null ? 0.016 : dt);
    const parts = mesh.userData.parts;
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = -e.angle;
    if (e.state === 'dead') {
      mesh.rotation.x = 0;
      mesh.rotation.z = Math.PI / 2;
      mesh.position.set(e.x, 0.28, e.z);
      return;
    }
    mesh.rotation.x = 0;
    mesh.rotation.z = 0;

    const running = e.state === 'flee' || (e === Game.player && Input.down('shift'));
    const moving = e.state !== 'react';
    const amp = running ? 0.75 : 0.5;
    const s = Math.sin(e.walkPhase);
    const s2 = Math.sin(e.walkPhase + Math.PI);

    if (moving) {
      // gambe: oscillazione avanti/indietro (asse z) + ginocchio che si piega in fase di recupero
      parts.hipL.rotation.z = s * amp;
      parts.hipR.rotation.z = s2 * amp;
      parts.kneeL.rotation.z = -Math.max(0, Math.sin(e.walkPhase + 2.4)) * (running ? 1.1 : 0.75) - 0.06;
      parts.kneeR.rotation.z = -Math.max(0, Math.sin(e.walkPhase + 2.4 + Math.PI)) * (running ? 1.1 : 0.75) - 0.06;
      // braccia in opposizione alle gambe, gomito semiflesso
      parts.shoulderL.rotation.z = s2 * amp * 0.7;
      parts.shoulderR.rotation.z = s * amp * 0.7;
      parts.elbowL.rotation.z = 0.3 + Math.max(0, s2) * 0.35;
      parts.elbowR.rotation.z = 0.3 + Math.max(0, s) * 0.35;
      mesh.position.set(e.x, Math.abs(Math.cos(e.walkPhase)) * (running ? 0.06 : 0.035), e.z);
      parts.body.rotation.z = running ? -0.14 : -0.04;
    } else {
      // fermo: respiro e micro-oscillazioni
      const br = Math.sin(Game.elapsed * 2 + e.walkPhase);
      for (const k of ['hipL', 'hipR', 'kneeL', 'kneeR', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR']) parts[k].rotation.z *= 0.8;
      parts.shoulderL.rotation.z = 0.06 + br * 0.02;
      parts.shoulderR.rotation.z = -0.06 - br * 0.02;
      parts.body.rotation.z = 0;
      mesh.position.set(e.x, 0.005 + Math.max(0, br) * 0.008, e.z);
    }

    // mira: braccio destro teso in avanti quando c'è un'arma da fuoco in mano
    const aiming = e === Game.player ? parts.gun.visible : !!e.aiming;
    if (aiming) {
      parts.shoulderR.rotation.z = 1.35;
      parts.elbowR.rotation.z = 0.12;
      parts.shoulderL.rotation.z = 1.0;
      parts.elbowL.rotation.z = 0.9;
    }
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
    syncList(Entities.cops, (c) => this.buildCopMesh(c));
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
      m.rotation.z = Math.PI / 2;
      return m;
    });

    const pl = Game.player;
    seen.add(pl);
    if (!pl.view) { pl.view = this.buildPersonMesh(pl.custom, 'player'); pl.view.userData._entity = pl; this.scene.add(pl.view); }
    if (!pl.inCar && !pl.dead) {
      const pp = pl.view.userData.parts;
      if (pp.gun) pp.gun.visible = !!WEAPONS[pl.curWeapon].bullet;
      if (pp.bat) pp.bat.visible = pl.curWeapon === 'bat';
      this.syncPersonView(pl, pl.view, dt);
      pl.view.visible = true;
    } else pl.view.visible = false;

    for (const p of Entities.peds) {
      if (p.state === 'dead') { p.view.visible = false; continue; }
      p.view.visible = true;
      this.syncPersonView(p, p.view, dt);
    }
    for (const c of Entities.cops) this.syncPersonView(c, c.view, dt);
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
