// ===== Mondo: città, edifici, terreno pre-renderizzato =====
const World = {
  buildings: [],   // {x,y,w,h,type,name,roof,door:{x,y}}
  doors: [],       // punti di interazione {x,y,type,label,building}
  parkingSpots: [],
  ground: null,    // canvas offscreen con strada/marciapiedi/erba
  minimapBase: null,

  isRoadTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_TILES || ty >= MAP_TILES) return false;
    return tx % ROAD_PERIOD < ROAD_W || ty % ROAD_PERIOD < ROAD_W;
  },

  isRoadAt(x, y) {
    return this.isRoadTile(Math.floor(x / TILE), Math.floor(y / TILE));
  },

  isSidewalkTile(tx, ty) {
    if (this.isRoadTile(tx, ty)) return false;
    // anello di marciapiede attorno a ogni isolato
    const bx = tx % ROAD_PERIOD, by = ty % ROAD_PERIOD;
    return bx === ROAD_W || by === ROAD_W || bx === ROAD_PERIOD - 1 || by === ROAD_PERIOD - 1;
  },

  // centro della corsia per il traffico
  laneCenterH(ty) { return (ty + 0.5) * TILE; },
  laneCenterV(tx) { return (tx + 0.5) * TILE; },

  generate() {
    this.buildings = [];
    this.doors = [];
    this.parkingSpots = [];

    const blocks = Math.floor(MAP_TILES / ROAD_PERIOD);
    const specialByBlock = {};
    for (const s of SPECIAL_BUILDINGS) specialByBlock[s.block[0] + ',' + s.block[1]] = s;

    for (let bx = 0; bx < blocks; bx++) {
      for (let by = 0; by < blocks; by++) {
        const x0 = (bx * ROAD_PERIOD + ROAD_W) * TILE;
        const y0 = (by * ROAD_PERIOD + ROAD_W) * TILE;
        const size = (ROAD_PERIOD - ROAD_W) * TILE; // 11 tiles = 440px
        const innerX = x0 + TILE, innerY = y0 + TILE, innerSize = size - 2 * TILE; // 360px

        const special = specialByBlock[bx + ',' + by];
        if (special) {
          this.addBuilding(innerX + 30, innerY + 30, innerSize - 60, innerSize - 60, special.key, special.name, special.roof, special.icon, special.blip);
          this.addParkRing(x0, y0, size, innerX, innerY, innerSize);
          continue;
        }

        const roll = Math.random();
        if (roll < 0.14) {
          // parco pubblico
          this.parks = this.parks || [];
          this.parks.push({ x: x0, y: y0, w: size, h: size });
          continue;
        }

        // isolato residenziale: 1-2 palazzi
        if (Math.random() < 0.5) {
          this.addBuilding(innerX + 20, innerY + 20, innerSize - 40, innerSize - 40, 'house', 'Palazzo', '#6d6875', null, null);
        } else {
          const half = innerSize / 2;
          this.addBuilding(innerX + 15, innerY + 15, half - 25, half - 25, 'house', 'Casa', '#6d6875', null, null);
          this.addBuilding(innerX + half + 10, innerY + 15, half - 25, half - 25, 'house', 'Casa', '#5f5a6b', null, null);
          this.addBuilding(innerX + 15, innerY + half + 10, half - 25, half - 25, 'house', 'Casa', '#756f80', null, null);
        }
        this.addParkRing(x0, y0, size, innerX, innerY, innerSize);
      }
    }

    // posti auto lungo i marciapiedi
    for (let bx = 0; bx < blocks; bx++) {
      for (let by = 0; by < blocks; by++) {
        const x0 = (bx * ROAD_PERIOD + ROAD_W) * TILE;
        const y0 = (by * ROAD_PERIOD + ROAD_W) * TILE;
        const size = (ROAD_PERIOD - ROAD_W) * TILE;
        if (Math.random() < 0.7) this.parkingSpots.push({ x: x0 + rand(60, size - 60), y: y0 - TILE * 1.5, angle: 0 });
        if (Math.random() < 0.7) this.parkingSpots.push({ x: x0 - TILE * 1.5, y: y0 + rand(60, size - 60), angle: Math.PI / 2 });
      }
    }

    this.renderGround();
  },

  addParkRing(x0, y0, size, innerX, innerY, innerSize) {
    this.parks = this.parks || [];
    this.parks.push({ x: x0, y: y0, w: size, h: size, ring: true, ix: innerX, iy: innerY, isz: innerSize });
  },

  addBuilding(x, y, w, h, type, name, roof, icon, blip) {
    const b = { x, y, w, h, type, name, roof, icon, blip };
    // porta sul lato sud
    b.door = { x: x + w / 2, y: y + h + 14 };
    this.buildings.push(b);
    if (SPECIAL_BUILDINGS.some((s) => s.key === type)) {
      this.doors.push({ x: b.door.x, y: b.door.y, type, label: name, building: b });
    }
    return b;
  },

  buildingAt(x, y, pad = 0) {
    for (const b of this.buildings) {
      if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return b;
    }
    return null;
  },

  isFreeGround(x, y) {
    // si può camminare: non dentro un edificio
    return !this.buildingAt(x, y, 2);
  },

  renderGround() {
    const c = document.createElement('canvas');
    c.width = WORLD_W; c.height = WORLD_W;
    const g = c.getContext('2d');

    for (let ty = 0; ty < MAP_TILES; ty++) {
      for (let tx = 0; tx < MAP_TILES; tx++) {
        const x = tx * TILE, y = ty * TILE;
        if (this.isRoadTile(tx, ty)) {
          g.fillStyle = '#3a3a40';
          g.fillRect(x, y, TILE, TILE);
        } else if (this.isSidewalkTile(tx, ty)) {
          g.fillStyle = '#8f959c';
          g.fillRect(x, y, TILE, TILE);
          g.strokeStyle = 'rgba(0,0,0,.12)';
          g.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
        } else {
          g.fillStyle = '#4d7c4a';
          g.fillRect(x, y, TILE, TILE);
          if ((tx + ty) % 2 === 0) { g.fillStyle = 'rgba(255,255,255,.03)'; g.fillRect(x, y, TILE, TILE); }
        }
      }
    }

    // strisce corsie
    g.strokeStyle = '#d8d0a0';
    g.lineWidth = 3;
    g.setLineDash([18, 22]);
    for (let t = 0; t < MAP_TILES; t += ROAD_PERIOD) {
      const mid = (t + 1.5) * TILE;
      g.beginPath(); g.moveTo(0, mid); g.lineTo(WORLD_W, mid); g.stroke();
      g.beginPath(); g.moveTo(mid, 0); g.lineTo(mid, WORLD_W); g.stroke();
    }
    g.setLineDash([]);

    // strisce pedonali agli incroci
    g.fillStyle = 'rgba(230,230,230,.75)';
    for (let by = 0; by < MAP_TILES; by += ROAD_PERIOD) {
      for (let bx = 0; bx < MAP_TILES; bx += ROAD_PERIOD) {
        const rx = bx * TILE, ry = by * TILE, rw = ROAD_W * TILE;
        for (let i = 0; i < 6; i++) {
          g.fillRect(rx + 6 + i * 18, ry - TILE + 4, 10, TILE - 8);
          g.fillRect(rx + 6 + i * 18, ry + rw + 4, 10, TILE - 8);
          g.fillRect(rx - TILE + 4, ry + 6 + i * 18, TILE - 8, 10);
          g.fillRect(rx + rw + 4, ry + 6 + i * 18, TILE - 8, 10);
        }
      }
    }

    // bordi marciapiede
    g.strokeStyle = 'rgba(0,0,0,.25)';
    g.lineWidth = 2;
    for (let t = 0; t < MAP_TILES; t += ROAD_PERIOD) {
      const a = t * TILE, b = (t + ROAD_W) * TILE;
      g.strokeRect(0, a, WORLD_W, b - a);
      g.strokeRect(a, 0, b - a, WORLD_W);
    }

    this.ground = c;

    // base minimappa
    const mm = document.createElement('canvas');
    const scale = 170 / WORLD_W;
    mm.width = 170; mm.height = 170;
    const m = mm.getContext('2d');
    m.fillStyle = '#2c3e2c';
    m.fillRect(0, 0, 170, 170);
    m.fillStyle = '#55555f';
    for (let t = 0; t < MAP_TILES; t += ROAD_PERIOD) {
      m.fillRect(0, t * TILE * scale, 170, ROAD_W * TILE * scale);
      m.fillRect(t * TILE * scale, 0, ROAD_W * TILE * scale, 170);
    }
    for (const b of this.buildings) {
      m.fillStyle = b.blip || '#777';
      m.fillRect(b.x * scale, b.y * scale, Math.max(2, b.w * scale), Math.max(2, b.h * scale));
    }
    this.minimapBase = mm;
    this.mmScale = scale;
  },

  drawGround(ctx, camX, camY, vw, vh) {
    ctx.drawImage(this.ground, camX, camY, vw, vh, 0, 0, vw, vh);
  },

  drawBuildings(ctx, camX, camY, vw, vh, night) {
    for (const b of this.buildings) {
      if (b.x + b.w < camX || b.x > camX + vw || b.y + b.h < camY || b.y > camY + vh) continue;
      const x = b.x - camX, y = b.y - camY;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(x + 5, y + 7, b.w, b.h);
      ctx.fillStyle = b.roof;
      ctx.fillRect(x, y, b.w, b.h);
      ctx.strokeStyle = 'rgba(0,0,0,.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, b.w, b.h);

      // finestre
      const cols = Math.max(2, Math.floor(b.w / 46));
      const rows = Math.max(2, Math.floor(b.h / 46));
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const wx = x + 12 + i * ((b.w - 24) / cols);
          const wy = y + 12 + j * ((b.h - 24) / rows);
          const lit = night && ((i * 7 + j * 13 + b.x) % 3 !== 0);
          ctx.fillStyle = lit ? '#ffd76e' : 'rgba(0,0,0,.25)';
          ctx.fillRect(wx, wy, 14, 10);
        }
      }

      if (b.icon) {
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(x + b.w / 2 - 40, y + b.h / 2 - 16, 80, 32);
        ctx.fillStyle = '#ffd23f';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(b.name, x + b.w / 2, y + b.h / 2 + 5);
      }
    }

    // porte interattive
    for (const d of this.doors) {
      const x = d.x - camX, y = d.y - camY;
      if (x < -40 || y < -40 || x > vw + 40 || y > vh + 40) continue;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; ctx.stroke();
    }
  },
};
