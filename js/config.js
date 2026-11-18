// ===== Costanti e dati di gioco =====
const TILE = 40;
const MAP_TILES = 84;                 // multiplo di 14 => 6 isolati per lato
const WORLD_W = MAP_TILES * TILE;
const ROAD_PERIOD = 14;
const ROAD_W = 3;

const WEAPONS = {
  fists:   { name: 'Pugni',        dmg: 8,  rate: 400, range: 40, melee: true },
  bat:     { name: 'Mazza',        dmg: 18, rate: 500, range: 58, melee: true, price: 100 },
  pistol:  { name: 'Pistola',      dmg: 26, rate: 320, range: 520, speed: 900, spread: 0.05, price: 500,  ammoPrice: 50, ammoPack: 12, bullet: true },
  smg:     { name: 'Mitraglietta', dmg: 14, rate: 110, range: 460, speed: 950, spread: 0.10, price: 1500, ammoPrice: 80, ammoPack: 30, bullet: true, auto: true },
  shotgun: { name: 'Fucile',       dmg: 11, pellets: 5, rate: 900, range: 380, speed: 850, spread: 0.24, price: 1200, ammoPrice: 90, ammoPack: 8, bullet: true },
};
const WEAPON_ORDER = ['fists', 'bat', 'pistol', 'smg', 'shotgun'];
const ARMOR_PRICE = 300;

const SHOP_CARS = [
  { id: 'rusty',  name: 'Rattoppo',    color: '#8a9a5b', maxSpeed: 250, accel: 160, price: 800,  w: 40, h: 21 },
  { id: 'van',    name: 'Furgoncino',  color: '#b0b7c0', maxSpeed: 270, accel: 170, price: 2000, w: 48, h: 23 },
  { id: 'sport',  name: 'Fulmine GT',  color: '#e63946', maxSpeed: 430, accel: 330, price: 5000, w: 44, h: 19 },
];

const TRAFFIC_COLORS = ['#4a6fa5', '#7a4ea5', '#a54e4e', '#4ea585', '#c9a227', '#888', '#d97b29', '#5d8aa8'];

const PED_FLEE = [
  'Aiuto!!', 'Un pazzo armato!', 'Correte!!', 'Mamma miaaa!',
  'Chiamo la polizia!', 'Non mi ammazzare!', 'Questo città è impazzita!',
];
const PED_CAR = [
  'Ehi! Stai attento!', 'Stai per ammazzarmi!', 'Ma sei scemo?!',
  'Guarda dove guidi!', 'Il semaforo era rosso, scemo!',
];
const PED_BUMP = [
  'Ehi! Guarda dove vai!', 'Ma che fai?!', 'Occhio, granone!',
  'Scusa, non ho visto...', 'Ma è mio il caffè, dai!',
];
const PED_WITNESS = [
  'Ho chiamato la polizia!', 'Polizia!! Aiuto!', 'Ti hanno visto, criminale!',
];
const PED_GREET_BOSS = [
  'Ciao, boss!', 'Onore ai Los Pepes!', 'Il capo è in città!', 'Grande, capo!',
];
const PED_IDLE = [
  'Che caldo oggi...', 'Devo prendere il pane.', 'Si dice che GTA 6 costi 100 euro...',
  'Io l\'ho comprata da Temu, 4 euro.', 'Bella giornata!', 'Il tram è in ritardo, come sempre.',
];

const PED_WATCH = [
  'Hai visto quello?!', 'Mamma mia, che scena!', 'Chiamiamo qualcuno... no, aspetta.',
  'Devo postare la storia di questo!', 'Mio cugino guidava così anche lui...',
  'Che casino, il traffico è fermo adesso.', 'Speriamo non esploda...',
  'Stavolta ho visto tutto io.', 'Un poliziotto sta correndo, corriamo a vedere!',
];

const COP_CHATTER = [
  'Fermati!!', 'Polizia! Non muoverti!', 'Mani in alto!', 'Ti ho visto, mascalzone!',
];

const HOSPITAL_RESPAWN_FEE = 200;

// Tipi di edificio speciale: colore tetto, etichetta, icona minimappa
const SPECIAL_BUILDINGS = [
  { key: 'pizzeria',  name: 'Pizzeria "Da Gino"',   roof: '#d1495b', icon: 'P', blip: '#ff8fa3', block: [2, 2] },
  { key: 'restaurant',name: 'Ristorante "Bella Napoli"', roof: '#3d8361', icon: 'R', blip: '#7dd87d', block: [3, 2] },
  { key: 'gunshop',   name: 'Ammu-Nazione',         roof: '#5c5470', icon: 'A', blip: '#b39ddb', block: [2, 3] },
  { key: 'dealer',    name: 'Concessionaria Temu',  roof: '#2a6db5', icon: 'C', blip: '#63b1f2', block: [3, 3] },
  { key: 'gang',      name: 'Base Los Pepes',       roof: '#8e3b46', icon: 'G', blip: '#ff5252', block: [1, 2] },
  { key: 'hospital',  name: 'Ospedale',             roof: '#e0e0e0', icon: 'H', blip: '#ffffff', block: [3, 1] },
  { key: 'police',    name: 'Polizia',              roof: '#1f4e8c', icon: 'L', blip: '#4fc3f7', block: [2, 1] },
];
