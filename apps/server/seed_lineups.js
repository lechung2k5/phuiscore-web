require('dotenv').config();
const { docClient } = require('./src/config/db.config');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const MatchRepo = require('./src/repositories/match.repo.js');

const seed = async () => {
  const date = new Date().toISOString().split('T')[0];
  const matches = await MatchRepo.getMatchesByDate(date);
  for (let m of matches) {
    if (!isNaN(parseInt(m.id))) continue; // skip numbers (sofascore matches)
    const h = m.homeTeam?.name || 'Home';
    const a = m.awayTeam?.name || 'Away';
    const lineups = {
      home: {
        players: Array.from({ length: 12 }).map((_, i) => ({
          id: m.id + '_h' + i,
          player: { name: h + ' Player ' + (i + 1), id: m.id + '_h' + i },
          position: i == 0 ? 'GK' : (i < 4 ? 'DF' : (i < 8 ? 'MF' : 'FW')),
          shirtNumber: i + 1
        }))
      },
      away: {
        players: Array.from({ length: 12 }).map((_, i) => ({
          id: m.id + '_a' + i,
          player: { name: a + ' Player ' + (i + 1), id: m.id + '_a' + i },
          position: i == 0 ? 'GK' : (i < 4 ? 'DF' : (i < 8 ? 'MF' : 'FW')),
          shirtNumber: i + 1
        }))
      }
    };
    await docClient.send(new UpdateCommand({
      TableName: 'PhuiScore_Matches',
      Key: { pk: `DATE#${date}`, sk: `MATCH#${m.id}` },
      UpdateExpression: 'SET lineups = :lineups',
      ExpressionAttributeValues: { ':lineups': lineups }
    }));
    console.log('Seeded match: ' + m.id + ' (' + h + ' vs ' + a + ')');
  }
};

seed().then(() => console.log('Done')).catch(console.error);
