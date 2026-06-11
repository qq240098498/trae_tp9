import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'api', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

const buildingGenderMap = {
  'bld_959_mq8385xp': { default: 'male', name: '1号楼' },
  'bld_960_mq8385xp': { default: 'female', name: '2号楼' },
  'bld_961_mq8385xp': { byFloor: { 1: 'male', 2: 'male', 3: 'male', 4: 'female', 5: 'female', 6: 'female' }, name: '3号楼' },
};

db.rooms = db.rooms.map((room) => {
  const buildingConfig = buildingGenderMap[room.buildingId];
  if (!buildingConfig) return room;
  
  let gender;
  if (buildingConfig.byFloor) {
    gender = buildingConfig.byFloor[room.floor] || 'male';
  } else {
    gender = buildingConfig.default;
  }
  
  return { ...room, gender };
});

let maleCount = 0, femaleCount = 0;
db.rooms.forEach(r => {
  if (r.gender === 'male') maleCount++;
  else femaleCount++;
});

console.log(`共 ${db.rooms.length} 间房间`);
console.log(`男宿舍: ${maleCount} 间`);
console.log(`女宿舍: ${femaleCount} 间`);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log('✓ 已写入 db.json');
