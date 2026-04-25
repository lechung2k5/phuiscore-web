const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./apps/server/src/config/db.config');

async function test() {
  const result = await docClient.send(new ScanCommand({ TableName: 'PhuiScore_Tournaments' }));
  const tournaments = result.Items;
  console.log(`Found ${tournaments.length} tournaments`);
  tournaments.forEach(t => {
      console.log(`Tournament ID: ${t.id} | Name: ${t.name} | Format: '${t.format}' | Teams: ${t.teams?.length}`);
  });
}

test().catch(console.error);
