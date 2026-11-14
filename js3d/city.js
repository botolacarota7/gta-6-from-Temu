// ===== Citt\u00e0 3D: dati puri (testabile senza browser) =====
const City3 = {
  GRID: 8,
  ROAD: 18,
  BLOCK: 62,
  CELL: 80,
  size: 0,
  buildings: [],
  specials: [],
  doors: [],
  lamps: [],
  trees: [],
  parks: [],
  laneCoords: [],
  houseColors: ['#8a8177', '#a3948a', '#7d8a97', '#97797d', '#8a9a7d', '#9a8a5b', '#75758a', '#a58a75'],

  generate() {
    this.size = this.GRID * this.CELL + this.ROAD;
    this.buildings = []; this.specials = []; this.doors = [];
    this.lamps = []; this.trees = []; this.parks = []; this.laneCoords = [];

    for (let i = 0; i <= this.GRID; i++) this.laneCoords.push(i * this.CELL + this.ROAD / 2);

    const specialBlocks = { pizzeria: [1, 1], restaurant: [5, 1], gunshop: [2, 4], dealer: [5, 4], gang: [1, 6], police: [5, 6], hospital: [3, 3] };
    const parkBlocks = [[6, 2], [2, 6]];
    const specialByBlock = {};
    for (const k in specialBlocks) specialByBlock[specialBlocks[k].join(',')] = k;

    for (let bx = 0; bx < this.GRID; bx++) {
      for (let bz = 0; bz < this.GRID; bz++) {
        const x0 = bx * this.CELL + this.ROAD;
        const z0 = bz * this.CELL + this.ROAD;
        const key = specialByBlock[bx + ',' + bz];
        if (key) {
          const spec = SPECIAL_BUILDINGS.find((s) => s.key === key);
          const w = 46, d = 46, h = 16;
          const b = { x: x0 + (this.BLOCK - w) / 2, z: z0 + (this.BLOCK - d) / 2, w, d, h, color: spec.roof, special: key, name: spec.name };
          b.door = { x: b.x + w / 2, z: b.z + d + 1.2 };
          this.buildings.push(b);
          this.specials.push(b);
          this.doors.push({ x: b.door.x, y: b.door.z, type: key, label: spec.name, building: b });
          continue;
        }
        if (parkBlocks.some((p) => p[0] === bx && p[1] === bz)) {
          this.parks.push({ x: x0, z: z0, w: this.BLOCK, d: this.BLOCK });
          for (let t = 0; t < 9; t++) {
            this.trees.push({ x: x0 + rand(8, this.BLOCK - 8), z: z0 + rand(8, this.BLOCK - 8), s: rand(0.8, 1.5) });
          }
          continue;
        }
        const centerDist = Math.max(Math.abs(bx - 3.5), Math.abs(bz - 3.5));
        const tall = centerDist < 2.2;
        for (let lx = 0; lx < 2; lx++) {
          for (let lz = 0; lz < 2; lz++) {
            if (Math.random() < 0.12) { this.trees.push({ x: x0 + 14 + lx * 30, z: z0 + 14 + lz * 30, s: rand(0.9, 1.3) }); continue; }
            const w = rand(20, 26), d = rand(20, 26);
            const h = tall ? rand(26, 64) : rand(10, 26);
            this.buildings.push({
              x: x0 + 4 + lx * 30 + (26 - w) / 2,
              z: z0 + 4 + lz * 30 + (26 - d) / 2,
              w, d, h,
              color: choice(this.houseColors),
            });
          }
        }
      }
    }

    for (let i = 0; i <= this.GRID; i++) {
      for (let j = 0; j < this.GRID; j++) {
        const along = i * this.CELL + this.ROAD / 2;
        const blockMid = j * this.CELL + this.ROAD + this.BLOCK / 2;
        this.lamps.push({ x: along - this.ROAD / 2 - 1.2, z: blockMid - 20 });
        this.lamps.push({ x: along + this.ROAD / 2 + 1.2, z: blockMid + 20 });
        this.lamps.push({ x: blockMid + 20, z: along - this.ROAD / 2 - 1.2 });
        this.lamps.push({ x: blockMid - 20, z: along + this.ROAD / 2 + 1.2 });
      }
    }

    for (let i = 0; i < 26; i++) {
      const side = randInt(0, 3);
      const road = randInt(0, this.GRID);
      const along = rand(this.ROAD + 4, this.size - this.ROAD - 4);
      const off = this.ROAD / 2 + 2.5;
      const t = road * this.CELL + this.ROAD / 2;
      if (side === 0) this.trees.push({ x: t - off, z: along, s: rand(0.8, 1.2) });
      else if (side === 1) this.trees.push({ x: t + off, z: along, s: rand(0.8, 1.2) });
      else if (side === 2) this.trees.push({ x: along, z: t - off, s: rand(0.8, 1.2) });
      else this.trees.push({ x: along, z: t + off, s: rand(0.8, 1.2) });
    }
    return this;
  },

  isOnRoad(x, z) {
    const m = x % this.CELL, n = z % this.CELL;
    return m < this.ROAD || n < this.ROAD;
  },

  buildingAt(x, z, pad = 0) {
    for (const b of this.buildings) {
      if (x > b.x - pad && x < b.x + b.w + pad && z > b.z - pad && z < b.z + b.d + pad) return b;
    }
    return null;
  },

  nearestDoor(x, z, range) {
    let best = null, bd = range;
    for (const d of this.doors) {
      const dd = dist(x, z, d.x, d.y);
      if (dd < bd) { bd = dd; best = d; }
    }
    return best;
  },

  randomSidewalkPoint() {
    for (let i = 0; i < 40; i++) {
      const road = randInt(0, this.GRID);
      const along = rand(this.ROAD + 3, this.size - this.ROAD - 3);
      const t = road * this.CELL + this.ROAD / 2 + (Math.random() < 0.5 ? -1 : 1) * (this.ROAD / 2 + 2.2);
      if (Math.random() < 0.5) { if (!this.buildingAt(t, along, 1)) return { x: t, z: along }; }
      else if (!this.buildingAt(along, t, 1)) return { x: along, z: t };
    }
    return { x: this.size / 2, z: this.size / 2 };
  },

  randomRoadPoint() {
    const road = randInt(0, this.GRID);
    const lane = road * this.CELL + this.ROAD / 2 + (Math.random() < 0.5 ? -4.5 : 4.5);
    const along = rand(this.ROAD, this.size - this.ROAD);
    return Math.random() < 0.5 ? { x: lane, z: along } : { x: along, z: lane };
  },
};
