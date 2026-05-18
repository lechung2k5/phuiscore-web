require('dotenv').config();
const bcrypt = require('bcryptjs');
const UserRepo = require('./src/repositories/user.repo');

async function seedAdmin() {
    try {
        const username = 'admin1';
        const password = 'Lechung123';
        const role = 'admin';

        console.log(`[Seed] 🛡️ Đang tạo tài khoản ${role}: ${username}...`);

        const existingUser = await UserRepo.findUserByUsername(username);
        if (existingUser) {
            console.log(`[Seed] ⚠️ Tài khoản ${username} đã tồn tại rồi đại ca ơi!`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            fullName: 'Lê Chung Admin',
            email: 'admin1@phuiscore.com',
            phoneNumber: '0987654321',
            password: hashedPassword,
            role: role,
            plan: 'PREMIUM',
            usage: { 
                matchesCreated: 0, 
                leaguesCreated: 0, 
                limitMatches: 9999, 
                limitLeagues: 999 
            },
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
        };

        await UserRepo.createUser(newUser);
        console.log(`[Seed] ✅ Đã tạo tài khoản ${role} thành công!`);
        console.log(`[Seed] 👤 Username: ${username}`);
        console.log(`[Seed] 🔑 Password: ${password}`);
        
        process.exit(0);
    } catch (error) {
        console.error("[Seed] ❌ Lỗi khi seed tài khoản:", error);
        process.exit(1);
    }
}

seedAdmin();
