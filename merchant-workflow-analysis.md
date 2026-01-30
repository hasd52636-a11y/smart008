# 🏢 商家端完整工作流程分析

## 📋 **商家使用后台的完整流程**

### **阶段1：系统初始化和配置**

#### **1.1 商家登录后台**
- 访问路径：`/merchant/dashboard`
- 首次进入看到Dashboard概览
- 查看系统状态和基础数据

#### **1.2 API密钥配置 (Settings页面)**
```typescript
// 商家必须首先配置智谱AI密钥
localStorage.setItem('zhipuApiKey', 'your-api-key');
aiService.setZhipuApiKey(apiKey);

// 系统支持的AI模型能力：
- GLM-4.7: 文本对话
- GLM-4.6V: 多模态分析  
- GLM-TTS: 语音合成
- GLM-4-Voice: 语音识别
- Embedding-3: 向量检索
- GLM-Realtime: 实时视频对话
```

### **阶段2：产品项目创建和管理**

#### **2.1 创建新产品项目 (ProjectList页面)**
```typescript
const newProject: ProductProject = {
  id: `proj_${Date.now()}`,
  name: "SmartHome Pro Hub",
  description: "智能家居控制器",
  status: ProjectStatus.DRAFT, // 初始为草稿状态
  config: {
    provider: AIProvider.ZHIPU,
    voiceName: 'tongtong',
    visionEnabled: false,
    multimodalEnabled: true,
    videoChatEnabled: false, // 默认关闭
    systemInstruction: "您是产品技术支持专家...",
    videoChatPrompt: "专业视频分析提示词...",
    avatarEnabled: false,
    annotationEnabled: false
  },
  knowledgeBase: [], // 空知识库
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}
```

#### **2.2 项目详细配置 (ProjectDetail页面)**

**知识库建设 (knowledge标签页)：**
```typescript
// 上传文档并自动处理
const handleFileUpload = (files: File[]) => {
  // 1. 文件上传和解析
  // 2. 自动分片处理
  // 3. 向量化嵌入 (Embedding-3)
  // 4. 存储到项目知识库
}

// 知识库向量化处理
const vectorizeKnowledge = async (content: string) => {
  const embedding = await aiService.createEmbedding(content, {
    model: ZhipuModel.EMBEDDING_3,
    dimensions: 768
  });
  return embedding.data[0].embedding;
}
```

**视频指南配置 (video标签页)：**
```typescript
// 三种视频配置方式：
1. AI智能生成：
   - 基于产品描述自动生成虚拟指导视频
   - 使用GLM视频生成能力

2. 商家专业上传：
   - 上传实拍安装视频 (推荐)
   - 支持MP4/MOV格式

3. 多模态分析配置：
   - 开启/关闭多模态分析功能
   - 配置视频分析提示词
   - 启用视频客服功能
```

**功能开关配置：**
```typescript
// 商家可以控制的功能开关
config: {
  visionEnabled: boolean,        // 图片分析
  multimodalEnabled: boolean,    // 多模态分析
  videoChatEnabled: boolean,     // 视频客服
  avatarEnabled: boolean,        // 虚拟人形象
  annotationEnabled: boolean,    // 视频标注工具
}

// 级联开关逻辑：
// videoChatEnabled = true 时，自动启用：
// - avatarEnabled = true
// - annotationEnabled = true
```

### **阶段3：AI服务个性化配置**

#### **3.1 系统指令定制**
```typescript
// 为每个产品定制AI角色
systemInstruction: `
您是中恒创世科技${project.name}的专业技术支持专家。
请基于产品知识库提供准确的技术支持和安装指导。

服务要求：
1. 使用专业但易懂的语言
2. 提供具体的操作步骤  
3. 标注重要的安全注意事项
4. 优先引用官方知识库内容
5. 必要时建议联系技术支持热线
`
```

#### **3.2 语音配置**
```typescript
// 语音音色选择和测试
voiceOptions: [
  'tongtong',    // 默认女声 (推荐)
  'chuichui',    // 男声
  'xiaochen',    // 女声
  'jam',         // 特色音色
  'kazi',        // 特色音色
]

// 语音预览测试
const testVoice = async (voiceName: string) => {
  const audioData = await aiService.generateSpeech(
    '您好，这是一个语音示例', 
    voiceName, 
    AIProvider.ZHIPU
  );
  // 播放测试音频
}
```

#### **3.3 视频分析提示词配置**
```typescript
videoChatPrompt: `
您是中恒创世科技的专业技术支持专家。
请仔细分析用户提供的视频内容，识别产品使用或安装过程中的具体问题。

分析重点：
1. 产品型号识别与规格确认
2. 安装步骤的正确性检查  
3. 连接线路与接口状态
4. 设备指示灯与显示状态
5. 操作流程的规范性
6. 潜在安全隐患识别

回复要求：
- 使用专业但易懂的语言
- 提供具体的操作步骤
- 标注重要的安全注意事项
- 如需更换配件，请说明具体型号
- 优先引用官方知识库内容
- 必要时建议联系中恒创世技术支持热线
`
```

### **阶段4：二维码生成和部署**

#### **4.1 二维码生成 (qr标签页)**
```typescript
// 动态生成产品专属二维码
const generateQRCode = (projectId: string) => {
  // 自动检测当前域名和端口
  const port = window.location.port ? `:${window.location.port}` : '';
  const baseUrl = `${window.location.protocol}//${window.location.hostname}${port}`;
  
  // 生成用户访问链接
  const userUrl = `${baseUrl}/#/view/${projectId}`;
  const videoUrl = `${baseUrl}/#/video/${projectId}`;
  
  // 生成二维码图片
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(userUrl)}`;
  
  return { userUrl, videoUrl, qrImageUrl };
}
```

#### **4.2 项目状态管理**
```typescript
// 项目状态流转
ProjectStatus.DRAFT → ProjectStatus.ACTIVE → ProjectStatus.DISABLED

// 只有ACTIVE状态的项目才能被用户访问
const validateProjectAccess = (project: ProductProject) => {
  return project.status === ProjectStatus.ACTIVE;
}
```

### **阶段5：知识库管理和智能搜索**

#### **5.1 知识库管理 (KnowledgeBase页面)**
```typescript
// 文档管理流程
1. 添加文档 → 2. 向量化处理 → 3. 存储嵌入 → 4. 启用搜索

// 批量向量化处理
const vectorizeAllDocuments = async (documents: KnowledgeDocument[]) => {
  for (const doc of documents) {
    const embedding = await aiService.createEmbedding(doc.content, {
      model: ZhipuModel.EMBEDDING_3,
      dimensions: 768
    });
    doc.embedding = embedding.data[0].embedding;
    doc.vectorized = true;
  }
}
```

#### **5.2 智能语义搜索 (SmartSearch页面)**
```typescript
// 语义搜索实现
const semanticSearch = async (query: string) => {
  // 1. 查询向量化
  const queryEmbedding = await aiService.createEmbedding(query);
  
  // 2. 相似度计算
  const results = documents.map(doc => ({
    doc,
    score: aiService.cosineSimilarity(queryEmbedding, doc.embedding)
  }))
  .filter(result => result.score > 0.3) // 相似度阈值
  .sort((a, b) => b.score - a.score);   // 按相似度排序
  
  return results;
}
```

### **阶段6：数据分析和监控**

#### **6.1 实时监控 (Dashboard页面)**
```typescript
// 关键指标监控
metrics: {
  totalScans: number,      // 累计扫码数
  aiQueries: number,       // AI对话数  
  resolutionRate: number,  // 问题解决率
  avgSessionTime: string,  // 平均会话时长
}

// 使用趋势分析
trendData: {
  scans: number[],    // 扫码趋势
  help: number[],     // 求助趋势
}
```

#### **6.2 详细分析 (Analytics页面)**
```typescript
// 用户行为分析
analytics: {
  uniqueUsers: number,           // 独立用户数
  avgHelpTime: number,           // 平均求助时间
  csatScore: number,             // 客户满意度
  bypassRate: number,            // 绕过率
  serviceTypeData: Array,        // 服务类型分布
  issueDistribution: Array,      // 问题分布
}
```

## 🔄 **商家端组件协同工作机制**

### **组件交互流程图**
```
Settings(API配置) → ProjectList(项目管理) → ProjectDetail(详细配置)
     ↓                    ↓                        ↓
Dashboard(监控) ← KnowledgeBase(知识库) ← SmartSearch(搜索测试)
     ↓                    ↓                        ↓
Analytics(分析) ← ProjectService(数据管理) ← AIService(AI调用)
```

### **AI模型调用策略**

#### **不同场景下的模型选择：**

1. **知识库建设阶段：**
   - **Embedding-3**: 文档向量化
   - **GLM-4.7**: 内容理解和分析

2. **配置测试阶段：**
   - **GLM-TTS**: 语音预览测试
   - **GLM-4.6V**: 多模态功能测试
   - **GLM-4.7**: 对话功能测试

3. **用户服务阶段：**
   - **GLM-4.7**: 主要对话引擎
   - **GLM-4.6V**: 图片/视频分析
   - **GLM-TTS**: 语音合成
   - **GLM-4-Voice**: 语音识别
   - **GLM-Realtime**: 实时视频对话
   - **Embedding-3**: RAG知识检索

### **功能开关的级联逻辑**

```typescript
// 功能依赖关系
const updateFeatureFlags = (config: ProjectConfig) => {
  // 视频客服开启时，自动启用相关功能
  if (config.videoChatEnabled) {
    config.avatarEnabled = true;      // 虚拟人形象
    config.annotationEnabled = true;  // 视频标注工具
    config.multimodalEnabled = true;  // 多模态分析
  }
  
  // 多模态分析关闭时，禁用视频客服
  if (!config.multimodalEnabled) {
    config.videoChatEnabled = false;
  }
  
  return config;
}
```

## 🎯 **商家工作流程总结**

### **完整操作流程：**
1. **登录后台** → 查看Dashboard概览
2. **配置API** → Settings页面设置智谱AI密钥
3. **创建项目** → ProjectList页面新建产品项目
4. **建设知识库** → ProjectDetail上传文档并向量化
5. **配置AI服务** → 设置系统指令、语音、视频分析提示词
6. **启用功能** → 开启多模态、视频客服等高级功能
7. **生成二维码** → 获取产品专属二维码用于印刷
8. **发布上线** → 将项目状态改为ACTIVE
9. **监控分析** → Dashboard和Analytics查看使用数据

### **关键成功因素：**
- ✅ API密钥正确配置
- ✅ 知识库内容完整且已向量化
- ✅ 功能开关正确设置
- ✅ 项目状态为ACTIVE
- ✅ 二维码正确生成和部署