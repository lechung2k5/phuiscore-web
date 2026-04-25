const TeamMemberRepo = require('../repositories/teamMember.repo');
const TeamRepo = require('../repositories/team.repo');

const TeamMemberController = {
  addMember: async (req, res) => {
    try {
      const { username } = req.user;
      const data = req.body;
      const { teamId } = data;

      if (!teamId || !data.name) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin thành viên hoặc đội bóng' });
      }

      const team = await TeamRepo.getById(teamId);
      if (!team) return res.status(404).json({ success: false, message: 'Không tìm thấy đội' });
      if (team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền sửa đội này' });

      // Check duplicates
      const members = await TeamMemberRepo.getByTeamId(teamId);
      
      // Map old 'number' to 'shirtNumber' if provided
      const incomingNumber = data.shirtNumber !== undefined ? data.shirtNumber : data.number;
      
      const isDuplicateNumber = incomingNumber !== undefined && members.some(p => p.shirtNumber === incomingNumber);
      const isDuplicateIdCard = data.idCard && members.some(p => p.idCard === data.idCard);
      
      if (isDuplicateNumber) return res.status(400).json({ success: false, message: 'Trùng số áo trong cùng một đội' });
      if (isDuplicateIdCard) return res.status(400).json({ success: false, message: 'Trùng số CCCD/CMND' });

      const newMember = await TeamMemberRepo.create(data, teamId);
      res.status(201).json(newMember);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  getMembersByTeam: async (req, res) => {
    try {
      const { team } = req.query; // teamId query param
      if (!team) return res.status(400).json({ success: false, message: 'Cần ID Đội bóng' });

      const members = await TeamMemberRepo.getByTeamId(team);
      res.json(members); // trả array trực tiếp 
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  updateMember: async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.user;
      const updates = req.body;

      const member = await TeamMemberRepo.getById(id);
      if (!member) return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });

      const team = await TeamRepo.getById(member.teamId);
      if (!team || team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền' });

      // Check duplicates 
      const incomingNumber = updates.shirtNumber !== undefined ? updates.shirtNumber : updates.number;

      if (incomingNumber !== undefined || updates.idCard) {
        const members = await TeamMemberRepo.getByTeamId(member.teamId);
        if (incomingNumber !== undefined && members.some(p => p.id !== id && p.shirtNumber === incomingNumber)) {
          return res.status(400).json({ success: false, message: 'Trùng số áo' });
        }
        if (updates.idCard && members.some(p => p.id !== id && p.idCard === updates.idCard)) {
          return res.status(400).json({ success: false, message: 'Trùng CCCD/CMND' });
        }
      }

      await TeamMemberRepo.update(id, updates);
      res.json({ success: true, message: 'Đã cập nhật' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  deleteMember: async (req, res) => {
    try {
      const { id } = req.params;
      const { username } = req.user;

      const member = await TeamMemberRepo.getById(id);
      if (!member) return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });

      const team = await TeamRepo.getById(member.teamId);
      if (!team || team.managerId !== username) return res.status(403).json({ success: false, message: 'Không có quyền' });

      await TeamMemberRepo.delete(id);
      res.json({ success: true, message: 'Đã xóa' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },
};

module.exports = TeamMemberController;
