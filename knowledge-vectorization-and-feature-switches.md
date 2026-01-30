# 📚 知识库向量化 & 🎛️ 功能开关详解

## 📚 **知识库向量化机制**

### **1. 向量化触发方式**

#### **🔄 自动向量化 (推荐)**
```typescript
// 文档上传时的处理流程
const handleFileUpload = (files: File[]) => {
  // 1. 文件上传和基本信息提取
  const newItems = files.map(file => ({
    id: `k_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: file.name,
    content: "[File Context Placeholder] 文件已上传，AI将在推理时解析内容",
    type: file.name.endsWith('.pdf') ? 'PDF' : 'TEXT',
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    vectorized: false  // 初始状态：未向量化
  }));
  
  // 2. 添加到知识库（此时还未向量化）
  setKnowledgeBase([...knowledgeBase, ...newItems]);
}
```

**说明**: 文档上传后**不会自动向量化**，需要商家手动触发。

#### **👆 手动向量化 (商家操作)**

**方式1: 单个文档向量化**
```typescript
// 商家点击单个文档的"向量化"按钮
const vectorizeDocument = async (doc: KnowledgeDocument) => {
  try {
    setIsVectorizing(true);
    
    // 调用智谱AI Embedding-3模型
    const embeddingResult = await aiService.createEmbedding(doc.content, {
      model: 'embedding-3',
      dimensions: 768
    });
    
    // 更新文档状态
    updateDocument({
      ...doc,
      embedding: embeddingResult.data[0].embedding,
      vectorized: true  // 标记为已向量化
    });
    
    showMessage('success', `文档 "${doc.title}" 向量化成功`);
  } catch (error) {
    showMessage('error', '向量化失败，请检查API密钥');
  }
};
```

**方式2: 批量向量化**
```typescript
// 商家点击"批量向量化"按钮
const vectorizeAllDocuments = async () => {
  const unvectorizedDocs = documents.filter(doc => !doc.vectorized);
  
  if (unvectorizedDocs.length === 0) {
    showMessage('info', '所有文档都已向量化');
    return;
  }
  
  // 逐个处理未向量化的文档
  for (const doc of unvectorizedDocs) {
    const embeddingResult = await aiService.createEmbedding(doc.content, {
      model: 'embedding-3',
      dimensions: 768
    });
    
    doc.embedding = embeddingResult.data[0].embedding;
    doc.vectorized = true;
  }
  
  showMessage('success', `成功向量化 ${unvectorizedDocs.length} 个文档`);
};
```

### **2. 向量化状态管理**

#### **文档状态标识**
```typescript
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  embedding?: number[];     // 向量数据（768维）
  vectorized: boolean;      // 向量化状态标识
  createdAt: Date;
}
```

#### **界面状态显示**
```jsx
// 在知识库管理界面显示向量化状态
{doc.vectorized ? (
  <span className="text-green-600">
    <CheckCircle size={14} />
    已向量化
  </span>
) : (
  <button onClick={() => vectorizeDocument(doc)}>
    <FileText size={12} />
    向量化
  </button>
)}
```

### **3. 向量化的重要性**

#### **⚠️ 未向量化的影响**
- **无法进行语义搜索**: 只能进行关键词匹配
- **AI回答质量下降**: 无法精确检索相关内容
- **用户体验差**: 回答不够准确和相关

#### **✅ 向量化后的优势**
- **智能语义搜索**: 理解用户意图，不仅仅是关键词匹配
- **精确内容检索**: 基于相似度计算找到最相关的内容
- **高质量AI回答**: RAG机制确保回答基于准确的知识库内容

### **4. 商家操作建议**

#### **📋 推荐工作流程**
1. **批量上传文档** → 一次性上传所有产品相关文档
2. **内容检查编辑** → 确认文档标题和内容准确性
3. **批量向量化** → 点击"批量向量化"按钮处理所有文档
4. **搜索测试** → 在SmartSearch页面测试检索效果
5. **发布上线** → 确认向量化完成后发布项目

#### **⏰ 向量化时机**
- **建议时机**: 知识库内容完整后，项目发布前
- **处理时间**: 每个文档约1-3秒（取决于内容长度）
- **成本考虑**: 向量化会消耗API调用次数

---

## 🎛️ **功能开关配置详解**

### **1. 功能开关总览**

```typescript
interface ProjectConfig {
  // 基础功能开关
  visionEnabled: boolean;        // 图片分析功能
  multimodalEnabled: boolean;    // 多模态分析功能
  videoChatEnabled: boolean;     // 视频客服功能
  
  // 高级功能开关（级联控制）
  avatarEnabled: boolean;        // 虚拟人形象
  annotationEnabled: boolean;    // 视频标注工具
  
  // 其他配置
  provider: AIProvider;          // AI服务商
  voiceName: string;            // 语音音色
  systemInstruction: string;     // 系统指令
  videoChatPrompt: string;      // 视频分析提示词
}
```

### **2. 具体功能开关说明**

#### **📷 图片分析功能 (visionEnabled)**
```typescript
visionEnabled: true/false
```

**功能说明**:
- **开启时**: 用户可以上传图片，AI使用GLM-4.6V模型分析
- **关闭时**: 用户界面不显示图片上传按钮
- **应用场景**: 产品安装照片分析、故障图片诊断

**用户界面影响**:
```jsx
{project.config.visionEnabled && (
  <button onClick={() => fileInputRef.current?.click()}>
    <Camera size={22} />
    上传图片
  </button>
)}
```

#### **🎭 多模态分析功能 (multimodalEnabled)**
```typescript
multimodalEnabled: true/false
```

**功能说明**:
- **开启时**: 支持图片、视频、音频等多种内容分析
- **关闭时**: 只支持纯文本对话
- **AI模型**: 使用GLM-4.6V进行多模态内容理解

**商家配置界面**:
```jsx
<div className="功能卡片">
  <h4>多模态分析 AI</h4>
  <label className="开关">
    <input 
      type="checkbox" 
      checked={config.multimodalEnabled}
      onChange={(e) => updateConfig({
        multimodalEnabled: e.target.checked
      })}
    />
  </label>
  <p>智能分析视频、音频内容，提取关键信息</p>
  
  {!config.multimodalEnabled && (
    <p className="警告">功能已禁用</p>
  )}
</div>
```

#### **📹 视频客服功能 (videoChatEnabled)**
```typescript
videoChatEnabled: true/false
```

**功能说明**:
- **开启时**: 用户可以进入实时视频对话模式
- **关闭时**: 用户只能使用文字客服
- **AI模型**: 使用GLM-Realtime进行实时视频分析

**级联启用逻辑**:
```typescript
// 视频客服开启时，自动启用相关功能
onChange={(e) => {
  const isEnabled = e.target.checked;
  updateConfig({
    videoChatEnabled: isEnabled,
    // 级联启用
    avatarEnabled: isEnabled,      // 虚拟人形象
    annotationEnabled: isEnabled   // 视频标注工具
  });
}}
```

**已启用功能显示**:
```jsx
{config.videoChatEnabled && (
  <div className="已启用功能">
    <span>✓ 虚拟人形象</span>
    <span>✓ 视频标注工具</span>
    <span>✓ 实时视频分析</span>
  </div>
)}
```

#### **🤖 虚拟人形象 (avatarEnabled)**
```typescript
avatarEnabled: true/false
```

**功能说明**:
- **开启时**: 显示智能助手虚拟形象，有表情和动作
- **关闭时**: 纯文字界面，无虚拟人显示
- **级联控制**: 由videoChatEnabled自动控制

#### **✏️ 视频标注工具 (annotationEnabled)**
```typescript
annotationEnabled: true/false
```

**功能说明**:
- **开启时**: 视频对话中可以添加箭头、圆圈、文字、高亮标注
- **关闭时**: 纯视频对话，无标注功能
- **级联控制**: 由videoChatEnabled自动控制

### **3. 功能开关的级联关系**

#### **依赖关系图**
```
videoChatEnabled (主开关)
├── avatarEnabled (自动启用)
├── annotationEnabled (自动启用)
└── multimodalEnabled (建议启用)

multimodalEnabled (独立开关)
├── visionEnabled (建议启用)
└── 支持图片/视频分析

visionEnabled (独立开关)
└── 支持图片上传分析
```

#### **级联逻辑实现**
```typescript
const updateFeatureFlags = (newConfig: Partial<ProjectConfig>) => {
  let updatedConfig = { ...currentConfig, ...newConfig };
  
  // 视频客服开启时，自动启用相关功能
  if (updatedConfig.videoChatEnabled) {
    updatedConfig.avatarEnabled = true;
    updatedConfig.annotationEnabled = true;
  }
  
  // 视频客服关闭时，自动禁用相关功能
  if (!updatedConfig.videoChatEnabled) {
    updatedConfig.avatarEnabled = false;
    updatedConfig.annotationEnabled = false;
  }
  
  // 多模态分析关闭时，建议关闭视频客服
  if (!updatedConfig.multimodalEnabled && updatedConfig.videoChatEnabled) {
    // 可以提示商家是否同时关闭视频客服
    console.warn('多模态分析已关闭，建议同时关闭视频客服功能');
  }
  
  return updatedConfig;
};
```

### **4. 商家配置建议**

#### **🎯 推荐配置组合**

**基础配置 (适合简单产品)**:
```typescript
{
  visionEnabled: true,          // 支持图片分析
  multimodalEnabled: false,     // 关闭多模态
  videoChatEnabled: false,      // 关闭视频客服
  avatarEnabled: false,         // 无虚拟人
  annotationEnabled: false      // 无标注工具
}
```

**标准配置 (适合大多数产品)**:
```typescript
{
  visionEnabled: true,          // 支持图片分析
  multimodalEnabled: true,      // 开启多模态
  videoChatEnabled: false,      // 暂不开启视频客服
  avatarEnabled: false,         // 无虚拟人
  annotationEnabled: false      // 无标注工具
}
```

**高级配置 (适合复杂产品)**:
```typescript
{
  visionEnabled: true,          // 支持图片分析
  multimodalEnabled: true,      // 开启多模态
  videoChatEnabled: true,       // 开启视频客服
  avatarEnabled: true,          // 自动启用虚拟人
  annotationEnabled: true       // 自动启用标注工具
}
```

#### **💰 成本考虑**
- **基础配置**: 主要使用GLM-4.7，成本较低
- **标准配置**: 增加GLM-4.6V调用，成本中等
- **高级配置**: 增加GLM-Realtime调用，成本较高

#### **🎛️ 配置建议流程**
1. **从基础配置开始** → 测试基本功能
2. **根据需求逐步启用** → 观察用户反馈
3. **监控使用数据** → 通过Analytics分析效果
4. **优化配置** → 平衡功能和成本

---

## 📋 **商家操作清单**

### **知识库向量化清单**
- [ ] 上传所有产品相关文档
- [ ] 检查文档内容和标题
- [ ] 执行批量向量化处理
- [ ] 在SmartSearch页面测试搜索效果
- [ ] 确认所有文档显示"已向量化"状态

### **功能开关配置清单**
- [ ] 根据产品复杂度选择配置方案
- [ ] 测试每个启用的功能
- [ ] 确认级联关系正确生效
- [ ] 配置个性化提示词
- [ ] 预览用户界面效果

### **发布前检查清单**
- [ ] API密钥配置正确
- [ ] 知识库完整且已向量化
- [ ] 功能开关配置合理
- [ ] 二维码生成成功
- [ ] 项目状态设为ACTIVE
- [ ] 用户访问测试通过

**完成以上清单后，商家的AI虚拟客服系统即可正式为用户提供服务！** 🚀