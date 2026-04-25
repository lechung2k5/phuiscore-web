const { ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./apps/server/src/config/db.config');

async function test() {
  const result = await docClient.send(new ScanCommand({ TableName: 'PhuiScore_Matches' }));
  console.log(`Scan all matches: ${result.Items.length}`);
  
  const q = await docClient.send(new QueryCommand({
      TableName: 'PhuiScore_Matches',
      IndexName: "TournamentIndex",
      KeyConditionExpression: "gsi1_pk = :tId",
      ExpressionAttributeValues: {
          ":tId": "TOURNAMENT#f1da4d79-ba4d-4085-8c3a-43eaaa7a16cc"
      }
  })).catch(e => console.error("Error querying GSI:", e.message));
  if (q) console.log("GSI Matches:", q.Items?.length);
}

test().catch(console.error);
