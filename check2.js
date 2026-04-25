require('dotenv').config();
const { docClient } = require('./apps/server/src/config/db.config');
const { ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const run = async () => {
    // try to query latest tournament matches
    const result = await docClient.send(new ScanCommand({
        TableName: 'PhuiScore_Matches',
        Limit: 10
    }));
    
    console.log(JSON.stringify(result.Items.map(i => ({
        id: i.id,
        tournamentId: i.tournamentId,
        dateString: i.dateString || 'MISSING',
        timeString: i.timeString || 'MISSING'
    })), null, 2));
}

run();
