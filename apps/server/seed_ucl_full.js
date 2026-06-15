require('dotenv').config();
const { docClient } = require('./src/config/db.config');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const seedUCL = async () => {
    console.log("Seeding UCL Tournament...");
    
    const tId = "UCL_" + Date.now();
    const tournament = {
        id: tId,
        name: "UEFA Champions League (Phủi)",
        status: "Ongoing",
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/UEFA_Champions_League_logo_2.svg/1200px-UEFA_Champions_League_logo_2.svg.png",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        teams: []
    };
    
    const teamDataList = [
        { name: "Real Madrid FC", logo: "https://crests.football-data.org/86.png", group: "A" },
        { name: "Manchester City", logo: "https://crests.football-data.org/65.png", group: "A" },
        { name: "Bayern Munich", logo: "https://crests.football-data.org/5.png", group: "A" },
        { name: "Paris Saint-Germain", logo: "https://crests.football-data.org/524.png", group: "A" },
        { name: "Barcelona", logo: "https://crests.football-data.org/81.png", group: "B" },
        { name: "Arsenal", logo: "https://crests.football-data.org/57.png", group: "B" },
        { name: "Liverpool", logo: "https://crests.football-data.org/64.png", group: "B" },
        { name: "AC Milan", logo: "https://crests.football-data.org/98.png", group: "B" }
    ];
    
    const teams = [];
    const teamSquads = {}; 
    const teamCoaches = {
        "Real Madrid FC": "Carlo Ancelotti",
        "Manchester City": "Pep Guardiola",
        "Bayern Munich": "Thomas Tuchel",
        "Paris Saint-Germain": "Luis Enrique",
        "Barcelona": "Xavi Hernandez",
        "Arsenal": "Mikel Arteta",
        "Liverpool": "Jurgen Klopp",
        "AC Milan": "Stefano Pioli"
    };

    const rosters = {
        "Real Madrid FC": ["Courtois", "Carvajal", "Militao", "Alaba", "Rudiger", "Mendy", "Kroos", "Modric", "Valverde", "Bellingham", "Vinicius Jr", "Rodrygo", "Joselu", "Camavinga", "Tchouameni", "Brahim Diaz", "Ceballos", "Fran Garcia", "Arda Guler", "Kepa"],
        "Manchester City": ["Ederson", "Walker", "Dias", "Stones", "Ake", "Gvardiol", "Rodri", "De Bruyne", "Bernardo Silva", "Foden", "Haaland", "Alvarez", "Doku", "Grealish", "Kovacic", "Matheus Nunes", "Akanji", "Lewis", "Oscar Bobb", "Ortega"],
        "Bayern Munich": ["Neuer", "Kimmich", "De Ligt", "Kim Min-jae", "Davies", "Goretzka", "Laimer", "Sane", "Musiala", "Coman", "Kane", "Muller", "Choupo-Moting", "Tel", "Guerreiro", "Upamecano", "Dier", "Mazraoui", "Pavlovic", "Ulreich"],
        "Paris Saint-Germain": ["Donnarumma", "Hakimi", "Marquinhos", "Skriniar", "Hernandez", "Ugarte", "Fabian Ruiz", "Zaire-Emery", "Dembele", "Mbappe", "Kolo Muani", "Goncalo Ramos", "Asensio", "Vitinha", "Lee Kang-in", "Danilo Pereira", "Beraldo", "Nuno Mendes", "Soler", "Navas"],
        "Barcelona": ["Ter Stegen", "Kounde", "Araujo", "Christensen", "Cancelo", "De Jong", "Pedri", "Gundogan", "Raphinha", "Lewandowski", "Joao Felix", "Lamine Yamal", "Ferran Torres", "Fermin Lopez", "Oriol Romeu", "Inigo Martinez", "Sergi Roberto", "Marcos Alonso", "Balde", "Inaki Pena"],
        "Arsenal": ["Raya", "White", "Saliba", "Gabriel", "Zinchenko", "Rice", "Odegaard", "Havertz", "Saka", "Gabriel Jesus", "Martinelli", "Trossard", "Jorginho", "Partey", "Kiwior", "Tomiyasu", "Smith Rowe", "Nketiah", "Reiss Nelson", "Ramsdale"],
        "Liverpool": ["Alisson", "Alexander-Arnold", "Konate", "Van Dijk", "Robertson", "Endo", "Mac Allister", "Szoboszlai", "Salah", "Darwin Nunez", "Luis Diaz", "Diogo Jota", "Cody Gakpo", "Harvey Elliott", "Curtis Jones", "Gravenberch", "Joe Gomez", "Quansah", "Bradley", "Kelleher"],
        "AC Milan": ["Maignan", "Calabria", "Thiaw", "Tomori", "Theo Hernandez", "Loftus-Cheek", "Reijnders", "Bennacer", "Pulisic", "Giroud", "Rafael Leao", "Chukwueze", "Okafor", "Luka Jovic", "Adli", "Musah", "Kjaer", "Gabbia", "Florenzi", "Sportiello"]
    };

    const teamCoachesObj = {};

    for (let i = 0; i < teamDataList.length; i++) {
        const td = teamDataList[i];
        const teamId = "TEAM_" + Date.now() + "_" + i;
        const teamObj = {
            id: teamId,
            name: td.name,
            logo: td.logo,
            group: td.group,
            status: "Approved",
            registeredAt: Date.now()
        };
        teams.push(teamObj);
        tournament.teams.push(teamObj);
        
        teamCoachesObj[teamId] = { id: "C_" + teamId, name: teamCoaches[td.name] || "HLV " + td.name };

        const squad = [];
        const roster = rosters[td.name] || [];
        for(let p = 1; p <= 20; p++) {
            let pos = "FW";
            if (p === 1 || p === 20) pos = "GK";
            else if (p >= 2 && p <= 6) pos = "DF";
            else if (p >= 7 && p <= 12) pos = "MF";
            else if (p >= 14 && p <= 17) pos = "DF";
            else if (p >= 18) pos = "MF";

            const pName = roster[p - 1] || `${td.name} Player ${p}`;
            squad.push({
                id: teamId + "_p" + p,
                player: {
                    id: teamId + "_p" + p,
                    name: pName,
                    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(pName)}`
                },
                position: pos,
                shirtNumber: p === 20 ? 99 : p
            });
        }
        teamSquads[teamId] = squad;
    }
    
    await docClient.send(new PutCommand({ TableName: "PhuiScore_Tournaments", Item: tournament }));
    console.log("Tournament saved:", tId);
    
    const matchesToInsert = [];
    let matchCounter = 1;

    const generateGroupMatches = (groupTeams, weekBase) => {
        // Week 1
        matchesToInsert.push(createMatch(tId, groupTeams[0], groupTeams[1], weekBase));
        matchesToInsert.push(createMatch(tId, groupTeams[2], groupTeams[3], weekBase));
        // Week 2
        matchesToInsert.push(createMatch(tId, groupTeams[0], groupTeams[2], weekBase + 7));
        matchesToInsert.push(createMatch(tId, groupTeams[1], groupTeams[3], weekBase + 7));
        // Week 3
        matchesToInsert.push(createMatch(tId, groupTeams[0], groupTeams[3], weekBase + 14));
        matchesToInsert.push(createMatch(tId, groupTeams[1], groupTeams[2], weekBase + 14));
    };

    function createMatch(tournId, home, away, dayOffset) {
        const mDate = new Date();
        mDate.setDate(mDate.getDate() + dayOffset);
        const dateString = mDate.toISOString().split('T')[0];
        const matchId = "ucl_m" + (matchCounter++);
        
        return {
            pk: `DATE#${dateString}`,
            sk: `MATCH#${matchId}`,
            gsi1_pk: `TOURNAMENT#${tournId}`,
            id: matchId,
            tournamentId: tournId,
            tournamentName: tournament.name,
            tournamentLogo: tournament.logo,
            dateString: dateString,
            timeString: "19:00",
            status: "inprogress", // All matches requested as "đang đá"
            liveStatus: "streaming",
            isManualControl: true,
            homeTeam: { name: home.name, logo: home.logo },
            awayTeam: { name: away.name, logo: away.logo },
            score: { home: Math.floor(Math.random()*3), away: Math.floor(Math.random()*3) },
            currentMinute: Math.floor(Math.random()*90).toString(),
            lineups: {
                home: { players: teamSquads[home.id], manager: teamCoachesObj[home.id] },
                away: { players: teamSquads[away.id], manager: teamCoachesObj[away.id] }
            },
            updatedAt: new Date().toISOString()
        };
    }

    const groupA = teams.filter(t => t.group === 'A');
    const groupB = teams.filter(t => t.group === 'B');
    
    generateGroupMatches(groupA, 0);
    generateGroupMatches(groupB, 0);
    
    for (const match of matchesToInsert) {
        await docClient.send(new PutCommand({ TableName: "PhuiScore_Matches", Item: match }));
        console.log(`Saved Match ${match.id} on ${match.dateString}`);
    }
}

seedUCL().then(() => console.log('UCL Seeding Complete!')).catch(console.error);
