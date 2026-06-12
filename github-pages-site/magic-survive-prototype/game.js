const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const statsEl = document.querySelector("#stats");
const skillsEl = document.querySelector("#skills");
const followersEl = document.querySelector("#followers");
const itemsEl = document.querySelector("#items");
const levelPanel = document.querySelector("#levelPanel");
const choicesEl = document.querySelector("#choices");
const startPanel = document.querySelector("#startPanel");
const startBtn = document.querySelector("#startBtn");
const moveStick = document.querySelector("#moveStick");
const moveKnob = moveStick?.querySelector("span");
const pauseTouch = document.querySelector("#pauseTouch");

const W = canvas.width;
const H = canvas.height;
const TILE = 520;
const keys = new Set();
const touchMove = { x: 0, y: 0, active: false, pointerId: null };
const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[Math.floor(Math.random() * list.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const monsterAssetByName = {
  "史莱姆": "Slime.png",
  "骷髅兵": "Skeleton.png",
  "骷髅射手": "SkeletonArcher.png",
  "僵尸": "Zombie.png",
  "鬼魂": "Ghost.png",
  "野蛮人": "Barbarian.png",
  "Imps": "Imp.png",
  "恶魔": "Demon.png",
  "树人": "Treant.png",
  "强盗": "Bandit.png",
  "暗精灵": "DarkElf.png",
  "独眼巨人": "Cyclops.png",
  "死亡骑士": "DeathKnight.png",
  "比蒙巨兽": "Behemoth.png",
  "利维坦": "Leviathan.png",
  "奇美拉": "Chimera.png",
  "海德拉": "Hydra.png",
  "耶梦加得": "Hydra.png",
  "芬里厄": "Behemoth.png",
  "克苏鲁随从": "Leviathan.png"
};
const monsterImages = {};
for (const file of new Set(Object.values(monsterAssetByName))) {
  const img = new Image();
  img.src = `./assets/monsters/${file}`;
  monsterImages[file] = img;
}
const arrowImage = new Image();
arrowImage.src = "./assets/monsters/Arrow.png";
const stoneImage = new Image();
stoneImage.src = "./assets/monsters/StoneProjectile.png";
const followerAssetById = { furnace: "FurnaceSpirit.png", balrog: "Balrog.png", lotus: "RedLotusBeast.png", water: "WaterElemental.png", rock: "RockSpirit.png", golem: "Golem.png", giant: "MountainGiant.png" };
const followerImages = {};
for (const file of new Set(Object.values(followerAssetById))) {
  const img = new Image();
  img.src = `./assets/followers/${file}`;
  followerImages[file] = img;
}

const terrains = [
  { id: "forest", name: "森林", tint: "#26351f", note: "火系蔓延+35%，风系伤害-20%", mod: { fireArea: 1.35, windDamage: 0.8 } },
  { id: "pond", name: "池塘", tint: "#19323a", note: "火系范围-25%，冰系伤害+35%", mod: { fireArea: 0.75, iceDamage: 1.35 } },
  { id: "desert", name: "沙漠", tint: "#5b4524", note: "风系伤害+35%", mod: { windDamage: 1.35 } },
  { id: "grassland", name: "草原", tint: "#3a4825", note: "均衡地形", mod: {} },
  { id: "graveyard", name: "墓地", tint: "#2c2e35", note: "亡灵更密集", mod: { undeadRate: 1.4 } },
  { id: "hell", name: "地狱", tint: "#3d1812", note: "火系伤害+25%，怪物更快", mod: { fireDamage: 1.25, monsterSpeed: 1.18 } },
  { id: "snowfield", name: "雪原", tint: "#aebfba", note: "冰系范围+25%，火系伤害-15%", mod: { iceArea: 1.25, fireDamage: 0.85 } }
];

function terrainAt(x, y) {
  const region = 720;
  const rx = Math.floor(x / region);
  const ry = Math.floor(y / region);
  let best = null;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = rx + ox;
      const cy = ry + oy;
      const seed = hash2(cx, cy);
      const centerX = (cx + 0.5 + (hashUnit(seed, 1) - 0.5) * 0.72) * region;
      const centerY = (cy + 0.5 + (hashUnit(seed, 2) - 0.5) * 0.72) * region;
      const wobble = Math.sin((x + seed % 313) * 0.006) * 92 + Math.cos((y - seed % 197) * 0.005) * 92 + Math.sin((x + y) * 0.003 + seed) * 70;
      const score = Math.hypot(x - centerX, y - centerY) + wobble;
      if (!best || score < best.score) best = { score, seed };
    }
  }
  return terrains[Math.abs(best.seed) % terrains.length];
}

function hash2(x, y) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 0x5f3759df;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return n ^ (n >>> 16);
}

function hashUnit(seed, salt) {
  let n = Math.imul(seed ^ Math.imul(salt, 1597334677), 1274126177);
  n = (n ^ (n >>> 16)) >>> 0;
  return n / 4294967295;
}

function timeGrowth() {
  return 1 + Math.floor((state?.time || 0) / 600) * 0.1;
}

const skillBook = {
  fireBreath: { name: "喷火", element: "fire", cd: 0.62, damage: 16, area: 120, type: "cone", desc: "身前锥形持续伤害并附加烧伤" },
  tornado: { name: "龙卷风", element: "wind", cd: 2.6, damage: 18, area: 95, type: "orb", desc: "追踪旋风，持续切割敌人" },
  meteor: { name: "陨石坠落", element: "fire", cd: 5.2, damage: 70, area: 120, type: "meteor", desc: "随机轰击大范围区域" },
  blizzard: { name: "暴风雪", element: "ice", cd: 4.6, damage: 15, area: 170, type: "aura", desc: "范围冰伤与减速" },
  frostNova: { name: "霜冻新星", element: "ice", cd: 4.8, damage: 35, area: 160, type: "nova", desc: "冻结近身敌人" },
  thunderCloud: { name: "雷云", element: "lightning", cd: 2.1, damage: 34, area: 260, type: "strike", desc: "雷云随机劈落敌人" },
  earthquake: { name: "地震", element: "earth", cd: 5.4, damage: 48, area: 220, type: "quake", desc: "向外发出地震波" },
  magicBolt: { name: "魔力弹", element: "arcane", cd: 0.9, damage: 19, area: 0, type: "bolt", desc: "自动追踪最近敌人" },
  chainLightning: { name: "连锁闪电", element: "lightning", cd: 2.8, damage: 29, area: 250, type: "chain", desc: "在多个目标间跳跃" },
  poisonCloud: { name: "毒气云", element: "poison", cd: 4.1, damage: 13, area: 145, type: "cloud", desc: "持续毒雾区域" },
  sandstorm: { name: "沙尘暴", element: "wind", cd: 4.4, damage: 20, area: 185, type: "aura", desc: "移动风暴，推挤并伤害敌人" },
  arrow: { name: "穿云箭", element: "physical", cd: 2.3, damage: 42, area: 0, type: "line", desc: "向最近敌人射出直线穿透" },
  ward: { name: "防御结界", element: "arcane", cd: 12, damage: 0, area: 0, type: "ward", desc: "短时间挡住所有远程伤害" },
  staticField: { name: "静电场", element: "lightning", cd: 0, damage: 8, area: 110, type: "passive", desc: "每次施法对周围造成额外伤害" },
  flameTornado: { name: "火龙卷", element: "fire", cd: 2.0, damage: 42, area: 125, type: "orb", desc: "喷火+龙卷风合成，旋转燃烧" },
  doom: { name: "末日审判", element: "fire", cd: 8.2, damage: 130, area: 300, type: "doom", desc: "陨石+龙卷风+地震合成，不分敌我火伤" },
  absoluteZero: { name: "绝对零度", element: "ice", cd: 0, damage: 20, area: 210, type: "passiveAura", desc: "暴风雪+霜冻新星合成，永久减速伤害" },
  lightningStorm: { name: "闪电风暴", element: "lightning", cd: 1.55, damage: 48, area: 330, type: "strike", desc: "龙卷风+雷云合成，雷云跟随且更多打击" },
  iceRing: { name: "冰暴之环", element: "ice", cd: 3.6, damage: 58, area: 180, type: "nova", desc: "陨石+霜冻新星合成，环形冰爆" }
};

const followersBook = [
  { id: "furnace", name: "熔炉精灵", tier: 1, element: "fire", damage: 13, range: 190 },
  { id: "balrog", name: "炎魔", tier: 2, element: "fire", damage: 24, range: 150 },
  { id: "lotus", name: "红莲星兽", tier: 3, element: "fire", damage: 55, range: 240 },
  { id: "water", name: "水元素", tier: 1, element: "ice", damage: 17, range: 260 },
  { id: "rock", name: "岩石精灵", tier: 1, element: "earth", damage: 12, range: 120 },
  { id: "golem", name: "石人", tier: 2, element: "earth", damage: 22, range: 230 },
  { id: "giant", name: "山岭巨人", tier: 3, element: "earth", damage: 43, range: 260 }
];

const followerById = Object.fromEntries(followersBook.map(f => [f.id, f]));
const followerByName = Object.fromEntries(followersBook.map(f => [f.name, f]));
const followerEvolvesTo = { furnace: "balrog", balrog: "lotus", rock: "golem", golem: "giant" };
const followerChoices = followersBook.filter(f => f.tier === 1);

const gearBook = [
  { name: "星火法杖", desc: "攻击力+12%", apply: s => s.damage *= 1.12 },
  { name: "扩散棱镜", desc: "范围+14%，攻击力+6%", apply: s => { s.area *= 1.14; s.damage *= 1.06; } },
  { name: "疾咏指环", desc: "攻速+12%，范围+6%", apply: s => { s.cooldown *= 0.88; s.area *= 1.06; } },
  { name: "冷月沙漏", desc: "冷却-12%，范围-4%", apply: s => { s.cooldown *= 0.88; s.area *= 0.96; } },
  { name: "符文胸甲", desc: "防御力+3", apply: s => s.defense += 3 },
  { name: "守望军旗", desc: "群体减伤+8%", apply: s => s.groupReduce += 0.08 },
  { name: "踏风靴", desc: "移速+10%", apply: s => s.speed *= 1.1 },
  { name: "焰纹宝珠", desc: "火伤+18%", apply: s => s.fire *= 1.18 },
  { name: "霜银吊坠", desc: "冰伤+18%", apply: s => s.ice *= 1.18 },
  { name: "复苏藤环", desc: "生命恢复+0.8/秒", apply: s => s.regen += 0.8 }
];

const artifactBook = [
  { name: "荆棘王冠", desc: "群体反伤", apply: s => s.thorns += 10 },
  { name: "永恒沙漏", desc: "大幅减冷却", apply: s => s.cooldown *= 0.72 },
  { name: "审判之眼", desc: "暴击+15%，爆伤+50%", apply: s => { s.crit += 0.15; s.critMul += 0.5; } },
  { name: "泰坦心脏", desc: "最大生命+150", apply: s => { s.maxHp += 150; s.hp += 150; } },
  { name: "星界罗盘", desc: "魔法范围+28%", apply: s => s.area *= 1.28 },
  { name: "圣泉圣杯", desc: "周期群体治疗", apply: s => s.healPulse = true }
];

const monsterBook = [
  ["史莱姆", "#73d56c", 18, 28, 7, "normal"],
  ["骷髅兵", "#d6d0bd", 28, 36, 9, "undead"],
  ["骷髅射手", "#e7ddb2", 16, 34, 8, "ranged"],
  ["僵尸", "#8fa86b", 45, 22, 10, "undead"],
  ["鬼魂", "#b8d7ff", 24, 44, 9, "ghost"],
  ["野蛮人", "#d09062", 42, 42, 12, "normal"],
  ["Imps", "#ff7051", 14, 88, 10, "demon"],
  ["恶魔", "#bc332e", 60, 58, 17, "demon"],
  ["树人", "#577a45", 95, 18, 19, "normal"],
  ["强盗", "#92816d", 36, 42, 11, "normal"],
  ["暗精灵", "#8e79d6", 28, 82, 14, "ranged"]
];

const eliteBook = [
  ["独眼巨人", "#c98c5b", 310, 28, 80, "elite"],
  ["死亡骑士", "#526070", 260, 42, 88, "elite"]
];

const bossBook = [
  ["比蒙巨兽", "#9a7252", 900, 24, 250],
  ["利维坦", "#4387a7", 850, 30, 250],
  ["奇美拉", "#a777ba", 780, 44, 250],
  ["海德拉", "#577f42", 1100, 26, 280],
  ["耶梦加得", "#4d8b66", 1800, 30, 500],
  ["芬里厄", "#cfd6df", 1500, 52, 500],
  ["克苏鲁随从", "#446b69", 1650, 34, 500]
];

let state;

function newState() {
  return {
    running: false,
    paused: false,
    time: 0,
    spawn: 0,
    projectiles: [],
    enemyShots: [],
    zones: [],
    effects: [],
    monsters: [],
    gems: [],
    chests: [],
    heals: [],
    texts: [],
    terrain: terrainAt(W / 2, H / 2),
    player: {
      x: W / 2, y: H / 2, r: 16, hp: 180, maxHp: 180, xp: 0, next: 32, level: 1,
      speed: 205, damage: 1, area: 1, cooldown: 1, defense: 0, groupReduce: 0,
      fire: 1, ice: 1, wind: 1, earth: 1, lightning: 1, arcane: 1, poison: 1,
      regen: 0.7, crit: 0.05, critMul: 1.5, thorns: 0, healPulse: false, ward: 0, hitGrace: 0
    },
    skills: { fireBreath: skillState("fireBreath"), magicBolt: skillState("magicBolt") },
    followers: [],
    items: [],
    artifacts: [],
    last: performance.now()
  };
}

function skillState(id) {
  return { id, level: 1, t: rand(0, skillBook[id].cd || 1) };
}

function terrainMod(key, fallback = 1) {
  return state.terrain.mod[key] || fallback;
}

function elementMult(element) {
  const p = state.player;
  let v = p[element] || 1;
  if (element === "fire") v *= terrainMod("fireDamage") * terrainMod("fireArea", 1);
  if (element === "ice") v *= terrainMod("iceDamage");
  if (element === "wind") v *= terrainMod("windDamage");
  return v;
}

function effectiveDefense() {
  return state.player.defense + (state.player.followerDefense || 0);
}

function areaMult(element) {
  let v = state.player.area;
  if (element === "fire") v *= terrainMod("fireArea");
  if (element === "ice") v *= terrainMod("iceArea");
  return v;
}

function addText(text, x, y, color = "#fff") {
  state.texts.push({ text, x, y, color, life: 1 });
}

function spawnMonster(kind = "normal") {
  const cap = state.time > 180 ? 145 : state.time > 90 ? 120 : 90;
  if (kind === "normal" && state.monsters.length >= cap) return;
  const wave = 1 + state.time / 85;
  const edge = Math.floor(rand(0, 4));
  const p = state.player;
  const camX = p.x - W / 2;
  const camY = p.y - H / 2;
  const margin = 90;
  const pos = edge === 0 ? { x: camX + rand(0, W), y: camY - margin } : edge === 1 ? { x: camX + W + margin, y: camY + rand(0, H) } : edge === 2 ? { x: camX + rand(0, W), y: camY + H + margin } : { x: camX - margin, y: camY + rand(0, H) };
  const src = kind === "boss" ? bossBook[Math.min(Math.max(0, Math.floor(state.time / 300) - 1), bossBook.length - 1)] : kind === "elite" ? pick(eliteBook) : pickMonster();
  const growth = timeGrowth();
  const scale = (kind === "boss" ? 1 + state.time / 260 : kind === "elite" ? 1.8 : wave) * growth;
  const radius = src[0] === "比蒙巨兽" ? 58 : kind === "boss" ? 38 : src[0] === "独眼巨人" ? 42 : kind === "elite" ? 28 : 16;
  state.monsters.push({
    x: pos.x, y: pos.y, r: radius,
    name: src[0], color: src[1], hp: src[2] * scale, maxHp: src[2] * scale,
    speed: src[3] * terrainMod("monsterSpeed") * (kind === "boss" ? 0.65 : 1),
    xp: src[4], tag: src[5], kind, hit: 0, shoot: rand(1, 3), attackMul: growth
  });
  if (kind === "boss") addText(`${src[0]} 降临`, W / 2 - 60, 88, "#ffd36b");
}

function pickMonster() {
  const weighted = [];
  for (const m of monsterBook) {
    const weight = m[5] === "ranged" ? 0.35 : 1;
    for (let i = 0; i < Math.round(weight * 20); i++) weighted.push(m);
  }
  return pick(weighted);
}

function nearestEnemy(from, range = 9999) {
  let best = null;
  let bd = range;
  for (const m of state.monsters) {
    const d = dist(from, m);
    if (d < bd) {
      best = m;
      bd = d;
    }
  }
  return best;
}

function castSkill(s) {
  const b = skillBook[s.id];
  const p = state.player;
  const lvl = s.level;
  const dmg = b.damage * (1 + (lvl - 1) * 0.35) * p.damage * elementMult(b.element);
  const area = b.area * (1 + (lvl - 1) * 0.12) * areaMult(b.element);
  if (state.skills.staticField && b.type !== "passive") {
    damageCircle(p.x, p.y, 95 * p.area, skillBook.staticField.damage * (1 + (state.skills.staticField.level - 1) * 0.35) * p.lightning, "lightning", false);
    addRing(p.x, p.y, 95 * p.area, "rgba(255,238,78,.85)", 0.22);
  }

  if (b.type === "bolt") {
    const target = nearestEnemy(p);
    if (!target) return;
    fireProjectile(p.x, p.y, target.x, target.y, 430, dmg, 6, b.element, "#d9b8ff");
    if (s.id === "arrow") addLine(p.x, p.y, target.x, target.y, "rgba(255,246,170,.85)", 5, 0.18, false);
  } else if (b.type === "line") {
    const target = nearestEnemy(p);
    if (!target) return;
    fireProjectile(p.x, p.y, target.x, target.y, 720, dmg, 4, b.element, "#fcf0aa", true);
    addLine(p.x, p.y, target.x, target.y, "rgba(255,246,170,.9)", 7, 0.2, false);
  } else if (b.type === "cone") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    const ang = Math.atan2(target.y - p.y, target.x - p.x);
    state.zones.push({ x: p.x, y: p.y, a: ang, r: area, life: 0.28, maxLife: 0.28, damage: dmg * 0.13, element: b.element, type: "cone", color: "rgba(255,111,49,.34)", grow: 1.2 });
    addParticles(p.x + Math.cos(ang) * 45, p.y + Math.sin(ang) * 45, "rgba(255,180,84,.9)", 12, 55, 0.35);
  } else if (b.type === "meteor") {
    const target = nearestEnemy(p) || { x: rand(120, W - 120), y: rand(90, H - 90) };
    const x = target.x + rand(-60, 60);
    const y = target.y + rand(-60, 60);
    addLine(x - 90, y - 170, x, y, "rgba(255,140,52,.95)", 14, 0.36, false);
    addRing(x, y, area, "rgba(255,196,86,.9)", 0.5);
    addParticles(x, y, "rgba(255,110,54,.9)", 24, area * 0.35, 0.55);
    state.zones.push({ x, y, r: area, life: 0.5, maxLife: 0.5, damage: dmg, element: b.element, type: "burst", color: "rgba(255,91,48,.30)", spin: 3, grow: 2.0 });
  } else if (b.type === "aura" || b.type === "cloud") {
    const target = nearestEnemy(p, 500) || p;
    state.zones.push({ x: target.x, y: target.y, r: area, life: 3.2, maxLife: 3.2, damage: dmg * 0.22, element: b.element, type: b.element === "wind" ? "spiral" : "dot", color: b.element === "ice" ? "rgba(150,220,255,.25)" : b.element === "poison" ? "rgba(103,212,95,.23)" : "rgba(214,190,92,.22)", spin: b.element === "wind" ? 5 : -1, grow: 0.05 });
    if (b.element === "poison") addParticles(target.x, target.y, "rgba(128,255,105,.65)", 18, area * 0.45, 2.4);
  } else if (b.type === "nova") {
    damageCircle(p.x, p.y, area, dmg, b.element, true);
    state.zones.push({ x: p.x, y: p.y, r: area, life: 0.38, maxLife: 0.38, damage: 0, element: b.element, type: "visual", color: "rgba(165,230,255,.25)", grow: 2.4 });
    addRing(p.x, p.y, area, "rgba(210,250,255,.9)", 0.45);
    addParticles(p.x, p.y, "rgba(190,245,255,.85)", 20, area * 0.48, 0.55);
  } else if (b.type === "strike" || b.type === "chain") {
    const hits = b.type === "chain" ? 3 + Math.floor(lvl / 2) : 2 + Math.floor(lvl / 2);
    for (let i = 0; i < hits; i++) {
      const target = nearestEnemy(p, area);
      if (target) hitMonster(target, dmg, b.element);
      if (target) {
        addLightning(target.x + rand(-35, 35), target.y - rand(80, 130), target.x, target.y);
        state.zones.push({ x: target.x, y: target.y, r: 28, life: 0.18, maxLife: 0.18, damage: 0, element: b.element, type: "visual", color: "rgba(255,245,136,.45)", grow: 1.8 });
      }
    }
  } else if (b.type === "quake") {
    damageCircle(p.x, p.y, area, dmg, b.element, true);
    state.zones.push({ x: p.x, y: p.y, r: area, life: 0.5, maxLife: 0.5, damage: 0, element: b.element, type: "visual", color: "rgba(180,128,84,.24)", grow: 2.1 });
    addRing(p.x, p.y, area, "rgba(255,184,92,.75)", 0.55);
    for (let i = 0; i < 8; i++) {
      const a = rand(0, Math.PI * 2);
      const r1 = rand(25, area * 0.35);
      const r2 = rand(area * 0.45, area);
      addLine(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1, p.x + Math.cos(a + rand(-0.25, 0.25)) * r2, p.y + Math.sin(a + rand(-0.25, 0.25)) * r2, "rgba(255,196,110,.72)", 4, 0.5, true);
    }
  } else if (b.type === "orb") {
    const target = nearestEnemy(p) || p;
    const a = Math.atan2(target.y - p.y, target.x - p.x);
    state.zones.push({
      x: p.x + Math.cos(a) * 45,
      y: p.y + Math.sin(a) * 45,
      vx: Math.cos(a) * 170,
      vy: Math.sin(a) * 170,
      r: area,
      life: 2.6,
      maxLife: 2.6,
      damage: dmg * 0.28,
      element: b.element,
      type: "movingSpiral",
      color: s.id === "flameTornado" ? "rgba(255,95,42,.30)" : "rgba(190,220,220,.22)",
      spin: s.id === "flameTornado" ? 8 : 5,
      seek: 250
    });
    addRing(target.x, target.y, area * 0.45, s.id === "flameTornado" ? "rgba(255,160,78,.65)" : "rgba(220,255,245,.55)", 0.6);
  } else if (b.type === "ward") {
    p.ward = 4 + lvl * 0.4;
    addText("防御结界", p.x - 28, p.y - 32, "#9fd2ff");
    addRing(p.x, p.y, 70, "rgba(145,210,255,.95)", 0.75);
  } else if (b.type === "doom") {
    damageCircle(p.x, p.y, area, dmg, b.element, true);
    p.hp -= 14;
    state.zones.push({ x: p.x, y: p.y, r: area, life: 0.8, maxLife: 0.8, damage: 0, element: b.element, type: "visual", color: "rgba(255,74,40,.35)", spin: -4, grow: 3.0 });
    addRing(p.x, p.y, area, "rgba(255,70,35,.95)", 0.85);
    for (let i = 0; i < 9; i++) {
      const a = rand(0, Math.PI * 2);
      addLine(p.x, p.y, p.x + Math.cos(a) * area, p.y + Math.sin(a) * area, "rgba(255,210,80,.75)", 7, 0.65, true);
    }
  }
}

function fireProjectile(x, y, tx, ty, speed, damage, r, element, color, pierce = false) {
  const a = Math.atan2(ty - y, tx - x);
  state.projectiles.push({ x, y, px: x, py: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage, r, element, color, life: 2.2, pierce, hit: new Set(), angle: a });
}

function fireEnemyShot(m, p) {
  const a = Math.atan2(p.y - m.y, p.x - m.x);
  const speed = m.name === "暗精灵" ? 300 : 245;
  state.enemyShots.push({
    x: m.x,
    y: m.y,
    px: m.x,
    py: m.y,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    r: 5,
    damage: Math.max(1, 10 * timeGrowth() - effectiveDefense()) * (1 - state.player.groupReduce),
    color: m.name === "暗精灵" ? "rgba(196,150,255,.95)" : "rgba(255,218,126,.95)",
    life: 3.2,
    angle: a
  });
  addLine(m.x, m.y, m.x + Math.cos(a) * 38, m.y + Math.sin(a) * 38, "rgba(255,230,150,.65)", 3, 0.18, false);
}

function fireEnemyBoulder(m, target) {
  const a = Math.atan2(target.y - m.y, target.x - m.x);
  const startX = m.x + Math.cos(a) * (m.r * 0.8);
  const startY = m.y + Math.sin(a) * (m.r * 0.8) - 10;
  state.enemyShots.push({
    kind: "rock",
    x: startX,
    y: startY,
    px: startX,
    py: startY,
    vx: Math.cos(a) * 285,
    vy: Math.sin(a) * 285,
    r: 13,
    damage: Math.max(3, 18 * timeGrowth() - effectiveDefense() * 0.5) * (1 - state.player.groupReduce),
    color: "rgba(164,126,82,.95)",
    life: 3.4,
    angle: a,
    spin: rand(0, Math.PI * 2)
  });
  addLine(m.x, m.y - 10, startX, startY, "rgba(92,66,42,.62)", 8, 0.16, false);
}

function cyclopsAreaAttack(m) {
  const p = state.player;
  const radius = 118;
  const damage = Math.max(4, 19 * timeGrowth() - effectiveDefense() * 0.45) * (1 - p.groupReduce);
  if (Math.hypot(p.x - m.x, p.y - m.y) < radius + p.r && p.hitGrace <= 0) {
    p.hp -= damage;
    p.hitGrace = 0.48;
    addText(`-${Math.ceil(damage)}`, p.x - 10, p.y - 28, "#ff7a66");
  }
  for (const f of state.followers) {
    if (f.hp > 0 && Math.hypot(f.x - m.x, f.y - m.y) < radius + 16) damageFollower(f, damage * 0.85);
  }
  addRing(m.x, m.y, radius * 0.62, "rgba(255,156,70,.82)", 0.28);
  addRing(m.x, m.y, radius, "rgba(132,96,63,.85)", 0.5);
  state.zones.push({ x: m.x, y: m.y, r: radius, life: 0.4, maxLife: 0.4, damage: 0, element: "earth", type: "visual", color: "rgba(142,95,48,.25)", grow: 2.1 });
  for (let i = 0; i < 8; i++) {
    const a = rand(0, Math.PI * 2);
    addLine(m.x + Math.cos(a) * 20, m.y + Math.sin(a) * 20, m.x + Math.cos(a + rand(-0.22, 0.22)) * rand(72, radius), m.y + Math.sin(a + rand(-0.22, 0.22)) * rand(72, radius), "rgba(96,68,42,.72)", rand(3, 6), 0.36, true);
  }
}

function startDeathKnightCharge(m, target) {
  const a = Math.atan2(target.y - m.y, target.x - m.x);
  m.charge = {
    phase: "windup",
    t: 0.58,
    angle: a,
    hitFollowers: new Set(),
    hitPlayer: false,
    fx: 0
  };
  m.specialCd = rand(4.6, 6.2);
  addText("冲锋", m.x - 18, m.y - m.r - 24, "#ff6a4c");
}

function updateDeathKnightCharge(m, target, dt) {
  if (!m.charge) return false;
  const c = m.charge;
  c.t -= dt;
  c.fx -= dt;
  if (c.phase === "windup") {
    const a = Math.atan2(target.y - m.y, target.x - m.x);
    c.angle = c.angle * 0.86 + a * 0.14;
    if (c.fx <= 0) {
      c.fx = 0.08;
      addLine(m.x, m.y, m.x + Math.cos(c.angle) * 230, m.y + Math.sin(c.angle) * 230, "rgba(255,70,45,.62)", 5, 0.14, false);
    }
    if (c.t <= 0) {
      c.phase = "lunge";
      c.t = 0.34;
      addLine(m.x, m.y, m.x + Math.cos(c.angle) * 260, m.y + Math.sin(c.angle) * 260, "rgba(255,150,72,.8)", 8, 0.22, false);
    }
    return true;
  }

  const speed = 780;
  const oldX = m.x;
  const oldY = m.y;
  m.x += Math.cos(c.angle) * speed * dt;
  m.y += Math.sin(c.angle) * speed * dt;
  m.hit = Math.max(m.hit, 0.08);
  if (c.fx <= 0) {
    c.fx = 0.045;
    addLine(oldX, oldY, m.x, m.y, "rgba(255,88,54,.55)", 9, 0.16, false);
  }

  const p = state.player;
  const chargeDamage = Math.max(6, 28 * timeGrowth() - effectiveDefense() * 0.5) * (1 - p.groupReduce);
  if (!c.hitPlayer && Math.hypot(p.x - m.x, p.y - m.y) < p.r + m.r + 12 && p.hitGrace <= 0) {
    p.hp -= chargeDamage;
    p.hitGrace = 0.5;
    c.hitPlayer = true;
    addText(`-${Math.ceil(chargeDamage)}`, p.x - 10, p.y - 28, "#ff7a66");
  }
  for (const f of state.followers) {
    if (f.hp <= 0 || c.hitFollowers.has(f)) continue;
    if (Math.hypot(f.x - m.x, f.y - m.y) < m.r + 18) {
      damageFollower(f, chargeDamage * 0.82);
      c.hitFollowers.add(f);
    }
  }
  if (c.t <= 0) m.charge = null;
  return true;
}

function behemothEarthquake(m) {
  const p = state.player;
  const radius = 185;
  const damage = Math.max(8, 34 * timeGrowth() - effectiveDefense() * 0.45) * (1 - p.groupReduce);
  if (Math.hypot(p.x - m.x, p.y - m.y) < radius + p.r && p.hitGrace <= 0) {
    p.hp -= damage;
    p.hitGrace = 0.58;
    addText(`-${Math.ceil(damage)}`, p.x - 10, p.y - 28, "#ff7a66");
  }
  for (const f of state.followers) {
    if (f.hp > 0 && Math.hypot(f.x - m.x, f.y - m.y) < radius + 18) damageFollower(f, damage * 0.82);
  }
  state.zones.push({ x: m.x, y: m.y, r: radius, life: 0.58, maxLife: 0.58, damage: 0, element: "earth", type: "visual", color: "rgba(118,72,42,.30)", grow: 2.8 });
  addRing(m.x, m.y, radius * 0.58, "rgba(255,150,74,.78)", 0.36);
  addRing(m.x, m.y, radius, "rgba(126,88,54,.92)", 0.62);
  for (let i = 0; i < 14; i++) {
    const a = rand(0, Math.PI * 2);
    const inner = rand(26, 64);
    const outer = rand(radius * 0.58, radius);
    addLine(m.x + Math.cos(a) * inner, m.y + Math.sin(a) * inner, m.x + Math.cos(a + rand(-0.25, 0.25)) * outer, m.y + Math.sin(a + rand(-0.25, 0.25)) * outer, i % 2 ? "rgba(78,52,34,.78)" : "rgba(255,118,42,.55)", rand(4, 8), 0.48, true);
  }
}

function startBehemothCharge(m, target) {
  const a = Math.atan2(target.y - m.y, target.x - m.x);
  m.charge = { phase: "windup", t: 0.72, angle: a, hitFollowers: new Set(), hitPlayer: false, fx: 0, behemoth: true };
  m.specialCd = rand(5.6, 7.2);
  addText("比蒙突刺", m.x - 34, m.y - m.r - 28, "#ffb06b");
}

function updateBehemothCharge(m, target, dt) {
  if (!m.charge?.behemoth) return false;
  const c = m.charge;
  c.t -= dt;
  c.fx -= dt;
  if (c.phase === "windup") {
    const a = Math.atan2(target.y - m.y, target.x - m.x);
    c.angle = c.angle * 0.9 + a * 0.1;
    if (c.fx <= 0) {
      c.fx = 0.09;
      addLine(m.x, m.y, m.x + Math.cos(c.angle) * 300, m.y + Math.sin(c.angle) * 300, "rgba(255,150,74,.72)", 9, 0.16, false);
    }
    if (c.t <= 0) {
      c.phase = "lunge";
      c.t = 0.42;
      addLine(m.x, m.y, m.x + Math.cos(c.angle) * 340, m.y + Math.sin(c.angle) * 340, "rgba(255,205,98,.85)", 12, 0.25, false);
    }
    return true;
  }
  const oldX = m.x;
  const oldY = m.y;
  const speed = 680;
  m.x += Math.cos(c.angle) * speed * dt;
  m.y += Math.sin(c.angle) * speed * dt;
  m.hit = Math.max(m.hit, 0.1);
  if (c.fx <= 0) {
    c.fx = 0.05;
    addLine(oldX, oldY, m.x, m.y, "rgba(156,98,58,.62)", 14, 0.18, false);
  }
  const p = state.player;
  const damage = Math.max(10, 42 * timeGrowth() - effectiveDefense() * 0.5) * (1 - p.groupReduce);
  if (!c.hitPlayer && Math.hypot(p.x - m.x, p.y - m.y) < p.r + m.r + 10 && p.hitGrace <= 0) {
    p.hp -= damage;
    p.hitGrace = 0.6;
    c.hitPlayer = true;
    addText(`-${Math.ceil(damage)}`, p.x - 10, p.y - 28, "#ff7a66");
  }
  for (const f of state.followers) {
    if (f.hp <= 0 || c.hitFollowers.has(f)) continue;
    if (Math.hypot(f.x - m.x, f.y - m.y) < m.r + 20) {
      damageFollower(f, damage * 0.78);
      c.hitFollowers.add(f);
    }
  }
  if (c.t <= 0) {
    m.charge = null;
    behemothEarthquake(m);
  }
  return true;
}

function spawnHeal() {
  const p = state.player;
  const angle = rand(0, Math.PI * 2);
  const distance = rand(240, 560);
  state.heals.push({
    x: p.x + Math.cos(angle) * distance,
    y: p.y + Math.sin(angle) * distance,
    r: 11,
    amount: 34,
    pulse: rand(0, Math.PI * 2)
  });
}

function addLine(x1, y1, x2, y2, color, width, life, jagged = false) {
  if (state.effects.length > 180) return;
  const points = [];
  const count = jagged ? 4 : 2;
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    points.push({
      x: x1 + (x2 - x1) * t + (jagged && i > 0 && i < count - 1 ? rand(-13, 13) : 0),
      y: y1 + (y2 - y1) * t + (jagged && i > 0 && i < count - 1 ? rand(-13, 13) : 0)
    });
  }
  state.effects.push({ type: "line", points, color, width, life, maxLife: life });
}

function addLightning(x1, y1, x2, y2) {
  addLine(x1, y1, x2, y2, "rgba(255,244,88,.95)", 5, 0.22, true);
  addLine(x1, y1, x2, y2, "rgba(120,210,255,.45)", 13, 0.22, true);
  addRing(x2, y2, 26, "rgba(255,255,150,.85)", 0.22);
}

function addRing(x, y, r, color, life) {
  state.effects.push({ type: "ring", x, y, r, color, width: 5, life, maxLife: life, grow: 120 });
}

function addParticles(x, y, color, count, radius, life) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const d = rand(0, radius);
    state.effects.push({
      type: "particle",
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d,
      vx: Math.cos(a) * rand(10, 70),
      vy: Math.sin(a) * rand(10, 70),
      r: rand(2, 6),
      color,
      life: life * rand(0.65, 1.2),
      maxLife: life
    });
  }
}

function hitMonster(m, amount, element) {
  const p = state.player;
  const crit = Math.random() < p.crit;
  const dmg = amount * (crit ? p.critMul : 1);
  m.hp -= dmg;
  m.hit = 0.08;
  if (crit) addText("暴击", m.x - 12, m.y - 18, "#ffd36b");
}

function damageCircle(x, y, r, damage, element, slow) {
  for (const m of state.monsters) {
    if (Math.hypot(m.x - x, m.y - y) < r + m.r) {
      hitMonster(m, damage, element);
      if (slow) m.slow = 1;
    }
  }
}

function update(dt) {
  if (!state.running || state.paused) return;
  const p = state.player;
  state.time += dt;
  state.spawn -= dt;
  state.healTimer = (state.healTimer ?? rand(12, 22)) - dt;
  const prevTerrain = state.terrain;
  state.terrain = terrainAt(p.x, p.y);
  if (prevTerrain.id !== state.terrain.id) addText(`进入：${state.terrain.name}`, p.x - 40, p.y - 38, "#e7f7cf");
  p.ward = Math.max(0, p.ward - dt);
  p.hitGrace = Math.max(0, p.hitGrace - dt);
  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  if (state.healTimer <= 0) {
    spawnHeal();
    state.healTimer = rand(14, 26);
  }

  let mx = 0, my = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
  mx += touchMove.x;
  my += touchMove.y;
  const len = Math.hypot(mx, my) || 1;
  p.x += (mx / len) * p.speed * dt;
  p.y += (my / len) * p.speed * dt;

  if (state.spawn <= 0) {
    const count = state.time > 90 ? 3 : state.time > 35 ? 2 : 1;
    for (let i = 0; i < count; i++) spawnMonster("normal");
    if (state.time >= 300 && Math.random() < 0.08 + state.time / 3000) spawnMonster("elite");
    if (Math.floor((state.time - dt) / 300) < Math.floor(state.time / 300)) spawnMonster("boss");
    state.spawn = Math.max(0.18, 0.9 - state.time / 500);
  }
  for (const s of Object.values(state.skills)) {
    const b = skillBook[s.id];
    if (b.cd <= 0) continue;
    s.t -= dt;
    if (s.t <= 0) {
      castSkill(s);
      s.t = b.cd * p.cooldown * Math.max(0.38, 1 - (s.level - 1) * 0.035);
    }
  }
  if (state.skills.absoluteZero) damageCircle(p.x, p.y, skillBook.absoluteZero.area * p.area, 6 * dt * 60, "ice", true);

  updateFollowers(dt);
  updateProjectiles(dt);
  updateEnemyShots(dt);
  updateZones(dt);
  updateEffects(dt);
  updateMonsters(dt);
  updateGems(dt);
  updateChests(dt);
  updateHeals(dt);
  updateTexts(dt);
  checkFusions();
  if (p.healPulse && Math.floor((state.time - dt) / 9) < Math.floor(state.time / 9)) p.hp = Math.min(p.maxHp, p.hp + 30);
  if (p.hp <= 0) {
    state.running = false;
    startPanel.classList.remove("hidden");
    startPanel.querySelector("h1").textContent = "生存结束";
    startPanel.querySelector("p").textContent = `坚持 ${Math.floor(state.time)} 秒 · 等级 ${p.level}`;
    startBtn.textContent = "重新开始";
  }
}

function updateFollowers(dt) {
  const p = state.player;
  p.followerDefense = state.followers.reduce((sum, f) => sum + (f.id === "golem" ? 3 : f.id === "giant" ? 6 : 0), 0);
  for (let i = state.followers.length - 1; i >= 0; i--) {
    const f = state.followers[i];
    const grownMax = Math.floor((f.baseMaxHp || f.maxHp || followerMaxHp(f)) * timeGrowth());
    if (grownMax > f.maxHp) {
      f.hp += grownMax - f.maxHp;
      f.maxHp = grownMax;
    }
    if (f.hp <= 0) {
      addText(`${f.name} 倒下`, f.x - 24, f.y - 28, "#d7b08a");
      state.followers.splice(i, 1);
      continue;
    }
    f.hitGrace = Math.max(0, (f.hitGrace || 0) - dt);
    const target = nearestEnemy(f, f.range + 170);
    const home = { x: p.x + ((i % 3) - 1) * 34, y: p.y + 42 + Math.floor(i / 3) * 18 };
    const moveTarget = target || home;
    const desired = target ? (f.id === "water" ? Math.max(145, target.r + 110) : f.id === "golem" || f.id === "giant" ? Math.max(125, target.r + 92) : Math.max(58, target.r + 34)) : 0;
    const dx = moveTarget.x - f.x;
    const dy = moveTarget.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = target ? 185 : 230;
    if (!target || d > desired) {
      f.x += (dx / d) * speed * dt;
      f.y += (dy / d) * speed * dt;
    } else if (target && d < desired * 0.7) {
      f.x -= (dx / d) * speed * 0.55 * dt;
      f.y -= (dy / d) * speed * 0.55 * dt;
    }
    f.cast = Math.max(0, (f.cast || 0) - dt);
    f.t -= dt;
    if (f.t <= 0) {
      const attackTarget = nearestEnemy(f, f.range);
      if (attackTarget) followerAttack(f, attackTarget);
      f.t = f.id === "water" ? 0.85 : f.id === "golem" ? 1.15 : f.id === "giant" ? 1.25 : f.id === "lotus" ? 1.65 : f.id === "balrog" ? 1.05 : 0.95;
    }
  }
}

function followerAttack(f, target) {
  const p = state.player;
  const damage = f.damage * timeGrowth() * p.damage * (1 + (f.tier - 1) * 0.18);
  if (f.id === "furnace") {
    f.cast = 0.32;
    fireFollowerFireball(f, target, damage * 1.08);
    return;
  }
  if (f.id === "water") {
    f.cast = 0.2;
    fireProjectile(f.x, f.y, target.x, target.y, 390, damage, 6, "ice", "#8de8ff");
    addLine(f.x, f.y, target.x, target.y, "rgba(145,232,255,.28)", 4, 0.12, false);
    return;
  }
  if (f.id === "rock") {
    f.cast = 0.28;
    punchTarget(f, target, damage * 1.18);
    return;
  }
  if (f.id === "golem") {
    f.cast = 0.36;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    throwBoulder(f, target, damage * 1.08);
    return;
  }
  if (f.id === "balrog") {
    f.cast = 0.42;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    breatheFire(f, target, damage);
    return;
  }
  if (f.id === "lotus") {
    f.cast = 0.55;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    summonLotusMeteor(f, target, damage * 1.25);
    return;
  }
  if (f.id === "giant") {
    f.cast = 0.65;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    giantEarthquake(f, damage * 1.25);
    return;
  }
  fireProjectile(f.x, f.y, target.x, target.y, 360, damage, f.tier >= 2 ? 6 : 5, f.element, f.element === "fire" ? "#ff8a42" : f.element === "ice" ? "#9deaff" : "#c7a16a");
}

function fireFollowerFireball(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const muzzleX = f.x + Math.cos(a) * 20;
  const muzzleY = f.y + Math.sin(a) * 20;
  state.projectiles.push({
    kind: "furnaceFireball",
    x: muzzleX,
    y: muzzleY,
    px: muzzleX,
    py: muzzleY,
    vx: Math.cos(a) * 430,
    vy: Math.sin(a) * 430,
    damage,
    r: 9,
    element: "fire",
    color: "#ff7a22",
    life: 2.0,
    pierce: false,
    hit: new Set(),
    angle: a,
    spin: rand(0, Math.PI * 2),
    maxLife: 2.0
  });
  addRing(muzzleX, muzzleY, 22, "rgba(255,168,62,.82)", 0.22);
  for (let i = 0; i < 4; i++) {
    const s = a + rand(-0.8, 0.8);
    addLine(muzzleX, muzzleY, muzzleX - Math.cos(s) * rand(10, 24), muzzleY - Math.sin(s) * rand(10, 24), "rgba(255,210,92,.72)", 3, 0.18, true);
  }
}

function punchTarget(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  f.face = a;
  const fistX = f.x + Math.cos(a) * 24;
  const fistY = f.y + Math.sin(a) * 24;
  hitMonster(target, damage, "earth");
  target.x += Math.cos(a) * 18;
  target.y += Math.sin(a) * 18;
  target.slow = Math.max(target.slow || 0, 0.3);
  addRing(target.x, target.y, 30, "rgba(214,170,102,.82)", 0.22);
  addLine(f.x, f.y, fistX, fistY, "rgba(74,48,30,.82)", 9, 0.12, false);
  addLine(fistX, fistY, target.x, target.y, "rgba(238,196,132,.65)", 6, 0.16, true);
  for (let i = 0; i < 3; i++) {
    const s = a + rand(-0.8, 0.8);
    addLine(target.x, target.y, target.x + Math.cos(s) * rand(16, 32), target.y + Math.sin(s) * rand(16, 32), "rgba(164,124,82,.55)", 3, 0.18, true);
  }
}

function throwBoulder(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const startX = f.x + Math.cos(a) * 22;
  const startY = f.y + Math.sin(a) * 22 - 8;
  state.projectiles.push({
    kind: "boulder",
    x: startX,
    y: startY,
    px: startX,
    py: startY,
    vx: Math.cos(a) * 340,
    vy: Math.sin(a) * 340,
    damage,
    r: 11,
    element: "earth",
    color: "#a88a62",
    life: 2.1,
    maxLife: 2.1,
    pierce: false,
    hit: new Set(),
    angle: a,
    spin: rand(0, Math.PI * 2)
  });
  addLine(f.x, f.y, startX, startY, "rgba(92,66,42,.55)", 7, 0.12, false);
}

function giantEarthquake(f, damage) {
  const radius = 132;
  damageCircle(f.x, f.y, radius, damage, "earth", true);
  state.zones.push({
    x: f.x,
    y: f.y,
    r: radius,
    life: 0.5,
    maxLife: 0.5,
    damage: 0,
    element: "earth",
    type: "visual",
    color: "rgba(156,105,58,.28)",
    grow: 2.4
  });
  addRing(f.x, f.y, radius * 0.62, "rgba(255,124,42,.78)", 0.34);
  addRing(f.x, f.y, radius, "rgba(168,122,76,.82)", 0.52);
  for (let i = 0; i < 10; i++) {
    const a = rand(0, Math.PI * 2);
    const inner = rand(18, 45);
    const outer = rand(radius * 0.55, radius);
    const x1 = f.x + Math.cos(a) * inner;
    const y1 = f.y + Math.sin(a) * inner;
    const x2 = f.x + Math.cos(a + rand(-0.22, 0.22)) * outer;
    const y2 = f.y + Math.sin(a + rand(-0.22, 0.22)) * outer;
    addLine(x1, y1, x2, y2, i % 2 ? "rgba(86,58,39,.78)" : "rgba(255,111,35,.58)", rand(3, 7), 0.45, true);
  }
}

function breatheFire(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const range = f.range + 45;
  const arc = Math.PI * 0.52;
  damageCone(f.x, f.y, target.x, target.y, range, arc, damage * 1.05, "fire");
  const cx = f.x + Math.cos(a) * range * 0.48;
  const cy = f.y + Math.sin(a) * range * 0.48;
  state.zones.push({
    x: cx,
    y: cy,
    r: range * 0.38,
    life: 0.26,
    maxLife: 0.26,
    damage: 0,
    element: "fire",
    type: "coneVisual",
    color: "rgba(255,92,28,.28)",
    angle: a,
    arc,
    grow: 1.4
  });
  for (let i = 0; i < 5; i++) {
    const spread = a + rand(-arc * 0.46, arc * 0.46);
    const len = rand(range * 0.45, range);
    addLine(f.x + Math.cos(a) * 12, f.y + Math.sin(a) * 12, f.x + Math.cos(spread) * len, f.y + Math.sin(spread) * len, i % 2 ? "rgba(255,207,70,.72)" : "rgba(255,83,26,.78)", rand(4, 9), 0.2, true);
  }
  addRing(f.x + Math.cos(a) * 22, f.y + Math.sin(a) * 22, 28, "rgba(255,183,62,.72)", 0.18);
}

function summonLotusMeteor(f, target, damage) {
  const tx = target.x + rand(-24, 24);
  const ty = target.y + rand(-24, 24);
  const startX = tx - 170;
  const startY = ty - 230;
  state.projectiles.push({
    kind: "lotusMeteor",
    x: startX,
    y: startY,
    px: startX,
    py: startY,
    tx,
    ty,
    vx: 390,
    vy: 520,
    damage,
    r: 15,
    element: "fire",
    color: "#ff6428",
    life: 1.1,
    maxLife: 1.1,
    pierce: false,
    hit: new Set(),
    angle: Math.atan2(ty - startY, tx - startX),
    spin: rand(0, Math.PI * 2)
  });
  addRing(tx, ty, 54, "rgba(255,82,34,.5)", 0.45);
  addLine(f.x, f.y - 18, tx, ty, "rgba(255,198,74,.28)", 3, 0.22, true);
}

function damageCone(x, y, tx, ty, range, arc, damage, element) {
  const facing = Math.atan2(ty - y, tx - x);
  for (const m of state.monsters) {
    const dx = m.x - x;
    const dy = m.y - y;
    const d = Math.hypot(dx, dy);
    if (d > range + m.r) continue;
    let diff = Math.atan2(Math.sin(Math.atan2(dy, dx) - facing), Math.cos(Math.atan2(dy, dx) - facing));
    if (Math.abs(diff) <= arc * 0.5) hitMonster(m, damage * (1 - d / (range * 1.35)), element);
  }
}

function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const pr = state.projectiles[i];
    pr.px = pr.x;
    pr.py = pr.y;
    if (pr.kind === "boulder") pr.spin += dt * 8;
    if (pr.kind === "lotusMeteor") {
      pr.spin += dt * 9;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (Math.random() < 0.35) {
        addLine(pr.x, pr.y, pr.x - pr.vx * 0.035 + rand(-10, 10), pr.y - pr.vy * 0.035 + rand(-10, 10), "rgba(255,126,38,.55)", rand(4, 8), 0.16, true);
      }
      if (Math.hypot(pr.x - pr.tx, pr.y - pr.ty) < 28 || pr.y >= pr.ty) {
        damageCircle(pr.tx, pr.ty, 92, pr.damage, "fire", false);
        state.zones.push({ x: pr.tx, y: pr.ty, r: 92, life: 0.42, maxLife: 0.42, damage: 0, element: "fire", type: "visual", color: "rgba(255,72,32,.34)", grow: 2.7 });
        addRing(pr.tx, pr.ty, 96, "rgba(255,180,62,.9)", 0.45);
        for (let k = 0; k < 7; k++) {
          const a = rand(0, Math.PI * 2);
          addLine(pr.tx, pr.ty, pr.tx + Math.cos(a) * rand(36, 92), pr.ty + Math.sin(a) * rand(36, 92), "rgba(255,205,76,.7)", rand(4, 8), 0.28, true);
        }
        pr.life = 0;
      }
      if (pr.life <= 0) {
        state.projectiles.splice(i, 1);
        continue;
      }
      continue;
    }
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    if (pr.kind === "furnaceFireball") {
      pr.spin += dt * 12;
      pr.trail = (pr.trail || 0) - dt;
      if (pr.trail <= 0) {
        pr.trail = 0.055;
        const back = Math.atan2(pr.vy, pr.vx) + Math.PI + rand(-0.45, 0.45);
        addLine(pr.x, pr.y, pr.x + Math.cos(back) * rand(14, 30), pr.y + Math.sin(back) * rand(14, 30), "rgba(255,121,35,.42)", rand(2, 5), 0.14, true);
      }
    }
    pr.life -= dt;
    for (const m of state.monsters) {
      if (!pr.hit.has(m) && Math.hypot(pr.x - m.x, pr.y - m.y) < pr.r + m.r) {
        hitMonster(m, pr.damage, pr.element);
        pr.hit.add(m);
        if (pr.kind === "boulder") {
          damageCircle(pr.x, pr.y, 30, pr.damage * 0.35, "earth", true);
          addRing(pr.x, pr.y, 34, "rgba(178,136,88,.78)", 0.22);
          for (let k = 0; k < 4; k++) {
            const a = rand(0, Math.PI * 2);
            addLine(pr.x, pr.y, pr.x + Math.cos(a) * rand(12, 32), pr.y + Math.sin(a) * rand(12, 32), "rgba(126,94,62,.62)", rand(2, 5), 0.18, true);
          }
        }
        if (pr.kind === "furnaceFireball") {
          damageCircle(pr.x, pr.y, 34, pr.damage * 0.35, "fire", false);
          addRing(pr.x, pr.y, 42, "rgba(255,130,36,.9)", 0.32);
          for (let k = 0; k < 3; k++) {
            const a = rand(0, Math.PI * 2);
            addLine(pr.x, pr.y, pr.x + Math.cos(a) * rand(18, 44), pr.y + Math.sin(a) * rand(18, 44), "rgba(255,205,74,.72)", rand(3, 6), 0.24, true);
          }
        }
        if (!pr.pierce) pr.life = 0;
      }
    }
    if (pr.life <= 0 || pr.x < -80 || pr.y < -80 || pr.x > W + 80 || pr.y > H + 80) state.projectiles.splice(i, 1);
  }
}

function updateEnemyShots(dt) {
  const p = state.player;
  for (let i = state.enemyShots.length - 1; i >= 0; i--) {
    const s = state.enemyShots[i];
    s.px = s.x;
    s.py = s.y;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.kind === "rock") s.spin = (s.spin || 0) + dt * 8;
    s.life -= dt;
    let hitFollower = null;
    for (const f of state.followers) {
      if (f.hp > 0 && Math.hypot(s.x - f.x, s.y - f.y) < s.r + 14) {
        hitFollower = f;
        break;
      }
    }
    if (hitFollower) {
      damageFollower(hitFollower, s.damage);
      state.enemyShots.splice(i, 1);
      continue;
    }
    if (Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r) {
      if (!p.ward && p.hitGrace <= 0) {
        p.hp -= s.damage;
        p.hitGrace = 0.45;
        addText(`-${Math.ceil(s.damage)}`, p.x - 10, p.y - 28, "#ff7a66");
      }
      state.enemyShots.splice(i, 1);
      continue;
    }
    if (s.life <= 0) state.enemyShots.splice(i, 1);
  }
}

function updateZones(dt) {
  for (let i = state.zones.length - 1; i >= 0; i--) {
    const z = state.zones[i];
    z.life -= dt;
    z.angle = (z.angle || 0) + (z.spin || 0) * dt;
    if (z.type === "movingSpiral") {
      const target = nearestEnemy(z, z.seek || 260);
      if (target) {
        const a = Math.atan2(target.y - z.y, target.x - z.x);
        z.vx = (z.vx || 0) * 0.9 + Math.cos(a) * 210 * 0.1;
        z.vy = (z.vy || 0) * 0.9 + Math.sin(a) * 210 * 0.1;
      }
      z.x += (z.vx || 0) * dt;
      z.y += (z.vy || 0) * dt;
      if (Math.random() < 0.25) addLine(z.x + rand(-12, 12), z.y + rand(-12, 12), z.x + rand(-42, 42), z.y + rand(-42, 42), z.element === "fire" ? "rgba(255,146,52,.32)" : "rgba(225,245,230,.25)", 3, 0.12, true);
    }
    z.r += (z.grow || 0) * dt * 45;
    if (z.damage > 0) {
      if (z.type === "cone") {
        for (const m of state.monsters) {
          const a = Math.atan2(m.y - z.y, m.x - z.x);
          const diff = Math.abs(Math.atan2(Math.sin(a - z.a), Math.cos(a - z.a)));
          if (diff < 0.55 && Math.hypot(m.x - z.x, m.y - z.y) < z.r) hitMonster(m, z.damage * dt * 60, z.element);
        }
      } else {
        damageCircle(z.x, z.y, z.r, z.damage * dt * 12, z.element, z.element === "ice");
      }
    }
    if (z.life <= 0) state.zones.splice(i, 1);
  }
}

function updateEffects(dt) {
  if (state.effects.length > 220) state.effects.splice(0, state.effects.length - 180);
  for (let i = state.effects.length - 1; i >= 0; i--) {
    const e = state.effects[i];
    e.life -= dt;
    if (e.type === "particle") {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= 0.98;
      e.vy *= 0.98;
    } else if (e.type === "ring") {
      e.r += (e.grow || 0) * dt;
    }
    if (e.life <= 0) state.effects.splice(i, 1);
  }
}

function updateMonsters(dt) {
  const p = state.player;
  for (let i = state.monsters.length - 1; i >= 0; i--) {
    const m = state.monsters[i];
    const far = Math.hypot(p.x - m.x, p.y - m.y);
    if (m.kind === "normal" && far > 1250) {
      state.monsters.splice(i, 1);
      continue;
    }
    if (m.hp <= 0) {
      if (Math.random() < 0.72 || m.kind !== "normal") state.gems.push({ x: m.x, y: m.y, r: m.kind === "boss" ? 10 : 6, xp: m.xp });
      if (Math.random() < (m.kind === "normal" ? 0.045 : m.kind === "elite" ? 0.18 : 0.35)) state.chests.push({ x: m.x + rand(-10, 10), y: m.y + rand(-10, 10), r: 12, pulse: rand(0, Math.PI * 2) });
      if (m.kind === "boss") awardArtifact();
      state.monsters.splice(i, 1);
      continue;
    }
    const followerTarget = far > 360 ? nearestFollower(m, 430) : null;
    const target = followerTarget || p;
    const targetRadius = followerTarget ? 15 : p.r;
    const a = Math.atan2(target.y - m.y, target.x - m.x);
    const slow = m.slow ? 0.55 : 1;
    m.slow = Math.max(0, (m.slow || 0) - dt);
    m.hit = Math.max(0, m.hit - dt);
    m.attackCd = Math.max(0, (m.attackCd || 0) - dt);
    m.specialCd = Math.max(0, (m.specialCd || rand(1.3, 2.2)) - dt);
    if (m.name === "死亡骑士") {
      const rangeToTarget = Math.hypot(target.x - m.x, target.y - m.y);
      if (!m.charge && m.specialCd <= 0 && rangeToTarget > 135 && rangeToTarget < 620) startDeathKnightCharge(m, target);
      if (updateDeathKnightCharge(m, target, dt)) continue;
    }
    if (m.name === "比蒙巨兽") {
      const rangeToTarget = Math.hypot(target.x - m.x, target.y - m.y);
      if (!m.charge && m.specialCd <= 0) {
        if (rangeToTarget < 210) {
          behemothEarthquake(m);
          m.specialCd = rand(3.8, 5.0);
        } else if (rangeToTarget < 720) {
          startBehemothCharge(m, target);
        }
      }
      if (updateBehemothCharge(m, target, dt)) continue;
    }
    const targetDistance = Math.hypot(target.x - m.x, target.y - m.y);
    if (m.tag === "ranged") {
      const keepDistance = m.name === "暗精灵" ? 360 : 310;
      const strafe = Math.sin(state.time * 1.8 + m.x * 0.01) * 0.42;
      let moveX = 0;
      let moveY = 0;
      if (targetDistance < keepDistance * 0.78) {
        moveX = -Math.cos(a) + Math.cos(a + Math.PI / 2) * strafe;
        moveY = -Math.sin(a) + Math.sin(a + Math.PI / 2) * strafe;
      } else if (targetDistance > keepDistance * 1.22) {
        moveX = Math.cos(a);
        moveY = Math.sin(a);
      } else {
        moveX = Math.cos(a + Math.PI / 2) * strafe;
        moveY = Math.sin(a + Math.PI / 2) * strafe;
      }
      const moveLen = Math.hypot(moveX, moveY) || 1;
      m.x += (moveX / moveLen) * m.speed * slow * dt;
      m.y += (moveY / moveLen) * m.speed * slow * dt;
    } else {
      m.x += Math.cos(a) * m.speed * slow * dt;
      m.y += Math.sin(a) * m.speed * slow * dt;
    }
    if (m.name === "独眼巨人" && m.specialCd <= 0) {
      const rangeToTarget = Math.hypot(target.x - m.x, target.y - m.y);
      if (rangeToTarget < 155) {
        cyclopsAreaAttack(m);
        m.specialCd = rand(2.2, 3.0);
      } else if (rangeToTarget < 560) {
        fireEnemyBoulder(m, target);
        m.specialCd = rand(2.8, 3.8);
      }
    }
    if (Math.hypot(target.x - m.x, target.y - m.y) < targetRadius + m.r && m.attackCd <= 0) {
      const incoming = Math.max(1, 11 * timeGrowth() - (followerTarget ? 0 : effectiveDefense())) * (1 - (followerTarget ? 0 : p.groupReduce));
      if (followerTarget) damageFollower(followerTarget, incoming);
      else if (p.hitGrace <= 0) {
        p.hp -= incoming;
        p.hitGrace = 0.45;
        addText(`-${Math.ceil(incoming)}`, p.x - 10, p.y - 28, "#ff7a66");
      }
      m.attackCd = m.kind === "boss" ? 0.55 : 0.85;
      const push = Math.atan2(m.y - target.y, m.x - target.x);
      m.x += Math.cos(push) * 22;
      m.y += Math.sin(push) * 22;
      if (!followerTarget && p.thorns) m.hp -= p.thorns * 2;
    }
    if (m.tag === "ranged") {
      m.shoot -= dt;
      const shotTarget = far > 420 ? nearestFollower(m, 620) || p : p;
      const rangeToTarget = Math.hypot(shotTarget.x - m.x, shotTarget.y - m.y);
      if (m.shoot <= 0 && rangeToTarget < 620) {
        fireEnemyShot(m, shotTarget);
        m.shoot = rand(2.2, 3.7);
      }
    }
  }
}

function nearestFollower(pos, range = Infinity) {
  let best = null;
  let bestD = range;
  for (const f of state.followers) {
    if (f.hp <= 0) continue;
    const d = Math.hypot(f.x - pos.x, f.y - pos.y);
    if (d < bestD) {
      best = f;
      bestD = d;
    }
  }
  return best;
}

function damageFollower(f, amount) {
  if (f.hitGrace > 0) return;
  f.hp -= amount;
  f.hitGrace = 0.42;
  addText(`-${Math.ceil(amount)}`, f.x - 10, f.y - 28, "#ffb089");
}

function updateGems(dt) {
  const p = state.player;
  for (let i = state.gems.length - 1; i >= 0; i--) {
    const g = state.gems[i];
    const d = Math.hypot(p.x - g.x, p.y - g.y);
    if (d < 120) {
      g.x += (p.x - g.x) / d * 260 * dt;
      g.y += (p.y - g.y) / d * 260 * dt;
    }
    if (d < p.r + g.r + 4) {
      gainXp(g.xp);
      state.gems.splice(i, 1);
    }
  }
}

function updateChests(dt) {
  const p = state.player;
  for (let i = state.chests.length - 1; i >= 0; i--) {
    const c = state.chests[i];
    c.pulse += dt * 5;
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d < p.r + c.r + 10) {
      const g = pick(gearBook);
      g.apply(p);
      state.items.push(g.name);
      addText(`宝箱：${g.name}`, c.x - 36, c.y - 20, "#ffd36b");
      addRing(c.x, c.y, 42, "rgba(255,211,107,.9)", 0.45);
      addParticles(c.x, c.y, "rgba(255,226,132,.9)", 16, 32, 0.55);
      state.chests.splice(i, 1);
    }
  }
}

function updateHeals(dt) {
  const p = state.player;
  for (let i = state.heals.length - 1; i >= 0; i--) {
    const h = state.heals[i];
    h.pulse += dt * 4;
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (d < p.r + h.r + 6) {
      p.hp = Math.min(p.maxHp, p.hp + h.amount);
      addText(`+${h.amount}`, h.x - 10, h.y - 18, "#7dff9a");
      addRing(h.x, h.y, 36, "rgba(125,255,154,.85)", 0.38);
      state.heals.splice(i, 1);
    }
  }
}

function updateTexts(dt) {
  for (let i = state.texts.length - 1; i >= 0; i--) {
    const t = state.texts[i];
    t.y -= 22 * dt;
    t.life -= dt;
    if (t.life <= 0) state.texts.splice(i, 1);
  }
}

function gainXp(v) {
  const p = state.player;
  p.xp += v;
  while (p.xp >= p.next) {
    p.xp -= p.next;
    p.level++;
    p.next = Math.floor(p.next * 1.22 + 12);
    openLevelChoices();
  }
}

function openLevelChoices() {
  state.paused = true;
  const choices = [];
  const skillIds = Object.keys(skillBook).filter(id => !["flameTornado", "doom", "absoluteZero", "lightningStorm", "iceRing"].includes(id));
  for (let i = 0; i < 3; i++) {
    const roll = Math.random();
    if (roll < 0.68) {
      const id = pick(skillIds);
      const current = state.skills[id]?.level || 0;
      choices.push({ title: current ? `${skillBook[id].name} Lv.${Math.min(7, current + 1)}` : `学习 ${skillBook[id].name}`, desc: skillBook[id].desc, run: () => learnSkill(id) });
    } else {
      const f = pick(followerChoices);
      const next = followerEvolvesTo[f.id] ? followerById[followerEvolvesTo[f.id]].name : "高阶随从";
      choices.push({ title: `棋子：${f.name}`, desc: `自走棋随从，集齐 3 个 ${f.name} 自动升级为 ${next}`, run: () => addFollower(f) });
    }
  }
  choicesEl.innerHTML = "";
  choices.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.innerHTML = `<b>${c.title}</b><span>${c.desc}</span>`;
    btn.addEventListener("click", () => {
      c.run();
      state.paused = false;
      levelPanel.classList.add("hidden");
      syncHud();
    });
    choicesEl.appendChild(btn);
  });
  levelPanel.classList.remove("hidden");
}

function learnSkill(id) {
  if (!state.skills[id]) state.skills[id] = skillState(id);
  else state.skills[id].level = Math.min(7, state.skills[id].level + 1);
}

function addFollower(src) {
  const base = typeof src === "string" ? followerByName[src] : src;
  const f = spawnFollower(base);
  resolveFollowerMerge(f.id);
}

function spawnFollower(src, x = state.player.x + rand(-28, 28), y = state.player.y + rand(34, 58)) {
  const maxHp = followerMaxHp(src);
  const grownMax = Math.floor(maxHp * timeGrowth());
  const f = { ...src, x, y, hp: grownMax, maxHp: grownMax, baseMaxHp: maxHp, hitGrace: 0, t: rand(0, 1), autoChess: true };
  state.followers.push(f);
  state.items.push(`棋子:${f.name}`);
  return f;
}

function followerMaxHp(src) {
  const base = src.element === "earth" ? 95 : src.element === "fire" ? 78 : 72;
  return Math.floor(base * (1 + (src.tier - 1) * 0.85));
}

function resolveFollowerMerge(startId) {
  let id = startId;
  while (followerEvolvesTo[id]) {
    const matches = state.followers.map((f, index) => ({ f, index })).filter(entry => entry.f.id === id);
    if (matches.length < 3) return;
    const next = followerById[followerEvolvesTo[id]];
    const x = matches.slice(0, 3).reduce((sum, entry) => sum + entry.f.x, 0) / 3;
    const y = matches.slice(0, 3).reduce((sum, entry) => sum + entry.f.y, 0) / 3;
    for (const entry of matches.slice(0, 3).sort((a, b) => b.index - a.index)) state.followers.splice(entry.index, 1);
    spawnFollower(next, x, y);
    addText(`${next.name} 合成!`, x - 34, y - 32, next.element === "fire" ? "#ffb36b" : "#d4b084");
    addRing(x, y, next.tier === 3 ? 92 : 64, next.element === "fire" ? "rgba(255,150,70,.9)" : "rgba(214,168,104,.9)", 0.65);
    state.items.push(`合成:${next.name}`);
    id = next.id;
  }
}

function awardArtifact() {
  const a = pick(artifactBook);
  a.apply(state.player);
  state.artifacts.push(a.name);
  addText(`神器：${a.name}`, 72, 105, "#ffd36b");
}

function checkFusions() {
  const has = id => state.skills[id]?.level >= 3;
  const add = id => { if (!state.skills[id]) { state.skills[id] = skillState(id); addText(`合成：${skillBook[id].name}`, 72, 165, "#ffd36b"); } };
  if (has("fireBreath") && has("tornado")) add("flameTornado");
  if (has("meteor") && has("tornado") && has("earthquake")) add("doom");
  if (has("blizzard") && has("frostNova")) add("absoluteZero");
  if (has("tornado") && has("thunderCloud")) add("lightningStorm");
  if (has("meteor") && has("frostNova")) add("iceRing");
}

function draw() {
  const camX = state.player.x - W / 2;
  const camY = state.player.y - H / 2;
  drawTerrainTiles(camX, camY);
  drawWorldInkOverlay(camX, camY);
  ctx.save();
  ctx.translate(-camX, -camY);
  for (const g of state.gems) drawGem(g);
  for (const c of state.chests) drawChest(c);
  for (const h of state.heals) drawHeal(h);
  for (const z of state.zones) drawZone(z);
  for (const e of state.effects) drawEffect(e);
  for (const pr of state.projectiles) drawProjectile(pr);
  for (const s of state.enemyShots) drawEnemyShot(s);
  for (const f of state.followers) drawFollower(f);
  for (const m of state.monsters) drawMonster(m);
  drawPlayer();
  ctx.restore();
  drawTopHud();
  for (const t of state.texts) {
    const onScreen = t.x > camX - 120 && t.x < camX + W + 120 && t.y > camY - 120 && t.y < camY + H + 120;
    if (!onScreen) continue;
    ctx.globalAlpha = Math.max(0, t.life);
    ctx.fillStyle = t.color;
    ctx.font = "18px Microsoft YaHei";
    ctx.fillText(t.text, t.x - camX, t.y - camY);
    ctx.globalAlpha = 1;
  }
}

function drawWorldInkOverlay(camX, camY) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "rgba(0,0,0,.9)";
  ctx.lineWidth = 1;
  const step = 160;
  const startX = Math.floor(camX / step) * step;
  const startY = Math.floor(camY / step) * step;
  for (let y = startY; y < camY + H + step; y += step) {
    for (let x = startX; x < camX + W + step; x += step) {
      const seed = Math.abs(hash2(Math.floor(x / step), Math.floor(y / step)));
      if (seed % 5 !== 0) continue;
      const sx = x - camX + hashUnit(seed, 1) * 60;
      const sy = y - camY + hashUnit(seed, 2) * 60;
      ctx.beginPath();
      ctx.moveTo(sx - 18, sy);
      ctx.lineTo(sx + 9, sy + 6);
      ctx.lineTo(sx + 24, sy + 1);
      ctx.stroke();
    }
  }
  if (typeof ctx.createRadialGradient === "function") {
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.2, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,.42)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function drawTerrainTiles(camX, camY) {
  const cell = 72;
  const startX = Math.floor(camX / cell) - 1;
  const endX = Math.floor((camX + W) / cell) + 1;
  const startY = Math.floor(camY / cell) - 1;
  const endY = Math.floor((camY + H) / cell) + 1;
  for (let ty = startY; ty <= endY; ty++) {
    for (let tx = startX; tx <= endX; tx++) {
      const x = tx * cell;
      const y = ty * cell;
      const terrain = terrainAt(x + cell * 0.5, y + cell * 0.5);
      drawTerrainPatch(terrain, x - camX, y - camY, tx, ty, cell);
    }
  }
}

function drawTerrainPatch(terrain, sx, sy, tx, ty, size) {
  const seed = Math.abs(hash2(tx, ty));
  const light = hashUnit(seed, 11) * 0.18 - 0.12;
  if (typeof ctx.createLinearGradient === "function") {
    const grad = ctx.createLinearGradient(sx, sy, sx + size, sy + size);
    grad.addColorStop(0, shadeColor(terrain.tint, 0.08 + light));
    grad.addColorStop(0.58, terrain.tint);
    grad.addColorStop(1, shadeColor(terrain.tint, -0.24 + light * 0.5));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = shadeColor(terrain.tint, light);
  }
  ctx.fillRect(sx, sy, size + 1, size + 1);
  drawTerrainInkWash(terrain, sx, sy, tx, ty, size);
  drawTerrainNoise(terrain, sx, sy, tx, ty, size);
  drawTerrainPattern(terrain, sx, sy, tx, ty, size);
  drawTerrainEdgeBlend(terrain, sx, sy, tx, ty, size);
}

function drawTerrainInkWash(terrain, sx, sy, tx, ty, size) {
  const seed = Math.abs(hash2(tx, ty));
  ctx.save();
  ctx.globalAlpha = terrain.id === "snowfield" ? 0.09 : 0.16;
  ctx.strokeStyle = terrain.id === "pond" ? "rgba(5,12,18,.38)" : "rgba(18,14,10,.5)";
  ctx.lineWidth = 1;
  const lines = terrain.id === "pond" ? 1 : 2;
  for (let i = 0; i < lines; i++) {
    const y = sy + hashUnit(seed, 100 + i) * size;
    const x = sx + hashUnit(seed, 120 + i) * size * 0.4;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + size * 0.35, y + hashUnit(seed, 130 + i) * 8 - 4);
    ctx.lineTo(x + size * 0.75, y + hashUnit(seed, 140 + i) * 10 - 5);
    ctx.stroke();
  }
  if ((seed % 5) === 0) {
    ctx.globalAlpha = terrain.id === "hell" ? 0.24 : 0.14;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    const px = sx + hashUnit(seed, 151) * size;
    const py = sy + hashUnit(seed, 152) * size;
    ctx.beginPath();
    ctx.arc(px, py, 3 + hashUnit(seed, 153) * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTerrainNoise(terrain, sx, sy, tx, ty, size) {
  const seed = Math.abs(hash2(tx, ty));
  const specks = terrain.id === "pond" ? 3 : terrain.id === "snowfield" ? 5 : 6;
  ctx.save();
  ctx.globalAlpha = terrain.id === "hell" ? 0.24 : terrain.id === "pond" ? 0.11 : 0.2;
  for (let i = 0; i < specks; i++) {
    const px = sx + hashUnit(seed, i * 2 + 21) * size;
    const py = sy + hashUnit(seed, i * 2 + 22) * size;
    const r = 0.7 + hashUnit(seed, i + 40) * 2.2;
    ctx.fillStyle = hashUnit(seed, i + 60) > 0.55 ? "rgba(255,244,203,.42)" : "rgba(8,7,5,.55)";
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTerrainEdgeBlend(terrain, sx, sy, tx, ty, size) {
  const samples = [
    [0, -1, sx, sy, size, 4],
    [0, 1, sx, sy + size - 4, size, 4],
    [-1, 0, sx, sy, 4, size],
    [1, 0, sx + size - 4, sy, 4, size]
  ];
  ctx.save();
  ctx.globalAlpha = 0.28;
  for (const [ox, oy, x, y, w, h] of samples) {
    const neighbor = terrainAt((tx + ox + 0.5) * size, (ty + oy + 0.5) * size);
    if (neighbor.id !== terrain.id) {
      ctx.fillStyle = shadeColor(neighbor.tint, -0.05);
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(16,12,9,.52)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (w > h) {
        ctx.moveTo(x, y + h * 0.5);
        ctx.lineTo(x + w, y + h * 0.5 + ((tx + ty) % 2) * 2);
      } else {
        ctx.moveTo(x + w * 0.5, y);
        ctx.lineTo(x + w * 0.5 + ((tx - ty) % 2) * 2, y + h);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTerrainPattern(terrain, sx, sy, tx, ty, size = TILE) {
  ctx.save();
  const seed = Math.abs((tx * 928371 + ty * 689287) % 97);
  const motifCount = terrain.id === "forest" || terrain.id === "grassland" ? 3 : 2;
  for (let i = 0; i < motifCount; i++) {
    const px = sx + ((seed * 37 + i * 83) % size);
    const py = sy + ((seed * 53 + i * 61) % size);
    if (terrain.id === "forest" || terrain.id === "grassland") {
      ctx.globalAlpha = terrain.id === "forest" ? 0.42 : 0.34;
      ctx.strokeStyle = terrain.id === "forest" ? "rgba(12,20,10,.72)" : "rgba(31,34,15,.62)";
      ctx.lineWidth = 1.7;
      for (let j = 0; j < 3; j++) {
        const ox = (j - 1) * 6;
        ctx.beginPath();
        ctx.moveTo(px + ox, py + 10);
        ctx.lineTo(px + ox - 2, py + 1);
        ctx.lineTo(px + ox + 4, py - 8);
        ctx.stroke();
      }
      ctx.globalAlpha = terrain.id === "forest" ? 0.32 : 0.24;
      ctx.fillStyle = terrain.id === "forest" ? "rgba(87,112,49,.7)" : "rgba(142,132,66,.58)";
      ctx.beginPath();
      ctx.moveTo(px - 10, py + 7);
      ctx.lineTo(px + 2, py - 8);
      ctx.lineTo(px + 13, py + 5);
      ctx.lineTo(px + 3, py + 2);
      ctx.closePath();
      ctx.fill();
    } else if (terrain.id === "pond") {
      ctx.globalAlpha = 0.38;
      ctx.strokeStyle = "rgba(9,18,26,.74)";
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.ellipse(px, py, 18, 5, hashUnit(seed, i + 90) * Math.PI, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = "rgba(120,210,218,.65)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - 14, py - 2);
      ctx.lineTo(px - 2, py + 2);
      ctx.lineTo(px + 15, py - 1);
      ctx.stroke();
      ctx.fillStyle = "rgba(180,235,224,.55)";
      ctx.fillRect(px - 9, py - 1, 18, 2);
    } else if (terrain.id === "graveyard") {
      ctx.globalAlpha = 0.36;
      ctx.fillStyle = "rgba(9,9,11,.72)";
      ctx.fillRect(px - 6, py - 10, 12, 20);
      ctx.fillRect(px - 12, py - 3, 24, 4);
      ctx.strokeStyle = "rgba(170,160,135,.2)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px - 14, py + 12);
      ctx.lineTo(px + 15, py + 8);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,.5)";
      ctx.beginPath();
      ctx.moveTo(px - 13, py - 12);
      ctx.lineTo(px - 7, py - 17);
      ctx.lineTo(px - 2, py - 11);
      ctx.stroke();
    } else if (terrain.id === "desert") {
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = "rgba(42,29,15,.58)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px - 22, py + 2);
      ctx.lineTo(px - 8, py - 6);
      ctx.lineTo(px + 5, py + 3);
      ctx.lineTo(px + 24, py);
      ctx.stroke();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "rgba(239,196,101,.6)";
      ctx.beginPath();
      ctx.moveTo(px - 18, py + 10);
      ctx.lineTo(px - 4, py + 4);
      ctx.lineTo(px + 8, py + 12);
      ctx.lineTo(px + 25, py + 8);
      ctx.stroke();
    } else if (terrain.id === "snowfield") {
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = "rgba(31,46,48,.38)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(px - 8, py);
      ctx.lineTo(px + 8, py);
      ctx.moveTo(px, py - 8);
      ctx.lineTo(px, py + 8);
      ctx.moveTo(px - 6, py - 6);
      ctx.lineTo(px + 6, py + 6);
      ctx.moveTo(px - 6, py + 6);
      ctx.lineTo(px + 6, py - 6);
      ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = "rgba(255,255,255,.7)";
      ctx.beginPath();
      ctx.moveTo(px - 16, py + 12);
      ctx.lineTo(px + 17, py + 9);
      ctx.stroke();
    } else if (terrain.id === "hell") {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "rgba(10,5,3,.78)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px - 18, py - 6);
      ctx.lineTo(px - 5, py + 2);
      ctx.lineTo(px + 7, py - 4);
      ctx.lineTo(px + 20, py + 9);
      ctx.stroke();
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = "rgba(245,86,39,.86)";
      ctx.lineWidth = 3.2;
      ctx.stroke();
    } else {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.beginPath();
      ctx.moveTo(px - 20, py);
      ctx.lineTo(px + 20, py + 10);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function shadeColor(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + 255 * amount));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + 255 * amount));
  const b = Math.max(0, Math.min(255, (n & 255) + 255 * amount));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function drawPlayer() {
  const p = state.player;
  drawCircle(p.x, p.y, p.r + (p.ward ? 9 : 0), p.ward ? "rgba(125,190,255,.38)" : "rgba(255,255,255,.08)");
  drawCircle(p.x, p.y, p.r, "#73d1ff");
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(p.x - 24, p.y - 34, 48, 6);
  ctx.fillStyle = p.hp / p.maxHp > 0.35 ? "#6df08a" : "#ff6464";
  ctx.fillRect(p.x - 24, p.y - 34, 48 * Math.max(0, p.hp / p.maxHp), 6);
  ctx.fillStyle = "#101820";
  ctx.font = "18px serif";
  ctx.fillText("✦", p.x - 7, p.y + 6);
}

function drawMonster(m) {
  const file = monsterAssetByName[m.name];
  const img = file && monsterImages[file];
  if (img && img.complete && img.naturalWidth) {
    const size = m.r * (m.name === "比蒙巨兽" ? 2.85 : m.kind === "boss" ? 2.35 : m.kind === "elite" ? 2.15 : 2.05);
    if (m.hit) {
      ctx.globalAlpha = 0.65;
      drawCircle(m.x, m.y, size * 0.56, "#fff3cf");
      ctx.globalAlpha = 1;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, m.x - size / 2, m.y - size / 2, size, size);
    ctx.imageSmoothingEnabled = true;
  } else {
    drawCircle(m.x, m.y, m.r, m.hit ? "#fff3cf" : m.color);
  }
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.fillRect(m.x - m.r, m.y - m.r - 9, m.r * 2, 4);
  ctx.fillStyle = m.kind === "boss" ? "#ffcf66" : "#e66f61";
  ctx.fillRect(m.x - m.r, m.y - m.r - 9, m.r * 2 * Math.max(0, m.hp / m.maxHp), 4);
  if (m.kind !== "normal") {
    ctx.fillStyle = "#fff";
    ctx.font = "12px Microsoft YaHei";
    ctx.fillText(m.name, m.x - m.r, m.y - m.r - 14);
  }
}

function drawFollower(f) {
  const file = followerAssetById[f.id];
  const img = file && followerImages[file];
  if (img && img.complete && img.naturalWidth) {
    const pulse = f.cast ? 1 + Math.sin(performance.now() / 45) * 0.1 + f.cast * 0.35 : 1;
    const baseSize = f.id === "furnace" ? 46 : f.id === "balrog" ? 58 : f.id === "lotus" ? 62 : f.id === "giant" ? 72 : f.id === "golem" ? 60 : f.id === "rock" ? 48 : 34 + f.tier * 8;
    const size = baseSize * pulse;
    const lunge = (f.id === "rock" || f.id === "golem") && f.cast ? f.cast * 22 : 0;
    const drawX = f.x + Math.cos(f.face || 0) * lunge;
    const drawY = f.y + Math.sin(f.face || 0) * lunge;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = f.id === "furnace" || f.id === "balrog" || f.id === "lotus" ? "rgba(255,112,32,.85)" : f.id === "rock" || f.id === "golem" || f.id === "giant" ? "rgba(90,62,38,.75)" : "rgba(85,225,255,.65)";
    ctx.shadowBlur = f.cast ? 24 : 14;
    if (f.cast) {
      ctx.globalAlpha = 0.78;
      drawCircle(drawX, drawY, size * 0.42, f.id === "rock" || f.id === "golem" || f.id === "giant" ? "rgba(160,118,74,.24)" : "rgba(255,101,31,.26)");
      ctx.globalAlpha = 1;
    }
    ctx.drawImage(img, drawX - size / 2, drawY - size / 2, size, size);
    drawFollowerHealth(f, drawX, drawY, size);
    ctx.restore();
    return;
  }
  drawCircle(f.x, f.y, 9 + f.tier * 2, f.element === "fire" ? "#ff9b4f" : f.element === "ice" ? "#8de8ff" : "#b49a6d");
  drawFollowerHealth(f, f.x, f.y, 28);
  ctx.fillStyle = "#101010";
  ctx.font = "12px Microsoft YaHei";
  ctx.fillText(f.tier, f.x - 3, f.y + 4);
}

function drawFollowerHealth(f, x, y, size) {
  if (!f.maxHp) return;
  const w = Math.max(28, size * 0.72);
  const ratio = clamp(f.hp / f.maxHp, 0, 1);
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(x - w / 2, y - size * 0.5 - 8, w, 4);
  ctx.fillStyle = ratio > 0.35 ? "#74e08b" : "#ff7666";
  ctx.fillRect(x - w / 2, y - size * 0.5 - 8, w * ratio, 4);
}

function drawGem(g) {
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "#6cf2ff";
  ctx.fillRect(-g.r, -g.r, g.r * 2, g.r * 2);
  ctx.restore();
}

function drawChest(c) {
  const bob = Math.sin(c.pulse) * 2;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  ctx.fillStyle = "#8a5630";
  ctx.fillRect(-13, -8, 26, 18);
  ctx.fillStyle = "#d7953d";
  ctx.fillRect(-13, -13, 26, 9);
  ctx.fillStyle = "#ffe08a";
  ctx.fillRect(-3, -8, 6, 8);
  ctx.strokeStyle = "rgba(255,226,132,.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -14, 28, 24);
  ctx.restore();
}

function drawHeal(h) {
  const bob = Math.sin(h.pulse) * 3;
  ctx.save();
  ctx.translate(h.x, h.y + bob);
  ctx.fillStyle = "rgba(82,210,105,.95)";
  ctx.beginPath();
  ctx.arc(0, 0, h.r + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4fff2";
  ctx.fillRect(-4, -11, 8, 22);
  ctx.fillRect(-11, -4, 22, 8);
  ctx.restore();
}

function drawZone(z) {
  const alpha = clamp(z.life / (z.maxLife || z.life || 1), 0.08, 0.8);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = z.color;
  if (z.type === "cone") {
    ctx.beginPath();
    ctx.moveTo(z.x, z.y);
    ctx.arc(z.x, z.y, z.r, z.a - 0.55, z.a + 0.55);
    ctx.closePath();
    ctx.fill();
  } else if (z.type === "coneVisual") {
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle || 0);
    ctx.beginPath();
    ctx.moveTo(-z.r * 0.75, 0);
    ctx.lineTo(z.r * 0.95, -z.r * 0.58);
    ctx.lineTo(z.r * 1.2, 0);
    ctx.lineTo(z.r * 0.95, z.r * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = "rgba(255,210,76,.75)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-z.r * 0.6, 0);
    ctx.lineTo(z.r * 1.1, -z.r * 0.36);
    ctx.moveTo(-z.r * 0.55, 0);
    ctx.lineTo(z.r * 1.15, z.r * 0.32);
    ctx.stroke();
    ctx.restore();
  } else if (z.type === "spiral" || z.type === "movingSpiral") {
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle || 0);
    ctx.strokeStyle = z.color;
    ctx.lineWidth = 7;
    ctx.beginPath();
    for (let i = 0; i < 80; i++) {
      const t = i / 79;
      const a = t * Math.PI * 6;
      const r = t * z.r;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    drawCircle(z.x, z.y, z.r, z.color);
  } else {
    drawCircle(z.x, z.y, z.r, z.color);
  }
  ctx.globalAlpha = 1;
}

function drawEffect(e) {
  const alpha = clamp(e.life / (e.maxLife || e.life || 1), 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  if (e.type === "line") {
    ctx.strokeStyle = e.color;
    ctx.lineWidth = e.width * (0.35 + alpha * 0.65);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    e.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  } else if (e.type === "ring") {
    ctx.strokeStyle = e.color;
    ctx.lineWidth = e.width * (0.45 + alpha);
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (e.type === "particle") {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r * (0.4 + alpha), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawProjectile(pr) {
  if (pr.kind === "boulder") {
    drawBoulderProjectile(pr);
    return;
  }
  if (pr.kind === "lotusMeteor") {
    drawLotusMeteor(pr);
    return;
  }
  if (pr.kind === "furnaceFireball") {
    drawFurnaceFireball(pr);
    return;
  }
  ctx.save();
  ctx.strokeStyle = pr.color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = pr.pierce ? 5 : 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pr.px, pr.py);
  ctx.lineTo(pr.x, pr.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.translate(pr.x, pr.y);
  ctx.rotate(pr.angle || 0);
  ctx.fillStyle = pr.color;
  if (pr.pierce) {
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 5);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, pr.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBoulderProjectile(pr) {
  ctx.save();
  ctx.strokeStyle = "rgba(58,42,31,.45)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pr.px, pr.py);
  ctx.lineTo(pr.x, pr.y);
  ctx.stroke();
  ctx.translate(pr.x, pr.y);
  ctx.rotate(pr.spin || 0);
  ctx.fillStyle = "#8f7658";
  ctx.strokeStyle = "#3b2a21";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(12, -2);
  ctx.lineTo(5, -12);
  ctx.lineTo(-9, -9);
  ctx.lineTo(-13, 3);
  ctx.lineTo(-4, 12);
  ctx.lineTo(9, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(220,188,132,.75)";
  ctx.fillRect(-3, -8, 8, 4);
  ctx.restore();
}

function drawFurnaceFireball(pr) {
  ctx.save();
  const heat = 0.7 + Math.sin((pr.spin || 0) * 1.7) * 0.18;
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,96,28,.42)";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pr.px, pr.py);
  ctx.lineTo(pr.x, pr.y);
  ctx.stroke();
  ctx.translate(pr.x, pr.y);
  ctx.rotate((pr.spin || 0) + pr.angle);
  ctx.shadowColor = "rgba(255,94,24,.95)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255,88,25,.95)";
  ctx.beginPath();
  ctx.arc(0, 0, pr.r * 1.25 * heat, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,218,83,.95)";
  ctx.beginPath();
  ctx.arc(2, -2, pr.r * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,226,112,.8)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-pr.r * 1.6, 0);
  ctx.lineTo(-pr.r * 0.3, -pr.r * 0.55);
  ctx.lineTo(pr.r * 0.7, -pr.r * 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawLotusMeteor(pr) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(255,92,32,.45)";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pr.px, pr.py);
  ctx.lineTo(pr.x, pr.y);
  ctx.stroke();
  ctx.translate(pr.x, pr.y);
  ctx.rotate((pr.spin || 0) + 0.3);
  ctx.shadowColor = "rgba(255,98,24,.95)";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "rgba(98,42,28,.95)";
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(4, -15);
  ctx.lineTo(-16, -9);
  ctx.lineTo(-19, 8);
  ctx.lineTo(3, 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,116,30,.9)";
  ctx.beginPath();
  ctx.arc(2, -1, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,226,86,.95)";
  ctx.beginPath();
  ctx.arc(5, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemyShot(s) {
  ctx.save();
  if (s.kind === "rock") {
    ctx.strokeStyle = "rgba(62,45,32,.42)";
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s.px, s.py);
    ctx.lineTo(s.x, s.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin || 0);
    if (stoneImage.complete && stoneImage.naturalWidth) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(stoneImage, -18, -18, 36, 36);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.fillStyle = "#927354";
      ctx.strokeStyle = "#3d2b21";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(13, -2);
      ctx.lineTo(5, -12);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-13, 4);
      ctx.lineTo(-3, 13);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.strokeStyle = s.color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(s.px, s.py);
  ctx.lineTo(s.x, s.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle || 0);
  if (arrowImage.complete && arrowImage.naturalWidth) {
    ctx.rotate(-Math.PI / 4);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(arrowImage, -18, -18, 36, 36);
    ctx.imageSmoothingEnabled = true;
  } else {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, -5);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-7, 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCircle(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTopHud() {
  const p = state.player;
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(22, 20, 410, 62);
  ctx.fillStyle = "#e7f7ef";
  ctx.font = "18px Microsoft YaHei";
  ctx.fillText(`${state.terrain.name} · ${state.terrain.note}`, 38, 46);
  ctx.fillStyle = "#ff6666";
  ctx.fillRect(38, 58, 180 * p.hp / p.maxHp, 8);
  ctx.fillStyle = "#61d5ff";
  ctx.fillRect(38, 70, 180 * p.xp / p.next, 6);
  ctx.fillStyle = "#f7f7f7";
  ctx.font = "13px Microsoft YaHei";
  ctx.fillText(`Lv.${p.level}  ${Math.floor(state.time)}s  (${Math.floor(p.x)}, ${Math.floor(p.y)})`, 232, 72);
}

function syncHud() {
  const p = state.player;
  statsEl.innerHTML = `
    <dt>生命</dt><dd>${Math.ceil(p.hp)} / ${p.maxHp}</dd>
    <dt>等级</dt><dd>${p.level}</dd>
    <dt>时间</dt><dd>${Math.floor(state.time)} 秒</dd>
    <dt>成长</dt><dd>+${Math.round((timeGrowth() - 1) * 100)}%</dd>
    <dt>地形</dt><dd>${state.terrain.name}</dd>
    <dt>怪物</dt><dd>${state.monsters.length}</dd>
  `;
  skillsEl.innerHTML = Object.values(state.skills).map(s => `<li><span>${skillBook[s.id].name}</span><b>Lv.${s.level}</b></li>`).join("");
  const followerSummary = Object.values(state.followers.reduce((acc, f) => {
    acc[f.id] ||= { name: f.name, tier: f.tier, count: 0, hp: 0, maxHp: 0 };
    acc[f.id].count++;
    acc[f.id].hp += Math.max(0, f.hp || 0);
    acc[f.id].maxHp += f.maxHp || 0;
    return acc;
  }, {}));
  followersEl.innerHTML = followerSummary.length ? followerSummary.map(f => `<li><span>${f.name} ×${f.count}</span><b>T${f.tier} ${Math.ceil(f.hp)}/${Math.ceil(f.maxHp)}</b></li>`).join("") : "<li><span>暂无</span><b>-</b></li>";
  itemsEl.innerHTML = [...state.items.slice(-8), ...state.artifacts.map(a => `神器:${a}`)].slice(-10).map(i => `<li><span>${i}</span><b></b></li>`).join("") || "<li><span>暂无</span><b>-</b></li>";
}

function loop(now) {
  const dt = Math.min(0.033, (now - state.last) / 1000);
  state.last = now;
  update(dt);
  draw();
  if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) syncHud();
  requestAnimationFrame(loop);
}

function start() {
  state = newState();
  state.running = true;
  startPanel.querySelector("h1").textContent = "Elemental Survival";
  startPanel.querySelector("p").textContent = "元素法师 · 开放世界无限生存 · 特效增强版";
  startBtn.textContent = "开始生存";
  startPanel.classList.add("hidden");
  levelPanel.classList.add("hidden");
  syncHud();
}

window.addEventListener("keydown", e => {
  keys.add(e.code);
  if (e.code === "Space" && state?.running) state.paused = !state.paused;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", e => keys.delete(e.code));
if (moveStick) {
  const setStick = e => {
    const rect = moveStick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const max = rect.width * 0.36;
    const len = Math.hypot(dx, dy) || 1;
    const mag = Math.min(1, len / max);
    touchMove.x = (dx / len) * mag;
    touchMove.y = (dy / len) * mag;
    if (moveKnob) moveKnob.style.transform = `translate(calc(-50% + ${touchMove.x * max}px), calc(-50% + ${touchMove.y * max}px))`;
  };
  const resetStick = () => {
    touchMove.x = 0;
    touchMove.y = 0;
    touchMove.active = false;
    touchMove.pointerId = null;
    if (moveKnob) moveKnob.style.transform = "translate(-50%, -50%)";
  };
  moveStick.addEventListener("pointerdown", e => {
    touchMove.active = true;
    touchMove.pointerId = e.pointerId;
    moveStick.setPointerCapture(e.pointerId);
    setStick(e);
    e.preventDefault();
  });
  moveStick.addEventListener("pointermove", e => {
    if (!touchMove.active || e.pointerId !== touchMove.pointerId) return;
    setStick(e);
    e.preventDefault();
  });
  moveStick.addEventListener("pointerup", resetStick);
  moveStick.addEventListener("pointercancel", resetStick);
}
pauseTouch?.addEventListener("click", () => {
  if (state?.running) state.paused = !state.paused;
});
startBtn.addEventListener("click", start);

state = newState();
draw();
syncHud();
requestAnimationFrame(loop);
