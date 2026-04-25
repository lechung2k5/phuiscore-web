const { generateStructure, allocateGreedy } = require('./apps/server/src/utils/scheduler');

// Mock teams
const teams = [
  { id: 't1', name: 'Team A' },
  { id: 't2', name: 'Team B' },
  { id: 't3', name: 'Team C' }
];

const matches = generateStructure(teams, 'League');
console.log('League Matches:', matches.length);

const matchesGroup = generateStructure(teams, 'GroupKnockout');
console.log('GroupKnockout Matches:', matchesGroup.length);

const teams4 = [
  { id: 't1', name: 'Team A' },
  { id: 't2', name: 'Team B' },
  { id: 't3', name: 'Team C' },
  { id: 't4', name: 'Team D' }
];
console.log('League 4 Matches:', generateStructure(teams4, 'League').length);
console.log('GroupKnockout 4 Matches:', generateStructure(teams4, 'GroupKnockout').length);

const slotsConfig = [
  { date: '2026-05-20', slots: [{ time: '18:00', pitchesCount: 2 }] },
  { date: '2026-05-21', slots: [{ time: '18:00', pitchesCount: 2 }] }
];
console.log('Slots:', allocateGreedy(generateStructure(teams4, 'League'), slotsConfig).length);
