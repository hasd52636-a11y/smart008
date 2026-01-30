# AI虚拟客服系统架构分析

## 🎯 **用户扫码对应商家预设产品资料**

### **1. 商家预设产品资料结构**

```typescript
interface ProductProject {
  id: string;                    // 产品唯一标识（二维码关联）
  name: string;                  // 产品名称
  description: string;           // 产品描述
  status: ProjectStatus;         // 服务状态（ACTIVE/DRAFT/DISABLED）
  config: ProjectConfig;         // AI服务配置
  knowledgeBase: KnowledgeItem[]; // 产品知识库
  createdAt: string;
  updatedAt: string;
}
```

### **2. 产品配置详解**

```typescript
interface ProjectConfig {
  // 基础AI配置
  provider: AIProvider;          // AI服务商（智谱）
  systemInstruction: string;     // 系统指令（AI角色定位）
  
  // 语音配置
  voiceName: string;            // 语音音色（tongtong/chuichui等）
  
  // 视觉分析配置
  visionEnabled: boolean;       // 是否启用图片分析
  visionPrompt: string;         // 图片分析提示词
  
  // 多模态配置
  multimodalEnabled: boolean;   // 多模态分析开关
  videoChatEnabled: boolean;    // 视频对话开关
  videoChatPrompt: string;      // 视频分析提示词
  
  // 界面配置
  avatarEnabled: boolean;       // 虚拟人开关
  annotationEnabled: boolean;   // 标注工具开关
  
  // 视频指南
  videoGuides: VideoGuide[];    // 产品视频教程
}
```

### **3. 知识库结构**

```typescript
interface KnowledgeItem {
  id: string;
  title: string;               // 知识标题
  content: string;             // 知识内容
  type: KnowledgeType;         // 类型（TEXT/PDF/VIDEO等）
  tags?: string[];             // 标签（用于检索）
  embedding?: number[];        // 向量嵌入（用于语义搜索）
  createdAt: string;
}
```

## 🔄 **各功能组件协同工作流程**

### **组件架构图**

```
用户扫码 → ProjectService → UserPreview/VideoChat
    ↓              ↓              ↓
二维码验证 → 项目数据加载 → AI服务初始化
    ↓              ↓              ↓
AIService ← 知识库检索 ← 用户交互
    ↓
智谱AI模型调用
```

### **1. 项目服务层 (ProjectService)**

**职责：**
- 管理所有产品项目数据
- 验证二维码有效性
- 提供项目配置和知识库

**关键方法：**
```typescript
// 验证项目ID（用户扫码时）
validateProjectId(projectId: string): Promise<{
  valid: boolean;
  project?: ProductProject;
  error?: string;
}>

// 获取项目数据
getProjectById(projectId: string): Promise<ProductProject | null>

// 记录访问统计
logUserAccess(projectId: string, userInfo: any): Promise<void>
```

### **2. 用户界面层 (UserPreview/VideoChat)**

**UserPreview组件职责：**
- 文字对话界面
- 语音输入/输出
- 图片上传分析
- OCR文字识别

**VideoChat组件职责：**
- 实时视频对话
- 摄像头/麦克风管理
- 视频标注工具
- GLM-Realtime连接

**组件协同：**
```typescript
// 1. 项目加载
useEffect(() => {
  const validation = await projectService.validateProjectId(projectId);
  setProject(validation.project);
}, [projectId]);

// 2. AI服务初始化
useEffect(() => {
  aiService.setZhipuApiKey(savedApiKey);
  if (project) {
    initializeAIService();
  }
}, [project]);
```

### **3. AI服务层 (AIService)**

**核心功能：**
- 智谱AI模型调用
- RAG知识检索
- 多模态分析
- 语音合成/识别
- 实时对话管理

## 🤖 **AI模型调用机制**

### **1. 模型选择策略**

```typescript
enum ZhipuModel {
  GLM_4_7 = 'glm-4.7',           // 文本对话（主力模型）
  GLM_4_6V = 'glm-4.6v',         // 多模态分析（图片+文本）
  GLM_4_VOICE = 'glm-4-voice',   // 语音识别
  GLM_TTS = 'glm-tts',           // 语音合成
  GLM_REALTIME = 'glm-realtime-flash', // 实时对话
  EMBEDDING_3 = 'embedding-3',    // 向量嵌入
}
```

### **2. 智能响应流程 (RAG)**

```
用户提问 → 向量化查询 → 知识库检索 → 相似度计算 → 上下文构建 → AI生成回答
```

**详细步骤：**

1. **向量化用户查询**
```typescript
const queryEmbedding = await this.createEmbedding(prompt, {
  model: ZhipuModel.EMBEDDING_3,
  dimensions: 768
});
```

2. **知识库向量检索**
```typescript
const relevantItems = vectorizedKnowledge
  .map(item => ({
    item,
    score: this.cosineSimilarity(queryEmbedding, item.embedding)
  }))
  .filter(item => item.score > 0.3)  // 相似度阈值
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);  // 取前5个最相关
```

3. **上下文构建**
```typescript
const context = relevantItems
  .map((item, index) => `[Knowledge Item ${index + 1}: ${item.title}]\n${item.content}`)
  .join('\n\n');

const fullPrompt = `${systemInstruction}\n\nContext:\n${context}\n\nUser Question: ${prompt}`;
```

4. **AI模型调用**
```typescript
const requestBody = {
  model: 'glm-4.7',
  messages: [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: fullPrompt }
  ],
  temperature: 0.1,
  stream: true  // 流式输出
};
```

## 🎭 **不同场景下的服务接入**

### **场景1：文字客服 (/view/{projectId})**

**触发条件：** 用户扫码进入文字对话界面

**服务流程：**
1. **项目验证** → ProjectService.validateProjectId()
2. **界面初始化** → UserPreview组件加载
3. **AI配置** → 加载project.config.systemInstruction
4. **知识库准备** → 加载project.knowledgeBase
5. **对话开始** → 用户输入 → RAG检索 → GLM-4.7生成回答

**使用的AI模型：**
- **GLM-4.7**: 主要对话模型
- **Embedding-3**: 知识库向量检索
- **GLM-TTS**: 语音播放（可选）
- **GLM-4.6V**: 图片分析（如果上传图片）

### **场景2：视频客服 (/video/{projectId})**

**触发条件：** 用户点击视频对话或直接扫码进入视频界面

**服务流程：**
1. **项目验证** → ProjectService.validateProjectId()
2. **权限请求** → 摄像头/麦克风权限
3. **实时连接** → GLM-Realtime WebSocket连接
4. **视频分析** → 使用project.config.videoChatPrompt
5. **实时对话** → 视频帧 + 语音 → 多模态分析 → 实时回复

**使用的AI模型：**
- **GLM-Realtime**: 实时对话引擎
- **GLM-4.6V**: 视频帧分析
- **GLM-4-Voice**: 语音识别
- **GLM-TTS**: 语音合成

### **场景3：图片分析**

**触发条件：** 用户在文字界面上传图片

**服务流程：**
1. **图片上传** → Base64编码
2. **多模态分析** → GLM-4.6V模型
3. **提示词应用** → project.config.visionPrompt
4. **结果返回** → 图片分析结果

**使用的AI模型：**
- **GLM-4.6V**: 图片理解和分析

### **场景4：OCR文字识别**

**触发条件：** 用户上传包含文字的图片

**服务流程：**
1. **图片上传** → FormData格式
2. **OCR识别** → 智谱OCR API
3. **文字提取** → 识别结果
4. **智能问答** → 基于识别文字进行RAG检索

**使用的AI模型：**
- **智谱OCR**: 文字识别
- **GLM-4.7**: 基于识别文字的问答

### **场景5：语音交互**

**触发条件：** 用户点击语音输入按钮

**服务流程：**
1. **录音开始** → MediaRecorder API
2. **语音识别** → GLM-4-Voice模型
3. **文字处理** → 转换为文字后进行RAG检索
4. **语音合成** → GLM-TTS生成回复语音

**使用的AI模型：**
- **GLM-4-Voice**: 语音转文字
- **GLM-4.7**: 文字理解和回答
- **GLM-TTS**: 文字转语音

## 🔧 **配置驱动的个性化服务**

### **系统指令个性化**
```typescript
// 不同产品的AI角色定位
systemInstruction: "您是中恒创世科技SmartHome Pro系列产品的专业技术支持专家..."
```

### **提示词个性化**
```typescript
// 视频分析针对不同产品的重点
videoChatPrompt: `
分析重点：
1. 设备型号识别与兼容性确认
2. 网络连接状态与信号强度
3. 安装位置与环境适配性
...
`
```

### **知识库个性化**
```typescript
// 每个产品独有的知识库
knowledgeBase: [
  { title: "SmartHome Pro安装指南", content: "..." },
  { title: "常见故障排除", content: "..." },
  { title: "技术参数说明", content: "..." }
]
```

## 📊 **服务质量保证**

### **1. 知识库质量**
- **向量相似度阈值**: 0.3（确保相关性）
- **检索数量限制**: 最多5个相关文档
- **得分权重**: 标题匹配(3.0) > 内容匹配(2.0) > 标签匹配(1.5)

### **2. AI回答质量**
- **温度参数**: 0.1（确保准确性）
- **最大令牌**: 1024（控制回答长度）
- **引用要求**: 必须标注知识来源

### **3. 实时性保证**
- **流式输出**: 边生成边显示
- **连接监控**: WebSocket状态实时监控
- **错误恢复**: 自动重连机制

## 🎯 **总结**

**用户扫码 → 商家预设产品资料的完整链路：**

1. **商家预设**: 在后台配置产品信息、知识库、AI参数
2. **二维码生成**: 包含项目ID的专属二维码
3. **用户扫码**: 系统验证项目ID并加载对应配置
4. **个性化服务**: 基于产品配置提供定制化AI客服
5. **智能交互**: 多模态AI模型协同工作，提供专业技术支持

整个系统实现了**一码一品一服务**的个性化AI客服体验！