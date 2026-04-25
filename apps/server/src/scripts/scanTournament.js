const axios = require('axios');
const fs = require('fs'); // Thêm dòng này

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const checkAllLeagues = async () => {
    try {
        const catRes = await axios.get('https://www.sofascore.com/api/v1/sport/football/categories', { headers: HEADERS });
        const categories = catRes.data.categories;
        
        let outputData = "DANH SÁCH GIẢI ĐẤU SOFASCORE\n============================\n\n";
        
        for (let i = 0; i < categories.length; i++) {
            const cat = categories[i];
            try {
                const tourRes = await axios.get(`https://www.sofascore.com/api/v1/category/${cat.id}/unique-tournaments`, { headers: HEADERS });
                const tournaments = tourRes.data.groups[0]?.uniqueTournaments || [];
                
                if (tournaments.length > 0) {
                    outputData += `--- 🌍 ${cat.name.toUpperCase()} ---\n`;
                    tournaments.forEach(t => {
                        outputData += `[ID: ${t.id}] - ${t.name} (${t.userCount} followers)\n`;
                    });
                    outputData += "\n";
                    console.log(`✅ Đã quét xong: ${cat.name}`); // Vẫn in ra màn hình để ông theo dõi tiến độ
                }
            } catch (err) {
                console.log(`❌ Lỗi tại ${cat.name}`);
            }
            await new Promise(r => setTimeout(r, 800)); // Nghỉ để tránh bị ban
        }

        // --- ĐOẠN QUAN TRỌNG NHẤT: GHI FILE ---
        fs.writeFileSync('leagues_list.txt', outputData, 'utf8');
        console.log("\n🎉 XONG RỒI! Đại ca mở file leagues_list.txt lên mà hưởng thụ thành quả nhé.");

    } catch (error) {
        console.error("Lỗi:", error.message);
    }
};

checkAllLeagues();