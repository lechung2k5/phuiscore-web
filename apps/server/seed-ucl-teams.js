require('dotenv').config();
const TeamRepo = require('./src/repositories/team.repo');
const TeamMemberRepo = require('./src/repositories/teamMember.repo');
const { docClient } = require('./src/config/db.config');
const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");

// Dữ liệu 8 đội bóng UCL và cầu thủ với hình ảnh thật
const UCL_DATA = [
    {
        team: {
            name: "Real Madrid",
            short_name: "RMA",
            leader: "Carlo Ancelotti",
            area: "Madrid, Spain",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/8633.png",
            primary_color: "#FFFFFF",
            secondary_color: "#FEBE10",
            description: "Los Blancos - Vua của Champions League."
        },
        players: [
            { name: "Thibaut Courtois", num: 1, pos: "GK", avatar: "https://cdn.sofifa.net/players/192/119/24_120.png", role: "player" },
            { name: "Dani Carvajal", num: 2, pos: "RB", avatar: "https://cdn.sofifa.net/players/204/963/24_120.png", role: "player" },
            { name: "Eder Militao", num: 3, pos: "CB", avatar: "https://cdn.sofifa.net/players/240/130/24_120.png", role: "player" },
            { name: "Antonio Rudiger", num: 22, pos: "CB", avatar: "https://cdn.sofifa.net/players/205/452/24_120.png", role: "player" },
            { name: "Ferland Mendy", num: 23, pos: "LB", avatar: "https://cdn.sofifa.net/players/228/618/24_120.png", role: "player" },
            { name: "Fede Valverde", num: 15, pos: "CM", avatar: "https://cdn.sofifa.net/players/239/053/24_120.png", role: "player" },
            { name: "Aurelien Tchouameni", num: 18, pos: "CDM", avatar: "https://cdn.sofifa.net/players/241/637/24_120.png", role: "player" },
            { name: "Eduardo Camavinga", num: 12, pos: "CM", avatar: "https://cdn.sofifa.net/players/258/092/24_120.png", role: "player" },
            { name: "Jude Bellingham", num: 5, pos: "CAM", avatar: "https://cdn.sofifa.net/players/252/371/24_120.png", role: "captain" },
            { name: "Vinicius Junior", num: 7, pos: "LW", avatar: "https://cdn.sofifa.net/players/238/794/24_120.png", role: "player" },
            { name: "Kylian Mbappe", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/231/747/24_120.png", role: "player" },
            { name: "Rodrygo", num: 11, pos: "RW", avatar: "https://cdn.sofifa.net/players/243/812/24_120.png", role: "player" },
            { name: "Luka Modric", num: 10, pos: "CM", avatar: "https://cdn.sofifa.net/players/177/003/24_120.png", role: "player" },
            { name: "Brahim Diaz", num: 21, pos: "CAM", avatar: "https://cdn.sofifa.net/players/231/410/24_120.png", role: "player" },
            { name: "Andriy Lunin", num: 13, pos: "GK", avatar: "https://cdn.sofifa.net/players/243/630/24_120.png", role: "player" }
        ]
    },
    {
        team: {
            name: "Manchester City",
            short_name: "MCI",
            leader: "Pep Guardiola",
            area: "Manchester, England",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/8456.png",
            primary_color: "#6CABDD",
            secondary_color: "#1C2C5B",
            description: "The Citizens."
        },
        players: [
            { name: "Ederson", num: 31, pos: "GK", avatar: "https://cdn.sofifa.net/players/210/257/24_120.png", role: "player" },
            { name: "Kyle Walker", num: 2, pos: "RB", avatar: "https://cdn.sofifa.net/players/188/377/24_120.png", role: "captain" },
            { name: "Ruben Dias", num: 3, pos: "CB", avatar: "https://cdn.sofifa.net/players/239/818/24_120.png", role: "player" },
            { name: "John Stones", num: 5, pos: "CB", avatar: "https://cdn.sofifa.net/players/203/574/24_120.png", role: "player" },
            { name: "Nathan Ake", num: 6, pos: "LB", avatar: "https://cdn.sofifa.net/players/208/702/24_120.png", role: "player" },
            { name: "Rodri", num: 16, pos: "CDM", avatar: "https://cdn.sofifa.net/players/231/866/24_120.png", role: "player" },
            { name: "Kevin De Bruyne", num: 17, pos: "CM", avatar: "https://cdn.sofifa.net/players/192/985/24_120.png", role: "player" },
            { name: "Bernardo Silva", num: 20, pos: "CM", avatar: "https://cdn.sofifa.net/players/218/667/24_120.png", role: "player" },
            { name: "Phil Foden", num: 47, pos: "RW", avatar: "https://cdn.sofifa.net/players/237/692/24_120.png", role: "player" },
            { name: "Erling Haaland", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/239/085/24_120.png", role: "player" },
            { name: "Jack Grealish", num: 10, pos: "LW", avatar: "https://cdn.sofifa.net/players/206/517/24_120.png", role: "player" },
            { name: "Jeremy Doku", num: 11, pos: "LW", avatar: "https://cdn.sofifa.net/players/243/629/24_120.png", role: "player" },
            { name: "Mateo Kovacic", num: 8, pos: "CM", avatar: "https://cdn.sofifa.net/players/207/410/24_120.png", role: "player" },
            { name: "Julian Alvarez", num: 19, pos: "ST", avatar: "https://cdn.sofifa.net/players/257/535/24_120.png", role: "player" },
            { name: "Stefan Ortega", num: 18, pos: "GK", avatar: "https://cdn.sofifa.net/players/202/371/24_120.png", role: "player" }
        ]
    },
    {
        team: {
            name: "Arsenal",
            short_name: "ARS",
            leader: "Mikel Arteta",
            area: "London, England",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/9825.png",
            primary_color: "#EF0107",
            secondary_color: "#063672",
            description: "The Gunners."
        },
        players: [
            { name: "David Raya", num: 22, pos: "GK", avatar: "https://cdn.sofifa.net/players/225/381/24_120.png", role: "player" },
            { name: "Ben White", num: 4, pos: "RB", avatar: "https://cdn.sofifa.net/players/235/569/24_120.png", role: "player" },
            { name: "William Saliba", num: 2, pos: "CB", avatar: "https://cdn.sofifa.net/players/243/715/24_120.png", role: "player" },
            { name: "Gabriel Magalhaes", num: 6, pos: "CB", avatar: "https://cdn.sofifa.net/players/235/018/24_120.png", role: "player" },
            { name: "Oleksandr Zinchenko", num: 35, pos: "LB", avatar: "https://cdn.sofifa.net/players/228/664/24_120.png", role: "player" },
            { name: "Declan Rice", num: 41, pos: "CDM", avatar: "https://cdn.sofifa.net/players/234/396/24_120.png", role: "player" },
            { name: "Martin Odegaard", num: 8, pos: "CAM", avatar: "https://cdn.sofifa.net/players/222/665/24_120.png", role: "captain" },
            { name: "Kai Havertz", num: 29, pos: "CM", avatar: "https://cdn.sofifa.net/players/235/790/24_120.png", role: "player" },
            { name: "Bukayo Saka", num: 7, pos: "RW", avatar: "https://cdn.sofifa.net/players/246/669/24_120.png", role: "player" },
            { name: "Gabriel Martinelli", num: 11, pos: "LW", avatar: "https://cdn.sofifa.net/players/251/566/24_120.png", role: "player" },
            { name: "Gabriel Jesus", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/230/666/24_120.png", role: "player" },
            { name: "Leandro Trossard", num: 19, pos: "LW", avatar: "https://cdn.sofifa.net/players/207/421/24_120.png", role: "player" },
            { name: "Thomas Partey", num: 5, pos: "CDM", avatar: "https://cdn.sofifa.net/players/209/989/24_120.png", role: "player" },
            { name: "Takehiro Tomiyasu", num: 18, pos: "RB", avatar: "https://cdn.sofifa.net/players/232/862/24_120.png", role: "player" },
            { name: "Aaron Ramsdale", num: 1, pos: "GK", avatar: "https://cdn.sofifa.net/players/235/068/24_120.png", role: "player" }
        ]
    },
    {
        team: {
            name: "Bayern Munich",
            short_name: "FCB",
            leader: "Vincent Kompany",
            area: "Munich, Germany",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/9823.png",
            primary_color: "#DC052D",
            secondary_color: "#FFFFFF",
            description: "Die Bayern."
        },
        players: [
            { name: "Manuel Neuer", num: 1, pos: "GK", avatar: "https://cdn.sofifa.net/players/167/495/24_120.png", role: "captain" },
            { name: "Joshua Kimmich", num: 6, pos: "RB", avatar: "https://cdn.sofifa.net/players/212/622/24_120.png", role: "player" },
            { name: "Dayot Upamecano", num: 2, pos: "CB", avatar: "https://cdn.sofifa.net/players/229/558/24_120.png", role: "player" },
            { name: "Kim Min Jae", num: 3, pos: "CB", avatar: "https://cdn.sofifa.net/players/243/738/24_120.png", role: "player" },
            { name: "Alphonso Davies", num: 19, pos: "LB", avatar: "https://cdn.sofifa.net/players/234/396/24_120.png", role: "player" },
            { name: "Leon Goretzka", num: 8, pos: "CM", avatar: "https://cdn.sofifa.net/players/207/696/24_120.png", role: "player" },
            { name: "Jamal Musiala", num: 42, pos: "CAM", avatar: "https://cdn.sofifa.net/players/256/790/24_120.png", role: "player" },
            { name: "Leroy Sane", num: 10, pos: "RW", avatar: "https://cdn.sofifa.net/players/222/492/24_120.png", role: "player" },
            { name: "Kingsley Coman", num: 11, pos: "LW", avatar: "https://cdn.sofifa.net/players/213/345/24_120.png", role: "player" },
            { name: "Thomas Muller", num: 25, pos: "CAM", avatar: "https://cdn.sofifa.net/players/189/596/24_120.png", role: "player" },
            { name: "Harry Kane", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/202/126/24_120.png", role: "player" },
            { name: "Serge Gnabry", num: 7, pos: "RW", avatar: "https://cdn.sofifa.net/players/206/113/24_120.png", role: "player" },
            { name: "Matthijs de Ligt", num: 4, pos: "CB", avatar: "https://cdn.sofifa.net/players/235/243/24_120.png", role: "player" },
            { name: "Aleksandar Pavlovic", num: 45, pos: "CDM", avatar: "https://cdn.sofifa.net/players/274/987/24_120.png", role: "player" },
            { name: "Sven Ulreich", num: 26, pos: "GK", avatar: "https://cdn.sofifa.net/players/186/569/24_120.png", role: "player" }
        ]
    },
    {
        team: {
            name: "Barcelona",
            short_name: "BAR",
            leader: "Hansi Flick",
            area: "Barcelona, Spain",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/8634.png",
            primary_color: "#A50044",
            secondary_color: "#004D98",
            description: "Mes que un club."
        },
        players: [
            { name: "Marc-Andre ter Stegen", num: 1, pos: "GK", avatar: "https://cdn.sofifa.net/players/192/448/24_120.png", role: "captain" },
            { name: "Jules Kounde", num: 23, pos: "RB", avatar: "https://cdn.sofifa.net/players/241/464/24_120.png", role: "player" },
            { name: "Ronald Araujo", num: 4, pos: "CB", avatar: "https://cdn.sofifa.net/players/253/004/24_120.png", role: "player" },
            { name: "Andreas Christensen", num: 15, pos: "CB", avatar: "https://cdn.sofifa.net/players/213/661/24_120.png", role: "player" },
            { name: "Joao Cancelo", num: 2, pos: "LB", avatar: "https://cdn.sofifa.net/players/210/514/24_120.png", role: "player" },
            { name: "Frenkie de Jong", num: 21, pos: "CM", avatar: "https://cdn.sofifa.net/players/228/702/24_120.png", role: "player" },
            { name: "Ilkay Gundogan", num: 22, pos: "CM", avatar: "https://cdn.sofifa.net/players/186/942/24_120.png", role: "player" },
            { name: "Pedri", num: 8, pos: "CM", avatar: "https://cdn.sofifa.net/players/251/854/24_120.png", role: "player" },
            { name: "Lamine Yamal", num: 27, pos: "RW", avatar: "https://cdn.sofifa.net/players/273/935/24_120.png", role: "player" },
            { name: "Robert Lewandowski", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/188/545/24_120.png", role: "player" },
            { name: "Raphinha", num: 11, pos: "LW", avatar: "https://cdn.sofifa.net/players/231/851/24_120.png", role: "player" },
            { name: "Gavi", num: 6, pos: "CM", avatar: "https://cdn.sofifa.net/players/264/240/24_120.png", role: "player" },
            { name: "Joao Felix", num: 14, pos: "LW", avatar: "https://cdn.sofifa.net/players/242/444/24_120.png", role: "player" },
            { name: "Ferran Torres", num: 7, pos: "RW", avatar: "https://cdn.sofifa.net/players/240/507/24_120.png", role: "player" },
            { name: "Inaki Pena", num: 13, pos: "GK", avatar: "https://cdn.sofifa.net/players/242/903/24_120.png", role: "player" }
        ]
    },
    {
        team: {
            name: "Liverpool",
            short_name: "LIV",
            leader: "Arne Slot",
            area: "Liverpool, England",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/8650.png",
            primary_color: "#C8102E",
            secondary_color: "#F6EB61",
            description: "You'll Never Walk Alone."
        },
        players: [
            { name: "Alisson Becker", num: 1, pos: "GK", avatar: "https://cdn.sofifa.net/players/212/831/24_120.png", role: "player" },
            { name: "Trent Alexander-Arnold", num: 66, pos: "RB", avatar: "https://cdn.sofifa.net/players/231/281/24_120.png", role: "player" },
            { name: "Virgil van Dijk", num: 4, pos: "CB", avatar: "https://cdn.sofifa.net/players/203/376/24_120.png", role: "captain" },
            { name: "Ibrahima Konate", num: 5, pos: "CB", avatar: "https://cdn.sofifa.net/players/237/678/24_120.png", role: "player" },
            { name: "Andrew Robertson", num: 26, pos: "LB", avatar: "https://cdn.sofifa.net/players/216/267/24_120.png", role: "player" },
            { name: "Alexis Mac Allister", num: 10, pos: "CM", avatar: "https://cdn.sofifa.net/players/230/481/24_120.png", role: "player" },
            { name: "Dominik Szoboszlai", num: 8, pos: "CM", avatar: "https://cdn.sofifa.net/players/236/772/24_120.png", role: "player" },
            { name: "Mohamed Salah", num: 11, pos: "RW", avatar: "https://cdn.sofifa.net/players/209/331/24_120.png", role: "player" },
            { name: "Luis Diaz", num: 7, pos: "LW", avatar: "https://cdn.sofifa.net/players/241/461/24_120.png", role: "player" },
            { name: "Darwin Nunez", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/253/002/24_120.png", role: "player" },
            { name: "Diogo Jota", num: 20, pos: "ST", avatar: "https://cdn.sofifa.net/players/224/019/24_120.png", role: "player" },
            { name: "Cody Gakpo", num: 18, pos: "LW", avatar: "https://cdn.sofifa.net/players/241/830/24_120.png", role: "player" },
            { name: "Harvey Elliott", num: 19, pos: "CAM", avatar: "https://cdn.sofifa.net/players/246/147/24_120.png", role: "player" },
            { name: "Wataru Endo", num: 3, pos: "CDM", avatar: "https://cdn.sofifa.net/players/215/656/24_120.png", role: "player" },
            { name: "Caoimhin Kelleher", num: 62, pos: "GK", avatar: "https://cdn.sofifa.net/players/245/263/24_120.png", role: "player" }
        ]
    },
    {
        team: {
            name: "Paris Saint-Germain",
            short_name: "PSG",
            leader: "Luis Enrique",
            area: "Paris, France",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/9847.png",
            primary_color: "#004170",
            secondary_color: "#DA291C",
            description: "Les Parisiens."
        },
        players: [
            { name: "Gianluigi Donnarumma", num: 99, pos: "GK", avatar: "https://cdn.sofifa.net/players/230/621/24_120.png", role: "player" },
            { name: "Achraf Hakimi", num: 2, pos: "RB", avatar: "https://cdn.sofifa.net/players/235/212/24_120.png", role: "player" },
            { name: "Marquinhos", num: 5, pos: "CB", avatar: "https://cdn.sofifa.net/players/207/865/24_120.png", role: "captain" },
            { name: "Milan Skriniar", num: 37, pos: "CB", avatar: "https://cdn.sofifa.net/players/232/363/24_120.png", role: "player" },
            { name: "Nuno Mendes", num: 25, pos: "LB", avatar: "https://cdn.sofifa.net/players/258/070/24_120.png", role: "player" },
            { name: "Warren Zaire-Emery", num: 33, pos: "CM", avatar: "https://cdn.sofifa.net/players/270/673/24_120.png", role: "player" },
            { name: "Vitinha", num: 17, pos: "CM", avatar: "https://cdn.sofifa.net/players/251/517/24_120.png", role: "player" },
            { name: "Ousmane Dembele", num: 10, pos: "RW", avatar: "https://cdn.sofifa.net/players/231/443/24_120.png", role: "player" },
            { name: "Bradley Barcola", num: 29, pos: "LW", avatar: "https://cdn.sofifa.net/players/265/222/24_120.png", role: "player" },
            { name: "Goncalo Ramos", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/255/444/24_120.png", role: "player" },
            { name: "Randal Kolo Muani", num: 23, pos: "ST", avatar: "https://cdn.sofifa.net/players/241/888/24_120.png", role: "player" },
            { name: "Lucas Hernandez", num: 21, pos: "CB", avatar: "https://cdn.sofifa.net/players/220/814/24_120.png", role: "player" },
            { name: "Fabian Ruiz", num: 8, pos: "CM", avatar: "https://cdn.sofifa.net/players/232/580/24_120.png", role: "player" },
            { name: "Marco Asensio", num: 11, pos: "RW", avatar: "https://cdn.sofifa.net/players/220/834/24_120.png", role: "player" },
            { name: "Keylor Navas", num: 1, pos: "GK", avatar: "https://cdn.sofifa.net/players/193/041/24_120.png", role: "player" }
        ]
    },
    {
        team: {
            name: "Inter Milan",
            short_name: "INT",
            leader: "Simone Inzaghi",
            area: "Milan, Italy",
            logo_url: "https://images.fotmob.com/image_resources/logo/teamlogo/8636.png",
            primary_color: "#010E80",
            secondary_color: "#000000",
            description: "I Nerazzurri."
        },
        players: [
            { name: "Yann Sommer", num: 1, pos: "GK", avatar: "https://cdn.sofifa.net/players/177/683/24_120.png", role: "player" },
            { name: "Benjamin Pavard", num: 28, pos: "CB", avatar: "https://cdn.sofifa.net/players/226/851/24_120.png", role: "player" },
            { name: "Francesco Acerbi", num: 15, pos: "CB", avatar: "https://cdn.sofifa.net/players/204/000/24_120.png", role: "player" },
            { name: "Alessandro Bastoni", num: 95, pos: "CB", avatar: "https://cdn.sofifa.net/players/239/656/24_120.png", role: "player" },
            { name: "Denzel Dumfries", num: 2, pos: "RWB", avatar: "https://cdn.sofifa.net/players/225/100/24_120.png", role: "player" },
            { name: "Federico Dimarco", num: 32, pos: "LWB", avatar: "https://cdn.sofifa.net/players/228/881/24_120.png", role: "player" },
            { name: "Hakan Calhanoglu", num: 20, pos: "CM", avatar: "https://cdn.sofifa.net/players/208/093/24_120.png", role: "player" },
            { name: "Nicolo Barella", num: 23, pos: "CM", avatar: "https://cdn.sofifa.net/players/234/153/24_120.png", role: "player" },
            { name: "Henrikh Mkhitaryan", num: 22, pos: "CM", avatar: "https://cdn.sofifa.net/players/192/883/24_120.png", role: "player" },
            { name: "Lautaro Martinez", num: 10, pos: "ST", avatar: "https://cdn.sofifa.net/players/231/478/24_120.png", role: "captain" },
            { name: "Marcus Thuram", num: 9, pos: "ST", avatar: "https://cdn.sofifa.net/players/229/420/24_120.png", role: "player" },
            { name: "Matteo Darmian", num: 36, pos: "RWB", avatar: "https://cdn.sofifa.net/players/189/280/24_120.png", role: "player" },
            { name: "Davide Frattesi", num: 16, pos: "CM", avatar: "https://cdn.sofifa.net/players/238/067/24_120.png", role: "player" },
            { name: "Marko Arnautovic", num: 8, pos: "ST", avatar: "https://cdn.sofifa.net/players/180/183/24_120.png", role: "player" },
            { name: "Emil Audero", num: 77, pos: "GK", avatar: "https://cdn.sofifa.net/players/228/221/24_120.png", role: "player" }
        ]
    }
];

async function cleanOldData(managerId) {
    console.log("Đang xóa các đội bóng cũ của manager:", managerId);
    const teams = await TeamRepo.getByManagerId(managerId);
    for (const t of teams) {
        const members = await TeamMemberRepo.getByTeamId(t.id);
        for (const m of members) {
            await docClient.send(new DeleteCommand({ TableName: "PhuiScore_TeamMembers", Key: { id: m.id } }));
        }
        await TeamRepo.delete(t.id);
    }
    console.log(`Đã xóa ${teams.length} đội bóng cũ.`);
}

async function seedUCLTeams() {
    try {
        const managerId = "media1"; 
        
        await cleanOldData(managerId);

        console.log(`Bắt đầu seed 8 đội bóng UCL và siêu sao cho managerId: ${managerId}...`);
        
        for (const teamItem of UCL_DATA) {
            const teamData = { ...teamItem.team, status: "active" };
            const team = await TeamRepo.create(teamData, managerId);
            console.log(`✅ Đã tạo đội: ${team.name}`);
            
            for (const playerInfo of teamItem.players) {
                await TeamMemberRepo.create({
                    name: playerInfo.name,
                    shirtNumber: playerInfo.num,
                    position: playerInfo.pos,
                    avatar: playerInfo.avatar,
                    role: playerInfo.role,
                    status: 'active'
                }, team.id);
            }
            console.log(`   -> Đã tạo 15 siêu sao cho ${team.name}`);
        }
        
        console.log(`🎉 Seed thành công hoàn toàn! Chúc mừng bạn đã có Champions League!`);
        process.exit(0);
    } catch (error) {
        console.error("Lỗi khi seed data:", error);
        process.exit(1);
    }
}

setTimeout(seedUCLTeams, 2000);
