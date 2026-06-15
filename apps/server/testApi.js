const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch(e) { resolve(null); }
            });
        }).on('error', reject);
    });
}

async function test() {
    console.log("Fetching Real Madrid...");
    const data = await fetchJson('https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?t=Real%20Madrid');
    if (data && data.player) {
        console.log(`Found ${data.player.length} players!`);
        console.log(data.player[0].strPlayer, data.player[0].strCutout);
    } else {
        console.log("No data or API key 3 blocked. Let's try 1...");
        const data1 = await fetchJson('https://www.thesportsdb.com/api/v1/json/1/searchplayers.php?t=Real%20Madrid');
        if (data1 && data1.player) {
            console.log(`Found ${data1.player.length} players via key 1!`);
            console.log(data1.player[0].strPlayer, data1.player[0].strCutout);
        } else {
            console.log("API not working.");
        }
    }
}
test();
