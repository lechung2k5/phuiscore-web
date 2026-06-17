require('dotenv').config({ path: './apps/server/.env' });
const { docClient } = require('./apps/server/src/config/db.config');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

async function fix() {
  const rosters = {
    'Real Madrid': ['Courtois', 'Carvajal', 'Militao', 'Alaba', 'Rudiger', 'Mendy', 'Kroos', 'Modric', 'Valverde', 'Bellingham', 'Vinicius Jr', 'Rodrygo', 'Joselu', 'Camavinga', 'Tchouameni', 'Brahim Diaz', 'Ceballos', 'Fran Garcia', 'Arda Guler', 'Kepa'],
    'Bayern Munich': ['Neuer', 'Kimmich', 'De Ligt', 'Kim Min-jae', 'Davies', 'Goretzka', 'Laimer', 'Sane', 'Musiala', 'Coman', 'Kane', 'Muller', 'Choupo-Moting', 'Tel', 'Guerreiro', 'Upamecano', 'Dier', 'Mazraoui', 'Pavlovic', 'Ulreich']
  };

  const getSquad = (teamName, teamId) => {
    const squad = [];
    const roster = rosters[teamName] || [];
    for(let p = 1; p <= 20; p++) {
        let pos = 'FW';
        if (p === 1 || p === 20) pos = 'GK';
        else if (p >= 2 && p <= 6) pos = 'DF';
        else if (p >= 7 && p <= 12) pos = 'MF';
        else if (p >= 14 && p <= 17) pos = 'DF';
        else if (p >= 18) pos = 'MF';

        const pName = roster[p - 1] || `${teamName} Player ${p}`;
        squad.push({
            id: teamId + '_p' + p,
            player: {
                id: teamId + '_p' + p,
                name: pName,
                avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(pName)}`
            },
            position: pos,
            shirtNumber: p === 20 ? 99 : p
        });
    }
    return squad;
  };

  const homeSquad = getSquad('Bayern Munich', 'ee9a2366-eb89-440d-ab74-3463ea86519a');
  const awaySquad = getSquad('Real Madrid', 'e09b7128-7b27-4250-bc0a-4f3004123421');

  const lineups = {
    home: { players: homeSquad, manager: { id: 'c_bayern', name: 'Thomas Tuchel' } },
    away: { players: awaySquad, manager: { id: 'c_real', name: 'Carlo Ancelotti' } }
  };

  const updateCommand = new UpdateCommand({
    TableName: 'PhuiScore_Matches',
    Key: { pk: 'DATE#2026-06-16', sk: 'MATCH#18c4c870-847e-476b-9718-26a2065a9053' },
    UpdateExpression: 'SET lineups = :l',
    ExpressionAttributeValues: {
      ':l': lineups
    }
  });

  try {
    await docClient.send(updateCommand);
    console.log('Successfully updated match lineups!');
  } catch(e) {
    console.error('Error:', e);
  }
}
fix();
