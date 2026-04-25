const { generateStructure, allocateGreedy } = require('./apps/server/src/utils/scheduler');

const teams = [
  { id: '1', name: 'T1' },
  { id: '2', name: 'T2' },
  { id: '3', name: 'T3' },
  { id: '4', name: 'T4' },
];

const matches = generateStructure(teams, 'Knockout');
console.log('Matches:', matches.length);

const slotsConfig = [
  { date: '2026-05-20', slots: [{ time: '18:00', pitchesCount: 2 }] },
];

try {
  const final = allocateGreedy(matches, slotsConfig);
  console.log('Final:', final.length);
} catch (e) {
  console.log('Error:', e.message);
}
