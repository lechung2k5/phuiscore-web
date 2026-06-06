require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { ScanCommand, GetCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../src/config/db.config');

const PRESERVE_TOURNAMENT_ID = 'e691a46c-1a5e-469c-b363-139c007ac4c4';
const EXECUTE = process.argv.includes('--execute');

const backupDir = path.resolve(__dirname, '..', '..', '..', 'scratch', 'db-backups', new Date().toISOString().replace(/[:.]/g, '-'));

const tables = {
  tournaments: { name: 'PhuiScore_Tournaments', key: ['id'] },
  matches: { name: process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Matches` : 'PhuiScore_Matches', key: ['pk', 'sk'] },
  tournamentTeams: { name: 'PhuiScore_TournamentTeams', key: ['id'] },
  teamStats: { name: 'PhuiScore_TeamStats', key: ['id'] },
  teams: { name: 'PhuiScore_Teams', key: ['id'] },
  teamMembers: { name: 'PhuiScore_TeamMembers', key: ['id'] },
  players: { name: 'PhuiScore_Players', key: ['id'] },
  standings: { name: process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Standings` : 'PhuiScore_Standings', key: ['tournamentId', 'seasonId'] },
  externalNews: { name: 'PhuiScore_ExternalNews', key: ['id'] },
  notifications: { name: 'Notifications', key: ['userId', 'id'] },
  auditLogs: { name: 'PhuiScore_AuditLogs', key: ['id', 'timestamp'] },
  liveChats: { name: 'PhuiScore_LiveChats', key: ['matchId', 'timestamp'] },
};

const userTable = process.env.DYNAMODB_TABLE_NAME ? `${process.env.DYNAMODB_TABLE_NAME}_Users` : 'PhuiScore_Users';

const scanAll = async (tableName) => {
  const items = [];
  let ExclusiveStartKey;

  try {
    do {
      const result = await docClient.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
      items.push(...(result.Items || []));
      ExclusiveStartKey = result.LastEvaluatedKey;
    } while (ExclusiveStartKey);
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.warn(`[Skip] Table not found: ${tableName}`);
      return null;
    }
    throw err;
  }

  return items;
};

const scanAllState = async (tableName) => {
  const items = await scanAll(tableName);
  return { exists: items !== null, items: items || [] };
};

const keyOf = (item, keyFields) => Object.fromEntries(keyFields.map((field) => [field, item[field]]));

const batchDelete = async (tableName, keyFields, items) => {
  for (let i = 0; i < items.length; i += 25) {
    let requestItems = {
      [tableName]: items.slice(i, i + 25).map((item) => ({
        DeleteRequest: { Key: keyOf(item, keyFields) },
      })),
    };

    do {
      const result = await docClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
      requestItems = result.UnprocessedItems || {};
      if (Object.keys(requestItems).length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } while (Object.keys(requestItems).length > 0);
  }
};

const backup = (tableName, items) => {
  if (!EXECUTE || items.length === 0) return;
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(path.join(backupDir, `${tableName}.json`), JSON.stringify(items, null, 2));
};

const getPreservedTournament = async () => {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: tables.tournaments.name,
      Key: { id: PRESERVE_TOURNAMENT_ID },
    }));
    return result.Item || null;
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      throw new Error(`Required table not found: ${tables.tournaments.name}`);
    }
    throw err;
  }
};

const withItems = async (table, buildItems) => {
  const items = await buildItems();
  return { ...table, exists: items !== null, items: items || [] };
};

const withScannedItems = (table, state, filterItems) => ({
  ...table,
  exists: state.exists,
  items: state.exists ? filterItems(state.items) : [],
});

const addTournamentTeams = (tournament, keepTeamIds) => {
  for (const team of tournament?.teams || []) {
    if (team.id) keepTeamIds.add(String(team.id));
    if (team.teamId) keepTeamIds.add(String(team.teamId));
  }
};

const addPossibleStandingIds = (tournament, keepStandingIds) => {
  const possibleFields = ['tournamentId', 'sofaTournamentId', 'uniqueTournamentId', 'externalId', 'standingTournamentId'];
  for (const field of possibleFields) {
    const value = Number(tournament?.[field]);
    if (Number.isFinite(value) && value > 0) keepStandingIds.add(value);
  }
};

const main = async () => {
  console.log(EXECUTE ? '[EXECUTE] Cleanup will delete data.' : '[DRY RUN] No data will be deleted.');
  console.log(`Preserving tournament: ${PRESERVE_TOURNAMENT_ID}`);
  console.log(`Skipping user table entirely: ${userTable}`);

  const preservedTournament = await getPreservedTournament();
  if (!preservedTournament) {
    throw new Error(`Tournament ${PRESERVE_TOURNAMENT_ID} not found. Aborting.`);
  }

  const keepTeamIds = new Set();
  const keepStandingIds = new Set();
  addTournamentTeams(preservedTournament, keepTeamIds);
  addPossibleStandingIds(preservedTournament, keepStandingIds);

  const tournamentTeamsState = await scanAllState(tables.tournamentTeams.name);
  const allTournamentTeams = tournamentTeamsState.items;
  for (const item of allTournamentTeams) {
    if (String(item.tournamentId) === PRESERVE_TOURNAMENT_ID && item.teamId) {
      keepTeamIds.add(String(item.teamId));
    }
  }

  const teamStatsState = await scanAllState(tables.teamStats.name);
  const allTeamStats = teamStatsState.items;
  for (const item of allTeamStats) {
    if (String(item.tournamentId) === PRESERVE_TOURNAMENT_ID && item.teamId) {
      keepTeamIds.add(String(item.teamId));
    }
  }

  const standingsState = await scanAllState(tables.standings.name);
  if (standingsState.exists && keepStandingIds.size === 0) {
    console.warn('[Keep] No numeric standing ID found for preserved tournament. PhuiScore_Standings will be left untouched.');
  }

  const plan = [
    await withItems(tables.tournaments, async () => (await scanAll(tables.tournaments.name)).filter((item) => String(item.id) !== PRESERVE_TOURNAMENT_ID)),
    await withItems(tables.matches, async () => ((await scanAll(tables.matches.name)) || []).filter((item) =>
        String(item.tournamentId) !== PRESERVE_TOURNAMENT_ID &&
        item.gsi1_pk !== `TOURNAMENT#${PRESERVE_TOURNAMENT_ID}`
      )),
    withScannedItems(tables.tournamentTeams, tournamentTeamsState, (items) => items.filter((item) => String(item.tournamentId) !== PRESERVE_TOURNAMENT_ID)),
    withScannedItems(tables.teamStats, teamStatsState, (items) => items.filter((item) => String(item.tournamentId) !== PRESERVE_TOURNAMENT_ID)),
    await withItems(tables.teams, async () => ((await scanAll(tables.teams.name)) || []).filter((item) => !keepTeamIds.has(String(item.id)))),
    await withItems(tables.teamMembers, async () => ((await scanAll(tables.teamMembers.name)) || []).filter((item) => !keepTeamIds.has(String(item.teamId)))),
    await withItems(tables.players, async () => ((await scanAll(tables.players.name)) || []).filter((item) => !keepTeamIds.has(String(item.teamId)))),
    withScannedItems(tables.standings, standingsState, (items) =>
      keepStandingIds.size === 0 ? [] : items.filter((item) => !keepStandingIds.has(Number(item.tournamentId)))
    ),
    withScannedItems(tables.externalNews, await scanAllState(tables.externalNews.name), () => []),
    await withItems(tables.notifications, async () => await scanAll(tables.notifications.name)),
    await withItems(tables.auditLogs, async () => await scanAll(tables.auditLogs.name)),
    await withItems(tables.liveChats, async () => await scanAll(tables.liveChats.name)),
  ];

  console.table(plan.map(({ name, exists, items }) => ({ table: name, exists, deleteCount: items.length })));
  console.log(`Keeping related team IDs: ${keepTeamIds.size}`);
  console.log(`Keeping numeric standing IDs: ${Array.from(keepStandingIds).join(', ') || '(none)'}`);

  if (!EXECUTE) {
    console.log('Dry-run complete. Re-run with --execute to delete and write backups.');
    return;
  }

  for (const { name, key, exists, items } of plan) {
    if (!exists) continue;
    backup(name, items);
    await batchDelete(name, key, items);
    console.log(`[Deleted] ${items.length} items from ${name}`);
  }

  console.log(`Cleanup complete. Backups written to: ${backupDir}`);
};

main().catch((err) => {
  console.error('[Cleanup failed]', err);
  process.exitCode = 1;
});
