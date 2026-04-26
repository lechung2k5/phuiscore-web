const {
  PutCommand, GetCommand, QueryCommand, ScanCommand, DeleteCommand, UpdateCommand
} = require("@aws-sdk/lib-dynamodb");
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { docClient, client } = require('../config/db.config');
const { v4: uuidv4 } = require('uuid');

const TABLE = "PhuiScore_Tournaments";

// ─── Tự động tạo table nếu chưa tồn tại ────────────────────────────
async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE }));
    // table đã có, không làm gì
  } catch (err) {
    if (err.name === 'ResourceNotFoundException') {
      console.log(`[DynamoDB] 📦 Tạo table ${TABLE}...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE,
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
      }));
      console.log(`[DynamoDB] ✅ Table ${TABLE} đã được tạo thành công!`);
    }
    // các lỗi khác (credential, network) thì bỏ qua để server vẫn chạy
  }
}

ensureTable();


const TournamentRepo = {
  /**
   * Tạo giải đấu mới
   */
  create: async (data) => {
    const id = uuidv4();
    const now = Date.now();
    const item = {
      id,
      ...data,
      status: data.status || 'Registration',
      teams: [],
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
    return item;
  },

  /**
   * Lấy toàn bộ giải đấu (có thể filter)
   */
  getAll: async ({ status, region, search } = {}) => {
    const params = { TableName: TABLE };
    const result = await docClient.send(new ScanCommand(params));
    let items = result.Items || [];

    // Filter phía app (DynamoDB Scan không phải best practice nhưng đủ cho MVP)
    if (status && status !== 'all') {
      items = items.filter(i => i.status === status);
    }
    if (region && region !== 'all') {
      items = items.filter(i => i.region === region);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name?.toLowerCase().includes(q) ||
        i.region?.toLowerCase().includes(q)
      );
    }

    // Sắp xếp mới nhất lên đầu
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  },

  /**
   * Lấy chi tiết 1 giải theo ID
   */
  getById: async (id) => {
    const result = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    return result.Item || null;
  },

  /**
   * Cập nhật giải đấu
   */
  update: async (id, updates) => {
    const updateExpressions = [];
    const attrNames = {};
    const attrValues = {};

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id') continue;
      updateExpressions.push(`#${key} = :${key}`);
      attrNames[`#${key}`] = key;
      attrValues[`:${key}`] = val;
    }

    attrNames['#updatedAt'] = 'updatedAt';
    attrValues[':updatedAt'] = Date.now();
    updateExpressions.push('#updatedAt = :updatedAt');

    const params = {
      TableName: TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
      ReturnValues: 'ALL_NEW',
    };
    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  },

  /**
   * Xóa giải đấu
   */
  delete: async (id) => {
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
    return true;
  },

  /**
   * Đăng ký đội vào giải đấu
   */
  registerTeam: async (tournamentId, teamData) => {
    const tournament = await TournamentRepo.getById(tournamentId);
    if (!tournament) throw new Error('Giải đấu không tồn tại');

    // Chấp nhận cả Pending (chờ duyệt) và Registration (đang mở đk)
    const openStatuses = ['Registration', 'Pending', 'Opening'];
    if (!openStatuses.includes(tournament.status)) {
      throw new Error('Giải đấu đã đóng đăng ký');
    }
    // LƯU Ý: Không giới hạn số lượng đội đăng ký (Pending), chỉ giới hạn lúc BTC duyệt (Approved)
    // Kiểm tra trùng đội bằng tên (backward support)
    const dupName = tournament.teams?.find(t => t.teamName?.toLowerCase() === teamData.teamName?.toLowerCase() && t.status !== 'Rejected');
    if (dupName && !teamData.teamId) throw new Error('Tên đội này đã đăng ký trong giải!');

    // Kiểm tra trùng đội bằng teamId (nếu có)
    if (teamData.teamId) {
      const dupId = tournament.teams?.find(t => 
        t.teamId === teamData.teamId && 
        t.status !== 'Rejected'
      );
      if (dupId) throw new Error('Đội bóng này đang tham gia giải hoặc đang chờ duyệt, không thể đăng ký thêm!');
    }

    const newTeam = {
      id: `team_${Date.now()}`,
      // Thông tin đội bóng
      teamName:      teamData.teamName,
      logo:          teamData.logo || null,
      jerseyColor:   teamData.jerseyColor || null,
      jerseyColorAlt: teamData.jerseyColorAlt || null,
      // Trưởng đoàn / Quản lý đội
      managerName:   teamData.managerName || null,
      managerPhone:  teamData.managerPhone || teamData.contactPhone || null,
      managerEmail:  teamData.managerEmail || null,
      managerIdCard: teamData.managerIdCard || null,
      // HLV trưởng (tùy chọn)
      coachName:     teamData.coachName || null,
      coachPhone:    teamData.coachPhone || null,
      // Số cầu thủ đăng ký
      playerCount:   teamData.playerCount || 0,
      // Ghi chú cho BTC
      note:          teamData.note || null,
      // Danh sách cầu thủ chi tiết
      players:       teamData.players || [],
      // Meta
      appliedAt: Date.now(),
      status: 'Pending', // BTC phải duyệt từng đội
      userId: teamData.userId || null,
      teamId: teamData.teamId || null,
    };


    const teams = [...(tournament.teams || []), newTeam];
    return TournamentRepo.update(tournamentId, { teams });
  },

  /**
   * Publish giải: chuyển từ Pending sang Registration
   */
  publish: async (id) => {
    return TournamentRepo.update(id, { status: 'Registration' });
  },

  /**
   * Cập nhật trạng thái 1 đội: Approved / RequireUpdate / Rejected / Confirmed
   * newStatus: 'Approved' | 'RequireUpdate' | 'Rejected' | 'Confirmed'
   * btcNote: ghi chú từ BTC gửi lại cho đội
   */
  updateTeamStatus: async (tournamentId, teamId, newStatus, btcNote = '') => {
    const tournament = await TournamentRepo.getById(tournamentId);
    if (!tournament) throw new Error('Giải đấu không tồn tại');

    // Nếu BTC đang muốn Duyệt, phải kiểm tra giới hạn Max Teams
    if (newStatus === 'Approved') {
      const approvedTeamsCount = tournament.teams?.filter(t => ['Approved', 'Confirmed'].includes(t.status)).length || 0;
      if (approvedTeamsCount >= tournament.maxTeams && tournament.teams?.find(t => t.id === teamId)?.status !== 'Approved') {
        throw new Error(`Giải đấu đã duyệt đủ ${tournament.maxTeams} đội chính thức, không thể duyệt thêm!`);
      }
    }

    const teams = (tournament.teams || []).map(t =>
      t.id === teamId
        ? { ...t, status: newStatus, btcNote, reviewedAt: Date.now() }
        : t
    );
    if (!teams.find(t => t.id === teamId)) throw new Error('Đội không tồn tại trong giải');
    return TournamentRepo.update(tournamentId, { teams });
  },

  /**
   * Xóa một đội khỏi giải đấu (thường dùng cho các đội bị Từ chối)
   */
  removeTeam: async (tournamentId, teamId) => {
    const tournament = await TournamentRepo.getById(tournamentId);
    if (!tournament) throw new Error('Giải đấu không tồn tại');

    const originalLength = (tournament.teams || []).length;
    const teams = (tournament.teams || []).filter(t => t.id !== teamId);
    
    if (teams.length === originalLength) {
      throw new Error('Đội không tồn tại trong giải');
    }
    
    return TournamentRepo.update(tournamentId, { teams });
  },

  /**
   * Cập nhật bảng xếp hạng cho giải đấu (từ Crawler)
   */
  updateStandings: async (tournamentId, standings, extra = {}) => {
    const tournamentIdStr = String(tournamentId);
    const existing = await TournamentRepo.getById(tournamentIdStr);
    
    // Dùng PutCommand để ghi đè toàn bộ Item, đảm bảo an toàn cho dữ liệu phức tạp như BXH
    const item = {
      id: tournamentIdStr,
      name: extra.name || (existing ? existing.name : `Giải đấu ${tournamentIdStr}`),
      logo: extra.logo || (existing ? existing.logo : null),
      status: 'Ongoing',
      standings: standings, // Đây là mảng các BXH (Total, Home, Away)
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await docClient.send(new PutCommand({ 
      TableName: TABLE, 
      Item: item 
    }));
    
    return item;
  },
};

module.exports = TournamentRepo;
