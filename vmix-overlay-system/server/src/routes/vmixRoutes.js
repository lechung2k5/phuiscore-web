const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const VMIX_URL = 'http://127.0.0.1:8088';

// Tạo thư mục temp nếu chưa có
const TEMP_DIR = path.join(__dirname, '../../../uploads/temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// GET /api/vmix/state
// Lấy danh sách inputs và trạng thái từ vMix
router.get('/state', async (req, res) => {
  try {
    const response = await axios.get(`${VMIX_URL}/api/`);
    
    // Parse XML to JSON
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    parser.parseString(response.data, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Lỗi parse XML từ vMix' });
      }
      
      const vmixData = result.vmix;
      
      // Đảm bảo inputs luôn là mảng
      let inputs = [];
      if (vmixData.inputs && vmixData.inputs.input) {
        if (Array.isArray(vmixData.inputs.input)) {
          inputs = vmixData.inputs.input;
        } else {
          inputs = [vmixData.inputs.input];
        }
      }

      res.json({
        version: vmixData.version,
        active: vmixData.active,
        preview: vmixData.preview,
        recording: vmixData.recording,
        streaming: vmixData.streaming,
        playBuffer: vmixData.playBuffer,
        inputs: inputs
      });
    });
  } catch (error) {
    console.error('vMix connection error:', error.message);
    res.status(502).json({ error: 'Không thể kết nối đến vMix', details: error.message });
  }
});

// POST /api/vmix/command
// Gửi lệnh điều khiển tới vMix
router.post('/command', async (req, res) => {
  const { Function: funcName, Input: inputKey, Value: value } = req.body;
  
  if (!funcName) {
    return res.status(400).json({ error: 'Thiếu tham số Function' });
  }

  try {
    let url = `${VMIX_URL}/api/?Function=${encodeURIComponent(funcName)}`;
    if (inputKey) url += `&Input=${encodeURIComponent(inputKey)}`;
    if (value) url += `&Value=${encodeURIComponent(value)}`;

    await axios.get(url);
    res.json({ success: true, message: `Command ${funcName} sent.` });
  } catch (error) {
    console.error('vMix command error:', error.message);
    res.status(502).json({ error: 'Không thể gửi lệnh đến vMix' });
  }
});

// GET /api/vmix/thumbnail/:inputKey
// Lấy ảnh thumbnail của 1 input bằng SnapshotInput
router.get('/thumbnail/:inputKey', async (req, res) => {
  const inputKey = req.params.inputKey;
  const tempFile = path.join(TEMP_DIR, `thumb_${inputKey}.jpg`);

  try {
    // 1. Gọi vMix lưu ảnh snapshot vào thư mục temp
    await axios.get(`${VMIX_URL}/api/?Function=SnapshotInput&Input=${encodeURIComponent(inputKey)}&Value=${encodeURIComponent(tempFile)}`);
    
    // 2. Chờ một chút để vMix ghi xong file (vMix ghi file trực tiếp xuống ổ cứng rất nhanh)
    setTimeout(() => {
      if (fs.existsSync(tempFile)) {
        res.sendFile(tempFile);
      } else {
        res.status(404).send('Thumbnail not found');
      }
    }, 100); // 100ms
  } catch (error) {
    console.error('Lỗi lấy thumbnail cho input:', inputKey, error.message);
    res.status(404).send('Thumbnail error');
  }
});

module.exports = router;
