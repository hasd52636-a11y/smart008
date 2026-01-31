const axios = require('axios');

// 获取API密钥
function getApiKey() {
  return process.env.ZHIPU_API_KEY || process.env.API_KEY || '';
}

// 处理SSE流式响应
function handleStreamingResponse(response, res) {
  const contentType = response.headers['content-type'];
  
  if (contentType && contentType.includes('text/event-stream')) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 流式传输响应
    response.data.on('data', (chunk) => {
      res.write(chunk);
    });
    
    response.data.on('end', () => {
      res.end();
    });
    
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: 'Stream error' });
    });
  } else {
    // 非流式响应
    return response.data.then((data) => {
      res.json(data);
    });
  }
}

module.exports = async (req, res) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(401).json({ error: 'No API key provided' });
    }

    const { endpoint } = req.query;
    const endpointPath = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;
    const url = `https://open.bigmodel.cn/api/paas/v4/${endpointPath}`;
    
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

    // 处理流式或非流式响应
    await handleStreamingResponse(response, res);
  } catch (error) {
    console.error('Zhipu API proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error?.message || error.message || 'API proxy error'
    });
  }
};
