const TeamRepo = require('../repositories/team.repo');
const TeamMemberRepo = require('../repositories/teamMember.repo');

const TeamController = {
  // Lấy các team quản lý bởi user
  getMyTeams: async (req, res) => {
    try {
      const { username } = req.user; // Lấy từ authMiddleware
      if (!username) return res.status(401).json({ success: false, message: 'Unauthorized' });
      
      const teams = await TeamRepo.getByManagerId(username);
      res.json(teams);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi nạp danh sách đội' });
    }
  },

  // Tạo đội bóng mới
  createTeam: async (req, res) => {
    try {
      const { username } = req.user;
      const data = req.body;

      if (!data.name || !data.leader) {
        return res.status(400).json({ success: false, message: 'Tên đội và đội trưởng là bắt buộc' });
      }

      const newTeam = await TeamRepo.create(data, username);
      res.status(201).json({ success: true, data: newTeam });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo đội' });
    }
  },

  // Cập nhật đội bóng
  updateTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.user;
      const updates = req.body;

      const team = await TeamRepo.getById(id);
      if (!team) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
      if (team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền sửa đội này' });

      const updatedTeam = await TeamRepo.update(id, updates);
      res.json({ success: true, data: updatedTeam });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật đội' });
    }
  },

  // Xóa đội bóng
  deleteTeam: async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.user;

      const team = await TeamRepo.getById(id);
      if (!team) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
      if (team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền xóa đội này' });

      await TeamRepo.delete(id);
      res.json({ success: true, message: 'Đã xóa đội bóng thành công' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi xóa đội' });
    }
  },

  // Lấy toàn bộ danh sách đội (dành cho trang tìm đội)
  getAllTeams: async (req, res) => {
    try {
      const { search } = req.query;
      const teams = await TeamRepo.getAll(search);
      res.json({ success: true, data: teams });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tìm đội' });
    }
  },

  // Lấy chi tiết 1 đội bóng
  getTeamById: async (req, res) => {
    try {
      const { id } = req.params;
      const team = await TeamRepo.getById(id);
      if (!team) return res.status(404).json({ success: false, message: 'Đội không tồn tại' });
      
      const players = await TeamMemberRepo.getByTeamId(id);
      res.json({ success: true, data: { ...team, players } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đội' });
    }
  },
};

module.exports = TeamController;
