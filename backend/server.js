require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3002;

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 配置CORS
app.use(cors({
  origin: '*', // 生产环境中应该设置具体的域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON请求体
app.use(express.json());
// 解析URL编码请求体
app.use(express.urlencoded({ extended: true }));

// 获取API密钥（优先使用环境变量，其次使用配置文件）
function getApiKey() {
  return process.env.ZHIPU_API_KEY || process.env.API_KEY || '';
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Zhipu API代理
app.post('/api/zhipu/*', async (req, res) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(401).json({ error: 'No API key provided' });
    }

    const endpoint = req.params[0];
    const url = `https://open.bigmodel.cn/api/paas/v4/${endpoint}`;
    
    console.log('Proxying request to:', url);
    
    const response = await axios({
      url,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: req.body,
      responseType: 'stream'
    });

    // 检查是否是SSE流式响应
    if (response.headers['content-type']?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 流式传输响应
      response.data.pipe(res);
      
      response.data.on('end', () => {
        res.end();
      });
    } else {
      // 非流式响应
      const data = await response.data;
      res.json(data);
    }
  } catch (error) {
    console.error('Zhipu API proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || error.message || 'API proxy error'
    });
  }
});

// 文件上传和OCR处理
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(401).json({ error: 'No API key provided' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('tool_type', req.body.tool_type || 'hand_write');
    formData.append('language_type', req.body.language_type || 'CHN_ENG');
    formData.append('probability', req.body.probability || 'false');

    const response = await axios({
      url: 'https://open.bigmodel.cn/api/paas/v4/files/ocr',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      data: formData
    });

    // 清理上传的文件
    fs.unlinkSync(req.file.path);

    res.json(response.data);
  } catch (error) {
    console.error('OCR processing error:', error.response?.data || error.message);
    
    // 清理上传的文件
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || error.message || 'OCR processing error'
    });
  }
});

// 静态文件服务（用于部署前端）
app.use(express.static(path.join(__dirname, '../dist')));

// 处理所有其他路由，返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`API proxy available at http://0.0.0.0:${PORT}/api/zhipu`);
  console.log(`Health check at http://0.0.0.0:${PORT}/api/health`);
});

// 导出app（用于测试）
module.exports = app;