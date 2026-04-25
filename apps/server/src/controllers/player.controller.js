const PlayerRepo = require('../repositories/player.repo');
const TeamRepo = require('../repositories/team.repo');

const PlayerController = {
  // Thêm cầu thủ vào đội
  addPlayer: async (req, res) => {
    try {
      const { username } = req.user;
      const data = req.body;
      const { teamId } = data;

      if (!teamId || !data.name) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin cầu thủ hoặc đội bóng' });
      }

      // Kiểm tra quyền (chỉ manager của đội mới được add)
      const team = await TeamRepo.getById(teamId);
      if (!team) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
      if (team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền sửa đội này' });

      // Check duplicates
      const players = await PlayerRepo.getByTeamId(teamId);
      const isDuplicateNumber = data.number !== undefined && players.some(p => p.number === data.number);
      const isDuplicateIdCard = data.idCard && players.some(p => p.idCard === data.idCard);
      
      if (isDuplicateNumber) return res.status(400).json({ success: false, message: 'Trùng số áo trong cùng một đội' });
      if (isDuplicateIdCard) return res.status(400).json({ success: false, message: 'Trùng số CCCD/CMND cầu thủ' });

      const newPlayer = await PlayerRepo.create(data, teamId);
      res.status(201).json(newPlayer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // Lấy các cầu thủ của đội hiện tại
  getPlayersByTeam: async (req, res) => {
    try {
      const { team } = req.query; // teamId query param
      if (!team) return res.status(400).json({ success: false, message: 'Cần ID Đội bóng' });

      const players = await PlayerRepo.getByTeamId(team);
      res.json(players); // trả array trực tiếp để giống API soccer-web
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  updatePlayer: async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.user;
      const updates = req.body;

      // Tìm cầu thủ
      const player = await PlayerRepo.getById(id);
      if (!player) return res.status(404).json({ success: false, message: 'Không tìm thấy cầu thủ' });

      // Kiểm tra quyền
      const team = await TeamRepo.getById(player.teamId);
      if (!team || team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền' });

      // Check duplicates again (ngoại trừ chính nó)
      if (updates.number !== undefined || updates.idCard) {
        const players = await PlayerRepo.getByTeamId(player.teamId);
        if (updates.number !== undefined && players.some(p => p.id !== id && p.number === updates.number)) {
          return res.status(400).json({ success: false, message: 'Trùng số áo' });
        }
        if (updates.idCard && players.some(p => p.id !== id && p.idCard === updates.idCard)) {
          return res.status(400).json({ success: false, message: 'Trùng CCCD/CMND' });
        }
      }

      await PlayerRepo.update(id, updates);
      res.json({ success: true, message: 'Đã cập nhật' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  deletePlayer: async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.user;

      const player = await PlayerRepo.getById(id);
      if (!player) return res.status(404).json({ success: false, message: 'Không tìm thấy cầu thủ' });

      const team = await TeamRepo.getById(player.teamId);
      if (!team || team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền' });

      await PlayerRepo.delete(id);
      res.json({ success: true, message: 'Đã xóa' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },
};

module.exports = PlayerController;
