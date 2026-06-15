require('dotenv').config({ path: './apps/server/.env' });
const fs = require('fs');
const TournamentRepo = require('./apps/server/src/repositories/tournament.repo');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./apps/server/src/config/db.config');

async function sync() {
    const mapping = JSON.parse(fs.readFileSync('excel_updates.json', 'utf8'));
    const idMap = new Map();
    const nameMap = new Map();
    
    console.log('Updating TeamMembers table...');
    for (const m of mapping) {
        idMap.set(m.member_id, m.avatar);
        nameMap.set(m.member_id, m.name);
        
        const expr = [];
        const attrs = {};
        if (m.avatar) {
            expr.push('avatar = :avatar');
            attrs[':avatar'] = m.avatar;
        }
        if (m.name) {
            expr.push('#n = :name');
            attrs[':name'] = m.name;
        }
        
        if (expr.length > 0) {
            const params = {
                TableName: 'PhuiScore_TeamMembers',
                Key: { id: m.member_id },
                UpdateExpression: 'SET ' + expr.join(', '),
                ExpressionAttributeValues: attrs
            };
            if (m.name) {
                params.ExpressionAttributeNames = { '#n': 'name' };
            }
            await docClient.send(new UpdateCommand(params));
        }
    }

    console.log('Syncing to Tournaments table...');
    const tourneys = await TournamentRepo.getAll();
    const t = tourneys[0];
    if (t) {
        let updated = false;
        // Map old names to new names for stats replacement
        const oldNameToNewName = new Map();

        if (t.teams) {
            for (const team of t.teams) {
                if (team.players) {
                    for (const player of team.players) {
                        const newAvatar = idMap.get(player.id);
                        const newName = nameMap.get(player.id);
                        
                        if (newName && player.name !== newName) {
                            oldNameToNewName.set(player.name, newName);
                            player.name = newName;
                            player.playerName = newName; // In some structures
                            updated = true;
                        }
                        if (newAvatar) {
                            player.avatar = newAvatar;
                            player.photo = newAvatar;
                            updated = true;
                        }
                    }
                }
            }
        }
        
        const updates = {};
        if (updated) updates.teams = t.teams;
        
        let statsUpdated = false;
        if (t.stats) {
            if (t.stats.topScorers) {
                for (const p of t.stats.topScorers) {
                    if (oldNameToNewName.has(p.playerName)) {
                        p.playerName = oldNameToNewName.get(p.playerName);
                        statsUpdated = true;
                    }
                    
                    let avatar = null;
                    if (t.teams) {
                        for(const team of t.teams) {
                            if(team.players) {
                                const found = team.players.find(x => x.name === p.playerName);
                                if (found && idMap.has(found.id)) {
                                    avatar = idMap.get(found.id);
                                    break;
                                }
                            }
                        }
                    }
                    if (avatar) {
                        p.playerPhoto = avatar;
                        statsUpdated = true;
                    }
                }
            }
            if (t.stats.cards) {
                for (const p of t.stats.cards) {
                    if (oldNameToNewName.has(p.playerName)) {
                        p.playerName = oldNameToNewName.get(p.playerName);
                        statsUpdated = true;
                    }

                    let avatar = null;
                    if (t.teams) {
                        for(const team of t.teams) {
                            if(team.players) {
                                const found = team.players.find(x => x.name === p.playerName);
                                if (found && idMap.has(found.id)) {
                                    avatar = idMap.get(found.id);
                                    break;
                                }
                            }
                        }
                    }
                    if (avatar) {
                        p.playerPhoto = avatar;
                        statsUpdated = true;
                    }
                }
            }
            if (statsUpdated) updates.stats = t.stats;
        }
        
        if (Object.keys(updates).length > 0) {
            await TournamentRepo.update(t.id, updates);
            console.log('Updated tournament stats and teams with avatars and new names.');
        } else {
            console.log('No updates needed for tournament.');
        }
    }
}
sync().catch(console.error);
