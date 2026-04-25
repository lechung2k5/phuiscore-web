const { generateStructure } = require('./apps/server/src/utils/scheduler');

const teams2 = [
  { id: 't1', name: 'Team A' },
  { id: 't2', name: 'Team B' }
];

console.log('League 2 Matches:', generateStructure(teams2, 'League').length);
console.log('GroupKnockout 2 Matches:', generateStructure(teams2, 'GroupKnockout').length);
