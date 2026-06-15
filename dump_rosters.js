require('dotenv').config({ path: './apps/server/.env' });
const fs = require('fs');
const TeamRepo = require('./apps/server/src/repositories/team.repo');
const TeamMemberRepo = require('./apps/server/src/repositories/teamMember.repo');

async function dump() {
    const teams = await TeamRepo.getByManagerId('media1');
    const rosters = [];
    
    for (const t of teams) {
        const members = await TeamMemberRepo.getByTeamId(t.id);
        rosters.push({
            id: t.id,
            name: t.name,
            short_name: t.short_name,
            members: members.map(m => ({ id: m.id, name: m.name, role: m.role }))
        });
    }
    
    fs.writeFileSync('rosters.json', JSON.stringify(rosters, null, 2));
    console.log("Dumped rosters.json");
    process.exit(0);
}

dump().catch(console.error);
