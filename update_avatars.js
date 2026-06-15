require('dotenv').config({ path: './apps/server/.env' });
const fs = require('fs');
const TeamMemberRepo = require('./apps/server/src/repositories/teamMember.repo');

async function updateAvatars() {
    console.log("Reading avatar_mapping.json...");
    if (!fs.existsSync('avatar_mapping.json')) {
        console.error("avatar_mapping.json not found!");
        process.exit(1);
    }
    
    const mapping = JSON.parse(fs.readFileSync('avatar_mapping.json', 'utf8'));
    console.log(`Found ${mapping.length} avatars to update.`);
    
    let success = 0;
    let failed = 0;
    
    for (const item of mapping) {
        try {
            await TeamMemberRepo.update(item.member_id, { avatar: item.avatar });
            console.log(`✅ Updated avatar for member ${item.member_id}`);
            success++;
        } catch (err) {
            console.error(`❌ Failed to update avatar for member ${item.member_id}:`, err.message);
            failed++;
        }
    }
    
    console.log(`\nDONE! Success: ${success}, Failed: ${failed}`);
    process.exit(0);
}

updateAvatars().catch(console.error);
