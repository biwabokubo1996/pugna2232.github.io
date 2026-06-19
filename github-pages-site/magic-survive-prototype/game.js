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
const startActions = document.querySelector("#startActions");
const classPanel = document.querySelector("#classPanel");
const moveStick = document.querySelector("#moveStick");
const moveKnob = moveStick?.querySelector("span");
const pauseTouch = document.querySelector("#pauseTouch");

const W = canvas.width;
const H = canvas.height;
const TILE = 520;
const SAVE_KEY = "elemental-survival-save-v1";
const BASE_FOLLOWER_LIMIT = 7;
const WORLD_BOSS_SITES = {
  chimera: { id: "chimera", name: "奇美拉巢穴", boss: "奇美拉", x: 1850, y: -980, r: 130 }
};
WORLD_BOSS_SITES.typhon = { id: "typhon", name: "Typhon Rift", boss: "Typhon", x: -2300, y: 1500, r: 170 };
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
  "Typhon": "Typhon.png",
  "树人": "Treant.png",
  "强盗": "Bandit.png",
  "暗精灵": "DarkElf.png",
  "独眼巨人": "Cyclops.png",
  "死亡骑士": "DeathKnight.png",
  "蝎狮": "Manticore.png",
  "比蒙巨兽": "Behemoth.png",
  "奇美拉": "Chimera.png",
  "海德拉": "Hydra.png",
  "耶梦加得": "Hydra.png",
  "芬里厄": "Behemoth.png",
  "克苏鲁随从": "Hydra.png"
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
const effectImages = {};
for (const [id, file] of Object.entries({ fireBreath: "FireBreath.png", breathOfFire: "BreathOfFire.png", blizzard: "Blizzard.png", absoluteZero: "AbsoluteZero.png", poisonCloud: "PoisonCloud.png", sandstorm: "Sandstorm.png", spiritTaming: "SpiritOrbit.png", blackPlague: "BlackPlague.png", virulentPlague: "VirulentPlague.png", chainLightning: "ChainLightning.png", thunderCloud: "ThunderCloud.png", forkLightning: "ForkLightning.png", fireball: "Fireball.png", slash: "Slash.png", dimensionalSlash: "DimensionalSlash.png", tornado: "Tornado.png", flameTornado: "FlameTornado.png", doom: "Doomsday.png", meteor: "Meteor.png", meteorExplosion: "MeteorExplosion.png", earthquake: "Earthquake.png", frostNova: "FrostNova.png", iceAge: "IceAge.png", lavaField: "LavaField.png", arrowRain: "ArrowRain.png", surge: "Surge.png", bloodSpear: "BloodSpear.png", painScream: "PainScream.png" })) {
  const img = new Image();
  img.src = `./assets/effects/${file}`;
  effectImages[id] = img;
}
const terrainImages = {};
for (const [id, file] of Object.entries({ forest: "Forest.jpg", pond: "Swamp.jpg", desert: "Desert.jpg", grassland: "Grassland.jpg", graveyard: "Graveyard.jpg", hell: "Hell.jpg", snowfield: "Snowfield.jpg" })) {
  const img = new Image();
  img.src = `./assets/terrains/${file}`;
  terrainImages[id] = img;
}
const npcImages = {};
for (const [id, file] of Object.entries({ blackMarket: "BlackMarketMerchant.png" })) {
  const img = new Image();
  img.src = `./assets/npcs/${file}`;
  npcImages[id] = img;
}
const followerAssetById = { furnace: "FurnaceSpirit.png", balrog: "Balrog.png", lotus: "RedLotusBeast.png", rock: "RockSpirit.png", golem: "Golem.png", giant: "MountainGiant.png", skeleton: "SkeletonFollower.png", skeletonWarrior: "SkeletonWarrior.png", reaper: "DeathReaper.png", militia: "Militia.png", swordsman: "Swordsman.png", knight: "Knight.png", rogueGirl: "RogueGirl.png", assassinGirl: "AssassinGirl.png", ninjaGirl: "NinjaGirl.png", pixie: "Pixie.png", flowerFairy: "FlowerFairy.png", fairyPrincess: "FairyPrincess.png", ghostFollower: "GhostFollower.png", wraith: "Wraith.png", banshee: "Banshee.png", littleDemon: "LittleDemon.png", demonFollower: "DemonFollower.png", hellKing: "HellKing.png", treantGuardian: "TreantGuardian.png" };
const followerImages = {};
for (const file of new Set(Object.values(followerAssetById))) {
  const img = new Image();
  img.src = `./assets/followers/${file}`;
  followerImages[file] = img;
}
const classAssetById = {
  elementMage: "GrandWitch.png",
  necromancer: "Necromancer.png",
  roundTableKnight: "RoundTableKnight.png",
  elf: "Elf.png",
  vampirePrincess: "VampirePrincess.png",
  hellLord: "HellLord.png"
};
const classCastAssetById = {
  elementMage: "GrandWitchCast.png"
};
const classImages = {};
for (const file of new Set([...Object.values(classAssetById), ...Object.values(classCastAssetById)])) {
  const img = new Image();
  img.src = `./assets/classes/${file}`;
  classImages[file] = img;
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
  const region = 1680;
  const rx = Math.floor(x / region);
  const ry = Math.floor(y / region);
  let best = null;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = rx + ox;
      const cy = ry + oy;
      const seed = hash2(cx, cy);
      const centerX = (cx + 0.5 + (hashUnit(seed, 1) - 0.5) * 0.34) * region;
      const centerY = (cy + 0.5 + (hashUnit(seed, 2) - 0.5) * 0.34) * region;
      const wobble = Math.sin((x + seed % 313) * 0.0017) * 105 + Math.cos((y - seed % 197) * 0.0015) * 105 + Math.sin((x + y) * 0.0011 + seed) * 70;
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
  return 1 + Math.floor((state?.time || 0) / 60) * 0.1;
}

function followerLimit() {
  return BASE_FOLLOWER_LIMIT + (state?.player?.followerLimitBonus || 0);
}

function classLevel() {
  return state?.player?.level || 1;
}

function isElementMagic(element) {
  return ["fire", "ice", "wind", "earth", "lightning", "arcane", "poison"].includes(element);
}

const SKILL_POWER_MULT = 1.25;
const FUSION_DAMAGE_MULT = 1.35;
const FUSION_AREA_MULT = 1.25;
const ENEMY_DAMAGE_MULT = 3;

function isFusionSkill(id) {
  return ["flameTornado", "doom", "absoluteZero", "lightningStorm", "iceRing", "forkLightning", "virulentPlague", "iceAge", "breathOfFire", "dimensionalSlash"].includes(id);
}

const skillBook = {
  fireBreath: { name: "Fire Breath", element: "fire", cd: 0.62, damage: 16, area: 165, type: "cone", desc: "Cone damage with burn" },
  tornado: { name: "Tornado", element: "wind", cd: 2.6, damage: 18, area: 95, type: "orb", desc: "Moving spiral wind" },
  meteor: { name: "Meteor", element: "fire", cd: 5.2, damage: 70, area: 120, type: "meteor", desc: "Large impact area" },
  lavaField: { name: "Lava Field", element: "fire", cd: 5.0, damage: 18, area: 155, type: "cloud", desc: "Burning lava ground" },
  blizzard: { name: "Blizzard", element: "ice", cd: 4.6, damage: 15, area: 170, type: "aura", desc: "Ice damage and slow" },
  frostNova: { name: "Frost Nova", element: "ice", cd: 4.8, damage: 35, area: 160, type: "nova", desc: "Freeze nearby enemies" },
  thunderCloud: { name: "Thunder Cloud", element: "lightning", cd: 2.1, damage: 34, area: 260, type: "strike", desc: "Strike N enemies in range, N equals skill level" },
  earthquake: { name: "Earthquake", element: "earth", cd: 5.4, damage: 48, area: 220, type: "quake", desc: "Shockwave around the caster" },
  fireball: { name: "Fireball", element: "fire", cd: 2.4, damage: 32, area: 0, type: "fireball", desc: "Piercing fireballs in a straight line; count scales with level" },
  arrowRain: { name: "Arrow Rain", element: "physical", cd: 4.9, damage: 38, area: 155, type: "arrowRain", desc: "Calls down a volley of arrows over an area" },
  spiritTaming: { name: "Spirit Taming", element: "arcane", cd: 0, damage: 60, area: 92, type: "spiritOrbit", desc: "Orbiting spirits damage enemies on touch" },
  chainLightning: { name: "Chain Lightning", element: "lightning", cd: 2.8, damage: 29, area: 250, type: "chain", desc: "Jumps between nearby enemies up to 2 x level" },
  poisonCloud: { name: "Poison Cloud", element: "poison", cd: 4.1, damage: 13, area: 145, type: "cloud", desc: "Growing poison field" },
  blackPlague: { name: "Black Plague", element: "poison", cd: 5.6, damage: 56, area: 150, type: "plagueBolt", desc: "Plague projectile that erupts into disease cloud" },
  virulentPlague: { name: "Virulent Plague", element: "poison", cd: 5.2, damage: 62, area: 175, type: "virulentPlague", desc: "Splits into six spreading plague clouds with damage and slow" },
  sandstorm: { name: "Sandstorm", element: "wind", cd: 4.4, damage: 20, area: 185, type: "aura", desc: "Follows the player, blinds enemies" },
  cleave: { name: "Cleave", element: "physical", cd: 2.1, damage: 45, area: 115, type: "cleave", desc: "Sweeping melee slash in front of the caster" },
  bloodSpear: { name: "Blood Spear", element: "physical", cd: 2.1, damage: 64, area: 220, type: "bloodRect", desc: "Carves a bloody rectangle in front of the caster" },
  painScream: { name: "Pain Scream", element: "arcane", cd: 5.1, damage: 22, area: 210, type: "fearCone", desc: "Terrifies enemies and forces them to flee" },
  ward: { name: "Ward", element: "arcane", cd: 12, damage: 0, area: 0, type: "ward", desc: "Blocks ranged damage briefly" },
  flameTornado: { name: "Flame Tornado", element: "fire", cd: 2.0, damage: 42, area: 165, type: "orb", desc: "Large pulling fire tornado with burn" },
  doom: { name: "Doomsday Judgment", element: "fire", cd: 10.5, damage: 185, area: 760, type: "doom", desc: "Ultimate full-screen fire shockwave" },
  absoluteZero: { name: "Absolute Zero", element: "ice", cd: 0, damage: 44, area: 245, type: "absoluteZero", desc: "Permanent aura that follows you; first hit freezes enemies" },
  lightningStorm: { name: "Lightning Storm", element: "lightning", cd: 1.55, damage: 48, area: 330, type: "strike", desc: "Improved Thunder Cloud" },
  forkLightning: { name: "Fork Lightning", element: "lightning", cd: 2.35, damage: 86, area: 420, type: "forkLightning", desc: "Branching lightning from Lv.7 Fire Breath and Chain Lightning" },
  iceRing: { name: "Ice Ring", element: "ice", cd: 3.6, damage: 58, area: 180, type: "nova", desc: "Ring-shaped ice burst" },
  iceAge: { name: "Ice Age", element: "ice", cd: 6.2, damage: 86, area: 260, type: "iceAge", desc: "Ice arrows rain down and trigger many freezing Frost Novas" },
  breathOfFire: { name: "Breath of Fire", element: "fire", cd: 2.45, damage: 64, area: 245, type: "fireBreathBarrage", desc: "Several wider Fire Breath waves from Lv.7 Pain Scream and Fire Breath" },
  dimensionalSlash: { name: "Dimensional Slash", element: "arcane", cd: 6.8, damage: 165, area: 760, type: "dimensionalSlash", desc: "Full-screen spatial slash from Lv.7 Earthquake and Cleave" }
};

const followersBook = [
  { id: "furnace", name: "Furnace Spirit", tier: 1, element: "fire", damage: 13, range: 190 },
  { id: "balrog", name: "Balrog", tier: 2, element: "fire", damage: 24, range: 150 },
  { id: "lotus", name: "Red Lotus Beast", tier: 3, element: "fire", damage: 55, range: 240 },
  { id: "rock", name: "Rock Spirit", tier: 1, element: "earth", damage: 12, range: 120 },
  { id: "golem", name: "Golem", tier: 2, element: "earth", damage: 22, range: 230 },
  { id: "giant", name: "Mountain Giant", tier: 3, element: "earth", damage: 43, range: 260 },
  { id: "skeleton", name: "Skeleton", tier: 1, element: "physical", damage: 16, range: 86 },
  { id: "skeletonWarrior", name: "Skeleton Warrior", tier: 2, element: "physical", damage: 28, range: 104 },
  { id: "reaper", name: "Reaper", tier: 3, element: "arcane", damage: 46, range: 128 },
  { id: "militia", name: "Militia", tier: 1, element: "physical", damage: 15, range: 92 },
  { id: "swordsman", name: "Swordsman", tier: 2, element: "physical", damage: 29, range: 112 },
  { id: "knight", name: "Knight", tier: 3, element: "physical", damage: 48, range: 132 },
  { id: "rogueGirl", name: "Rogue Girl", tier: 1, element: "physical", damage: 18, range: 96 },
  { id: "assassinGirl", name: "Assassin Girl", tier: 2, element: "poison", damage: 34, range: 112 },
  { id: "ninjaGirl", name: "Ninja Girl", tier: 3, element: "poison", damage: 54, range: 138 },
  { id: "pixie", name: "Pixie", tier: 1, element: "poison", damage: 14, range: 230 },
  { id: "flowerFairy", name: "Flower Fairy", tier: 2, element: "poison", damage: 26, range: 250 },
  { id: "fairyPrincess", name: "Fairy Princess", tier: 3, element: "poison", damage: 40, range: 270 },
  { id: "ghostFollower", name: "Ghost", tier: 1, element: "arcane", damage: 17, range: 120 },
  { id: "wraith", name: "Wraith", tier: 2, element: "arcane", damage: 31, range: 145 },
  { id: "banshee", name: "Banshee", tier: 3, element: "arcane", damage: 46, range: 220 },
  { id: "littleDemon", name: "Little Demon", tier: 1, element: "fire", damage: 18, range: 92 },
  { id: "demonFollower", name: "Demon", tier: 2, element: "fire", damage: 34, range: 245 },
  { id: "hellKing", name: "Hell King", tier: 3, element: "fire", damage: 56, range: 275 }
];

const followerById = Object.fromEntries(followersBook.map(f => [f.id, f]));
const followerByName = Object.fromEntries(followersBook.map(f => [f.name, f]));
const followerEvolvesTo = { furnace: "balrog", balrog: "lotus", rock: "golem", golem: "giant", skeleton: "skeletonWarrior", skeletonWarrior: "reaper", militia: "swordsman", swordsman: "knight", rogueGirl: "assassinGirl", assassinGirl: "ninjaGirl", pixie: "flowerFairy", flowerFairy: "fairyPrincess", ghostFollower: "wraith", wraith: "banshee", littleDemon: "demonFollower", demonFollower: "hellKing" };
const followerChoices = followersBook.filter(f => f.tier === 1);

const gearBook = [
  { name: "星火法杖", rarity: "uncommon", desc: "攻击力+12%", apply: s => s.damage *= 1.12 },
  { name: "扩散棱镜", rarity: "rare", desc: "范围+14%，攻击力+6%", apply: s => { s.area *= 1.14; s.damage *= 1.06; } },
  { name: "疾咏指环", rarity: "epic", desc: "攻速+12%，范围+6%", apply: s => { s.cooldown *= 0.88; s.area *= 1.06; } },
  { name: "冷月沙漏", rarity: "rare", desc: "冷却-12%，范围-4%", apply: s => { s.cooldown *= 0.88; s.area *= 0.96; } },
  { name: "符文胸甲", rarity: "common", desc: "防御力+3", apply: s => s.defense += 3 },
  { name: "守望军旗", rarity: "uncommon", desc: "群体减伤+8%", apply: s => s.groupReduce += 0.08 },
  { name: "踏风靴", rarity: "common", desc: "移速+10%", apply: s => s.speed *= 1.1 },
  { name: "焰纹宝珠", rarity: "rare", desc: "火伤+18%", apply: s => s.fire *= 1.18 },
  { name: "霜银吊坠", rarity: "rare", desc: "冰伤+18%", apply: s => s.ice *= 1.18 },
  { name: "复苏藤环", rarity: "common", desc: "生命恢复+0.8/秒", apply: s => s.regen += 0.8 },
  { name: "Chronos Amulet", rarity: "epic", icon: "ChronosAmulet.png", desc: "Cooldown -10%", apply: s => { s.cooldown *= 0.9; } },
  { name: "Time Pocket Watch", rarity: "rare", icon: "TimePocketWatch.png", desc: "Cooldown -6%", apply: s => { s.cooldown *= 0.94; } },
  { name: "Time Sand", rarity: "common", icon: "TimeSand.png", desc: "Cooldown -3%", apply: s => { s.cooldown *= 0.97; } },
  { name: "Mana Source", rarity: "rare", icon: "ManaSource.png", desc: "All friendly skill cooldown -3%", apply: s => { s.cooldown *= 0.97; s.followerCooldown = (s.followerCooldown || 1) * 0.97; } },
  { name: "War Horn", rarity: "rare", icon: "WarHorn.png", desc: "Follower attack aura +12%", apply: s => { s.followerAttackAuraGear = (s.followerAttackAuraGear || 0) + 0.12; } },
  { name: "War Drum", rarity: "common", icon: "WarDrum.png", desc: "Follower move speed aura +10%", apply: s => { s.followerMoveAura = (s.followerMoveAura || 0) + 0.1; } },
  { name: "牧灵之笛", rarity: "common", desc: "Spirit Taming ghosts +4", apply: s => { s.spiritBonus = (s.spiritBonus || 0) + 4; } },
  { name: "回春法杖", rarity: "rare", desc: "Area healing +2 HP/sec", apply: s => { s.healAura = (s.healAura || 0) + 2; s.healAuraRange = Math.max(s.healAuraRange || 0, 190); } },
  { name: "蝎狮尾针", rarity: "legendary", desc: "Dead enemies have 75% chance to explode", apply: s => { s.deathExplosionChance = Math.min(1, (s.deathExplosionChance || 0) + 0.75); } },
  { name: "增幅器", rarity: "rare", desc: "Magic area +10%", apply: s => { s.area *= 1.1; } },
  { name: "火药", rarity: "common", desc: "Magic area +5%", apply: s => { s.area *= 1.05; } },
  { name: "放射元素", rarity: "epic", desc: "Magic area +15%, duration +10%", apply: s => { s.area *= 1.15; s.duration = (s.duration || 1) * 1.1; } }
];

const gearRarityInfo = {
  common: { label: "普通", weight: 56, color: "#e5e7eb" },
  uncommon: { label: "优秀", weight: 30, color: "#8df29f" },
  rare: { label: "稀有", weight: 11, color: "#83c7ff" },
  epic: { label: "史诗", weight: 3, color: "#d58cff" },
  legendary: { label: "传说", weight: 1, color: "#ffb84d" }
};

function ownedGearNames() {
  const gear = new Set(state?.gear || []);
  for (const item of state?.items || []) {
    for (const entry of gearBook) {
      if (item === entry.name || item.includes(entry.name)) gear.add(entry.name);
    }
  }
  return gear;
}

function pickGearByRarity(excluded = new Set()) {
  const owned = ownedGearNames();
  const pool = gearBook.filter(gear => !owned.has(gear.name) && !excluded.has(gear.name));
  if (!pool.length) return null;
  const total = pool.reduce((sum, gear) => sum + (gearRarityInfo[gear.rarity]?.weight || 1), 0);
  let roll = Math.random() * total;
  for (const gear of pool) {
    roll -= gearRarityInfo[gear.rarity]?.weight || 1;
    if (roll <= 0) return gear;
  }
  return pool[pool.length - 1];
}

function gearTitle(gear) {
  const rarity = gearRarityInfo[gear.rarity] || gearRarityInfo.common;
  return `[${rarity.label}] ${gear.name}`;
}

function applyUniqueGear(gear, source = "") {
  if (!gear) return false;
  state.gear = state.gear || [];
  if (state.gear.includes(gear.name)) return false;
  gear.apply(state.player);
  state.gear.push(gear.name);
  state.items.push(source ? `${source}: ${gearTitle(gear)}` : gearTitle(gear));
  return true;
}

const artifactBook = [
  { name: "荆棘王冠", desc: "群体反伤", apply: s => s.thorns += 10 },
  { name: "永恒沙漏", desc: "大幅减冷却", apply: s => s.cooldown *= 0.72 },
  { name: "Chronos Clock", desc: "Cooldown -15%, skill duration +10%", apply: s => { s.cooldown *= 0.85; s.duration = (s.duration || 1) * 1.1; } },
  { name: "审判之眼", desc: "暴击+15%，爆伤+50%", apply: s => { s.crit += 0.15; s.critMul += 0.5; } },
  { name: "泰坦心脏", desc: "最大生命+150", apply: s => { s.maxHp += 150; s.hp += 150; } },
  { name: "星界罗盘", desc: "魔法范围+28%", apply: s => s.area *= 1.28 },
  { name: "圣泉圣杯", desc: "周期群体治疗", apply: s => s.healPulse = true },
  { name: "民心所向", desc: "随从上限+3", apply: s => s.followerLimitBonus = (s.followerLimitBonus || 0) + 3 }
];

const monsterBook = [
  ["史莱姆", "#73d56c", 18, 28, 7, "normal"],
  ["骷髅兵", "#d6d0bd", 28, 36, 9, "undead"],
  ["骷髅射手", "#e7ddb2", 16, 34, 8, "ranged"],
  ["僵尸", "#8fa86b", 45, 22, 10, "undead"],
  ["鬼魂", "#b8d7ff", 24, 44, 9, "ghost"],
  ["野蛮人", "#d09062", 42, 42, 12, "normal"],
  ["Imps", "#ff7051", 14, 88, 10, "demon"],
  ["树人", "#577a45", 95, 18, 19, "normal"],
  ["强盗", "#92816d", 36, 42, 11, "normal"],
  ["暗精灵", "#8e79d6", 28, 82, 14, "ranged"]
];

const eliteBook = [
  ["独眼巨人", "#c98c5b", 310, 28, 80, "elite"],
  ["死亡骑士", "#526070", 260, 42, 88, "elite"],
  ["蝎狮", "#a86b45", 210, 76, 92, "poisonElite"]
];

const bossBook = [
  ["比蒙巨兽", "#9a7252", 900, 24, 250],
  ["海德拉", "#577f42", 1100, 26, 280],
  ["耶梦加得", "#4d8b66", 1800, 30, 500],
  ["芬里厄", "#cfd6df", 1500, 52, 500],
  ["克苏鲁随从", "#446b69", 1650, 34, 500]
];

const classBook = {
  elementMage: {
    name: "Grand Witch",
    icon: "GrandWitch.png",
    innate: "Element Mastery",
    desc: "Innate: elemental magic damage +N%. Starts with Chain Lightning.",
    skills: ["chainLightning"],
    apply(player) {
      player.fire *= 1.08;
      player.arcane *= 1.06;
    }
  },
  necromancer: {
    name: "Necromancer",
    icon: "Necromancer.png",
    innate: "Soul Raise",
    desc: "Innate: +N% chance to turn dead enemies into Skeleton followers. Starts with Spirit Taming.",
    skills: ["spiritTaming"],
    apply(player) {
      player.arcane *= 1.12;
      player.poison *= 1.06;
      player.maxHp += 20;
      player.hp += 20;
    }
  },
  roundTableKnight: {
    name: "Round Table Knight",
    icon: "RoundTableKnight.png",
    innate: "Round Table Aura",
    desc: "Innate: aura grants +N% attack and N% damage reduction. Starts with Cleave.",
    skills: ["cleave"],
    apply(player) {
      player.maxHp += 55;
      player.hp += 55;
      player.defense += 8;
      player.damage *= 1.05;
    }
  },
  elf: {
    name: "Elf",
    icon: "Elf.png",
    innate: "Forest Mending",
    desc: "Innate: nearby allies recover N HP per second. Starts with Arrow Rain.",
    skills: ["arrowRain"],
    apply(player) {
      player.speed += 28;
      player.physical = (player.physical || 1) * 1.16;
      player.area *= 1.05;
    }
  },
  vampirePrincess: {
    name: "Vampire Princess",
    icon: "VampirePrincess.png",
    innate: "Blood Aura",
    desc: "Innate: attacks restore N% of damage dealt. Starts with Blood Spear.",
    skills: ["bloodSpear"],
    apply(player) {
      player.maxHp += 35;
      player.hp += 35;
      player.regen += 1.15;
      player.poison *= 1.15;
      player.crit += 0.04;
    }
  },
  hellLord: {
    name: "Demon Lord",
    icon: "HellLord.png",
    innate: "Hell Breath",
    desc: "Innate: nearby enemies take 2N fire damage per second. Starts with Lava Field.",
    skills: ["lavaField"],
    apply(player) {
      player.fire *= 1.24;
      player.damage *= 1.1;
      player.maxHp += 30;
      player.hp += 30;
    }
  }
};
let state;

function newState(classId = "elementMage") {
  const selectedClass = classBook[classId] || classBook.elementMage;
  const nextState = {
    running: false,
    paused: false,
    classId,
    className: selectedClass.name,
    time: 0,
    spawn: 0,
    gold: 0,
    saveClock: 0,
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
      speed: 205, damage: 1, area: 1, cooldown: 1, followerCooldown: 1, duration: 1, defense: 0, groupReduce: 0,
      fire: 1, ice: 1, wind: 1, earth: 1, lightning: 1, arcane: 1, poison: 1,
      regen: 0.7, crit: 0.05, critMul: 1.5, thorns: 0, healPulse: false, followerLimitBonus: 0, spiritBonus: 0, healAura: 0, healAuraRange: 0, deathExplosionChance: 0, ward: 0, hitGrace: 0
    },
    skills: Object.fromEntries(selectedClass.skills.map(id => [id, skillState(id)])),
    followers: [],
    items: [],
    gear: [],
    artifacts: [],
    blackMarket: { x: W / 2 + 280, y: H / 2 - 150, r: 88, wasNear: false },
    worldBosses: Object.fromEntries(Object.entries(WORLD_BOSS_SITES).map(([id, site]) => [id, { ...site, spawned: false, defeated: false }])),
    last: performance.now()
  };
  selectedClass.apply(nextState.player);
  return nextState;
}

function skillState(id) {
  return { id, level: 1, t: rand(0, skillBook[id].cd || 1) };
}

function storageAvailable() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function saveGame() {
  if (!storageAvailable() || !state?.running || state.player.hp <= 0) return;
  const cleanMonster = m => ({
    x: m.x, y: m.y, r: m.r, name: m.name, color: m.color,
    hp: m.hp, maxHp: m.maxHp, baseMaxHp: m.baseMaxHp || m.maxHp || m.hp, speed: m.speed, xp: m.xp,
    tag: m.tag, kind: m.kind, worldBoss: !!m.worldBoss,
    hit: 0, shoot: m.shoot || 0, attackMul: m.attackMul || 1,
    attackCd: m.attackCd || 0, specialCd: m.specialCd || 0,
    slow: m.slow || 0, poison: m.poison || null, disease: m.disease || null, burn: m.burn || null, blind: m.blind || 0, fear: m.fear || 0, disarm: m.disarm || 0
  });
  const save = {
    version: 1,
    savedAt: Date.now(),
    classId: state.classId,
    className: state.className,
    time: state.time,
    spawn: state.spawn,
    gold: state.gold || 0,
    player: state.player,
    skills: state.skills,
    followers: state.followers,
    items: state.items,
    gear: state.gear || [],
    artifacts: state.artifacts,
    worldBosses: state.worldBosses,
    blackMarket: state.blackMarket,
    monsters: state.monsters.map(cleanMonster),
    gems: state.gems,
    chests: state.chests,
    heals: state.heals
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Local storage can be unavailable in some browser modes.
  }
}

function loadSavedGame() {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (!save || save.version !== 1 || !save.player || save.player.hp <= 0) return null;
    return save;
  } catch {
    return null;
  }
}

function clearSave() {
  if (!storageAvailable()) return;
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function restoreState(save) {
  const restored = newState(save.classId || "elementMage");
  restored.running = true;
  restored.paused = false;
  restored.time = save.time || 0;
  restored.spawn = save.spawn || 0;
  restored.gold = save.gold || 0;
  restored.className = classBook[save.classId]?.name || save.className || restored.className;
  restored.player = { ...restored.player, ...save.player, hitGrace: 0 };
  restored.skills = save.skills || restored.skills;
  restored.followers = (save.followers || []).map(f => ({ ...f, hitGrace: 0, t: f.t || rand(0, 1) }));
  restored.items = save.items || [];
  restored.gear = save.gear || [];
  restored.artifacts = save.artifacts || [];
  restored.blackMarket = { ...restored.blackMarket, ...(save.blackMarket || {}), wasNear: false };
  restored.worldBosses = { ...restored.worldBosses, ...(save.worldBosses || {}) };
  restored.monsters = (save.monsters || []).map(m => ({ ...m, baseMaxHp: m.baseMaxHp || (m.maxHp || m.hp || 1) / timeGrowth(), hit: 0, charge: null }));
  restored.gems = save.gems || [];
  restored.chests = save.chests || [];
  restored.heals = save.heals || [];
  restored.terrain = terrainAt(restored.player.x, restored.player.y);
  restored.last = performance.now();
  return restored;
}

function terrainMod(key, fallback = 1) {
  return state.terrain.mod[key] || fallback;
}

function elementMult(element) {
  const p = state.player;
  let v = p[element] || 1;
  if (state.classId === "elementMage" && isElementMagic(element)) v *= 1 + classLevel() * 0.01;
  if (element === "fire") v *= terrainMod("fireDamage") * terrainMod("fireArea", 1);
  if (element === "ice") v *= terrainMod("iceDamage");
  if (element === "wind") v *= terrainMod("windDamage");
  return v;
}

function effectiveDefense() {
  return state.player.defense + (state.player.followerDefense || 0);
}

function effectiveGroupReduce() {
  const p = state.player;
  return Math.min(0.8, (p.groupReduce || 0) + (p.classGroupReduce || 0));
}

function areaMult(element) {
  let v = state.player.area;
  if (element === "fire") v *= terrainMod("fireArea");
  if (element === "ice") v *= terrainMod("iceArea");
  return v;
}

function skillDamageMultiplier(level) {
  return 1 + (level - 1) * 0.35;
}

function skillAreaMultiplier(level) {
  return 1 + (level - 1) * 0.12;
}

function skillCooldownMultiplier(level) {
  return 1;
}

function skillDurationMultiplier() {
  return state?.player?.duration || 1;
}

function scaleSkillDuration(zone) {
  const mult = skillDurationMultiplier();
  if (zone.life) zone.life *= mult;
  if (zone.maxLife) zone.maxLife *= mult;
  return zone;
}

function addText(text, x, y, color = "#fff") {
  state.texts.push({ text, x, y, color, life: 1 });
}

function addGold(amount, x = state.player.x, y = state.player.y) {
  const gain = Math.max(0, Math.floor(amount));
  if (!gain) return;
  state.gold = (state.gold || 0) + gain;
  addText(`+${gain}G`, x - 12, y - 34, "#ffd35a");
}

function monsterGoldValue(m) {
  const base = m.kind === "boss" ? 90 : m.kind === "elite" ? 28 : 5;
  const timeBonus = 1 + Math.floor(state.time / 300) * 0.18;
  const sizeBonus = m.tag === "typhon" ? 2.2 : m.worldBoss ? 1.7 : 1;
  return base * timeBonus * sizeBonus;
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
  const src = kind === "boss" ? pick(bossBook) : kind === "elite" ? pick(eliteBook) : pickMonster();
  const growth = timeGrowth();
  const baseScale = kind === "boss" ? 1 + state.time / 260 : kind === "elite" ? 1.8 : wave;
  const scale = baseScale * growth;
  const radius = src[0] === "比蒙巨兽" ? 58 : src[0] === "海德拉" ? 54 : kind === "boss" ? 38 : src[0] === "独眼巨人" ? 42 : kind === "elite" ? 28 : 16;
  state.monsters.push({
    x: pos.x, y: pos.y, r: radius,
    name: src[0], color: src[1], hp: src[2] * scale, maxHp: src[2] * scale, baseMaxHp: src[2] * baseScale,
    speed: src[3] * terrainMod("monsterSpeed") * (kind === "boss" ? 0.65 : 1),
    xp: src[4], tag: src[5], kind, hit: 0, shoot: rand(1, 3), attackMul: 1
  });
  if (kind === "boss") addText(`${src[0]} 降临`, W / 2 - 60, 88, "#ffd36b");
}

function spawnBossAt(name, x, y, worldBoss = false) {
  if (name === "Typhon") {
    const src = ["Typhon", "#4e315f", 3600, 38, 1200, "typhon"];
    const growth = timeGrowth();
    const baseScale = 1.75 + state.time / 330;
    const scale = baseScale * growth;
    const radius = 82;
    const m = {
      x, y, r: radius,
      name: src[0], color: src[1], hp: src[2] * scale, maxHp: src[2] * scale, baseMaxHp: src[2] * baseScale,
      speed: src[3] * terrainMod("monsterSpeed") * 0.62,
      xp: src[4], tag: src[5], kind: "boss", worldBoss,
      hit: 0, shoot: rand(1, 3), attackMul: 1.25, specialCd: rand(0.8, 1.6)
    };
    state.monsters.push(m);
    addText("Typhon awakens", x - 70, y - radius - 42, "#ff9a46");
    addRing(x, y, radius * 2.8, "rgba(255,88,32,.9)", 1.0);
    return m;
  }
  const src = bossBook.find(b => b[0] === name) || (name === "奇美拉" ? ["奇美拉", "#a777ba", 1350, 46, 420] : null);
  if (!src) return null;
  const growth = timeGrowth();
  const baseScale = 1.25 + state.time / 420;
  const scale = baseScale * growth;
  const radius = name === "奇美拉" ? 60 : name === "比蒙巨兽" ? 58 : name === "海德拉" ? 54 : 38;
  const m = {
    x, y, r: radius,
    name: src[0], color: src[1], hp: src[2] * scale, maxHp: src[2] * scale, baseMaxHp: src[2] * baseScale,
    speed: src[3] * terrainMod("monsterSpeed") * 0.72,
    xp: src[4], tag: src[5] || "boss", kind: "boss", worldBoss,
    hit: 0, shoot: rand(1, 3), attackMul: 1, specialCd: rand(1.2, 2.4)
  };
  state.monsters.push(m);
  addText(`${name} 苏醒`, x - 52, y - radius - 36, "#ffd36b");
  addRing(x, y, radius * 2.2, "rgba(210,90,255,.85)", 0.8);
  return m;
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

function nearestEnemyExcluding(from, range = 9999, excluded = new Set()) {
  let best = null;
  let bd = range;
  for (const m of state.monsters) {
    if (excluded.has(m)) continue;
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
  const fusionDamage = isFusionSkill(s.id) ? FUSION_DAMAGE_MULT : 1;
  const fusionArea = isFusionSkill(s.id) ? FUSION_AREA_MULT : 1;
  const dmg = b.damage * SKILL_POWER_MULT * fusionDamage * skillDamageMultiplier(lvl) * p.damage * (1 + (p.classDamageAura || 0)) * diseaseAttackMult(p) * elementMult(b.element);
  const area = b.area * fusionArea * skillAreaMultiplier(lvl) * areaMult(b.element);
  p.castAnim = 0.24;

  if (b.type === "bolt") {
    const target = nearestEnemy(p);
    if (!target) return;
    fireProjectile(p.x, p.y, target.x, target.y, 430, dmg, 6, b.element, "#d9b8ff");
  } else if (b.type === "fireball") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    castFireballVolley(p, target, lvl, dmg);
  } else if (b.type === "arrowRain") {
    const target = nearestEnemy(p, 620) || { x: p.x + 140, y: p.y };
    castArrowRain(target.x, target.y, area, dmg, lvl);
  } else if (b.type === "cleave") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    castPlayerCleave(p, target, area, dmg, lvl);
  } else if (b.type === "bloodRect") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    castBloodRectangle(p, target, area, dmg, lvl);
  } else if (b.type === "fearCone") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    castPainScream(p, target, area, dmg, lvl);
  } else if (b.type === "fireBreathBarrage") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    castFireBreathBarrage(p, target, area, dmg, lvl);
  } else if (b.type === "bloodSpear") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    fireBloodSpear(p.x, p.y, target.x, target.y, dmg, lvl);
  } else if (b.type === "forkLightning") {
    const target = nearestEnemy(p, area) || { x: p.x + 1, y: p.y };
    castForkLightning(p, target, lvl, area, dmg);
  } else if (b.type === "virulentPlague") {
    const target = nearestEnemy(p, 620) || { x: p.x + 140, y: p.y };
    castVirulentPlague(target.x, target.y, lvl, area, dmg);
  } else if (b.type === "iceAge") {
    const target = nearestEnemy(p, 680) || { x: p.x + 160, y: p.y };
    castIceAge(target.x, target.y, lvl, area, dmg);
  } else if (b.type === "dimensionalSlash") {
    castDimensionalSlash(p, area, dmg, lvl);
  } else if (b.type === "line") {
    const target = nearestEnemy(p);
    if (!target) return;
    fireProjectile(p.x, p.y, target.x, target.y, 720, dmg, 4, b.element, "#fcf0aa", true);
    addLine(p.x, p.y, target.x, target.y, "rgba(255,246,170,.9)", 7, 0.2, false);
  } else if (b.type === "cone") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    const ang = Math.atan2(target.y - p.y, target.x - p.x);
    state.zones.push(scaleSkillDuration({ x: p.x, y: p.y, a: ang, arc: s.id === "fireBreath" ? 0.72 : 0.55, r: area, life: 0.34, maxLife: 0.34, damage: dmg * 0.15, element: b.element, type: s.id === "fireBreath" ? "fireBreathFx" : "cone", color: "rgba(255,111,49,.28)", grow: 1.2, burnDamage: s.id === "fireBreath" ? dmg * 0.08 : 0, burnVulnerable: s.id === "fireBreath" ? 0.12 + lvl * 0.012 : 0 }));
    addParticles(p.x + Math.cos(ang) * 45, p.y + Math.sin(ang) * 45, "rgba(255,180,84,.9)", 12, 55, 0.35);
  } else if (b.type === "meteor") {
    const target = nearestEnemy(p) || { x: rand(120, W - 120), y: rand(90, H - 90) };
    const x = target.x + rand(-60, 60);
    const y = target.y + rand(-60, 60);
    spawnMeteorProjectile(x, y, area, dmg, "playerMeteor");
  } else if (b.type === "aura" || b.type === "cloud") {
    const target = nearestEnemy(p, 500) || p;
    state.zones.push(scaleSkillDuration({ x: s.id === "sandstorm" ? p.x : target.x, y: s.id === "sandstorm" ? p.y : target.y, followPlayer: s.id === "sandstorm", r: s.id === "poisonCloud" ? area * 0.58 : s.id === "lavaField" ? area * 0.42 : area, maxR: s.id === "lavaField" ? area * 1.35 : area, life: s.id === "poisonCloud" ? 4.2 : s.id === "lavaField" ? 5.6 : 3.2, maxLife: s.id === "poisonCloud" ? 4.2 : s.id === "lavaField" ? 5.6 : 3.2, damage: dmg * (s.id === "lavaField" ? 0.28 : 0.22), element: b.element, type: s.id === "blizzard" ? "blizzardFx" : s.id === "poisonCloud" ? "poisonCloudFx" : s.id === "sandstorm" ? "sandstormFx" : s.id === "lavaField" ? "lavaFieldFx" : b.element === "wind" ? "spiral" : "dot", color: b.element === "ice" ? "rgba(150,220,255,.22)" : b.element === "poison" ? "rgba(103,212,95,.20)" : b.element === "fire" ? "rgba(255,94,28,.22)" : "rgba(214,190,92,.20)", spin: s.id === "blizzard" ? 2.2 : s.id === "poisonCloud" ? 1.6 : s.id === "sandstorm" ? 2.8 : s.id === "lavaField" ? 0.9 : b.element === "wind" ? 5 : -1, grow: s.id === "poisonCloud" ? 1.5 : s.id === "lavaField" ? 0.85 : 0.05, poisonDamage: b.element === "poison" ? dmg * 0.16 : 0, burnVulnerable: s.id === "lavaField" ? 0.14 + lvl * 0.015 : 0, blind: s.id === "sandstorm" }));
    if (b.element === "poison") addParticles(target.x, target.y, "rgba(128,255,105,.65)", 18, area * 0.45, 2.4);
  } else if (b.type === "nova") {
    damageCircle(p.x, p.y, area, dmg, b.element, true);
    state.zones.push(scaleSkillDuration({ x: p.x, y: p.y, r: area, life: 0.48, maxLife: 0.48, damage: 0, element: b.element, type: "frostNovaFx", color: "rgba(165,230,255,.25)", grow: 1.65, spin: rand(0, Math.PI * 2) }));
    addParticles(p.x, p.y, "rgba(190,245,255,.85)", 20, area * 0.48, 0.55);
  } else if (b.type === "strike" || b.type === "chain") {
    if (b.type === "chain") castChainLightning(p, lvl, area, dmg, b.element);
    else {
      const hits = s.id === "thunderCloud" ? lvl : 2 + Math.floor(lvl / 2);
      const used = new Set();
      for (let i = 0; i < hits; i++) {
        const target = nearestEnemyExcluding(p, area, used);
        if (target) hitMonster(target, dmg, b.element);
        if (target) {
          used.add(target);
          addLightning(target.x + rand(-35, 35), target.y - rand(80, 130), target.x, target.y);
          if (s.id === "thunderCloud") state.zones.push({ x: target.x, y: target.y - 38, r: 72, life: 0.32, maxLife: 0.32, damage: 0, element: b.element, type: "thunderCloudFx", color: "rgba(82,155,255,.28)", grow: 1.1 });
          state.zones.push({ x: target.x, y: target.y, r: 28, life: 0.18, maxLife: 0.18, damage: 0, element: b.element, type: "visual", color: "rgba(255,245,136,.45)", grow: 1.8 });
        }
      }
    }
  } else if (b.type === "quake") {
    const waves = 1 + Math.floor((lvl - 1) / 2);
    for (let w = 0; w < waves; w++) {
      const waveArea = area * (0.72 + w * 0.28);
      damageCircle(p.x, p.y, waveArea, dmg * (1 - w * 0.12), b.element, true);
      state.zones.push({ x: p.x, y: p.y, r: waveArea, life: 0.55 + w * 0.12, maxLife: 0.55 + w * 0.12, delay: w * 0.09, damage: dmg * (1 - w * 0.12) * 0.34, impactDamage: dmg * (1 - w * 0.12) * 0.95, element: b.element, type: "earthquakeFx", color: "rgba(180,128,84,.24)", grow: 1.45 + w * 0.22, spin: rand(-0.25, 0.25) });
    }
    for (let i = 0; i < 5 + lvl * 2; i++) {
      const a = rand(0, Math.PI * 2);
      const r1 = rand(25, area * 0.35);
      const r2 = rand(area * 0.45, area * (0.9 + lvl * 0.08));
      addLine(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1, p.x + Math.cos(a + rand(-0.25, 0.25)) * r2, p.y + Math.sin(a + rand(-0.25, 0.25)) * r2, "rgba(255,196,110,.72)", 4, 0.5, true);
    }
  } else if (b.type === "orb") {
    const target = nearestEnemy(p) || p;
    const a = Math.atan2(target.y - p.y, target.x - p.x);
    state.zones.push(scaleSkillDuration({
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
      seek: s.id === "flameTornado" ? 380 : 250,
      pullMul: s.id === "flameTornado" ? 1.85 : 1,
      burnDamage: s.id === "flameTornado" ? dmg * 0.18 : 0,
      burnVulnerable: s.id === "flameTornado" ? 0.18 + lvl * 0.018 : 0
    }));
    addRing(target.x, target.y, area * 0.45, s.id === "flameTornado" ? "rgba(255,160,78,.65)" : "rgba(220,255,245,.55)", 0.6);
  } else if (b.type === "ward") {
    p.ward = 4 + lvl * 0.4;
    addText("防御结界", p.x - 28, p.y - 32, "#9fd2ff");
    addRing(p.x, p.y, 70, "rgba(145,210,255,.95)", 0.75);
  } else if (b.type === "doom") {
    const shockArea = Math.max(area, Math.max(W, H) * 0.78);
    damageCircle(p.x, p.y, shockArea, dmg * 1.35, b.element, true);
    state.zones.push({ x: p.x, y: p.y, r: shockArea * 0.62, life: 1.15, maxLife: 1.15, damage: 0, element: b.element, type: "doomFx", color: "rgba(255,74,40,.35)", spin: -2.4, grow: 2.6 });
    for (let wave = 0; wave < 3; wave++) {
      state.zones.push({ x: p.x, y: p.y, r: shockArea * (0.28 + wave * 0.22), life: 0.6 + wave * 0.22, maxLife: 0.6 + wave * 0.22, delay: wave * 0.12, damage: 0, element: b.element, type: "visual", color: "rgba(255,92,28,.30)", spin: -4 + wave, grow: 4.2 });
    }
    addRing(p.x, p.y, shockArea, "rgba(255,70,35,.95)", 1.05);
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2);
      addLine(p.x, p.y, p.x + Math.cos(a) * shockArea, p.y + Math.sin(a) * shockArea, "rgba(255,210,80,.75)", 7, 0.75, true);
    }
  } else if (b.type === "plagueBolt") {
    const target = nearestEnemy(p) || { x: p.x + 1, y: p.y };
    firePlagueBolt(p.x, p.y, target.x, target.y, dmg, area, lvl);
  }
}

function fireProjectile(x, y, tx, ty, speed, damage, r, element, color, pierce = false) {
  const a = Math.atan2(ty - y, tx - x);
  state.projectiles.push({ x, y, px: x, py: y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, damage, r, element, color, life: 2.2, pierce, hit: new Set(), angle: a });
}

function castFireballVolley(origin, target, level, damage) {
  const base = Math.atan2(target.y - origin.y, target.x - origin.x);
  const count = Math.min(7, 1 + Math.floor((level - 1) / 1));
  const spread = Math.min(0.58, 0.11 * (count - 1));
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : -spread * 0.5 + spread * (i / (count - 1));
    const a = base + offset;
    const x = origin.x + Math.cos(a) * 26;
    const y = origin.y + Math.sin(a) * 26;
    state.projectiles.push({
      kind: "fireballSkill",
      x,
      y,
      px: origin.x,
      py: origin.y,
      vx: Math.cos(a) * 520,
      vy: Math.sin(a) * 520,
      damage: damage * 0.86,
      r: 12,
      element: "fire",
      color: "rgba(255,128,34,.95)",
      life: 1.55,
      maxLife: 1.55,
      pierce: true,
      hit: new Set(),
      angle: a,
      spin: rand(0, Math.PI * 2)
    });
  }
}

function castArrowRain(x, y, area, damage, level) {
  damageCircle(x, y, area, damage, "physical", false);
  state.zones.push(scaleSkillDuration({
    x,
    y,
    r: area,
    life: 0.72,
    maxLife: 0.72,
    damage: damage * 0.04,
    element: "physical",
    type: "arrowRainFx",
    color: "rgba(255,170,56,.22)",
    grow: 0.35,
    spin: rand(-0.2, 0.2)
  }));
  const drops = 7 + level * 3;
  for (let i = 0; i < drops; i++) {
    const a = rand(0, Math.PI * 2);
    const rr = Math.sqrt(Math.random()) * area * 0.82;
    const tx = x + Math.cos(a) * rr;
    const ty = y + Math.sin(a) * rr * 0.55;
    addLine(tx - 12, ty - rand(110, 180), tx, ty, "rgba(255,180,56,.75)", rand(3, 6), 0.32, true);
  }
}

function castIceAge(x, y, level, area, damage) {
  const drops = 10 + level * 5;
  state.zones.push(scaleSkillDuration({
    x,
    y,
    r: area * 1.05,
    life: 1.05,
    maxLife: 1.05,
    damage: damage * 0.02,
    element: "ice",
    type: "iceAgeFx",
    color: "rgba(150,220,255,.26)",
    grow: 0.18,
    spin: rand(-0.1, 0.1)
  }));
  for (let i = 0; i < drops; i++) {
    const a = rand(0, Math.PI * 2);
    const rr = Math.sqrt(Math.random()) * area;
    const tx = x + Math.cos(a) * rr;
    const ty = y + Math.sin(a) * rr * 0.68;
    const delay = i * 0.035 + rand(0, 0.22);
    addLine(tx - rand(8, 22), ty - rand(180, 280), tx, ty, "rgba(158,220,255,.86)", rand(4, 8), 0.36 + delay, true);
    state.zones.push(scaleSkillDuration({
      x: tx,
      y: ty,
      r: area * rand(0.18, 0.3),
      life: 0.42,
      maxLife: 0.42,
      delay,
      damage: damage * 0.24,
      element: "ice",
      type: "frostNovaFx",
      color: "rgba(165,230,255,.28)",
      grow: 1.85,
      spin: rand(0, Math.PI * 2)
    }));
    if (i % 3 === 0) addParticles(tx, ty, "rgba(190,245,255,.78)", 4, 22, 0.65 + delay);
  }
  addRing(x, y, area * 1.05, "rgba(145,220,255,.75)", 0.95);
}

function castDimensionalSlash(origin, area, damage, level) {
  const radius = Math.max(area, Math.max(W, H) * 0.86);
  const slashDamage = damage * (1.08 + level * 0.08);
  for (const m of state.monsters) {
    hitMonster(m, slashDamage, "arcane");
  }
  state.zones.push(scaleSkillDuration({
    x: origin.x,
    y: origin.y,
    r: radius,
    life: 0.95,
    maxLife: 0.95,
    damage: 0,
    element: "arcane",
    type: "dimensionalSlashFx",
    color: "rgba(181,82,255,.35)",
    angle: -0.58 + rand(-0.12, 0.12),
    grow: 0.15,
    spin: 0.05
  }));
  addRing(origin.x, origin.y, radius * 0.72, "rgba(185,92,255,.78)", 0.9);
  for (let i = 0; i < 10 + level * 2; i++) {
    const a = -0.58 + rand(-0.55, 0.55);
    const ox = Math.cos(a + Math.PI / 2) * rand(-radius * 0.45, radius * 0.45);
    const oy = Math.sin(a + Math.PI / 2) * rand(-radius * 0.45, radius * 0.45);
    const sx = origin.x + ox - Math.cos(a) * radius * rand(0.25, 0.85);
    const sy = origin.y + oy - Math.sin(a) * radius * rand(0.25, 0.85);
    const ex = origin.x + ox + Math.cos(a) * radius * rand(0.35, 0.95);
    const ey = origin.y + oy + Math.sin(a) * radius * rand(0.35, 0.95);
    addLine(sx, sy, ex, ey, "rgba(196,96,255,.76)", rand(4, 10), 0.52, true);
  }
  addParticles(origin.x, origin.y, "rgba(190,96,255,.62)", 34, radius * 0.38, 0.85);
}

function castPlayerCleave(origin, target, area, damage, level) {
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const arc = Math.PI * (0.62 + level * 0.025);
  for (const m of state.monsters) {
    const dx = m.x - origin.x;
    const dy = m.y - origin.y;
    const d = Math.hypot(dx, dy);
    const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle)));
    if (d < area + m.r && diff < arc * 0.5) hitMonster(m, damage, "physical");
  }
  const cx = origin.x + Math.cos(angle) * area * 0.44;
  const cy = origin.y + Math.sin(angle) * area * 0.44;
  state.zones.push({ x: cx, y: cy, r: area, life: 0.28, maxLife: 0.28, damage: 0, element: "physical", type: "slashFx", color: "rgba(255,214,96,.36)", angle, grow: 0.9 });
}

function castBloodRectangle(origin, target, area, damage, level) {
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  const sideX = -forwardY;
  const sideY = forwardX;
  const length = area * (1.28 + level * 0.06);
  const width = 96 + level * 16;
  for (const m of state.monsters) {
    const dx = m.x - origin.x;
    const dy = m.y - origin.y;
    const forward = dx * forwardX + dy * forwardY;
    const side = Math.abs(dx * sideX + dy * sideY);
    if (forward > -m.r && forward < length + m.r && side < width * 0.5 + m.r) {
      hitMonster(m, damage, "physical");
    }
  }
  const cx = origin.x + forwardX * length * 0.5;
  const cy = origin.y + forwardY * length * 0.5;
  state.zones.push(scaleSkillDuration({
    x: cx,
    y: cy,
    r: width,
    length,
    width,
    life: 0.34,
    maxLife: 0.34,
    damage: 0,
    element: "physical",
    type: "bloodRectFx",
    color: "rgba(200,22,64,.28)",
    angle,
    grow: 0.65
  }));
  addLine(origin.x + forwardX * 22, origin.y + forwardY * 22, origin.x + forwardX * length, origin.y + forwardY * length, "rgba(255,55,92,.72)", 10, 0.18, true);
}

function applyFear(target, seconds) {
  target.fear = Math.max(target.fear || 0, seconds);
  target.slow = Math.max(target.slow || 0, seconds * 0.35);
}

function castPainScream(origin, target, area, damage, level) {
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  const sideX = -forwardY;
  const sideY = forwardX;
  const length = area * (1.25 + level * 0.08);
  const width = area * (0.72 + level * 0.04);
  for (const m of state.monsters) {
    const dx = m.x - origin.x;
    const dy = m.y - origin.y;
    const forward = dx * forwardX + dy * forwardY;
    const side = Math.abs(dx * sideX + dy * sideY);
    const maxSide = (width * 0.22) + (forward / length) * width * 0.48;
    if (forward > -m.r && forward < length + m.r && side < maxSide + m.r) {
      hitMonster(m, damage * 0.55, "arcane");
      applyFear(m, 1.35 + level * 0.24);
    }
  }
  state.zones.push(scaleSkillDuration({
    x: origin.x + forwardX * length * 0.5,
    y: origin.y + forwardY * length * 0.5,
    r: width,
    length,
    width,
    life: 0.58,
    maxLife: 0.58,
    damage: 0,
    element: "arcane",
    type: "painScreamFx",
    color: "rgba(224,67,255,.30)",
    angle,
    grow: 0.9
  }));
  addParticles(origin.x + forwardX * 58, origin.y + forwardY * 58, "rgba(238,86,255,.78)", 16, area * 0.32, 0.55);
}

function castFireBreathBarrage(origin, target, area, damage, level) {
  const baseAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const waves = 3 + Math.floor(level / 2);
  for (let i = 0; i < waves; i++) {
    const waveAngle = baseAngle + (i - (waves - 1) * 0.5) * 0.08;
    const waveArea = area * (1.02 + i * 0.06);
    const delay = i * 0.16;
    state.zones.push(scaleSkillDuration({
      x: origin.x,
      y: origin.y,
      a: waveAngle,
      arc: 0.9,
      r: waveArea,
      life: 0.38,
      maxLife: 0.38,
      delay,
      damage: damage * 0.18,
      element: "fire",
      type: "fireBreathFx",
      effect: "breathOfFire",
      color: "rgba(255,96,36,.32)",
      grow: 1.45,
      burnDamage: damage * 0.16,
      burnVulnerable: 0.18 + level * 0.016,
      widthMul: 1.72,
      heightMul: 1.18,
      alphaMul: 0.76
    }));
    addParticles(
      origin.x + Math.cos(waveAngle) * (58 + i * 8),
      origin.y + Math.sin(waveAngle) * (58 + i * 8),
      "rgba(255,174,72,.72)",
      10 + level,
      waveArea * 0.18,
      0.42 + delay
    );
  }
  addText("Breath of Fire", origin.x - 54, origin.y - 58, "#ffb35a");
}

function fireBloodSpear(x, y, tx, ty, damage, level) {
  const a = Math.atan2(ty - y, tx - x);
  state.projectiles.push({
    kind: "bloodSpear",
    x: x + Math.cos(a) * 28,
    y: y + Math.sin(a) * 28,
    px: x,
    py: y,
    vx: Math.cos(a) * (560 + level * 18),
    vy: Math.sin(a) * (560 + level * 18),
    damage: damage * 0.95,
    r: 20,
    element: "physical",
    color: "rgba(255,42,60,.9)",
    life: 1.25,
    maxLife: 1.25,
    pierce: true,
    hit: new Set(),
    angle: a,
    spin: rand(-0.16, 0.16)
  });
}

function firePlagueBolt(x, y, tx, ty, damage, area, level) {
  const a = Math.atan2(ty - y, tx - x);
  const maxDist = 360 + level * 42;
  const targetDist = Math.hypot(tx - x, ty - y);
  const travel = Math.min(maxDist, Math.max(160, targetDist));
  const endX = x + Math.cos(a) * travel;
  const endY = y + Math.sin(a) * travel;
  state.projectiles.push({
    kind: "blackPlague",
    x: x + Math.cos(a) * 24,
    y: y + Math.sin(a) * 24,
    px: x,
    py: y,
    vx: Math.cos(a) * 390,
    vy: Math.sin(a) * 390,
    tx: endX,
    ty: endY,
    damage,
    area,
    r: 12,
    element: "poison",
    color: "rgba(188,86,255,.95)",
    life: travel / 390 + 0.12,
    maxLife: travel / 390 + 0.12,
    pierce: false,
    hit: new Set(),
    angle: a,
    spin: rand(0, Math.PI * 2)
  });
  addLine(x, y, x + Math.cos(a) * 44, y + Math.sin(a) * 44, "rgba(194,88,255,.48)", 6, 0.2, true);
}

function explodeBlackPlague(pr) {
  damageCircle(pr.x, pr.y, pr.area, pr.damage, "poison", true);
  for (const m of state.monsters) {
    if (Math.hypot(m.x - pr.x, m.y - pr.y) < pr.area + m.r) {
      applyPoison(m, pr.damage * 0.12, 6);
      applyDisease(m, pr.damage * 0.05, 8);
    }
  }
  state.zones.push({
    x: pr.x,
    y: pr.y,
    r: pr.area * 0.7,
    maxR: pr.area * 1.08,
    life: 2.2,
    maxLife: 2.2,
    damage: pr.damage * 0.13,
    element: "poison",
    type: "blackPlagueFx",
    color: "rgba(142,62,220,.22)",
    spin: 2.4,
    grow: 1.4,
    poisonDamage: pr.damage * 0.08
  });
  addRing(pr.x, pr.y, pr.area, "rgba(205,92,255,.84)", 0.52);
}

function castVirulentPlague(x, y, level, area, damage) {
  damageCircle(x, y, area * 0.82, damage * 0.75, "poison", true);
  addRing(x, y, area * 0.95, "rgba(145,255,72,.82)", 0.58);
  addParticles(x, y, "rgba(172,255,74,.74)", 18 + level * 3, area * 0.42, 0.7);
  const pieces = 6;
  const base = rand(0, Math.PI * 2);
  for (let i = 0; i < pieces; i++) {
    const a = base + i * Math.PI * 2 / pieces;
    const speed = 58 + level * 8;
    const r = area * (0.46 + level * 0.035);
    state.zones.push(scaleSkillDuration({
      x: x + Math.cos(a) * area * 0.18,
      y: y + Math.sin(a) * area * 0.18,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r,
      maxR: r * 1.36,
      life: 4.2 + level * 0.22,
      maxLife: 4.2 + level * 0.22,
      damage: damage * 0.28,
      element: "poison",
      type: "virulentPlagueFx",
      color: "rgba(140,255,62,.22)",
      spin: (i % 2 ? 1 : -1) * (1.8 + level * 0.1),
      grow: 0.38,
      poisonDamage: damage * 0.18,
      slow: 0.38,
      diseaseDamage: damage * 0.035
    }));
  }
  addText("Virulent Plague", x - 54, y - 42, "#b7ff62");
}

function castChainLightning(origin, level, range, damage, element) {
  let current = nearestEnemy(origin, range);
  if (!current) return;
  const hit = new Set();
  let from = origin;
  const jumps = level * 2;
  for (let i = 0; i < jumps && current; i++) {
    hit.add(current);
    hitMonster(current, damage * (1 - i * 0.04), element);
    addLightning(from.x + rand(-8, 8), from.y + rand(-8, 8), current.x, current.y);
    addChainLightningSprite(from.x, from.y, current.x, current.y);
    state.zones.push({ x: current.x, y: current.y, r: 28, life: 0.18, maxLife: 0.18, damage: 0, element, type: "visual", color: "rgba(255,245,136,.45)", grow: 1.8 });
    from = current;
    let next = null;
    let bd = Math.min(170 + level * 18, range);
    for (const m of state.monsters) {
      if (hit.has(m)) continue;
      const d = Math.hypot(m.x - current.x, m.y - current.y);
      if (d < bd) {
        bd = d;
        next = m;
      }
    }
    current = next;
  }
}

function castForkLightning(origin, target, level, range, damage) {
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  const length = range * (0.95 + level * 0.04);
  const width = range * (0.55 + level * 0.035);
  const branches = 3 + Math.floor(level / 2);
  const hit = new Set();
  const ox = origin.x + Math.cos(angle) * length * 0.42;
  const oy = origin.y + Math.sin(angle) * length * 0.42;

  for (const m of state.monsters) {
    const dx = m.x - origin.x;
    const dy = m.y - origin.y;
    const forward = Math.cos(angle) * dx + Math.sin(angle) * dy;
    const side = Math.abs(-Math.sin(angle) * dx + Math.cos(angle) * dy);
    const taper = 0.25 + clamp(forward / Math.max(1, length), 0, 1) * 0.75;
    if (forward > -m.r && forward < length + m.r && side < width * taper + m.r) {
      hit.add(m);
    }
  }
  for (const m of hit) {
    hitMonster(m, damage * 1.16, "lightning");
    m.slow = Math.max(m.slow || 0, 0.18);
  }

  state.zones.push({
    x: ox,
    y: oy,
    r: width,
    length,
    width,
    angle,
    life: 0.42,
    maxLife: 0.42,
    damage: 0,
    element: "lightning",
    type: "forkLightningFx",
    color: "rgba(94,174,255,.35)",
    grow: 0.2
  });
  addLightning(origin.x, origin.y, target.x, target.y);
  for (let i = 0; i < branches; i++) {
    const t = 0.25 + i / Math.max(1, branches - 1) * 0.62;
    const baseX = origin.x + Math.cos(angle) * length * t;
    const baseY = origin.y + Math.sin(angle) * length * t;
    const side = (i % 2 ? 1 : -1) * rand(width * 0.35, width * 0.9);
    const endX = baseX + Math.cos(angle) * rand(length * 0.08, length * 0.18) - Math.sin(angle) * side;
    const endY = baseY + Math.sin(angle) * rand(length * 0.08, length * 0.18) + Math.cos(angle) * side;
    addLightning(baseX, baseY, endX, endY);
    addLine(baseX, baseY, endX, endY, "rgba(100,205,255,.9)", 6, 0.24, true);
  }
  addParticles(target.x, target.y, "rgba(110,210,255,.88)", 12 + level * 2, width * 0.45, 0.38);
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
    damage: Math.max(1, 10 * ENEMY_DAMAGE_MULT * timeGrowth() * diseaseAttackMult(m) - effectiveDefense()) * (1 - effectiveGroupReduce()),
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
    damage: Math.max(3, 18 * ENEMY_DAMAGE_MULT * timeGrowth() * diseaseAttackMult(m) - effectiveDefense() * 0.5) * (1 - effectiveGroupReduce()),
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
  const damage = Math.max(4, 19 * ENEMY_DAMAGE_MULT * timeGrowth() - effectiveDefense() * 0.45) * (1 - effectiveGroupReduce());
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
  const chargeDamage = Math.max(6, 28 * ENEMY_DAMAGE_MULT * timeGrowth() - effectiveDefense() * 0.5) * (1 - effectiveGroupReduce());
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
  const damage = Math.max(8, 34 * ENEMY_DAMAGE_MULT * timeGrowth() - effectiveDefense() * 0.45) * (1 - effectiveGroupReduce());
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
  const damage = Math.max(10, 42 * ENEMY_DAMAGE_MULT * timeGrowth() - effectiveDefense() * 0.5) * (1 - effectiveGroupReduce());
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

function damagePlayerAndFollowersCircle(x, y, radius, damage, color = "#ff7a66") {
  const p = state.player;
  if (Math.hypot(p.x - x, p.y - y) < radius + p.r && p.hitGrace <= 0) {
    const taken = Math.max(1, damage - effectiveDefense() * 0.35) * (1 - effectiveGroupReduce());
    p.hp -= taken;
    p.hitGrace = 0.5;
    addText(`-${Math.ceil(taken)}`, p.x - 10, p.y - 28, color);
  }
  for (const f of state.followers) {
    if (f.hp > 0 && Math.hypot(f.x - x, f.y - y) < radius + 16) damageFollower(f, damage * 0.8);
  }
}

function damagePlayerAndFollowersRect(x, y, angle, length, width, damage) {
  const hitTarget = target => {
    const dx = target.x - x;
    const dy = target.y - y;
    const forward = Math.cos(angle) * dx + Math.sin(angle) * dy;
    const side = -Math.sin(angle) * dx + Math.cos(angle) * dy;
    return forward > -20 && forward < length && Math.abs(side) < width * 0.5;
  };
  const p = state.player;
  if (hitTarget(p) && p.hitGrace <= 0) {
    const taken = Math.max(1, damage - effectiveDefense() * 0.35) * (1 - effectiveGroupReduce());
    p.hp -= taken;
    p.hitGrace = 0.55;
    addText(`-${Math.ceil(taken)}`, p.x - 10, p.y - 28, "#71ffa0");
  }
  for (const f of state.followers) {
    if (f.hp > 0 && hitTarget(f)) damageFollower(f, damage * 0.78);
  }
}

function knockbackPlayerAndFollowersRect(x, y, angle, length, width, push) {
  const shove = target => {
    const dx = target.x - x;
    const dy = target.y - y;
    const forward = Math.cos(angle) * dx + Math.sin(angle) * dy;
    const side = -Math.sin(angle) * dx + Math.cos(angle) * dy;
    if (forward < -20 || forward > length || Math.abs(side) > width * 0.5) return;
    target.x += Math.cos(angle) * push;
    target.y += Math.sin(angle) * push;
  };
  shove(state.player);
  for (const f of state.followers) {
    if (f.hp > 0) shove(f);
  }
}

function damagePlayerAndFollowersCone(x, y, angle, range, arc, damage, color = "#ff7a66") {
  const hitTarget = target => {
    const dx = target.x - x;
    const dy = target.y - y;
    const d = Math.hypot(dx, dy);
    if (d > range) return false;
    const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - angle), Math.cos(Math.atan2(dy, dx) - angle)));
    return diff <= arc * 0.5;
  };
  const p = state.player;
  if (hitTarget(p) && p.hitGrace <= 0) {
    const taken = Math.max(1, damage - effectiveDefense() * 0.35) * (1 - effectiveGroupReduce());
    p.hp -= taken;
    p.hitGrace = 0.5;
    addText(`-${Math.ceil(taken)}`, p.x - 10, p.y - 28, color);
  }
  for (const f of state.followers) {
    if (f.hp > 0 && hitTarget(f)) damageFollower(f, damage * 0.78);
  }
}

function hydraAreaAttack(m) {
  const radius = 150;
  const damage = 26 * ENEMY_DAMAGE_MULT * timeGrowth();
  damagePlayerAndFollowersCircle(m.x, m.y, radius, damage, "#71ffa0");
  state.zones.push({ x: m.x, y: m.y, r: radius, life: 0.5, maxLife: 0.5, damage: 0, element: "poison", type: "visual", color: "rgba(88,210,82,.25)", grow: 2.2 });
  addRing(m.x, m.y, radius, "rgba(90,230,86,.75)", 0.5);
}

function hydraPoisonCloud(m, target) {
  const x = target.x + rand(-60, 60);
  const y = target.y + rand(-60, 60);
  const radius = 165;
  state.zones.push({ x, y, r: radius, life: 4.2, maxLife: 4.2, damage: 0, element: "poison", type: "enemyPoison", color: "rgba(86,205,68,.20)", spin: 1.4, grow: 0.02, tick: 0 });
  addText("毒气云", x - 28, y - radius * 0.45, "#9cff76");
  addParticles(x, y, "rgba(112,255,84,.62)", 24, radius * 0.48, 2.4);
}

function hydraSurge(m, target) {
  const angle = Math.atan2(target.y - m.y, target.x - m.x);
  const length = 300;
  const width = 92;
  const damage = 38 * ENEMY_DAMAGE_MULT * timeGrowth();
  damagePlayerAndFollowersRect(m.x, m.y, angle, length, width, damage);
  knockbackPlayerAndFollowersRect(m.x, m.y, angle, length, width, 58);
  const cx = m.x + Math.cos(angle) * length * 0.48;
  const cy = m.y + Math.sin(angle) * length * 0.48;
  state.zones.push({ x: cx, y: cy, r: width, life: 0.55, maxLife: 0.55, damage: 0, element: "water", type: "surgeFx", color: "rgba(72,190,255,.25)", angle, length, width, grow: 0.1 });
  addLine(m.x, m.y, m.x + Math.cos(angle) * length, m.y + Math.sin(angle) * length, "rgba(110,215,255,.55)", width * 0.12, 0.22, false);
}

function chimeraFireBreath(m, target) {
  const angle = Math.atan2(target.y - m.y, target.x - m.x);
  const range = 245;
  const arc = Math.PI * 0.55;
  const damage = 35 * ENEMY_DAMAGE_MULT * timeGrowth();
  damagePlayerAndFollowersCone(m.x, m.y, angle, range, arc, damage, "#ff8a42");
  const cx = m.x + Math.cos(angle) * range * 0.45;
  const cy = m.y + Math.sin(angle) * range * 0.45;
  state.zones.push({ x: cx, y: cy, r: range * 0.42, life: 0.35, maxLife: 0.35, damage: 0, element: "fire", type: "coneVisual", color: "rgba(255,90,28,.30)", angle, arc, grow: 1.6 });
  for (let i = 0; i < 6; i++) {
    const a = angle + rand(-arc * 0.45, arc * 0.45);
    addLine(m.x, m.y, m.x + Math.cos(a) * rand(range * 0.55, range), m.y + Math.sin(a) * rand(range * 0.55, range), i % 2 ? "rgba(255,210,78,.75)" : "rgba(255,82,28,.78)", rand(5, 10), 0.24, true);
  }
}

function startChimeraCharge(m, target) {
  const angle = Math.atan2(target.y - m.y, target.x - m.x);
  m.charge = { phase: "windup", t: 0.62, angle, hitFollowers: new Set(), hitPlayer: false, fx: 0, chimera: true };
  m.specialCd = rand(4.8, 6.2);
  addText("奇美拉冲锋", m.x - 46, m.y - m.r - 32, "#ffb36b");
}

function updateChimeraCharge(m, target, dt) {
  if (!m.charge?.chimera) return false;
  const c = m.charge;
  c.t -= dt;
  c.fx -= dt;
  if (c.phase === "windup") {
    const a = Math.atan2(target.y - m.y, target.x - m.x);
    c.angle = c.angle * 0.88 + a * 0.12;
    if (c.fx <= 0) {
      c.fx = 0.08;
      addLine(m.x, m.y, m.x + Math.cos(c.angle) * 285, m.y + Math.sin(c.angle) * 285, "rgba(255,112,54,.72)", 8, 0.16, false);
    }
    if (c.t <= 0) {
      c.phase = "lunge";
      c.t = 0.38;
      addLine(m.x, m.y, m.x + Math.cos(c.angle) * 320, m.y + Math.sin(c.angle) * 320, "rgba(255,202,96,.82)", 11, 0.24, false);
    }
    return true;
  }
  const oldX = m.x;
  const oldY = m.y;
  const speed = 720;
  m.x += Math.cos(c.angle) * speed * dt;
  m.y += Math.sin(c.angle) * speed * dt;
  m.hit = Math.max(m.hit, 0.1);
  if (c.fx <= 0) {
    c.fx = 0.045;
    addLine(oldX, oldY, m.x, m.y, "rgba(255,130,56,.62)", 13, 0.16, false);
  }
  const p = state.player;
  const damage = 38 * ENEMY_DAMAGE_MULT * timeGrowth();
  if (!c.hitPlayer && Math.hypot(p.x - m.x, p.y - m.y) < p.r + m.r + 10 && p.hitGrace <= 0) {
    const taken = Math.max(1, damage - effectiveDefense() * 0.35) * (1 - effectiveGroupReduce());
    p.hp -= taken;
    p.hitGrace = 0.58;
    c.hitPlayer = true;
    addText(`-${Math.ceil(taken)}`, p.x - 10, p.y - 28, "#ff7a66");
  }
  for (const f of state.followers) {
    if (f.hp <= 0 || c.hitFollowers.has(f)) continue;
    if (Math.hypot(f.x - m.x, f.y - m.y) < m.r + 20) {
      damageFollower(f, damage * 0.78);
      c.hitFollowers.add(f);
    }
  }
  if (c.t <= 0) m.charge = null;
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
  if (m.tag === "ghost" && element === "physical" && Math.random() < 0.5) {
    addText("MISS", m.x - 16, m.y - 18, "#cfe8ff");
    m.hit = 0.04;
    return;
  }
  const p = state.player;
  const crit = Math.random() < p.crit;
  const vulnerable = m.burnVulnerable?.time > 0 ? 1 + (m.burnVulnerable.amp || 0) : 1;
  const dmg = amount * vulnerable * (crit ? p.critMul : 1);
  m.hp -= dmg;
  if (state.classId === "vampirePrincess" && dmg > 0) {
    p.hp = Math.min(p.maxHp, p.hp + dmg * classLevel() * 0.01);
  }
  m.hit = 0.08;
  if (crit) addText("暴击", m.x - 12, m.y - 18, "#ffd36b");
}

function applyBlind(target, duration = 3.2) {
  target.blind = Math.max(target.blind || 0, duration);
}

function applyBurnVulnerability(target, duration = 4, amp = 0.12) {
  target.burnVulnerable = {
    time: Math.max(target.burnVulnerable?.time || 0, duration),
    amp: Math.max(target.burnVulnerable?.amp || 0, amp)
  };
}

function applyBurn(target, damage, duration = 4) {
  target.burn = {
    time: Math.max(target.burn?.time || 0, duration),
    tick: Math.min(target.burn?.tick ?? 0.65, 0.65),
    damage: Math.max(target.burn?.damage || 0, damage)
  };
}

function monsterAttackMisses(m) {
  if ((m.blind || 0) <= 0 || Math.random() >= 0.5) return false;
  addText("MISS", m.x - 16, m.y - 24, "#f2d38a");
  return true;
}

function addChainLightningSprite(x1, y1, x2, y2) {
  state.effects.push({ type: "chainSprite", x1, y1, x2, y2, life: 0.22, maxLife: 0.22 });
}

function isZombieMonster(m) {
  return monsterAssetByName[m.name] === "Zombie.png" || m.name === "Zombie";
}

function damageCircle(x, y, r, damage, element, slow) {
  for (const m of state.monsters) {
    if (Math.hypot(m.x - x, m.y - y) < r + m.r) {
      hitMonster(m, damage, element);
      if (slow) {
        m.slow = 1;
        if (element === "ice") m.frozen = Math.max(m.frozen || 0, 1.15);
      }
    }
  }
}

function updateAbsoluteZero(dt) {
  const s = state.skills.absoluteZero;
  if (!s) return;
  const p = state.player;
  const b = skillBook.absoluteZero;
  const lvl = clamp(s.level || 1, 1, 7);
  const area = b.area * FUSION_AREA_MULT * skillAreaMultiplier(lvl) * p.area;
  const damage = b.damage * SKILL_POWER_MULT * FUSION_DAMAGE_MULT * skillDamageMultiplier(lvl) * p.damage * (1 + (p.classDamageAura || 0)) * elementMult("ice") * dt;
  for (const m of state.monsters) {
    if (Math.hypot(m.x - p.x, m.y - p.y) >= area + m.r) continue;
    hitMonster(m, damage, "ice");
    m.slow = Math.max(m.slow || 0, 1);
    if (!m.absoluteZeroTouched) {
      m.absoluteZeroTouched = true;
      m.frozen = Math.max(m.frozen || 0, 2.2);
      addText("FROZEN", m.x - 25, m.y - 28, "#8fdcff");
    }
  }
  let aura = state.zones.find(z => z.type === "absoluteZeroFx");
  if (!aura) {
    aura = {
      x: p.x, y: p.y, r: area, life: 0.34, maxLife: 0.34, damage: 0,
      element: "ice", type: "absoluteZeroFx", followPlayer: true,
      spin: 1.8, grow: 0, color: "rgba(155,225,255,.22)"
    };
    state.zones.push(aura);
  } else {
    aura.r = area;
    aura.life = aura.maxLife = 0.34;
  }
}

function maybeTriggerDeathExplosion(m) {
  const chance = state.player.deathExplosionChance || 0;
  if (chance <= 0 || Math.random() >= chance) return;
  const radius = 105 + (m.r || 16) * 0.8;
  const damage = 78 * state.player.damage * elementMult("poison");
  damageCircle(m.x, m.y, radius, damage, "poison", true);
  state.zones.push({
    x: m.x, y: m.y, r: radius * 0.5, maxR: radius, life: 0.55, maxLife: 0.55,
    damage: 0, element: "poison", type: "virulentPlagueFx",
    color: "rgba(166,255,70,.24)", grow: 1.8, spin: 2.2
  });
  addRing(m.x, m.y, radius, "rgba(166,255,70,.65)", 0.55);
  addParticles(m.x, m.y, "rgba(176,255,78,.5)", 18, radius * 0.45, 0.75);
}

function spiritOrbitConfig() {
  const s = state.skills.spiritTaming;
  if (!s) return null;
  const b = skillBook.spiritTaming;
  const lvl = clamp(s.level, 1, 7);
  const count = lvl * 2 + (state.player.spiritBonus || 0);
  const area = b.area * skillAreaMultiplier(lvl) * state.player.area;
  const damage = b.damage * SKILL_POWER_MULT * 2 * skillDamageMultiplier(lvl) * state.player.damage * (1 + (state.player.classDamageAura || 0)) * elementMult(b.element);
  return {
    level: lvl,
    count,
    damage,
    inner: area * 0.78,
    outer: area * 1.34,
    hitRadius: 17 + lvl * 1.4
  };
}

function spiritOrbitPoints(cfg) {
  const p = state.player;
  const points = [];
  const innerCount = Math.ceil(cfg.count / 2);
  const outerCount = cfg.count - innerCount;
  const t = state.time;
  for (let i = 0; i < innerCount; i++) {
    const a = t * 2.25 + i * Math.PI * 2 / innerCount;
    points.push({ x: p.x + Math.cos(a) * cfg.inner, y: p.y + Math.sin(a) * cfg.inner, a, layer: 0, index: i });
  }
  for (let i = 0; i < outerCount; i++) {
    const a = -t * 1.65 + i * Math.PI * 2 / Math.max(1, outerCount) + Math.PI / 5;
    points.push({ x: p.x + Math.cos(a) * cfg.outer, y: p.y + Math.sin(a) * cfg.outer, a, layer: 1, index: innerCount + i });
  }
  return points;
}

function updateSpiritOrbit(dt) {
  const cfg = spiritOrbitConfig();
  if (!cfg) return;
  const points = spiritOrbitPoints(cfg);
  const damage = cfg.damage * dt;
  for (const m of state.monsters) {
    for (const g of points) {
      if (Math.hypot(m.x - g.x, m.y - g.y) < m.r + cfg.hitRadius) {
        hitMonster(m, damage, "arcane");
        m.slow = Math.max(m.slow || 0, 0.25);
      }
    }
  }
}

function update(dt) {
  if (!state.running || state.paused) return;
  const p = state.player;
  state.time += dt;
  state.spawn -= dt;
  state.saveClock = (state.saveClock || 0) + dt;
  if (state.saveClock >= 4) {
    state.saveClock = 0;
    saveGame();
  }
  state.healTimer = (state.healTimer ?? rand(12, 22)) - dt;
  const prevTerrain = state.terrain;
  state.terrain = terrainAt(p.x, p.y);
  if (prevTerrain.id !== state.terrain.id) addText(`进入：${state.terrain.name}`, p.x - 40, p.y - 38, "#e7f7cf");
  p.ward = Math.max(0, p.ward - dt);
  p.hitGrace = Math.max(0, p.hitGrace - dt);
  p.castAnim = Math.max(0, (p.castAnim || 0) - dt);
  updatePoisonStatus(p, dt);
  updateDiseaseStatus(p, dt);
  p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  if (p.healAura > 0) {
    const healRange = p.healAuraRange || 190;
    p.hp = Math.min(p.maxHp, p.hp + p.healAura * dt);
    for (const f of state.followers) {
      if (f.hp > 0 && Math.hypot(f.x - p.x, f.y - p.y) <= healRange) {
        f.hp = Math.min(f.maxHp, f.hp + p.healAura * dt);
      }
    }
    p.healAuraFx = (p.healAuraFx || 0) - dt;
    if (p.healAuraFx <= 0) {
      p.healAuraFx = 1;
      addRing(p.x, p.y, healRange, "rgba(118,255,158,.45)", 0.8);
    }
  }
  if (state.healTimer <= 0) {
    spawnHeal();
    state.healTimer = rand(14, 26);
  }
  updateWorldBossSites();
  updateBlackMarket();
  updateClassInnates(dt);

  let mx = 0, my = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
  mx += touchMove.x;
  my += touchMove.y;
  const len = Math.hypot(mx, my) || 1;
  p.x += (mx / len) * p.speed * diseaseMoveMult(p) * dt;
  p.y += (my / len) * p.speed * diseaseMoveMult(p) * dt;

  if (state.spawn <= 0) {
    const count = state.time > 90 ? 3 : state.time > 35 ? 2 : 1;
    for (let i = 0; i < count; i++) spawnMonster("normal");
    if (state.time >= 300 && Math.random() < 0.08 + state.time / 3000) spawnMonster("elite");
    if (Math.floor((state.time - dt) / 300) < Math.floor(state.time / 300)) {
      const bossCount = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < bossCount; i++) spawnMonster("boss");
    }
    state.spawn = Math.max(0.18, 0.9 - state.time / 500);
  }
  for (const [id, s] of Object.entries(state.skills)) {
    const b = skillBook[s.id];
    if (!b) {
      delete state.skills[id];
      continue;
    }
    if (b.cd <= 0) continue;
    s.t -= dt;
    if (s.t <= 0) {
      castSkill(s);
      s.t = b.cd * p.cooldown * skillCooldownMultiplier(s.level);
    }
  }
  updateAbsoluteZero(dt);
  updateSpiritOrbit(dt);

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
    clearSave();
    startPanel.classList.remove("hidden");
    startPanel.querySelector("h1").textContent = "生存结束";
    startPanel.querySelector("p").textContent = `坚持 ${Math.floor(state.time)} 秒 · 等级 ${p.level}`;
    renderStartMenu();
  }
}

function typhonEarthquake(m) {
  const radius = 250;
  const damage = 58 * ENEMY_DAMAGE_MULT * timeGrowth() * (m.attackMul || 1);
  damagePlayerAndFollowersCircle(m.x, m.y, radius, damage, "#ff9b46");
  state.zones.push({ x: m.x, y: m.y, r: radius, life: 0.7, maxLife: 0.7, damage: 0, element: "earth", type: "quakeFx", color: "rgba(255,136,54,.28)", grow: 2.4 });
  addRing(m.x, m.y, radius * 0.55, "rgba(255,165,72,.86)", 0.42);
  addRing(m.x, m.y, radius, "rgba(255,95,42,.82)", 0.7);
  for (let i = 0; i < 18; i++) {
    const a = rand(0, Math.PI * 2);
    const inner = rand(18, 58);
    const outer = rand(radius * 0.55, radius);
    addLine(m.x + Math.cos(a) * inner, m.y + Math.sin(a) * inner, m.x + Math.cos(a + rand(-0.2, 0.2)) * outer, m.y + Math.sin(a + rand(-0.2, 0.2)) * outer, i % 2 ? "rgba(82,52,34,.8)" : "rgba(255,126,42,.62)", rand(5, 10), 0.55, true);
  }
}

function typhonFireBreath(m, target) {
  const angle = Math.atan2(target.y - m.y, target.x - m.x);
  const range = 330;
  const arc = Math.PI * 0.68;
  const damage = 50 * ENEMY_DAMAGE_MULT * timeGrowth() * (m.attackMul || 1);
  damagePlayerAndFollowersCone(m.x, m.y, angle, range, arc, damage, "#ff8a42");
  const cx = m.x + Math.cos(angle) * range * 0.46;
  const cy = m.y + Math.sin(angle) * range * 0.46;
  state.zones.push({ x: cx, y: cy, r: range * 0.48, life: 0.45, maxLife: 0.45, damage: 0, element: "fire", type: "coneVisual", color: "rgba(255,76,24,.34)", angle, arc, grow: 1.8 });
  for (let i = 0; i < 10; i++) {
    const a = angle + rand(-arc * 0.45, arc * 0.45);
    addLine(m.x, m.y, m.x + Math.cos(a) * rand(range * 0.55, range), m.y + Math.sin(a) * rand(range * 0.55, range), i % 2 ? "rgba(255,214,80,.82)" : "rgba(255,60,24,.82)", rand(6, 13), 0.28, true);
  }
}

function typhonMeteorFall(m, target) {
  const count = 3 + Math.floor(rand(0, 2));
  for (let i = 0; i < count; i++) {
    const x = target.x + rand(-150, 150);
    const y = target.y + rand(-120, 140);
    const radius = 118;
    const damage = 46 * ENEMY_DAMAGE_MULT * timeGrowth() * (m.attackMul || 1);
    damagePlayerAndFollowersCircle(x, y, radius, damage, "#ff8a42");
    addLine(x - 260, y - 310, x, y, "rgba(255,118,34,.85)", 18, 0.36, false);
    state.zones.push({ x, y, r: radius, life: 0.62, maxLife: 0.62, damage: 0, element: "fire", type: "meteorExplosionFx", color: "rgba(255,92,26,.34)", grow: 1.4 });
    addRing(x, y, radius, "rgba(255,168,68,.82)", 0.5);
  }
}

function typhonCleave(m, target) {
  const angle = Math.atan2(target.y - m.y, target.x - m.x);
  const range = 235;
  const arc = Math.PI * 0.92;
  const damage = 54 * ENEMY_DAMAGE_MULT * timeGrowth() * (m.attackMul || 1);
  damagePlayerAndFollowersCone(m.x, m.y, angle, range, arc, damage, "#ffd36a");
  const cx = m.x + Math.cos(angle) * range * 0.42;
  const cy = m.y + Math.sin(angle) * range * 0.42;
  state.zones.push({ x: cx, y: cy, r: range * 0.44, life: 0.32, maxLife: 0.32, damage: 0, element: "physical", type: "slashFx", color: "rgba(255,208,84,.34)", angle, arc, grow: 1.2 });
  for (let i = 0; i < 5; i++) {
    const a = angle + rand(-arc * 0.42, arc * 0.42);
    addLine(m.x + Math.cos(a) * 28, m.y + Math.sin(a) * 28, m.x + Math.cos(a) * range, m.y + Math.sin(a) * range, "rgba(255,208,84,.82)", rand(5, 10), 0.22, false);
  }
}

function updateClassInnates(dt) {
  const p = state.player;
  const n = classLevel();
  p.classDamageAura = 0;
  p.classGroupReduce = 0;
  p.classFollowerAttackAura = 0;
  if (state.classId === "roundTableKnight") {
    p.classDamageAura = n * 0.01;
    p.classFollowerAttackAura = n * 0.01;
    p.classGroupReduce = Math.min(0.6, n * 0.01);
  }
  if (state.classId === "elf") {
    const heal = n / 3 * dt;
    if (Math.hypot(p.x - p.x, p.y - p.y) < 1) p.hp = Math.min(p.maxHp, p.hp + heal);
    for (const f of state.followers) {
      if (f.hp > 0 && Math.hypot(f.x - p.x, f.y - p.y) < 210) f.hp = Math.min(f.maxHp, f.hp + heal);
    }
  }
  if (state.classId === "hellLord") {
    const radius = 150 + n * 5;
    const damage = 2 * n * dt;
    for (const m of state.monsters) {
      if (Math.hypot(m.x - p.x, m.y - p.y) < radius + m.r) {
        hitMonster(m, damage, "fire");
        applyBurnVulnerability(m, 4.0, 0.08 + n * 0.002);
      }
    }
    state.classAuraPulse = (state.classAuraPulse || 0) - dt;
    if (state.classAuraPulse <= 0) {
      state.classAuraPulse = 0.6;
      addRing(p.x, p.y, radius, "rgba(255,72,32,.36)", 0.42);
    }
  }
}

function updatePoisonStatus(target, dt) {
  if (!target.poison || target.poison.time <= 0) return;
  target.poison.time -= dt;
  target.poison.tick = (target.poison.tick || 0) - dt;
  if (target.poison.tick <= 0) {
    target.poison.tick = 1;
    target.hp -= target.poison.damage;
    addText(`毒-${Math.ceil(target.poison.damage)}`, target.x - 18, target.y - 30, "#85ff65");
  }
}

function applyPoison(target, damage, duration = 6) {
  target.poison = { time: duration, tick: 1, damage: Math.max(target.poison?.damage || 0, damage) };
  addText("中毒", target.x - 16, target.y - 38, "#85ff65");
}

function updateBurnStatus(target, dt) {
  if (!target.burn || target.burn.time <= 0) return;
  target.burn.time -= dt;
  target.burn.tick = (target.burn.tick || 0) - dt;
  if (target.burn.tick <= 0) {
    target.burn.tick = 0.75;
    target.hp -= target.burn.damage || 0;
    addText(`Burn-${Math.ceil(target.burn.damage || 0)}`, target.x - 22, target.y - 32, "#ff9b42");
  }
}

function updateDiseaseStatus(target, dt) {
  if (!target.disease || target.disease.time <= 0) return;
  target.disease.time -= dt;
  target.disease.tick = (target.disease.tick || 0) - dt;
  if (target.disease.tick <= 0) {
    target.disease.tick = 1.2;
    target.hp -= target.disease.damage || 0;
    addText("Disease", target.x - 24, target.y - 36, "#b677ff");
  }
}

function applyDisease(target, damage = 2, duration = 7) {
  target.disease = { time: Math.max(target.disease?.time || 0, duration), tick: 0.8, damage: Math.max(target.disease?.damage || 0, damage) };
}

function diseaseMoveMult(target) {
  return target?.disease?.time > 0 ? 0.65 : 1;
}

function diseaseAttackMult(target) {
  return target?.disease?.time > 0 ? 0.7 : 1;
}

function updateWorldBossSites() {
  const p = state.player;
  for (const site of Object.values(state.worldBosses || {})) {
    if (site.spawned || site.defeated) continue;
    const d = Math.hypot(p.x - site.x, p.y - site.y);
    if (d < site.r) {
      site.spawned = true;
      spawnBossAt(site.boss, site.x, site.y, true);
      addText(`${site.name} 被唤醒`, site.x - 62, site.y - 90, "#ffcf66");
    }
  }
}

function updateBlackMarket() {
  const market = state.blackMarket;
  if (!market) return;
  const p = state.player;
  const d = Math.hypot(p.x - market.x, p.y - market.y);
  if (d < market.r && !market.wasNear) {
    market.wasNear = true;
    openBlackMarket();
  } else if (d > market.r + 90) {
    market.wasNear = false;
  }
}

function canOpenBlackMarket() {
  const market = state?.blackMarket;
  if (!state?.running || state.paused || !market) return false;
  return Math.hypot(state.player.x - market.x, state.player.y - market.y) < market.r + 24;
}

function openBlackMarket() {
  if (!state?.running || !state.blackMarket) return;
  state.paused = true;
  const offers = [];
  const followerPool = [...followerChoices].sort(() => Math.random() - 0.5).slice(0, 3);
  followerPool.forEach((f, index) => {
    const cost = (70 + f.tier * 25 + index * 12) * 10;
    const next = followerEvolvesTo[f.id] ? followerById[followerEvolvesTo[f.id]].name : "higher tier";
    offers.push({
      title: `${f.name} - ${cost} Gold`,
      desc: `Follower piece. Three ${f.name} merge into ${next}.`,
      run: () => buyFollowerOffer(f, cost)
    });
  });
  const marketGear = new Set();
  for (let i = 0; i < 3; i++) {
    const gear = pickGearByRarity(marketGear);
    if (!gear) break;
    marketGear.add(gear.name);
    const cost = (90 + i * 22) * 10;
    offers.push({
      title: `${gearTitle(gear)} - ${cost} Gold`,
      desc: gear.desc,
      run: () => buyGearOffer(gear, cost)
    });
  }
  if (!marketGear.size) {
    offers.push({
      title: "Gear Sold Out",
      desc: "You already own every non-duplicate gear item.",
      run: () => false
    });
  }
  offers.push({
    title: "Leave Black Market",
    desc: "Close the merchant panel.",
    run: () => true
  });

  choicesEl.innerHTML = "";
  offers.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.innerHTML = `<b>${c.title}</b><span>${c.desc}</span>`;
    btn.addEventListener("click", () => {
      const close = c.run();
      if (close === false) {
        syncHud();
        return;
      }
      state.paused = false;
      levelPanel.classList.add("hidden");
      syncHud();
    });
    choicesEl.appendChild(btn);
  });
  levelPanel.classList.remove("hidden");
}

function buyFollowerOffer(follower, cost) {
  if ((state.gold || 0) < cost) {
    addText("Need more Gold", state.player.x - 42, state.player.y - 46, "#ffd36b");
    return false;
  }
  if (state.followers.length >= followerLimit()) {
    addText("Follower limit", state.player.x - 42, state.player.y - 46, "#ffd36b");
    return false;
  }
  state.gold -= cost;
  addFollower(follower);
  addText(`Bought ${follower.name}`, state.player.x - 56, state.player.y - 48, "#ffd36b");
  return false;
}

function buyGearOffer(gear, cost) {
  if ((state.gold || 0) < cost) {
    addText("Need more Gold", state.player.x - 42, state.player.y - 46, "#ffd36b");
    return false;
  }
  if (!applyUniqueGear(gear, "Black Market")) {
    addText("Already owned", state.player.x - 42, state.player.y - 46, "#ffd36b");
    return false;
  }
  state.gold -= cost;
  addText(`Bought ${gearTitle(gear)}`, state.player.x - 56, state.player.y - 48, gearRarityInfo[gear.rarity]?.color || "#ffd36b");
  addRing(state.player.x, state.player.y, 52, "rgba(255,211,107,.85)", 0.45);
  return false;
}

function updateFollowers(dt) {
  const p = state.player;
  p.followerDefense = state.followers.reduce((sum, f) => sum + (f.id === "golem" ? 3 : f.id === "giant" ? 6 : 0), 0);
  p.followerAttackAura = Math.min(0.95, state.followers.filter(f => f.id === "knight" && f.hp > 0).length * 0.18 + (p.followerAttackAuraGear || 0));
  state.mergeCheck = Math.max(0, (state.mergeCheck || 0) - dt);
  if (state.mergeCheck <= 0) {
    state.mergeCheck = 0.35;
    for (const id of Object.keys(followerEvolvesTo)) resolveFollowerMerge(id);
  }
  for (let i = state.followers.length - 1; i >= 0; i--) {
    const f = state.followers[i];
    const grownMax = Math.floor((f.baseMaxHp || f.maxHp || followerMaxHp(f)) * timeGrowth());
    if (grownMax > f.maxHp) {
      f.hp += grownMax - f.maxHp;
      f.maxHp = grownMax;
    }
    if (f.hp <= 0 && isSkeletonFollower(f) && !f.rebirthUsed) {
      f.rebirthUsed = true;
      f.hp = Math.max(1, f.maxHp * (0.45 + f.tier * 0.08));
      f.hitGrace = 1.2;
      addText("重生", f.x - 18, f.y - 32, "#cfe8ff");
      addRing(f.x, f.y, 54 + f.tier * 18, "rgba(196,226,255,.9)", 0.6);
    }
    if (f.hp <= 0) {
      addText(`${f.name} 倒下`, f.x - 24, f.y - 28, "#d7b08a");
      state.followers.splice(i, 1);
      continue;
    }
    if (f.tempLife != null) {
      f.tempLife -= dt;
      if (f.tempLife <= 0) {
        addText(`${f.name} fades`, f.x - 28, f.y - 28, f.element === "fire" ? "#ff9b58" : "#b8e88d");
        state.followers.splice(i, 1);
        continue;
      }
    }
    f.hitGrace = Math.max(0, (f.hitGrace || 0) - dt);
    updatePoisonStatus(f, dt);
    updateDiseaseStatus(f, dt);
    updateFollowerSpiritOrbit(f, dt);
    updateFairyFollowerSkills(f, dt);
    updateGhostFollowerSkills(f, dt);
    updateDemonFollowerSkills(f, dt);
    const target = f.id === "ninjaGirl" ? (nearestPriorityEnemy(f, f.range + 260, m => m.tag === "ranged") || nearestEnemy(f, f.range + 210)) : nearestEnemy(f, f.range + 170);
    const home = { x: p.x + ((i % 3) - 1) * 34, y: p.y + 42 + Math.floor(i / 3) * 18 };
    const moveTarget = target || home;
    const desired = target ? (isFairyFollower(f) || f.id === "demonFollower" || f.id === "hellKing" ? Math.max(165, target.r + 130) : f.id === "banshee" ? Math.max(150, target.r + 120) : f.id === "golem" || f.id === "giant" ? Math.max(125, target.r + 92) : isRogueFollower(f) ? Math.max(42, target.r + 24) : Math.max(58, target.r + 34)) : 0;
    const dx = moveTarget.x - f.x;
    const dy = moveTarget.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    const speedBoost = isRogueFollower(f) ? (f.id === "ninjaGirl" ? 1.65 : f.id === "assassinGirl" ? 1.45 : 1.35) : isGhostFollower(f) ? 1.28 : isFairyFollower(f) ? 1.2 : f.id === "littleDemon" ? 1.32 : isDemonFollower(f) ? 1.12 : 1;
    const speed = (target ? 185 : 230) * speedBoost * (1 + (p.followerMoveAura || 0)) * diseaseMoveMult(f);
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
      const attackTarget = f.id === "ninjaGirl" ? (nearestPriorityEnemy(f, f.range + 70, m => m.tag === "ranged") || nearestEnemy(f, f.range)) : nearestEnemy(f, f.range);
      if (attackTarget) followerAttack(f, attackTarget);
      f.t = f.id === "hellKing" ? 1.28 : f.id === "demonFollower" ? 0.92 : f.id === "littleDemon" ? 0.78 : f.id === "ninjaGirl" ? 0.72 : f.id === "assassinGirl" ? 0.78 : f.id === "rogueGirl" ? 0.82 : f.id === "banshee" ? 1.0 : f.id === "wraith" ? 0.84 : f.id === "ghostFollower" ? 0.9 : f.id === "fairyPrincess" ? 0.95 : f.id === "flowerFairy" ? 1.05 : f.id === "pixie" ? 0.9 : f.id === "knight" ? 0.9 : f.id === "swordsman" ? 0.88 : f.id === "militia" ? 0.98 : f.id === "reaper" ? 0.86 : f.id === "skeletonWarrior" ? 0.92 : f.id === "skeleton" ? 0.98 : f.id === "treantGuardian" ? 1.12 : f.id === "golem" ? 1.15 : f.id === "giant" ? 1.25 : f.id === "lotus" ? 1.65 : f.id === "balrog" ? 1.05 : 0.95;
    }
  }
}

function isSkeletonFollower(f) {
  return f.id === "skeleton" || f.id === "skeletonWarrior" || f.id === "reaper";
}

function isHumanFollower(f) {
  return f.id === "militia" || f.id === "swordsman" || f.id === "knight";
}

function isRogueFollower(f) {
  return f.id === "rogueGirl" || f.id === "assassinGirl" || f.id === "ninjaGirl";
}

function isFairyFollower(f) {
  return f.id === "pixie" || f.id === "flowerFairy" || f.id === "fairyPrincess";
}

function isGhostFollower(f) {
  return f.id === "ghostFollower" || f.id === "wraith" || f.id === "banshee";
}

function isDemonFollower(f) {
  return f.id === "littleDemon" || f.id === "demonFollower" || f.id === "hellKing";
}

function nearestPriorityEnemy(from, range = 9999, predicate = null) {
  let best = null;
  let bd = range;
  for (const m of state.monsters) {
    if (predicate && !predicate(m)) continue;
    const d = dist(from, m);
    if (d < bd) {
      best = m;
      bd = d;
    }
  }
  return best;
}

function followerAttack(f, target) {
  const p = state.player;
  const damage = f.damage * timeGrowth() * p.damage * diseaseAttackMult(f) * (1 + (f.tier - 1) * 0.18) * (1 + (p.followerAttackAura || 0) + (p.classFollowerAttackAura || 0));
  if (isGhostFollower(f)) {
    ghostStrike(f, target, damage);
    return;
  }
  if (isRogueFollower(f)) {
    rogueStrike(f, target, damage);
    return;
  }
  if (isHumanFollower(f)) {
    f.cast = 0.28 + f.tier * 0.08;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    if (f.id === "militia") militiaStrike(f, target, damage);
    else humanCleave(f, target, damage);
    return;
  }
  if (isSkeletonFollower(f)) {
    f.cast = 0.36 + f.tier * 0.08;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    skeletonSweep(f, target, damage);
    return;
  }
  if (isFairyFollower(f)) {
    f.cast = 0.28 + f.tier * 0.07;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    fireFairyBolt(f, target, damage);
    return;
  }
  if (isDemonFollower(f)) {
    f.cast = 0.32 + f.tier * 0.08;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    if (f.id === "littleDemon") demonClaw(f, target, damage);
    else fireFollowerFireball(f, target, damage * (f.id === "hellKing" ? 1.35 : 1.12));
    return;
  }
  if (f.id === "treantGuardian") {
    f.cast = 0.36;
    f.face = Math.atan2(target.y - f.y, target.x - f.x);
    punchTarget(f, target, damage * 1.18);
    return;
  }
  if (f.id === "furnace") {
    f.cast = 0.32;
    fireFollowerFireball(f, target, damage * 1.08);
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

function skeletonSweep(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const radius = 46 + f.tier * 18;
  const arc = f.tier === 3 ? Math.PI * 0.92 : Math.PI * 0.72;
  for (const m of state.monsters) {
    const d = Math.hypot(m.x - f.x, m.y - f.y);
    if (d > radius + m.r) continue;
    const ma = Math.atan2(m.y - f.y, m.x - f.x);
    const diff = Math.abs(Math.atan2(Math.sin(ma - a), Math.cos(ma - a)));
    if (diff < arc * 0.5 || d < 30 + f.tier * 6) hitMonster(m, damage * (f.tier === 3 ? 1.12 : 1), f.element);
  }
  state.zones.push({
    x: f.x + Math.cos(a) * radius * 0.38,
    y: f.y + Math.sin(a) * radius * 0.38,
    r: radius,
    angle: a,
    life: 0.24,
    maxLife: 0.24,
    damage: 0,
    element: "physical",
    type: "slashFx",
    color: f.tier === 3 ? "rgba(150,205,255,.78)" : "rgba(214,224,230,.68)"
  });
  addRing(f.x, f.y, radius, f.tier === 3 ? "rgba(150,205,255,.34)" : "rgba(214,224,230,.28)", 0.16);
  addLine(f.x, f.y, f.x + Math.cos(a - arc * 0.42) * radius, f.y + Math.sin(a - arc * 0.42) * radius, "rgba(210,228,255,.48)", 6, 0.16, true);
  addLine(f.x, f.y, f.x + Math.cos(a + arc * 0.42) * radius, f.y + Math.sin(a + arc * 0.42) * radius, "rgba(210,228,255,.48)", 6, 0.16, true);
  if (f.id === "reaper") addParticles(target.x, target.y, "rgba(164,218,255,.52)", 8, 44, 0.45);
}

function militiaStrike(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  hitMonster(target, damage * 1.05, "physical");
  target.x += Math.cos(a) * 10;
  target.y += Math.sin(a) * 10;
  addLine(f.x, f.y, target.x, target.y, "rgba(205,215,225,.65)", 5, 0.13, false);
  addRing(target.x, target.y, 24, "rgba(205,215,225,.55)", 0.18);
}

function rogueStrike(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  f.cast = 0.24 + f.tier * 0.06;
  f.face = a;
  if (f.id === "ninjaGirl") {
    const back = Math.atan2(f.y - target.y, f.x - target.x);
    f.x = target.x + Math.cos(back) * (target.r + 26);
    f.y = target.y + Math.sin(back) * (target.r + 26);
    f.hitGrace = 0.45;
    addRing(f.x, f.y, 42, "rgba(160,115,255,.58)", 0.22);
    addLine(f.x, f.y, target.x, target.y, "rgba(190,130,255,.72)", 7, 0.16, false);
  } else {
    addLine(f.x, f.y, target.x, target.y, "rgba(235,235,255,.65)", 5, 0.12, false);
  }
  const hitDamage = damage * (f.id === "ninjaGirl" ? 1.45 : f.id === "assassinGirl" ? 1.18 : 1.0);
  hitMonster(target, hitDamage, f.element);
  const steal = f.id === "ninjaGirl" ? 9 + Math.floor(state.time / 120) : f.id === "assassinGirl" ? 6 + Math.floor(state.time / 180) : 4 + Math.floor(state.time / 240);
  addGold(steal, target.x, target.y);
  if (f.id === "assassinGirl" || f.id === "ninjaGirl") applyPoison(target, (f.id === "ninjaGirl" ? 6 : 4) * timeGrowth(), 6);
  target.x += Math.cos(a) * 6;
  target.y += Math.sin(a) * 6;
}

function applyDisarm(target, seconds) {
  target.disarm = Math.max(target.disarm || 0, seconds);
  addText("缴械", target.x - 18, target.y - target.r - 18, "#dbeafe");
}

function ghostStrike(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  f.cast = 0.32 + f.tier * 0.07;
  f.face = a;
  hitMonster(target, damage * (f.id === "banshee" ? 1.18 : f.id === "wraith" ? 1.08 : 1), "arcane");
  if (f.id === "wraith" || f.id === "banshee") applyDisarm(target, f.id === "banshee" ? 1.55 : 1.15);
  target.slow = Math.max(target.slow || 0, 0.25);
  addLine(f.x, f.y, target.x, target.y, "rgba(210,232,255,.52)", 6 + f.tier, 0.16, true);
  addRing(target.x, target.y, 28 + f.tier * 10, "rgba(190,218,255,.48)", 0.24);
  addParticles(target.x, target.y, "rgba(218,238,255,.58)", 7 + f.tier * 2, 36 + f.tier * 8, 0.34);
}

function humanCleave(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const radius = f.id === "knight" ? 86 : 64;
  const arc = f.id === "knight" ? Math.PI * 0.88 : Math.PI * 0.72;
  for (const m of state.monsters) {
    const d = Math.hypot(m.x - f.x, m.y - f.y);
    if (d > radius + m.r) continue;
    const ma = Math.atan2(m.y - f.y, m.x - f.x);
    const diff = Math.abs(Math.atan2(Math.sin(ma - a), Math.cos(ma - a)));
    if (diff < arc * 0.5 || d < 28) {
      hitMonster(m, damage * (f.id === "knight" ? 1.18 : 1), "physical");
      m.x += Math.cos(a) * (f.id === "knight" ? 14 : 8);
      m.y += Math.sin(a) * (f.id === "knight" ? 14 : 8);
    }
  }
  state.zones.push({
    x: f.x + Math.cos(a) * radius * 0.38,
    y: f.y + Math.sin(a) * radius * 0.38,
    r: radius,
    angle: a,
    life: 0.25,
    maxLife: 0.25,
    damage: 0,
    element: "physical",
    type: "slashFx",
    color: f.id === "knight" ? "rgba(255,228,134,.72)" : "rgba(210,222,235,.62)"
  });
  addRing(f.x, f.y, radius, f.id === "knight" ? "rgba(255,228,134,.28)" : "rgba(210,222,235,.24)", 0.16);
  addLine(f.x, f.y, f.x + Math.cos(a - arc * 0.42) * radius, f.y + Math.sin(a - arc * 0.42) * radius, "rgba(230,238,245,.52)", 7, 0.16, true);
  addLine(f.x, f.y, f.x + Math.cos(a + arc * 0.42) * radius, f.y + Math.sin(a + arc * 0.42) * radius, "rgba(230,238,245,.52)", 7, 0.16, true);
  if (f.id === "knight") addParticles(f.x, f.y, "rgba(255,220,110,.42)", 8, radius * 0.6, 0.35);
}

function followerSpiritConfig(f) {
  if (!isSkeletonFollower(f)) return null;
  return {
    count: f.tier * 2,
    radius: 34 + f.tier * 22,
    hitRadius: 11 + f.tier * 2,
    damage: (7 + f.tier * 4) * timeGrowth() * state.player.damage,
    speed: 1.7 + f.tier * 0.25
  };
}

function followerSpiritPoints(f, cfg) {
  const points = [];
  const t = state.time * cfg.speed + (f.x + f.y) * 0.003;
  for (let i = 0; i < cfg.count; i++) {
    const layer = i % 2;
    const r = cfg.radius * (layer ? 1.22 : 0.78);
    const a = (layer ? -t : t) + i * Math.PI * 2 / cfg.count;
    points.push({ x: f.x + Math.cos(a) * r, y: f.y + Math.sin(a) * r, a, index: i, layer });
  }
  return points;
}

function updateFollowerSpiritOrbit(f, dt) {
  const cfg = followerSpiritConfig(f);
  if (!cfg) return;
  const points = followerSpiritPoints(f, cfg);
  for (const m of state.monsters) {
    for (const g of points) {
      if (Math.hypot(m.x - g.x, m.y - g.y) < m.r + cfg.hitRadius) {
        hitMonster(m, cfg.damage * dt, "arcane");
        if (f.id === "reaper") m.slow = Math.max(m.slow || 0, 0.2);
      }
    }
  }
}

function updateFairyFollowerSkills(f, dt) {
  if (!isFairyFollower(f)) return;
  f.skillCd = Math.max(0, (f.skillCd || rand(1.5, 3.5)) - dt);
  if (f.skillCd > 0) return;
  const target = nearestEnemy(f, 520);
  if (!target) return;
  if (f.id === "flowerFairy" || f.id === "fairyPrincess") castFairyPoisonCloud(f, target);
  if (f.id === "fairyPrincess") summonTreantGuardian(f, target);
  f.skillCd = (f.id === "fairyPrincess" ? 6.4 : 5.2) * (state.player.followerCooldown || 1);
}

function updateGhostFollowerSkills(f, dt) {
  if (f.id !== "banshee") return;
  f.skillCd = Math.max(0, (f.skillCd || rand(2.0, 4.0)) - dt);
  if (f.skillCd > 0) return;
  const target = nearestEnemy(f, 520);
  if (!target) return;
  f.cast = 0.55;
  f.face = Math.atan2(target.y - f.y, target.x - f.x);
  castPainScream(f, target, 205 + f.tier * 25, f.damage * timeGrowth() * state.player.damage * 1.2, 3);
  f.skillCd = 6.2 * (state.player.followerCooldown || 1);
}

function updateDemonFollowerSkills(f, dt) {
  if (f.id !== "hellKing") return;
  f.skillCd = Math.max(0, (f.skillCd || rand(2.8, 5.2)) - dt);
  if (f.skillCd > 0) return;
  const target = nearestEnemy(f, 620) || nearestEnemy(state.player, 720);
  summonHellDemon(f, target || state.player);
  f.skillCd = 7.2 * (state.player.followerCooldown || 1);
}

function demonClaw(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  hitMonster(target, damage * 1.12, "fire");
  applyBurn(target, damage * 0.08, 3.2);
  target.x += Math.cos(a) * 12;
  target.y += Math.sin(a) * 12;
  addLine(f.x, f.y, target.x, target.y, "rgba(255,108,42,.72)", 6, 0.14, true);
  addParticles(target.x, target.y, "rgba(255,112,42,.72)", 5, 24, 0.3);
}

function summonHellDemon(f, target) {
  if (state.followers.filter(x => x.id === "littleDemon" && x.summoner === f).length >= 3) return;
  const src = followerById.littleDemon;
  const maxHp = Math.floor((70 + f.tier * 28) * timeGrowth());
  const a = Math.atan2((target?.y || state.player.y) - f.y, (target?.x || state.player.x) - f.x);
  const demon = {
    ...src,
    x: f.x + Math.cos(a) * 62 + rand(-20, 20),
    y: f.y + Math.sin(a) * 62 + rand(-20, 20),
    hp: maxHp,
    maxHp,
    baseMaxHp: maxHp,
    damage: src.damage + 8 + f.tier * 5,
    hitGrace: 0.8,
    t: rand(0.1, 0.5),
    autoChess: true,
    summoned: true,
    summoner: f,
    tempLife: 26
  };
  state.followers.push(demon);
  addRing(demon.x, demon.y, 58, "rgba(255,84,32,.86)", 0.58);
  addText("Summon Demon", demon.x - 46, demon.y - 42, "#ff9b58");
}

function fireFairyBolt(f, target, damage) {
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const muzzleX = f.x + Math.cos(a) * 20;
  const muzzleY = f.y + Math.sin(a) * 20;
  state.projectiles.push({
    kind: "fairyBolt",
    x: muzzleX,
    y: muzzleY,
    px: muzzleX,
    py: muzzleY,
    vx: Math.cos(a) * 430,
    vy: Math.sin(a) * 430,
    damage: damage * (f.id === "pixie" ? 0.95 : 1.05),
    r: 7 + f.tier,
    element: "poison",
    color: "rgba(150,255,110,.9)",
    life: 1.25,
    pierce: false,
    hit: new Set(),
    angle: a
  });
  addLine(f.x, f.y, target.x, target.y, "rgba(160,255,120,.36)", 3, 0.12, true);
}

function castFairyPoisonCloud(f, target) {
  const area = 100 + f.tier * 34;
  const damage = f.damage * timeGrowth() * (1 + f.tier * 0.22);
  state.zones.push({
    x: target.x,
    y: target.y,
    r: area * 0.55,
    maxR: area,
    life: 3.8 + f.tier * 0.45,
    maxLife: 3.8 + f.tier * 0.45,
    damage: damage * 0.18,
    element: "poison",
    type: "poisonCloudFx",
    color: "rgba(116,234,78,.2)",
    spin: 1.4,
    grow: 1.35,
    poisonDamage: damage * 0.18
  });
  addParticles(target.x, target.y, "rgba(142,255,103,.65)", 14 + f.tier * 3, area * 0.35, 1.7);
  addText("Poison Cloud", target.x - 42, target.y - 36, "#9bff75");
}

function summonTreantGuardian(f, target) {
  if (state.followers.filter(x => x.id === "treantGuardian" && x.summoner === f).length >= 2) return;
  const maxHp = Math.floor((120 + f.tier * 45) * timeGrowth());
  const a = Math.atan2(target.y - f.y, target.x - f.x);
  const guardian = {
    id: "treantGuardian",
    name: "Treant Guardian",
    tier: 2,
    element: "earth",
    damage: 24 + f.tier * 8,
    range: 118,
    x: f.x + Math.cos(a) * 58 + rand(-18, 18),
    y: f.y + Math.sin(a) * 58 + rand(-18, 18),
    hp: maxHp,
    maxHp,
    baseMaxHp: maxHp,
    hitGrace: 0.6,
    t: rand(0.1, 0.5),
    autoChess: true,
    summoned: true,
    summoner: f,
    tempLife: 24
  };
  state.followers.push(guardian);
  addRing(guardian.x, guardian.y, 64, "rgba(137,220,92,.85)", 0.65);
  addText("Treant", guardian.x - 24, guardian.y - 42, "#b8e88d");
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
  spawnMeteorProjectile(tx, ty, 92, damage, "lotusMeteor");
  addLine(f.x, f.y - 18, tx, ty, "rgba(255,198,74,.28)", 3, 0.22, true);
}

function spawnMeteorProjectile(tx, ty, area, damage, kind = "playerMeteor") {
  const startX = tx - rand(170, 230);
  const startY = ty - rand(220, 310);
  const travel = 0.72;
  state.projectiles.push({
    kind,
    x: startX,
    y: startY,
    px: startX,
    py: startY,
    tx,
    ty,
    vx: (tx - startX) / travel,
    vy: (ty - startY) / travel,
    damage,
    area,
    r: kind === "playerMeteor" ? 22 : 17,
    element: "fire",
    color: "#ff6428",
    life: travel + 0.18,
    maxLife: travel + 0.18,
    pierce: false,
    hit: new Set(),
    angle: Math.atan2(ty - startY, tx - startX),
    spin: rand(0, Math.PI * 2)
  });
  addRing(tx, ty, Math.max(48, area * 0.55), "rgba(255,82,34,.38)", 0.45);
}

function meteorImpact(x, y, area, damage) {
  damageCircle(x, y, area, damage, "fire", false);
  state.zones.push({ x, y, r: area, life: 0.62, maxLife: 0.62, damage: 0, element: "fire", type: "meteorExplosionFx", color: "rgba(255,72,32,.34)", grow: 1.75, spin: rand(0, Math.PI * 2) });
  addRing(x, y, area * 1.04, "rgba(255,180,62,.75)", 0.45);
  addParticles(x, y, "rgba(255,118,42,.86)", 26, area * 0.52, 0.55);
  for (let k = 0; k < 8; k++) {
    const a = rand(0, Math.PI * 2);
    addLine(x, y, x + Math.cos(a) * rand(area * 0.42, area), y + Math.sin(a) * rand(area * 0.42, area), "rgba(255,205,76,.62)", rand(4, 9), 0.28, true);
  }
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
    if (pr.kind === "lotusMeteor" || pr.kind === "playerMeteor") {
      pr.spin += dt * 9;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      if (Math.random() < 0.35) {
        addLine(pr.x, pr.y, pr.x - pr.vx * 0.035 + rand(-10, 10), pr.y - pr.vy * 0.035 + rand(-10, 10), "rgba(255,126,38,.55)", rand(4, 8), 0.16, true);
      }
      if (Math.hypot(pr.x - pr.tx, pr.y - pr.ty) < 28 || pr.y >= pr.ty) {
        meteorImpact(pr.tx, pr.ty, pr.area || 92, pr.damage);
        pr.life = 0;
      }
      if (pr.life <= 0) {
        state.projectiles.splice(i, 1);
        continue;
      }
      continue;
    }
    if (pr.kind === "blackPlague") {
      pr.spin += dt * 5;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (Math.random() < 0.45) {
        addLine(pr.x, pr.y, pr.x - pr.vx * 0.045 + rand(-16, 16), pr.y - pr.vy * 0.045 + rand(-16, 16), "rgba(180,80,255,.45)", rand(4, 9), 0.18, true);
      }
      let detonated = Math.hypot(pr.x - pr.tx, pr.y - pr.ty) < 26 || pr.life <= 0;
      if (!detonated) {
        for (const m of state.monsters) {
          if (Math.hypot(pr.x - m.x, pr.y - m.y) < pr.r + m.r) {
            detonated = true;
            break;
          }
        }
      }
      if (detonated) {
        explodeBlackPlague(pr);
        state.projectiles.splice(i, 1);
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
    if (pr.kind === "fireballSkill") {
      pr.spin += dt * 10;
      if (Math.random() < 0.35) {
        const back = Math.atan2(pr.vy, pr.vx) + Math.PI + rand(-0.32, 0.32);
        addLine(pr.x, pr.y, pr.x + Math.cos(back) * rand(18, 38), pr.y + Math.sin(back) * rand(18, 38), "rgba(255,118,24,.45)", rand(4, 8), 0.16, true);
      }
    }
    pr.life -= dt;
    for (const m of state.monsters) {
      if (!pr.hit.has(m) && Math.hypot(pr.x - m.x, pr.y - m.y) < pr.r + m.r) {
        hitMonster(m, pr.damage, pr.element);
        pr.hit.add(m);
        if (pr.kind === "fairyBolt") applyPoison(m, Math.max(2, pr.damage * 0.12), 4.5);
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
    s.angle = Math.atan2(s.vy, s.vx);
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
    if (z.delay > 0) {
      z.delay -= dt;
      continue;
    }
    z.life -= dt;
    z.angle = (z.angle || 0) + (z.spin || 0) * dt;
    if (z.type === "earthquakeFx" && !z.impactDone) {
      z.impactDone = true;
      damageCircle(z.x, z.y, z.r, z.impactDamage || z.damage || 0, z.element, true);
      addParticles(z.x, z.y, "rgba(255,184,94,.64)", 12, z.r * 0.38, 0.5);
    }
    if (z.followPlayer) {
      z.x = state.player.x;
      z.y = state.player.y;
    }
    if (z.type === "virulentPlagueFx") {
      z.x += (z.vx || 0) * dt;
      z.y += (z.vy || 0) * dt;
      z.vx = (z.vx || 0) * (1 - Math.min(0.45, dt * 0.18));
      z.vy = (z.vy || 0) * (1 - Math.min(0.45, dt * 0.18));
      if (Math.random() < 0.18) addParticles(z.x + rand(-z.r * 0.28, z.r * 0.28), z.y + rand(-z.r * 0.28, z.r * 0.28), "rgba(166,255,70,.42)", 2, z.r * 0.24, 0.9);
    }
    if (z.type === "movingSpiral") {
      const target = nearestEnemy(z, z.seek || 260);
      if (target) {
        const a = Math.atan2(target.y - z.y, target.x - z.x);
        z.vx = (z.vx || 0) * 0.9 + Math.cos(a) * 210 * 0.1;
        z.vy = (z.vy || 0) * 0.9 + Math.sin(a) * 210 * 0.1;
      }
      z.x += (z.vx || 0) * dt;
      z.y += (z.vy || 0) * dt;
      for (const m of state.monsters) {
        const dx = z.x - m.x;
        const dy = z.y - m.y;
        const d = Math.hypot(dx, dy);
        const pullRange = z.r * 1.35 * (z.pullMul || 1) + m.r;
        if (d > 1 && d < pullRange) {
          const bossScale = m.kind === "boss" ? 0.22 : m.kind === "elite" ? 0.55 : 1;
          const force = (1 - d / pullRange) * (150 + (z.r || 0) * 0.28) * (z.pullMul || 1) * bossScale * dt;
          m.x += dx / d * force;
          m.y += dy / d * force;
          m.slow = Math.max(m.slow || 0, 0.22);
        }
      }
      if (Math.random() < 0.25) addLine(z.x + rand(-12, 12), z.y + rand(-12, 12), z.x + rand(-42, 42), z.y + rand(-42, 42), z.element === "fire" ? "rgba(255,146,52,.32)" : "rgba(225,245,230,.25)", 3, 0.12, true);
    }
    z.r += (z.grow || 0) * dt * 45;
    if (z.maxR) z.r = Math.min(z.r, z.maxR);
    if (z.type === "enemyPoison") {
      z.tick = (z.tick || 0) - dt;
      if (z.tick <= 0) {
        z.tick = 0.45;
        damagePlayerAndFollowersCircle(z.x, z.y, z.r, 11 * ENEMY_DAMAGE_MULT * timeGrowth(), "#83ff72");
      }
      if (Math.random() < 0.12) addParticles(z.x + rand(-z.r * 0.55, z.r * 0.55), z.y + rand(-z.r * 0.55, z.r * 0.55), "rgba(122,255,86,.36)", 2, 26, 1.2);
    }
    if (z.poisonDamage || z.blind || z.burnVulnerable || z.burnDamage || z.slow || z.diseaseDamage) {
      z.statusTick = (z.statusTick || 0) - dt;
      if (z.statusTick <= 0) {
        z.statusTick = 0.55;
        for (const m of state.monsters) {
          if (Math.hypot(m.x - z.x, m.y - z.y) < z.r + m.r) {
            if (z.poisonDamage) applyPoison(m, z.poisonDamage, z.type === "blackPlagueFx" || z.type === "virulentPlagueFx" ? 6 : 4.5);
            if (z.blind) applyBlind(m, 3.2);
            if (z.burnVulnerable) applyBurnVulnerability(m, 3.8, z.burnVulnerable);
            if (z.burnDamage) applyBurn(m, z.burnDamage, 4.2);
            if (z.slow) m.slow = Math.max(m.slow || 0, z.slow);
            if (z.diseaseDamage) applyDisease(m, z.diseaseDamage, 7);
          }
        }
      }
    }
    if (z.damage > 0) {
      if (z.type === "cone" || z.type === "fireBreathFx") {
        for (const m of state.monsters) {
          const a = Math.atan2(m.y - z.y, m.x - z.x);
          const diff = Math.abs(Math.atan2(Math.sin(a - z.a), Math.cos(a - z.a)));
          if (diff < (z.arc || 0.55) && Math.hypot(m.x - z.x, m.y - z.y) < z.r) hitMonster(m, z.damage * dt * 60, z.element);
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
    if (!m.baseMaxHp) m.baseMaxHp = (m.maxHp || m.hp || 1) / timeGrowth();
    const grownMax = m.baseMaxHp * timeGrowth();
    if (grownMax > (m.maxHp || 0)) {
      m.hp += grownMax - (m.maxHp || 0);
      m.maxHp = grownMax;
    }
    m.attackMul = m.tag === "typhon" ? 1.25 : 1;
    if (m.hp <= 0) {
      maybeTriggerDeathExplosion(m);
      if (Math.random() < 0.72 || m.kind !== "normal") state.gems.push({ x: m.x, y: m.y, r: m.kind === "boss" ? 10 : 6, xp: m.xp });
      if (Math.random() < (m.kind === "normal" ? 0.015 : m.kind === "elite" ? 0.07 : 0.18)) state.chests.push({ x: m.x + rand(-10, 10), y: m.y + rand(-10, 10), r: 12, pulse: rand(0, Math.PI * 2) });
      addGold(monsterGoldValue(m), m.x, m.y);
      if (m.worldBoss && m.tag === "typhon") {
        const site = state.worldBosses?.typhon;
        if (site) site.defeated = true;
      }
      if (m.worldBoss && m.name === "奇美拉") {
        const site = state.worldBosses?.chimera;
        if (site) site.defeated = true;
        awardArtifact("民心所向");
      } else if (m.kind === "boss") awardArtifact();
      if (state.classId === "necromancer" && Math.random() < classLevel() * 0.01) {
        const skeleton = followerById.skeleton;
        if (skeleton) {
          const f = spawnFollower(skeleton, m.x, m.y, false);
          if (f) resolveFollowerMerge(f.id);
        }
      }
      state.monsters.splice(i, 1);
      continue;
    }
    updateDiseaseStatus(m, dt);
    updateBurnStatus(m, dt);
    if (m.burnVulnerable) m.burnVulnerable.time -= dt;
    const followerTarget = far > 360 ? nearestFollower(m, 430) : null;
    const target = followerTarget || p;
    const targetRadius = followerTarget ? 15 : p.r;
    const a = Math.atan2(target.y - m.y, target.x - m.x);
    const slow = m.slow ? 0.55 : 1;
    m.slow = Math.max(0, (m.slow || 0) - dt);
    m.frozen = Math.max(0, (m.frozen || 0) - dt);
    m.blind = Math.max(0, (m.blind || 0) - dt);
    m.fear = Math.max(0, (m.fear || 0) - dt);
    m.disarm = Math.max(0, (m.disarm || 0) - dt);
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
    if (m.tag === "typhon" && m.specialCd <= 0) {
      const rangeToTarget = Math.hypot(target.x - m.x, target.y - m.y);
      const roll = Math.random();
      if (rangeToTarget < 230 && roll < 0.36) {
        typhonCleave(m, target);
        m.specialCd = rand(1.6, 2.4);
      } else if (rangeToTarget < 360 && roll < 0.62) {
        typhonFireBreath(m, target);
        m.specialCd = rand(2.2, 3.2);
      } else if (roll < 0.82) {
        typhonEarthquake(m);
        m.specialCd = rand(3.0, 4.2);
      } else {
        typhonMeteorFall(m, target);
        m.specialCd = rand(3.6, 4.8);
      }
    }
    if (m.name === "海德拉" && m.specialCd <= 0) {
      const rangeToTarget = Math.hypot(target.x - m.x, target.y - m.y);
      if (rangeToTarget < 175) {
        hydraAreaAttack(m);
        m.specialCd = rand(2.4, 3.4);
      } else if (rangeToTarget < 420 && Math.random() < 0.58) {
        hydraSurge(m, target);
        m.specialCd = rand(3.0, 4.2);
      } else {
        hydraPoisonCloud(m, target);
        m.specialCd = rand(4.0, 5.4);
      }
    }
    if (m.name === "奇美拉") {
      const rangeToTarget = Math.hypot(target.x - m.x, target.y - m.y);
      if (!m.charge && m.specialCd <= 0) {
        if (rangeToTarget > 240 && rangeToTarget < 720) {
          startChimeraCharge(m, target);
        } else if (rangeToTarget < 285 && Math.random() < 0.62) {
          chimeraFireBreath(m, target);
          m.specialCd = rand(2.6, 3.8);
        } else {
          hydraPoisonCloud(m, target);
          m.specialCd = rand(3.8, 5.2);
        }
      }
      if (updateChimeraCharge(m, target, dt)) continue;
    }
    const targetDistance = Math.hypot(target.x - m.x, target.y - m.y);
    if (m.fear > 0) {
      m.x -= Math.cos(a) * m.speed * 1.45 * slow * diseaseMoveMult(m) * dt;
      m.y -= Math.sin(a) * m.speed * 1.45 * slow * diseaseMoveMult(m) * dt;
    } else if (m.tag === "ranged") {
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
      m.x += (moveX / moveLen) * m.speed * slow * diseaseMoveMult(m) * dt;
      m.y += (moveY / moveLen) * m.speed * slow * diseaseMoveMult(m) * dt;
    } else {
      m.x += Math.cos(a) * m.speed * slow * diseaseMoveMult(m) * dt;
      m.y += Math.sin(a) * m.speed * slow * diseaseMoveMult(m) * dt;
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
    if (Math.hypot(target.x - m.x, target.y - m.y) < targetRadius + m.r && m.attackCd <= 0 && (m.disarm || 0) <= 0) {
      const incoming = Math.max(1, 11 * ENEMY_DAMAGE_MULT * timeGrowth() * diseaseAttackMult(m) - (followerTarget ? 0 : effectiveDefense())) * (1 - (followerTarget ? 0 : effectiveGroupReduce()));
      const missed = monsterAttackMisses(m);
      if (missed) {
        m.attackCd = m.kind === "boss" ? 0.55 : 0.85;
        const push = Math.atan2(m.y - target.y, m.x - target.x);
        m.x += Math.cos(push) * 22;
        m.y += Math.sin(push) * 22;
        continue;
      }
        if (followerTarget) {
          damageFollower(followerTarget, incoming);
          if (isZombieMonster(m)) applyDisease(followerTarget, 2.4 * timeGrowth(), 7);
          if (m.name === "蝎狮") applyPoison(followerTarget, 4 * timeGrowth(), 6);
        }
        else if (p.hitGrace <= 0) {
          p.hp -= incoming;
          p.hitGrace = 0.45;
          if (isZombieMonster(m)) applyDisease(p, 2.8 * timeGrowth(), 7);
          if (m.name === "蝎狮") applyPoison(p, 5 * timeGrowth(), 6);
        addText(`-${Math.ceil(incoming)}`, p.x - 10, p.y - 28, "#ff7a66");
      }
      m.attackCd = m.kind === "boss" ? 0.55 : 0.85;
      const push = Math.atan2(m.y - target.y, m.x - target.x);
      m.x += Math.cos(push) * 22;
      m.y += Math.sin(push) * 22;
      if (!followerTarget && p.thorns) m.hp -= p.thorns * 2;
    }
    if (m.tag === "ranged" && (m.disarm || 0) <= 0) {
      m.shoot -= dt;
      const shotTarget = far > 420 ? nearestFollower(m, 620) || p : p;
      const rangeToTarget = Math.hypot(shotTarget.x - m.x, shotTarget.y - m.y);
      if (m.shoot <= 0 && rangeToTarget < 620) {
        if (!monsterAttackMisses(m)) fireEnemyShot(m, shotTarget);
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
    if (f.id === "ninjaGirl") continue;
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
      const g = pickGearByRarity();
      if (g && applyUniqueGear(g)) {
        addText(`宝箱：${gearTitle(g)}`, c.x - 36, c.y - 20, gearRarityInfo[g.rarity]?.color || "#ffd36b");
      } else {
        const bonusGold = 80 + Math.floor(state.time / 60) * 12;
        state.gold = (state.gold || 0) + bonusGold;
        state.items.push(`Chest: ${bonusGold} Gold`);
        addText(`Chest: +${bonusGold} Gold`, c.x - 36, c.y - 20, "#ffd36b");
      }
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
    const hpGain = 10 + Math.floor(p.level * 1.5);
    p.maxHp += hpGain;
    p.hp = Math.min(p.maxHp, p.hp + hpGain);
    p.damage *= 1.045;
    p.next = Math.floor(p.next * 1.22 + 12);
    openLevelChoices();
  }
}

function openLevelChoices() {
  state.paused = true;
  const choices = [];
  const skillIds = skillChoicePool();
  const usedSkillChoices = new Set();
  for (let i = 0; i < 3; i++) {
    const roll = Math.random();
    if ((roll < 0.68 || state.followers.length >= followerLimit()) && skillIds.length) {
      const id = pickSkillChoice(skillIds, usedSkillChoices);
      usedSkillChoices.add(id);
      const current = state.skills[id]?.level || 0;
      const fusion = id === "flameTornado" && !state.skills.flameTornado;
      const doomFusion = id === "doom" && !state.skills.doom;
      const forkFusion = id === "forkLightning" && !state.skills.forkLightning;
      const plagueFusion = id === "virulentPlague" && !state.skills.virulentPlague;
      const absoluteFusion = id === "absoluteZero" && !state.skills.absoluteZero;
      const iceAgeFusion = id === "iceAge" && !state.skills.iceAge;
      const breathFusion = id === "breathOfFire" && !state.skills.breathOfFire;
      const dimensionalFusion = id === "dimensionalSlash" && !state.skills.dimensionalSlash;
      const title = fusion ? "Fusion: Flame Tornado" : doomFusion ? "Fusion: Doomsday Judgment" : forkFusion ? "Fusion: Fork Lightning" : plagueFusion ? "Fusion: Virulent Plague" : absoluteFusion ? "Fusion: Absolute Zero" : iceAgeFusion ? "Fusion: Ice Age" : breathFusion ? "Fusion: Breath of Fire" : dimensionalFusion ? "Fusion: Dimensional Slash" : current ? skillBook[id].name + " Lv." + Math.min(7, current + 1) : "Learn " + skillBook[id].name;
      const desc = fusion ? "Consumes Lv.7 Fire Breath and Lv.7 Tornado." : doomFusion ? "Consumes Lv.7 Lava Field, Meteor, Earthquake and sacrifices 1 Red Lotus Beast." : forkFusion ? "Consumes Lv.7 Fire Breath and Lv.7 Chain Lightning." : plagueFusion ? "Consumes Lv.7 Poison Cloud and Lv.7 Black Plague." : absoluteFusion ? "Consumes Lv.7 Blizzard and Lv.7 Frost Nova." : iceAgeFusion ? "Consumes Lv.7 Arrow Rain and Lv.7 Frost Nova." : breathFusion ? "Consumes Lv.7 Pain Scream and Lv.7 Fire Breath." : dimensionalFusion ? "Consumes Lv.7 Earthquake and Lv.7 Cleave." : skillBook[id].desc;
      choices.push({ title, desc, run: () => learnSkill(id) });
    } else {
      const f = pick(followerChoices);
      const next = followerEvolvesTo[f.id] ? followerById[followerEvolvesTo[f.id]].name : "Advanced follower";
      choices.push({ title: "Piece: " + f.name, desc: "Auto-chess follower. Collect 3 " + f.name + " to evolve into " + next + ".", run: () => addFollower(f) });
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

function flameTornadoAvailable() {
  return !state.skills.flameTornado && (state.skills.fireBreath?.level || 0) >= 7 && (state.skills.tornado?.level || 0) >= 7;
}

function hasRedLotusBeast() {
  return state.followers.some(f => f.id === "lotus" && f.hp > 0);
}

function doomAvailable() {
  return !state.skills.doom
    && (state.skills.lavaField?.level || 0) >= 7
    && (state.skills.meteor?.level || 0) >= 7
    && (state.skills.earthquake?.level || 0) >= 7
    && hasRedLotusBeast();
}

function forkLightningAvailable() {
  return !state.skills.forkLightning
    && (state.skills.fireBreath?.level || 0) >= 7
    && (state.skills.chainLightning?.level || 0) >= 7;
}

function virulentPlagueAvailable() {
  return !state.skills.virulentPlague
    && (state.skills.poisonCloud?.level || 0) >= 7
    && (state.skills.blackPlague?.level || 0) >= 7;
}

function iceAgeAvailable() {
  return !state.skills.iceAge
    && (state.skills.arrowRain?.level || 0) >= 7
    && (state.skills.frostNova?.level || 0) >= 7;
}

function absoluteZeroAvailable() {
  return !state.skills.absoluteZero
    && (state.skills.blizzard?.level || 0) >= 7
    && (state.skills.frostNova?.level || 0) >= 7;
}

function breathOfFireAvailable() {
  return !state.skills.breathOfFire
    && (state.skills.painScream?.level || 0) >= 7
    && (state.skills.fireBreath?.level || 0) >= 7;
}

function dimensionalSlashAvailable() {
  return !state.skills.dimensionalSlash
    && (state.skills.earthquake?.level || 0) >= 7
    && (state.skills.cleave?.level || 0) >= 7;
}

function sacrificeRedLotusBeast() {
  const index = state.followers.findIndex(f => f.id === "lotus" && f.hp > 0);
  if (index < 0) return false;
  const f = state.followers[index];
  addText("Sacrifice: Red Lotus Beast", f.x - 78, f.y - 42, "#ff9b42");
  addRing(f.x, f.y, 92, "rgba(255,84,24,.92)", 0.85);
  state.followers.splice(index, 1);
  return true;
}

function skillChoicePool() {
  const blocked = new Set(["lightningStorm", "iceRing"]);
  const pool = [];
  for (const id of Object.keys(skillBook)) {
    if (blocked.has(id)) continue;
    if (id === "flameTornado" && !state.skills.flameTornado && !flameTornadoAvailable()) continue;
    if (id === "doom" && !state.skills.doom && !doomAvailable()) continue;
    if (id === "forkLightning" && !state.skills.forkLightning && !forkLightningAvailable()) continue;
    if (id === "virulentPlague" && !state.skills.virulentPlague && !virulentPlagueAvailable()) continue;
    if (id === "absoluteZero" && !state.skills.absoluteZero && !absoluteZeroAvailable()) continue;
    if (id === "iceAge" && !state.skills.iceAge && !iceAgeAvailable()) continue;
    if (id === "breathOfFire" && !state.skills.breathOfFire && !breathOfFireAvailable()) continue;
    if (id === "dimensionalSlash" && !state.skills.dimensionalSlash && !dimensionalSlashAvailable()) continue;
    if ((id === "fireBreath" || id === "tornado") && state.skills.flameTornado) continue;
    if ((id === "fireBreath" || id === "chainLightning") && state.skills.forkLightning) continue;
    if ((id === "fireBreath" || id === "painScream") && state.skills.breathOfFire) continue;
    if ((id === "poisonCloud" || id === "blackPlague") && state.skills.virulentPlague) continue;
    if ((id === "blizzard" || id === "frostNova") && state.skills.absoluteZero) continue;
    if ((id === "arrowRain" || id === "frostNova") && state.skills.iceAge) continue;
    if ((id === "lavaField" || id === "meteor" || id === "earthquake") && state.skills.doom) continue;
    if ((id === "earthquake" || id === "cleave") && state.skills.dimensionalSlash) continue;
    const current = state.skills[id]?.level || 0;
    if (current >= 7) continue;
    const weight = current > 0 ? 4 : 1;
    for (let i = 0; i < weight; i++) pool.push(id);
  }
  if (flameTornadoAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("flameTornado");
  }
  if (doomAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("doom");
  }
  if (forkLightningAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("forkLightning");
  }
  if (virulentPlagueAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("virulentPlague");
  }
  if (absoluteZeroAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("absoluteZero");
  }
  if (iceAgeAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("iceAge");
  }
  if (breathOfFireAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("breathOfFire");
  }
  if (dimensionalSlashAvailable()) {
    for (let i = 0; i < 8; i++) pool.push("dimensionalSlash");
  }
  return pool;
}

function pickSkillChoice(pool, used = new Set()) {
  const available = pool.filter(id => !used.has(id));
  return pick(available.length ? available : pool);
}

function learnSkill(id) {
  if (id === "flameTornado" && !state.skills.flameTornado) {
    delete state.skills.fireBreath;
    delete state.skills.tornado;
    state.skills.flameTornado = skillState("flameTornado");
    addText("Fusion: Flame Tornado", state.player.x - 68, state.player.y - 56, "#ffb35a");
    addRing(state.player.x, state.player.y, 96, "rgba(255,110,36,.9)", 0.75);
    return;
  }
  if (id === "doom" && !state.skills.doom) {
    if (!doomAvailable() || !sacrificeRedLotusBeast()) {
      addText("Doomsday needs Lv.7 Lava, Meteor, Quake and Red Lotus Beast", state.player.x - 140, state.player.y - 58, "#ffb35a");
      return;
    }
    delete state.skills.lavaField;
    delete state.skills.meteor;
    delete state.skills.earthquake;
    state.skills.doom = skillState("doom");
    addText("Fusion: Doomsday Judgment", state.player.x - 88, state.player.y - 72, "#ff7038");
    addRing(state.player.x, state.player.y, 160, "rgba(255,82,30,.95)", 1.1);
    return;
  }
  if (id === "forkLightning" && !state.skills.forkLightning) {
    if (!forkLightningAvailable()) return;
    delete state.skills.fireBreath;
    delete state.skills.chainLightning;
    state.skills.forkLightning = skillState("forkLightning");
    addText("Fusion: Fork Lightning", state.player.x - 74, state.player.y - 62, "#7fd4ff");
    addRing(state.player.x, state.player.y, 118, "rgba(94,184,255,.9)", 0.82);
    return;
  }
  if (id === "virulentPlague" && !state.skills.virulentPlague) {
    if (!virulentPlagueAvailable()) return;
    delete state.skills.poisonCloud;
    delete state.skills.blackPlague;
    state.skills.virulentPlague = skillState("virulentPlague");
    addText("Fusion: Virulent Plague", state.player.x - 82, state.player.y - 66, "#b7ff62");
    addRing(state.player.x, state.player.y, 128, "rgba(145,255,64,.9)", 0.88);
    return;
  }
  if (id === "absoluteZero" && !state.skills.absoluteZero) {
    if (!absoluteZeroAvailable()) return;
    delete state.skills.blizzard;
    delete state.skills.frostNova;
    state.skills.absoluteZero = skillState("absoluteZero");
    addText("Fusion: Absolute Zero", state.player.x - 78, state.player.y - 66, "#aee9ff");
    addRing(state.player.x, state.player.y, 138, "rgba(170,235,255,.92)", 0.92);
    return;
  }
  if (id === "iceAge" && !state.skills.iceAge) {
    if (!iceAgeAvailable()) return;
    delete state.skills.arrowRain;
    delete state.skills.frostNova;
    state.skills.iceAge = skillState("iceAge");
    addText("Fusion: Ice Age", state.player.x - 62, state.player.y - 66, "#9fe7ff");
    addRing(state.player.x, state.player.y, 132, "rgba(145,220,255,.9)", 0.9);
    return;
  }
  if (id === "breathOfFire" && !state.skills.breathOfFire) {
    if (!breathOfFireAvailable()) return;
    delete state.skills.painScream;
    delete state.skills.fireBreath;
    state.skills.breathOfFire = skillState("breathOfFire");
    addText("Fusion: Breath of Fire", state.player.x - 78, state.player.y - 66, "#ffb35a");
    addRing(state.player.x, state.player.y, 126, "rgba(255,104,38,.9)", 0.88);
    return;
  }
  if (id === "dimensionalSlash" && !state.skills.dimensionalSlash) {
    if (!dimensionalSlashAvailable()) return;
    delete state.skills.earthquake;
    delete state.skills.cleave;
    state.skills.dimensionalSlash = skillState("dimensionalSlash");
    addText("Fusion: Dimensional Slash", state.player.x - 88, state.player.y - 68, "#c67cff");
    addRing(state.player.x, state.player.y, 145, "rgba(185,92,255,.9)", 0.95);
    return;
  }
  if (!state.skills[id]) state.skills[id] = skillState(id);
  else state.skills[id].level = Math.min(7, state.skills[id].level + 1);
}

function addFollower(src) {
  const base = typeof src === "string" ? followerByName[src] : src;
  const f = spawnFollower(base);
  if (!f) return;
  resolveFollowerMerge(f.id);
}

function spawnFollower(src, x = state.player.x + rand(-28, 28), y = state.player.y + rand(34, 58), ignoreLimit = false) {
  if (!ignoreLimit && state.followers.length >= followerLimit()) {
    addText("随从已满", state.player.x - 34, state.player.y - 42, "#ffd36b");
    return null;
  }
  const maxHp = followerMaxHp(src);
  const grownMax = Math.floor(maxHp * timeGrowth());
  const f = { ...src, x, y, hp: grownMax, maxHp: grownMax, baseMaxHp: maxHp, hitGrace: 0, t: rand(0, 1), autoChess: true };
  state.followers.push(f);
  state.items.push(`棋子:${f.name}`);
  return f;
}

function followerMaxHp(src) {
  if (src.id === "militia") return 82;
  if (src.id === "swordsman") return 150;
  if (src.id === "knight") return 270;
  if (src.id === "skeleton") return 68;
  if (src.id === "skeletonWarrior") return 128;
  if (src.id === "reaper") return 230;
  if (src.id === "ghostFollower") return 58;
  if (src.id === "wraith") return 112;
  if (src.id === "banshee") return 205;
  if (src.id === "littleDemon") return 72;
  if (src.id === "demonFollower") return 145;
  if (src.id === "hellKing") return 265;
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
    spawnFollower(next, x, y, true);
    addText(`${next.name} 合成!`, x - 34, y - 32, next.element === "fire" ? "#ffb36b" : "#d4b084");
    addRing(x, y, next.tier === 3 ? 92 : 64, next.element === "fire" ? "rgba(255,150,70,.9)" : "rgba(214,168,104,.9)", 0.65);
    state.items.push(`合成:${next.name}`);
    id = next.id;
  }
}

function awardArtifact(forcedName = null) {
  const owned = new Set(state.artifacts || []);
  const pool = artifactBook.filter(item => !owned.has(item.name));
  const a = forcedName ? artifactBook.find(item => item.name === forcedName && !owned.has(item.name)) : pick(pool);
  if (!a) {
    const bonusGold = 420 + Math.floor(state.time / 60) * 35;
    state.gold = (state.gold || 0) + bonusGold;
    addText(`Artifact duplicate: +${bonusGold} Gold`, 72, 105, "#ffd36b");
    return;
  }
  a.apply(state.player);
  state.artifacts.push(a.name);
  addText(`神器：${a.name}`, 72, 105, "#ffd36b");
}

function checkFusions() {
  const has = id => state.skills[id]?.level >= 3;
  const add = id => { if (!state.skills[id]) { state.skills[id] = skillState(id); addText(`合成：${skillBook[id].name}`, 72, 165, "#ffd36b"); } };
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
  drawWorldBossSites();
  drawBlackMarket();
  for (const g of state.gems) drawGem(g);
  for (const c of state.chests) drawChest(c);
  for (const h of state.heals) drawHeal(h);
  for (const z of state.zones) drawZone(z);
  for (const e of state.effects) drawEffect(e);
  for (const pr of state.projectiles) drawProjectile(pr);
  for (const s of state.enemyShots) drawEnemyShot(s);
  for (const f of state.followers) drawFollower(f);
  for (const f of state.followers) drawFollowerSpiritOrbit(f);
  for (const m of state.monsters) drawMonster(m);
  drawSpiritOrbit();
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

function drawWorldBossSites() {
  for (const site of Object.values(state.worldBosses || {})) {
    if (site.defeated) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      drawCircle(site.x, site.y, site.r * 0.5, "rgba(85,70,88,.45)");
      ctx.restore();
      continue;
    }
    const pulse = 1 + Math.sin(state.time * 2.2) * 0.08;
    ctx.save();
    ctx.globalAlpha = site.spawned ? 0.38 : 0.72;
    ctx.strokeStyle = site.spawned ? "rgba(255,108,70,.72)" : "rgba(218,106,255,.9)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(site.x, site.y, site.r * 0.55 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.5;
    drawCircle(site.x, site.y, site.r * 0.34, site.spawned ? "rgba(255,92,54,.35)" : "rgba(160,70,220,.34)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f7e7ff";
    ctx.font = "14px Microsoft YaHei";
    ctx.fillText(site.spawned ? `${site.boss} 已苏醒` : site.name, site.x - 48, site.y - site.r * 0.64);
    ctx.restore();
  }
}

function drawBlackMarket() {
  const market = state.blackMarket;
  if (!market) return;
  const img = npcImages.blackMarket;
  const pulse = 1 + Math.sin(state.time * 3) * 0.04;
  ctx.save();
  ctx.globalAlpha = 0.72;
  drawCircle(market.x, market.y + 28, 42 * pulse, "rgba(32,20,40,.55)");
  ctx.globalAlpha = 1;
  if (img?.complete && img.naturalWidth && typeof ctx.drawImage === "function") {
    const h = 104;
    const w = h * (img.naturalWidth / img.naturalHeight);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, market.x - w * 0.5, market.y - h * 0.78, w, h);
    ctx.imageSmoothingEnabled = true;
  } else {
    drawCircle(market.x, market.y, 32, "rgba(76,45,92,.95)");
    drawCircle(market.x, market.y - 10, 18, "rgba(242,194,139,.95)");
  }
  const near = Math.hypot(state.player.x - market.x, state.player.y - market.y) < market.r + 24;
  ctx.fillStyle = near ? "#ffe28a" : "#e7d2ff";
  ctx.font = near ? "18px Microsoft YaHei" : "14px Microsoft YaHei";
  ctx.textAlign = "center";
  ctx.fillText("Black Market", market.x, market.y - 72);
  if (near) {
    ctx.fillStyle = "#fff5c9";
    ctx.font = "13px Microsoft YaHei";
    ctx.fillText("E / approach: buy followers and gear", market.x, market.y - 52);
  }
  ctx.textAlign = "start";
  ctx.restore();
}

function drawTerrainTiles(camX, camY) {
  const cell = 180;
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
  const textured = drawTerrainTexture(terrain, sx, sy, tx, ty, size, light);
  if (!textured && typeof ctx.createLinearGradient === "function") {
    const grad = ctx.createLinearGradient(sx, sy, sx + size, sy + size);
    grad.addColorStop(0, shadeColor(terrain.tint, 0.08 + light));
    grad.addColorStop(0.58, terrain.tint);
    grad.addColorStop(1, shadeColor(terrain.tint, -0.24 + light * 0.5));
    ctx.fillStyle = grad;
  } else if (!textured) {
    ctx.fillStyle = shadeColor(terrain.tint, light);
  }
  if (!textured) {
    ctx.fillRect(sx, sy, size + 1, size + 1);
    drawTerrainInkWash(terrain, sx, sy, tx, ty, size);
    drawTerrainNoise(terrain, sx, sy, tx, ty, size);
    drawTerrainPattern(terrain, sx, sy, tx, ty, size);
  } else {
    drawTerrainTextureShade(terrain, sx, sy, size, light);
  }
  drawTerrainEdgeBlend(terrain, sx, sy, tx, ty, size);
}

function drawTerrainTexture(terrain, sx, sy, tx, ty, size, light) {
  if (typeof ctx.drawImage !== "function") return false;
  const img = terrainImages[terrain.id];
  if (!img?.complete || !img.naturalWidth) return false;
  const worldX = tx * size;
  const worldY = ty * size;
  const texScale = terrain.id === "forest" || terrain.id === "snowfield" ? 0.86 : 0.78;
  const srcSize = Math.max(1, size * texScale);
  const ox = Math.floor(hashUnit(Math.abs(hash2(tx >> 3, ty >> 3)), 301) * img.naturalWidth);
  const oy = Math.floor(hashUnit(Math.abs(hash2(tx >> 3, ty >> 3)), 302) * img.naturalHeight);
  const srcX = positiveMod(worldX * texScale + ox, img.naturalWidth);
  const srcY = positiveMod(worldY * texScale + oy, img.naturalHeight);
  drawWrappedImage(img, srcX, srcY, srcSize, srcSize, sx, sy, size + 1, size + 1);
  return true;
}

function drawWrappedImage(img, srcX, srcY, srcW, srcH, dx, dy, dw, dh) {
  let remainingH = srcH;
  let y = srcY;
  let destY = dy;
  while (remainingH > 0.01) {
    const h = Math.min(remainingH, img.naturalHeight - y);
    let remainingW = srcW;
    let x = srcX;
    let destX = dx;
    while (remainingW > 0.01) {
      const w = Math.min(remainingW, img.naturalWidth - x);
      ctx.drawImage(img, x, y, w, h, destX, destY, dw * (w / srcW), dh * (h / srcH));
      destX += dw * (w / srcW);
      remainingW -= w;
      x = 0;
    }
    destY += dh * (h / srcH);
    remainingH -= h;
    y = 0;
  }
}

function drawTerrainTextureShade(terrain, sx, sy, size, light) {
  ctx.save();
  ctx.globalAlpha = terrain.id === "hell" ? 0.22 : terrain.id === "snowfield" ? 0.1 : terrain.id === "pond" ? 0.18 : 0.13;
  ctx.fillStyle = light >= 0 ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.6)";
  ctx.fillRect(sx, sy, size + 1, size + 1);
  if (terrain.id === "pond") {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "rgba(15,45,42,.75)";
    ctx.fillRect(sx, sy, size + 1, size + 1);
  } else if (terrain.id === "hell") {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "rgba(80,16,8,.8)";
    ctx.fillRect(sx, sy, size + 1, size + 1);
  }
  ctx.restore();
}

function positiveMod(value, mod) {
  return ((value % mod) + mod) % mod;
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

function drawSpiritOrbit() {
  const cfg = spiritOrbitConfig();
  if (!cfg) return;
  const img = effectImages.spiritTaming;
  const points = spiritOrbitPoints(cfg);
  const frames = [
    { x: 260, y: 160, w: 220, h: 210 },
    { x: 84, y: 274, w: 200, h: 220 },
    { x: 512, y: 270, w: 190, h: 210 },
    { x: 300, y: 780, w: 190, h: 210 }
  ];
  ctx.save();
  for (const g of points) {
    const size = g.layer ? 38 + cfg.level * 2.2 : 32 + cfg.level * 1.8;
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.a + Math.PI / 2);
    ctx.globalAlpha = g.layer ? 0.76 : 0.86;
    if (img?.complete && img.naturalWidth) {
      const f = frames[g.index % frames.length];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, f.x, f.y, f.w, f.h, -size / 2, -size / 2, size, size);
      ctx.imageSmoothingEnabled = true;
    } else {
      drawCircle(0, 0, size * 0.34, "rgba(215,235,255,.86)");
      ctx.fillStyle = "#eaf6ff";
      ctx.beginPath();
      ctx.moveTo(-size * 0.24, 0);
      ctx.quadraticCurveTo(0, -size * 0.52, size * 0.26, 0);
      ctx.quadraticCurveTo(size * 0.12, size * 0.3, 0, size * 0.52);
      ctx.quadraticCurveTo(-size * 0.16, size * 0.24, -size * 0.24, 0);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawFollowerSpiritOrbit(f) {
  const cfg = followerSpiritConfig(f);
  if (!cfg) return;
  const img = effectImages.spiritTaming;
  const points = followerSpiritPoints(f, cfg);
  const frames = [
    { x: 260, y: 160, w: 220, h: 210 },
    { x: 84, y: 274, w: 200, h: 220 },
    { x: 512, y: 270, w: 190, h: 210 },
    { x: 300, y: 780, w: 190, h: 210 }
  ];
  ctx.save();
  for (const g of points) {
    const size = 18 + f.tier * 5 + (g.layer ? 2 : 0);
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.a + Math.PI / 2);
    ctx.globalAlpha = f.id === "reaper" ? 0.74 : 0.58;
    if (img?.complete && img.naturalWidth) {
      const frame = frames[g.index % frames.length];
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, -size / 2, -size / 2, size, size);
      ctx.imageSmoothingEnabled = true;
    } else {
      drawCircle(0, 0, size * 0.32, "rgba(220,238,255,.78)");
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawPlayer() {
  const p = state.player;
  drawCircle(p.x, p.y, p.r + (p.ward ? 9 : 0), p.ward ? "rgba(125,190,255,.38)" : "rgba(255,255,255,.08)");
  const classFile = classBook[state.classId]?.icon || classAssetById[state.classId];
  const castFile = p.castAnim > 0 ? classCastAssetById[state.classId] : null;
  const castImg = castFile && classImages[castFile];
  const classImg = castImg?.complete && castImg.naturalWidth ? castImg : classFile && classImages[classFile];
  if (classImg?.complete && classImg.naturalWidth && typeof ctx.drawImage === "function") {
    const size = 84;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(classImg, p.x - size / 2, p.y - size * 0.6, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.restore();
  } else {
    drawCircle(p.x, p.y, p.r, "#73d1ff");
  }
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.fillRect(p.x - 24, p.y - 34, 48, 6);
  ctx.fillStyle = p.hp / p.maxHp > 0.35 ? "#6df08a" : "#ff6464";
  ctx.fillRect(p.x - 24, p.y - 34, 48 * Math.max(0, p.hp / p.maxHp), 6);
  ctx.globalAlpha = 0;
  ctx.fillText("✦", p.x - 7, p.y + 6);
}

function drawMonster(m) {
  ctx.globalAlpha = 1;
  const file = monsterAssetByName[m.name];
  const img = file && monsterImages[file];
  if (img && img.complete && img.naturalWidth) {
    const size = m.r * (m.tag === "typhon" ? 3.58 : m.name === "奇美拉" ? 3.2 : m.name === "比蒙巨兽" ? 3.15 : m.name === "海德拉" ? 3.05 : m.name === "蝎狮" ? 2.85 : m.kind === "boss" ? 2.65 : m.kind === "elite" ? 2.42 : 2.32);
    if (m.hit) {
      ctx.globalAlpha = 0.65;
      drawCircle(m.x, m.y, size * 0.56, "#fff3cf");
      ctx.globalAlpha = 1;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, m.x - size / 2, m.y - size / 2, size, size);
    if (m.frozen > 0) {
      ctx.save();
      ctx.globalAlpha = 0.46;
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "#063b98";
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, size * 0.44, size * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "rgba(115,205,255,.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, size * 0.45, size * 0.49, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.imageSmoothingEnabled = true;
  } else {
    drawCircle(m.x, m.y, m.r, m.frozen > 0 ? "#063b98" : m.hit ? "#fff3cf" : m.color);
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
  if (f.id === "knight") {
    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(state.time * 4) * 0.04;
    ctx.strokeStyle = "rgba(255,220,110,.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (img && img.complete && img.naturalWidth) {
    const pulse = f.cast ? 1 + Math.sin(performance.now() / 45) * 0.1 + f.cast * 0.35 : 1;
    const baseSize = f.id === "hellKing" ? 86 : f.id === "demonFollower" ? 72 : f.id === "littleDemon" ? 50 : f.id === "banshee" ? 70 : f.id === "wraith" ? 62 : f.id === "ghostFollower" ? 46 : f.id === "ninjaGirl" ? 70 : f.id === "assassinGirl" ? 64 : f.id === "rogueGirl" ? 58 : f.id === "knight" ? 82 : f.id === "swordsman" ? 64 : f.id === "militia" ? 52 : f.id === "reaper" ? 72 : f.id === "skeletonWarrior" ? 62 : f.id === "skeleton" ? 50 : f.id === "furnace" ? 46 : f.id === "balrog" ? 58 : f.id === "lotus" ? 62 : f.id === "giant" ? 72 : f.id === "golem" ? 60 : f.id === "rock" ? 48 : 34 + f.tier * 8;
    const size = baseSize * pulse;
    const lunge = (f.id === "rock" || f.id === "golem" || isSkeletonFollower(f) || isHumanFollower(f)) && f.cast ? f.cast * 22 : 0;
    const drawX = f.x + Math.cos(f.face || 0) * lunge;
    const drawY = f.y + Math.sin(f.face || 0) * lunge;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.shadowColor = isHumanFollower(f) ? "rgba(255,218,118,.72)" : isGhostFollower(f) ? "rgba(190,226,255,.82)" : f.id === "reaper" || f.id === "skeletonWarrior" || f.id === "skeleton" ? "rgba(118,205,255,.78)" : f.id === "furnace" || f.id === "balrog" || f.id === "lotus" || isDemonFollower(f) ? "rgba(255,112,32,.85)" : f.id === "rock" || f.id === "golem" || f.id === "giant" ? "rgba(90,62,38,.75)" : "rgba(85,225,255,.65)";
    ctx.shadowBlur = f.cast ? 24 : 14;
    if (f.cast) {
      ctx.globalAlpha = 0.78;
      drawCircle(drawX, drawY, size * 0.42, isHumanFollower(f) ? "rgba(255,220,120,.22)" : isGhostFollower(f) ? "rgba(190,226,255,.22)" : isSkeletonFollower(f) ? "rgba(150,210,255,.22)" : f.id === "rock" || f.id === "golem" || f.id === "giant" ? "rgba(160,118,74,.24)" : isDemonFollower(f) ? "rgba(255,70,30,.28)" : "rgba(255,101,31,.26)");
      ctx.globalAlpha = 1;
    }
    if (isGhostFollower(f)) ctx.globalAlpha = 0.88;
    ctx.drawImage(img, drawX - size / 2, drawY - size / 2, size, size);
    ctx.globalAlpha = 1;
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

function drawGroundDecal(img, z, alpha, opts = {}) {
  ctx.save();
  ctx.translate(z.x, z.y);
  ctx.rotate((z.angle || 0) * (opts.spinScale ?? 1));
  const scale = (opts.scale || 1) + (1 - alpha) * (opts.grow || 0);
  const w = z.r * (opts.w || 2.25) * scale;
  const h = z.r * (opts.h || opts.w || 1.28) * scale;
  if (img?.complete && img.naturalWidth) {
    ctx.globalAlpha = alpha * (opts.alpha || 0.66);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, -w * 0.5, -h * 0.5, w, h);
    ctx.imageSmoothingEnabled = false;
  } else {
    ctx.globalAlpha = alpha * 0.7;
    ctx.fillStyle = z.color || "rgba(255,255,255,.2)";
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawZone(z) {
  if (z.delay > 0) return;
  const alpha = clamp(z.life / (z.maxLife || z.life || 1), 0.08, 0.8);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = z.color;
  if (z.type === "cone") {
    ctx.beginPath();
    ctx.moveTo(z.x, z.y);
    ctx.arc(z.x, z.y, z.r, z.a - 0.55, z.a + 0.55);
    ctx.closePath();
    ctx.fill();
  } else if (z.type === "fireBreathFx") {
    const img = effectImages[z.effect || "fireBreath"];
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.a || 0);
    if (img?.complete && img.naturalWidth) {
      const widthMul = z.widthMul || 1.44;
      const heightMul = z.heightMul || 1.08;
      ctx.globalAlpha = alpha * (z.alphaMul || 0.72);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -z.r * 0.2, -z.r * heightMul * 0.5, z.r * widthMul, z.r * heightMul);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, z.r, -0.55, 0.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
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
  } else if (z.type === "doomFx") {
    drawGroundDecal(effectImages.doom, z, alpha, { alpha: 0.74, w: 2.15, h: 2.15, spinScale: 0.12, scale: 1.05, grow: z.grow || 1.8 });
    return;
  } else if (z.type === "rectWave") {
    const length = z.length || 260;
    const width = z.width || z.r || 90;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle || 0);
    ctx.fillRect(-length * 0.5, -width * 0.5, length, width);
    ctx.globalAlpha = alpha * 0.82;
    ctx.strokeStyle = "rgba(186,255,218,.72)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-length * 0.5, -width * 0.35);
    ctx.lineTo(length * 0.5, -width * 0.35);
    ctx.moveTo(-length * 0.5, width * 0.35);
    ctx.lineTo(length * 0.5, width * 0.35);
    ctx.stroke();
    ctx.restore();
  } else if (z.type === "bloodRectFx") {
    const img = effectImages.bloodSpear;
    const length = z.length || 240;
    const width = z.width || z.r || 90;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle || 0);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.76;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -length * 0.56, -width * 1.05, length * 1.12, width * 2.1);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.fillRect(-length * 0.5, -width * 0.5, length, width);
    }
    ctx.restore();
  } else if (z.type === "painScreamFx") {
    const img = effectImages.painScream;
    const length = z.length || 280;
    const width = z.width || z.r || 130;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle || 0);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.72;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -length * 0.52, -width * 0.66, length * 1.14, width * 1.32);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.beginPath();
      ctx.moveTo(-length * 0.5, 0);
      ctx.lineTo(length * 0.52, -width * 0.5);
      ctx.lineTo(length * 0.58, width * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (z.type === "surgeFx") {
    const img = effectImages.surge;
    const length = z.length || 300;
    const width = z.width || z.r || 92;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle || 0);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.72;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -length * 0.58, -width * 0.85, length * 1.16, width * 1.7);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.fillRect(-length * 0.5, -width * 0.5, length, width);
    }
    ctx.restore();
  } else if (z.type === "forkLightningFx") {
    const img = effectImages.forkLightning;
    const length = z.length || z.r * 2.6;
    const width = z.width || z.r;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate((z.angle || 0) + Math.PI / 2);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.74;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -width * 0.62, -length * 0.56, width * 1.24, length * 1.12);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.strokeStyle = "rgba(122,210,255,.86)";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(0, -length * 0.52);
      ctx.lineTo(0, length * 0.5);
      ctx.moveTo(0, -length * 0.04);
      ctx.lineTo(-width * 0.45, length * 0.32);
      ctx.moveTo(0, -length * 0.1);
      ctx.lineTo(width * 0.45, length * 0.26);
      ctx.stroke();
    }
    ctx.restore();
  } else if (z.type === "blizzardFx") {
    const img = effectImages.blizzard;
    ctx.save();
    ctx.translate(z.x, z.y);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.68;
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      const w = z.r * 1.85;
      const h = z.r * 2.45;
      ctx.drawImage(img, -w * 0.5, -h * 0.64, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.fillStyle = "rgba(150,220,255,.24)";
      ctx.fillRect(-z.r * 0.75, -z.r, z.r * 1.5, z.r * 1.8);
    }
    ctx.restore();
  } else if (z.type === "thunderCloudFx") {
    const img = effectImages.thunderCloud;
    ctx.save();
    ctx.translate(z.x, z.y);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.72;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -z.r * 1.05, -z.r * 0.72, z.r * 2.1, z.r * 1.45);
      ctx.imageSmoothingEnabled = false;
    } else {
      drawCircle(0, 0, z.r, "rgba(90,150,255,.28)");
    }
    ctx.restore();
  } else if (z.type === "poisonCloudFx" || z.type === "enemyPoison" || z.type === "sandstormFx" || z.type === "blackPlagueFx" || z.type === "virulentPlagueFx" || z.type === "lavaFieldFx") {
    const img = z.type === "virulentPlagueFx" ? effectImages.virulentPlague : z.type === "blackPlagueFx" ? effectImages.blackPlague : z.type === "sandstormFx" ? effectImages.sandstorm : z.type === "lavaFieldFx" ? effectImages.lavaField : effectImages.poisonCloud;
    drawGroundDecal(img, z, alpha, { alpha: z.type === "enemyPoison" ? 0.5 : z.type === "sandstormFx" ? 0.48 : z.type === "blackPlagueFx" ? 0.56 : z.type === "virulentPlagueFx" ? 0.62 : z.type === "lavaFieldFx" ? 0.62 : 0.5, w: z.type === "virulentPlagueFx" ? 2.55 : 2.28, h: z.type === "virulentPlagueFx" ? 2.55 : 2.28, spinScale: z.type === "sandstormFx" ? 0.45 : z.type === "blackPlagueFx" || z.type === "virulentPlagueFx" ? 0.5 : 0.35, grow: z.type === "poisonCloudFx" ? 0.18 : z.type === "virulentPlagueFx" ? 0.12 : z.type === "lavaFieldFx" ? 0.05 : 0.1 });
  } else if (z.type === "slashFx") {
    const img = effectImages.slash;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate((z.angle || 0) + Math.PI);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.78;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -z.r * 0.78, -z.r * 0.55, z.r * 1.9, z.r * 1.12);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(0, 0, z.r, -0.56, 0.56);
      ctx.stroke();
    }
    ctx.restore();
  } else if (z.type === "dimensionalSlashFx") {
    const img = effectImages.dimensionalSlash;
    const size = z.r * 2.2;
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle || -0.58);
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.82;
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -size * 0.52, -size * 0.32, size * 1.04, size * 0.64);
      ctx.imageSmoothingEnabled = false;
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.strokeStyle = "rgba(202,104,255,.82)";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(-size * 0.45, size * 0.22);
      ctx.lineTo(size * 0.45, -size * 0.22);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = alpha * 0.22;
    drawCircle(z.x, z.y, z.r * 0.6, "rgba(122,72,255,.18)");
  } else if (z.type === "meteorExplosionFx") {
    const img = effectImages.meteorExplosion;
    drawGroundDecal(img, z, alpha, { alpha: 0.72, w: 2.35, h: 2.35, spinScale: 0.15, scale: 1.1, grow: z.grow || 1.6 });
  } else if (z.type === "earthquakeFx") {
    drawGroundDecal(effectImages.earthquake, z, alpha, { alpha: 0.7, w: 2.45, h: 2.45, spinScale: 0.25, scale: 1.02, grow: z.grow || 1.2 });
  } else if (z.type === "frostNovaFx") {
    drawGroundDecal(effectImages.frostNova, z, alpha, { alpha: 0.74, w: 2.3, h: 2.3, spinScale: 0.2, scale: 1.0, grow: z.grow || 1.4 });
  } else if (z.type === "absoluteZeroFx") {
    drawGroundDecal(effectImages.absoluteZero, z, Math.min(0.82, alpha + 0.22), { alpha: 0.62, w: 2.25, h: 2.25, spinScale: 0.42, scale: 1.0, grow: 0.05 });
  } else if (z.type === "iceAgeFx") {
    drawGroundDecal(effectImages.iceAge, z, alpha, { alpha: 0.66, w: 2.55, h: 2.55, spinScale: 0.08, scale: 1.0, grow: z.grow || 0.35 });
  } else if (z.type === "arrowRainFx") {
    drawGroundDecal(effectImages.arrowRain, z, alpha, { alpha: 0.72, w: 2.25, h: 2.25, spinScale: 0.15, scale: 1.0, grow: z.grow || 0.8 });
  } else if (z.type === "spiral" || z.type === "movingSpiral") {
    const spiralImg = z.element === "fire" ? effectImages.flameTornado : effectImages.tornado;
    if (z.type === "movingSpiral" && spiralImg?.complete && spiralImg.naturalWidth) {
      drawGroundDecal(spiralImg, z, alpha, { alpha: z.element === "fire" ? 0.72 : 0.66, w: 2.35, h: 2.35, spinScale: 0.5, scale: 1.0, grow: 0.05 });
      return;
    }
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
  } else if (z.type === "visual" || z.type === "dot") {
    drawGroundDecal(null, z, alpha, { alpha: 0.62, w: 2.18, h: 2.18, grow: z.grow || 0.6 });
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
  } else if (e.type === "chainSprite") {
    const img = effectImages.chainLightning;
    const dx = e.x2 - e.x1;
    const dy = e.y2 - e.y1;
    const len = Math.hypot(dx, dy);
    ctx.translate((e.x1 + e.x2) / 2, (e.y1 + e.y2) / 2);
    ctx.rotate(Math.atan2(dy, dx));
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha * 0.78;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -len * 0.55, -len * 0.23, len * 1.1, len * 0.46);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.strokeStyle = "rgba(120,200,255,.9)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0);
      ctx.lineTo(len / 2, 0);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawProjectile(pr) {
  if (pr.kind === "boulder") {
    drawBoulderProjectile(pr);
    return;
  }
  if (pr.kind === "lotusMeteor" || pr.kind === "playerMeteor") {
    drawLotusMeteor(pr);
    return;
  }
  if (pr.kind === "furnaceFireball") {
    drawFurnaceFireball(pr);
    return;
  }
  if (pr.kind === "fireballSkill") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,86,24,.42)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pr.px, pr.py);
    ctx.lineTo(pr.x, pr.y);
    ctx.stroke();
    ctx.translate(pr.x, pr.y);
    ctx.rotate(pr.angle || 0);
    const img = effectImages.fireball;
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = 0.78;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -30, -30, 60, 60);
      ctx.imageSmoothingEnabled = false;
    } else {
      drawCircle(0, 0, pr.r + 4, "rgba(255,118,28,.92)");
    }
    ctx.restore();
    return;
  }
  if (pr.kind === "bloodSpear") {
    ctx.save();
    ctx.strokeStyle = "rgba(255,42,60,.42)";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pr.px, pr.py);
    ctx.lineTo(pr.x, pr.y);
    ctx.stroke();
    ctx.translate(pr.x, pr.y);
    ctx.rotate((pr.angle || 0));
    const img = effectImages.bloodSpear;
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = 0.74;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -66, -42, 132, 84);
      ctx.imageSmoothingEnabled = false;
    } else {
      drawCircle(0, 0, pr.r + 4, "rgba(255,42,60,.86)");
    }
    ctx.restore();
    return;
  }
  if (pr.kind === "blackPlague") {
    ctx.save();
    ctx.strokeStyle = "rgba(158,70,220,.38)";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pr.px, pr.py);
    ctx.lineTo(pr.x, pr.y);
    ctx.stroke();
    ctx.translate(pr.x, pr.y);
    ctx.rotate((pr.spin || 0) + (pr.angle || 0));
    ctx.shadowColor = "rgba(190,82,255,.85)";
    ctx.shadowBlur = 18;
    drawCircle(0, 0, pr.r + 5, "rgba(160,54,230,.86)");
    ctx.fillStyle = "rgba(242,192,255,.9)";
    ctx.beginPath();
    ctx.arc(4, -3, pr.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  ctx.lineWidth = pr.kind === "playerMeteor" ? 16 : 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pr.px, pr.py);
  ctx.lineTo(pr.x, pr.y);
  ctx.stroke();
  ctx.translate(pr.x, pr.y);
  ctx.rotate((pr.angle || 0) + Math.PI * 1.25);
  ctx.shadowColor = "rgba(255,98,24,.95)";
  ctx.shadowBlur = 22;
  const img = effectImages.meteor;
  const size = pr.kind === "playerMeteor" ? 98 : 74;
  if (img?.complete && img.naturalWidth) {
    ctx.globalAlpha = 0.88;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, -size * 0.62, -size * 0.62, size * 1.24, size * 1.24);
    ctx.imageSmoothingEnabled = false;
  } else {
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
  }
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
    ctx.rotate(Math.PI / 4);
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
    <dt>Class</dt><dd>${state.className || "Unknown"}</dd>
    <dt>HP</dt><dd>${Math.ceil(p.hp)} / ${p.maxHp}</dd>
    <dt>Level</dt><dd>${p.level}</dd>
    <dt>Time</dt><dd>${Math.floor(state.time)}s</dd>
    <dt>Gold</dt><dd>${Math.floor(state.gold || 0)}</dd>
    <dt>Growth</dt><dd>+${Math.round((timeGrowth() - 1) * 100)}%</dd>
    <dt>Followers</dt><dd>${state.followers.length} / ${followerLimit()}</dd>
    <dt>Innate</dt><dd>${classBook[state.classId]?.innate || "-"}</dd>
    <dt>Aura</dt><dd>+${Math.round(((p.followerAttackAura || 0) + (p.classFollowerAttackAura || 0)) * 100)}% ATK</dd>
    <dt>Monsters</dt><dd>${state.monsters.length}</dd>
  `;
  skillsEl.innerHTML = Object.values(state.skills).filter(s => skillBook[s.id]).map(s => `<li><span>${skillBook[s.id].name}</span><b>Lv.${s.level}</b></li>`).join("");
  const followerSummary = Object.values(state.followers.reduce((acc, f) => {
    acc[f.id] ||= { name: f.name, tier: f.tier, count: 0, hp: 0, maxHp: 0 };
    acc[f.id].count++;
    acc[f.id].hp += Math.max(0, f.hp || 0);
    acc[f.id].maxHp += f.maxHp || 0;
    return acc;
  }, {}));
  followersEl.innerHTML = followerSummary.length ? followerSummary.map(f => `<li><span>${f.name} x${f.count}</span><b>T${f.tier} ${Math.ceil(f.hp)}/${Math.ceil(f.maxHp)}</b></li>`).join("") : "<li><span>None</span><b>-</b></li>";
  renderPlainItemList([...state.items.slice(-8), ...state.artifacts.map(a => `Artifact:${a}`)].slice(-10));
}

function renderPlainItemList(items) {
  itemsEl.innerHTML = "";
  const rows = items.length ? items : ["None"];
  for (const item of rows) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = String(item).replace(/<[^>]*>/g, "");
    const b = document.createElement("b");
    b.textContent = item === "None" ? "-" : "";
    li.appendChild(span);
    li.appendChild(b);
    itemsEl.appendChild(li);
  }
}

function loop(now) {
  const dt = Math.min(0.033, (now - state.last) / 1000);
  state.last = now;
  update(dt);
  draw();
  if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) syncHud();
  requestAnimationFrame(loop);
}

function renderStartMenu() {
  const save = loadSavedGame();
  startPanel.querySelector("h1").textContent = "Elemental Survival";
  startPanel.querySelector("p").textContent = save
    ? `发现存档：${save.className || "未知职业"} · ${Math.floor(save.time || 0)} 秒 · Lv.${save.player?.level || 1}`
    : "开放世界无限生存 · 选择职业后开始";
  if (classPanel) classPanel.classList.add("hidden");
  if (!startActions) return;
  startActions.innerHTML = "";
  if (save) {
    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.textContent = "继续游戏";
    continueBtn.addEventListener("click", continueGame);
    startActions.appendChild(continueBtn);
  }
  const newBtn = document.createElement("button");
  newBtn.type = "button";
  newBtn.textContent = save ? "从头开始" : "新游戏";
  newBtn.addEventListener("click", showClassSelect);
  startActions.appendChild(newBtn);
}

function showClassSelect() {
  if (!classPanel || !startActions) {
    startWithClass("elementMage");
    return;
  }
  startActions.innerHTML = "";
  classPanel.innerHTML = `<div class="class-title">选择职业</div>`;
  for (const [id, cls] of Object.entries(classBook)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "class-choice";
    btn.innerHTML = `<img src="./assets/classes/${cls.icon}" alt=""><b>${cls.name}</b><span>${cls.desc}</span>`;
    btn.addEventListener("click", () => startWithClass(id));
    classPanel.appendChild(btn);
  }
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "secondary";
  backBtn.textContent = "返回";
  backBtn.addEventListener("click", renderStartMenu);
  classPanel.appendChild(backBtn);
  classPanel.classList.remove("hidden");
  startPanel.querySelector("p").textContent = "从头开始会覆盖当前存档";
}

function startWithClass(classId) {
  clearSave();
  state = newState(classId);
  state.running = true;
  startPanel.classList.add("hidden");
  levelPanel.classList.add("hidden");
  if (classPanel) classPanel.classList.add("hidden");
  saveGame();
  syncHud();
}

function continueGame() {
  const save = loadSavedGame();
  if (!save) {
    renderStartMenu();
    return;
  }
  state = restoreState(save);
  startPanel.classList.add("hidden");
  levelPanel.classList.add("hidden");
  if (classPanel) classPanel.classList.add("hidden");
  syncHud();
}

window.addEventListener("keydown", e => {
  keys.add(e.code);
  if (e.code === "KeyE" && canOpenBlackMarket()) {
    state.blackMarket.wasNear = true;
    openBlackMarket();
  }
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
startBtn?.addEventListener("click", () => startWithClass("elementMage"));

state = newState();
renderStartMenu();
draw();
syncHud();
requestAnimationFrame(loop);
