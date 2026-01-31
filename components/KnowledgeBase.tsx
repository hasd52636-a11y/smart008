import React, { useState, useRef, useEffect } from 'react';
import { Search, Upload, FileText, BookOpen, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { aiService } from '../services/aiService';
import { ZhipuModel } from '../services/aiService';

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
  createdAt: Date;
  vectorized: boolean;
}

interface SearchResult {
  doc: KnowledgeDocument;
  score: number;
}

const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newDocument, setNewDocument] = useState({ title: '', content: '' });
  const [message, setMessage] = useState({ type: 'info' as 'info' | 'success' | 'error', text: '' });
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载示例文档
  useEffect(() => {
    const loadSampleDocuments = () => {
      const samples: KnowledgeDocument[] = [
        {
          id: '1',
          title: '虚拟客服小百科',
          content: `# 虚拟客服使用说明

## 文档信息
- **文档名称**：虚拟客服使用说明
- **版本**：v1.0.0
- **更新日期**：2026-01-30
- **适用范围**：中恒创世科技智能产品服务平台

## 一、系统概述

### 1.1 系统架构
本虚拟客服系统基于React 19.2.4和Vite 6.4.1构建，采用前后端分离架构，通过扫码方式为用户提供智能产品服务。

### 1.2 核心功能
- **用户端**：文字对话、语音交互、图片分析、视频客服、OCR文字识别
- **商家端**：项目管理、知识库配置、AI服务设置、数据分析、API管理

### 1.3 技术栈
- **前端**：React 19.2.4、TypeScript、Tailwind CSS、React Router
- **AI服务**：智谱AI模型、多模态分析、语音合成
- **构建工具**：Vite 6.4.1
- **部署**：支持本地开发和生产环境部署

## 二、用户端功能说明

### 2.1 使用场景

#### 场景1：产品使用咨询
**适用用户**：刚购买产品，需要了解基本使用方法的用户
**使用流程**：
1. 扫描产品包装上的二维码
2. 进入虚拟客服界面
3. 文字或语音提问产品使用问题
4. 获得AI提供的详细使用指导

**案例**：用户购买了SmartHome Pro Hub智能家居控制器，扫码后询问"如何连接WiFi"，AI会提供详细的WiFi连接步骤。

#### 场景2：故障排查
**适用用户**：产品出现故障，需要诊断和解决的用户
**使用流程**：
1. 扫描产品二维码
2. 描述故障现象
3. 可上传故障照片辅助诊断
4. AI分析并提供解决方案

**案例**：用户的SmartThermostat智能温控器显示错误代码，用户拍照上传后，AI识别错误代码并提供复位步骤。

#### 场景3：安装指导
**适用用户**：需要产品安装指导的用户
**使用流程**：
1. 扫描产品二维码
2. 请求安装指导
3. 可通过视频聊天获得实时安装指导
4. AI提供分步安装教程

**案例**：用户安装SmartHome Pro Hub，通过视频聊天功能，AI实时指导用户进行接线和配置。

#### 场景4：产品维护
**适用用户**：需要产品日常维护和保养的用户
**使用流程**：
1. 扫描产品二维码
2. 询问维护相关问题
3. AI提供维护建议和周期

**案例**：用户询问SmartThermostat的电池更换周期，AI提供电池类型和更换方法。

### 2.2 功能详解

#### 2.2.1 文字对话
**功能说明**：通过文字输入与AI进行对话，获取产品信息和技术支持。
**使用步骤**：
1. 扫描产品二维码进入客服界面
2. 在底部输入框中输入问题
3. 点击发送按钮或按Enter键
4. 等待AI回复

**技术原理**：
- 使用智谱AI的GLM模型进行自然语言处理
- 基于产品知识库提供精准回答
- 支持流式输出，边生成边显示

#### 2.2.2 语音交互
**功能说明**：通过语音输入与AI进行对话，适合不方便打字的场景。
**使用步骤**：
1. 点击麦克风图标
2. 开始说话，描述问题
3. 再次点击麦克风图标结束录音
4. 等待AI识别语音并回复

**技术原理**：
- 使用浏览器的MediaRecorder API录制音频
- 调用智谱AI的语音识别API将语音转换为文字
- AI处理文字请求并生成回复
- 可选：使用语音合成API将回复转换为语音

#### 2.2.3 图片分析
**功能说明**：上传产品照片，AI分析图片内容并提供相关服务。
**使用步骤**：
1. 点击相机图标
2. 选择或拍摄产品照片
3. 等待AI分析图片内容
4. 查看AI的分析结果和建议

**技术原理**：
- 使用浏览器的File API读取图片文件
- 调用智谱AI的多模态API分析图片内容
- 结合产品知识库提供针对性建议

#### 2.2.4 OCR文字识别
**功能说明**：上传包含文字的图片，AI识别文字内容并提供服务。
**使用步骤**：
1. 点击文件图标
2. 选择包含文字的图片
3. 等待AI识别文字内容
4. 查看识别结果并基于此进行后续操作

**技术原理**：
- 使用浏览器的File API读取图片文件
- 调用智谱AI的OCR API识别文字
- 将识别结果转换为可操作的文本

#### 2.2.5 视频客服
**功能说明**：通过视频聊天获得实时的视觉指导和技术支持。
**使用步骤**：
1. 点击视频图标
2. 允许浏览器访问摄像头和麦克风
3. 开始视频聊天
4. 展示产品问题，获得实时指导

**技术原理**：
- 使用浏览器的getUserMedia API获取摄像头和麦克风权限
- 建立WebSocket连接实现实时通信
- 使用智谱AI的Realtime API进行视频分析和对话

### 2.3 用户端工作原理

#### 2.3.1 扫码验证流程
1. **二维码生成**：商家在后台为每个产品生成唯一的二维码，包含项目ID
2. **用户扫码**：用户使用手机或浏览器扫描二维码
3. **路由解析**：系统解析URL中的项目ID，路由到对应产品的客服界面
4. **项目验证**：调用projectService.validateProjectId验证项目ID的有效性
5. **加载配置**：验证通过后，加载对应产品的配置和知识库
6. **初始化AI服务**：根据产品配置初始化AI服务，准备提供智能客服

#### 2.3.2 AI对话流程
1. **用户输入**：用户通过文字、语音或图片输入问题
2. **输入处理**：系统处理用户输入，转换为AI可理解的格式
3. **知识库检索**：根据用户问题检索产品知识库
4. **AI模型调用**：调用智谱AI模型生成回答
5. **回答处理**：处理AI生成的回答，添加个性化内容
6. **结果展示**：将回答展示给用户，支持文字、语音等多种形式

#### 2.3.3 多模态处理
1. **图片分析**：使用多模态AI模型分析图片内容
2. **视频分析**：实时分析视频流，识别产品和问题
3. **语音处理**：处理语音输入和输出
4. **文字识别**：识别图片中的文字内容

## 三、商家端功能说明

### 3.1 使用场景

#### 场景1：产品项目创建
**适用用户**：需要为新产品创建客服项目的商家
**使用流程**：
1. 登录商家后台
2. 进入项目管理页面
3. 点击创建新项目
4. 填写项目信息和配置
5. 生成产品专属二维码

**案例**：商家推出新产品SmartThermostat，在后台创建项目并配置AI服务参数，生成专属二维码用于产品包装。

#### 场景2：知识库管理
**适用用户**：需要维护产品知识库的商家
**使用流程**：
1. 登录商家后台
2. 进入知识库管理页面
3. 添加、编辑或删除知识条目
4. 测试知识库搜索效果

**案例**：商家发现用户经常询问产品保修政策，在知识库中添加详细的保修条款和流程。

#### 场景3：AI服务配置
**适用用户**：需要优化AI服务的商家
**使用流程**：
1. 登录商家后台
2. 进入项目详情页面
3. 调整AI服务参数
4. 测试AI回答效果

**案例**：商家发现AI回答不够专业，调整系统指令，添加更多产品专业术语。

#### 场景4：数据分析
**适用用户**：需要分析用户使用情况的商家
**使用流程**：
1. 登录商家后台
2. 进入数据分析页面
3. 查看用户访问统计和问题分布
4. 基于数据优化产品和服务

**案例**：商家通过数据分析发现80%的用户问题集中在产品安装环节，于是制作了详细的安装视频教程。

### 3.2 功能详解

#### 3.2.1 控制面板（Dashboard）
**功能说明**：提供项目概览和关键指标监控。
**核心功能**：
- 项目数量统计
- 扫码次数分析
- AI对话次数统计
- 问题解决率分析
- 使用趋势图表

**技术原理**：
- 使用recharts库绘制数据图表
- 从projectService获取统计数据
- 实时更新数据显示

#### 3.2.2 项目管理（ProjectList）
**功能说明**：管理所有产品项目，包括创建、编辑和删除。
**使用步骤**：
1. 查看项目列表
2. 点击创建新项目
3. 填写项目信息
4. 保存项目配置
5. 生成项目二维码

**技术原理**：
- 使用projectService管理项目数据
- 数据存储在localStorage中（生产环境可扩展为数据库）
- 实时更新项目列表

#### 3.2.3 项目配置（ProjectDetail）
**功能说明**：详细配置项目的AI服务和参数。
**配置项**：
- 项目基本信息（名称、描述）
- AI服务设置（提供商、模型参数）
- 语音设置（语音类型、语速）
- 多模态功能（图片分析、视频聊天）
- 系统指令（AI角色和回答风格）

**技术原理**：
- 实时验证配置参数
- 保存配置到projectService
- 提供配置预览功能

#### 3.2.4 知识库管理（KnowledgeBase）
**功能说明**：管理产品知识库，为AI提供回答依据。
**使用步骤**：
1. 查看现有知识库条目
2. 点击添加知识条目
3. 填写知识标题和内容
4. 选择知识类型
5. 保存知识条目

**技术原理**：
- 使用向量数据库存储知识条目
- 支持语义搜索
- 自动更新知识库索引

#### 3.2.5 数据分析（Analytics）
**功能说明**：分析用户使用情况和AI服务效果。
**分析维度**：
- 用户访问统计
- 问题类型分布
- 回答满意度分析
- 服务类型使用情况
- 时间趋势分析

**技术原理**：
- 收集用户行为数据
- 使用recharts绘制分析图表
- 提供数据导出功能

#### 3.2.6 API设置（Settings）
**功能说明**：管理AI服务的API密钥和配置。
**配置项**：
- 智谱API密钥管理
- 服务提供商配置
- API调用限制设置
- 服务状态监控

**技术原理**：
- 安全存储API密钥（localStorage）
- 实时验证API密钥有效性
- 监控API调用状态

### 3.3 商家端工作原理

#### 3.3.1 项目管理流程
1. **项目创建**：商家在后台创建产品项目，设置基本信息和AI参数
2. **知识库建设**：添加产品相关知识，构建AI回答的知识基础
3. **二维码生成**：系统为每个项目生成唯一的二维码，包含项目ID
4. **项目部署**：将二维码印刷到产品包装上
5. **服务监控**：通过数据分析页面监控用户使用情况
6. **持续优化**：基于用户反馈和数据分析，持续优化AI服务

#### 3.3.2 AI服务配置流程
1. **API密钥配置**：商家在设置页面配置智谱API密钥
2. **服务参数调整**：根据产品特点调整AI服务参数
3. **系统指令设置**：设置AI的角色和回答风格
4. **功能启用**：根据需要启用或禁用多模态功能
5. **测试验证**：测试AI回答效果，确保准确性
6. **部署应用**：将配置应用到实际服务中

#### 3.3.3 数据分析流程
1. **数据收集**：系统自动收集用户访问和使用数据
2. **数据处理**：对收集的数据进行清洗和处理
3. **统计分析**：生成各种统计指标和分析报告
4. **可视化展示**：通过图表直观展示分析结果
5. **洞察提取**：基于分析结果提取业务洞察
6. **优化建议**：根据分析结果提供优化建议

## 四、设计合理性解释

### 4.1 为什么采用扫码方式？

**优势**：
- **便捷性**：用户无需下载APP，直接扫码即可使用
- **精准性**：每个产品对应唯一二维码，确保提供针对性服务
- **低成本**：无需为每个产品开发专用APP，降低开发和维护成本
- **易更新**：服务内容可通过后台实时更新，无需用户更新客户端
- **广泛兼容**：支持所有具有扫码功能的设备

**技术实现**：
- 使用HashRouter实现前端路由，确保二维码URL稳定
- 项目ID作为路由参数，确保服务精准定位
- 响应式设计，适配不同设备屏幕

### 4.2 为什么分为用户端和商家端？

**优势**：
- **职责分离**：用户端专注于提供服务，商家端专注于管理和配置
- **安全性**：商家端功能需要授权访问，保护敏感配置
- **用户体验**：用户端界面简洁直观，专注于核心功能
- **管理效率**：商家端提供专业的管理工具，提高运营效率
- **可扩展性**：两端独立开发和部署，便于功能扩展

**技术实现**：
- 使用React Router实现路由隔离
- 用户端路由：/view/:id, /video/:id
- 商家端路由：/merchant/*
- 默认路由：公共欢迎页面

### 4.3 为什么使用多模态AI？

**优势**：
- **全面理解**：同时处理文字、语音、图片、视频等多种信息
- **场景覆盖**：适应不同使用场景的需求
- **用户友好**：提供多种交互方式，满足不同用户习惯
- **问题诊断**：通过视觉信息更准确地诊断产品问题
- **实时指导**：通过视频实现实时可视化指导

**技术原理**：
- 集成智谱AI的多模态模型
- 使用浏览器的MediaRecorder API处理音视频
- 使用WebSocket实现实时通信
- 优化资源使用，确保流畅体验

### 4.4 为什么使用本地存储？

**优势**：
- **快速响应**：本地存储访问速度快，提高系统响应速度
- **离线功能**：基本功能可在无网络环境下使用
- **降低成本**：减少服务器存储和带宽成本
- **易于部署**：无需复杂的后端基础设施
- **数据隐私**：用户数据存储在本地，提高隐私安全性

**技术实现**：
- 使用localStorage存储项目数据和API密钥
- 实现数据持久化和同步机制
- 生产环境可扩展为数据库存储

### 4.5 为什么使用ErrorBoundary？

**优势**：
- **系统稳定性**：防止单个组件错误导致整个应用崩溃
- **用户体验**：提供友好的错误提示，而非空白页面
- **错误监控**：集中捕获和记录错误信息
- **故障恢复**：允许应用在错误后继续运行
- **开发效率**：简化错误处理代码，提高开发效率

**技术实现**：
- 使用React的ErrorBoundary组件捕获渲染错误
- 提供详细的错误信息和用户指引
- 记录错误日志，便于问题排查

## 五、使用建议

### 5.1 用户端使用建议

1. **最佳浏览器**：推荐使用Chrome浏览器获得最佳体验
2. **网络环境**：建议在稳定的网络环境下使用视频和语音功能
3. **权限设置**：使用语音和视频功能时，请允许浏览器访问麦克风和摄像头
4. **图片质量**：上传图片时，确保图片清晰，光线充足
5. **问题描述**：详细描述问题，提供更多上下文信息，获得更准确的回答
6. **隐私保护**：系统不会收集个人信息，对话内容仅用于当前会话

### 5.2 商家端使用建议

1. **API密钥管理**：妥善保管API密钥，避免泄露
2. **知识库维护**：定期更新知识库，确保信息准确性
3. **服务监控**：定期查看数据分析，了解用户需求和问题
4. **系统指令优化**：根据用户反馈优化AI系统指令，提高回答质量
5. **功能测试**：新功能上线前，进行充分的测试验证
6. **备份数据**：定期导出和备份项目数据，防止数据丢失

### 5.3 故障排查建议

1. **页面加载失败**：检查网络连接，清除浏览器缓存后重试
2. **AI回答不准确**：检查知识库是否包含相关信息，优化系统指令
3. **语音功能异常**：检查麦克风权限，确保麦克风正常工作
4. **视频功能异常**：检查摄像头权限，确保摄像头正常工作
5. **图片分析失败**：确保图片格式正确，大小适中
6. **二维码扫描失败**：检查二维码是否清晰，尝试在不同光线条件下扫描

## 六、技术支持

### 6.1 联系信息
- **技术支持热线**：400-888-6666
- **官方网站**：www.aivirtualservice.com
- **微信公众号**：AI虚拟客服助手

### 6.2 常见问题

**Q1：扫码后显示黑屏怎么办？**
A1：清除浏览器缓存，使用Chrome浏览器重试，或联系技术支持。

**Q2：AI回答不准确怎么办？**
A2：商家可在后台更新知识库，优化系统指令，提高AI回答质量。

**Q3：语音功能不工作怎么办？**
A3：检查麦克风权限，确保麦克风正常工作，尝试刷新页面。

**Q4：视频聊天连接失败怎么办？**
A4：检查网络连接，确保摄像头和麦克风权限已授权，尝试重新连接。

**Q5：如何为多个产品创建项目？**
A5：在商家后台的项目管理页面，点击创建新项目，为每个产品创建独立项目。

**Q6：知识库如何组织更有效？**
A6：按照产品功能模块组织知识库，使用清晰的标题和结构化内容，便于AI检索。

**Q7：如何提高AI回答的专业性？**
A7：在系统指令中设置专业的角色定位，添加详细的产品专业术语和技术规范。

**Q8：数据分析如何帮助优化服务？**
A8：通过分析用户问题分布，识别常见问题和痛点，针对性优化知识库和系统指令。

## 七、版本更新记录

| 版本 | 更新日期 | 更新内容 |
|------|----------|----------|
| v1.0.0 | 2026-01-30 | 初始版本，包含基本功能 |
| v1.1.0 | 2026-02-15 | 优化语音识别和图片分析功能 |
| v1.2.0 | 2026-03-01 | 添加视频聊天标注功能 |
| v1.3.0 | 2026-03-15 | 增强数据分析能力，添加更多图表 |

## 八、免责声明

- 本系统提供的回答仅供参考，具体产品使用请以官方说明书为准
- 系统依赖网络连接和AI服务，可能因网络或服务问题暂时不可用
- 系统不会收集用户个人信息，对话内容仅用于当前会话
- 商家需确保知识库信息的准确性和合法性
- 系统使用受智谱AI服务条款和限制约束

---

**文档结束**

© 2026 中恒创世科技有限公司 版权所有`,
          createdAt: new Date(),
          vectorized: false
        },
        {
          id: '2',
          title: 'SmartHome Pro Hub详细使用指南',
          content: `# SmartHome Pro Hub详细使用指南

## 产品概述
SmartHome Pro Hub是一款功能强大的智能家居控制中心，支持连接和管理多种智能设备，为您打造智能、便捷、安全的家居环境。

## 主要功能
- **设备连接**：支持WiFi、Zigbee、Z-Wave等多种协议
- **智能场景**：可创建和管理多种自动化场景
- **远程控制**：通过手机APP远程控制家中设备
- **语音控制**：支持与Alexa、Google Assistant等语音助手集成
- **能源管理**：监控和优化家庭能源使用
- **安全监控**：集成安防设备，提供家庭安全保障

## 快速开始

### 开箱内容
- SmartHome Pro Hub主机
- 电源适配器
- 以太网网线
- 快速入门指南
- 保修卡

### 硬件安装
1. **连接电源**：将电源适配器插入Hub背面的电源接口
2. **连接网络**：可选择WiFi或以太网连接
   - WiFi：通过手机APP进行网络配置
   - 以太网：直接插入网线
3. **放置位置**：选择中心位置，确保信号覆盖全屋

### 软件配置
1. **下载APP**：搜索"SmartHome Pro"并下载
2. **创建账户**：注册并登录APP
3. **添加设备**：按照APP引导添加Hub
4. **连接设备**：添加家中的智能设备
5. **创建场景**：设置自动化场景

## 详细功能说明

### 设备管理
- **添加设备**：支持自动发现和手动添加
- **设备分组**：可按房间或功能对设备进行分组
- **设备控制**：支持开关、调节、定时等操作
- **设备状态**：实时查看设备运行状态

### 智能场景
- **场景创建**：根据时间、位置、设备状态等条件创建
- **场景触发**：支持多种触发方式
- **场景管理**：编辑、启用、禁用场景
- **场景分享**：可与家庭成员分享场景

### 语音控制
- **语音助手集成**：支持多种语音助手
- **语音指令**：可自定义语音指令
- **语音反馈**：设置语音反馈方式

### 能源管理
- **能源监控**：实时监控设备能耗
- **能源分析**：提供能耗报告和分析
- **节能建议**：基于使用习惯提供节能建议

### 安全功能
- **安防集成**：支持摄像头、门窗传感器等
- **安全告警**：异常情况及时通知
- **远程查看**：通过APP远程查看家中情况

## 故障排除

### 常见问题
1. **Hub无法连接网络**
   - 检查网络连接
   - 重启Hub
   - 重置网络设置

2. **设备无法添加**
   - 确保设备在Hub信号范围内
   - 检查设备电源
   - 重启设备和Hub

3. **APP无法控制设备**
   - 检查网络连接
   - 确认设备在线
   - 重启APP

4. **语音控制不响应**
   - 检查语音助手连接
   - 确认语音指令正确
   - 重启语音助手设备

### 重置方法
- **软重置**：通过APP进行重置
- **硬重置**：按住复位按钮10秒

## 技术规格

- **处理器**：四核1.4GHz处理器
- **内存**：1GB RAM
- **存储**：8GB闪存
- **网络**：WiFi 5、以太网
- **无线协议**：Zigbee 3.0、Z-Wave Plus
- **电源**：12V/2A
- **尺寸**：100×100×30mm
- **重量**：200g

## 保修信息
- **保修期限**：24个月
- **保修范围**：硬件故障
- **保修除外**：人为损坏、自然灾害等

## 联系支持
- **客服热线**：400-888-6666
- **官方网站**：www.smarthomepro.com
- **在线支持**：APP内在线客服
- **邮件支持**：support@smarthomepro.com

---

**文档结束**

© 2026 SmartHome Pro 版权所有`,
          createdAt: new Date(),
          vectorized: false
        }
      ];
      setDocuments(samples);
    };

    loadSampleDocuments();
  }, []);

  // 显示消息
  const showMessage = (type: 'info' | 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: 'info', text: '' }), 3000);
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadProgress(0);
      setUploadStatus('正在上传...');
      
      const reader = new FileReader();
      
      // 监听进度事件
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          setUploadStatus(`上传中... ${progress}%`);
        }
      };
      
      reader.onload = (event) => {
        setUploadProgress(100);
        setUploadStatus('上传完成，处理中...');
        
        const content = event.target?.result as string;
        setNewDocument({
          title: file.name,
          content
        });
        
        // 模拟处理时间
        setTimeout(() => {
          setUploadProgress(null);
          setUploadStatus('');
        }, 1000);
      };
      
      reader.onerror = () => {
        setUploadStatus('上传失败');
        setTimeout(() => {
          setUploadProgress(null);
          setUploadStatus('');
        }, 2000);
      };
      
      reader.readAsText(file);
    }
  };

  // 添加新文档
  const addDocument = async () => {
    if (!newDocument.title || !newDocument.content) {
      showMessage('error', '请填写文档标题和内容');
      return;
    }

    setUploadProgress(0);
    setUploadStatus('正在向量化...');

    try {
      // 创建文档对象
      const doc: KnowledgeDocument = {
        id: Date.now().toString(),
        title: newDocument.title,
        content: newDocument.content,
        createdAt: new Date(),
        vectorized: false
      };

      // 向量化文档内容
      setIsVectorizing(true);
      
      // 模拟向量化进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 90) {
            clearInterval(progressInterval);
            return prev || 90;
          }
          return prev + 10;
        });
      }, 200);

      const embeddingResult = await aiService.createEmbedding(doc.content, {
        model: ZhipuModel.EMBEDDING_3,
        dimensions: 768
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('已存放到多维知识库');

      // 更新文档为已向量化
      const vectorizedDoc = {
        ...doc,
        embedding: embeddingResult.data[0].embedding,
        vectorized: true
      };

      // 添加到知识库
      setDocuments(prev => [...prev, vectorizedDoc]);
      setNewDocument({ title: '', content: '' });
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 清除上传状态
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
      }, 1500);

      showMessage('success', '文档添加成功，已存放到多维知识库');
    } catch (error) {
      console.error('文档向量化失败:', error);
      setUploadStatus('向量化失败');
      setTimeout(() => {
        setUploadProgress(null);
        setUploadStatus('');
      }, 2000);
      showMessage('error', '文档向量化失败，请检查API密钥是否正确');
    } finally {
      setIsVectorizing(false);
    }
  };

  // 删除文档
  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    showMessage('success', '文档删除成功');
  };

  // 向量化单个文档
  const vectorizeDocument = async (doc: KnowledgeDocument) => {
    try {
      setIsVectorizing(true);
      
      const embeddingResult = await aiService.createEmbedding(doc.content, {
        model: ZhipuModel.EMBEDDING_3,
        dimensions: 768
      });

      setDocuments(prev => prev.map(d => 
        d.id === doc.id 
          ? { ...d, embedding: embeddingResult.data[0].embedding, vectorized: true }
          : d
      ));

      showMessage('success', `文档 "${doc.title}" 向量化成功`);
    } catch (error) {
      console.error('向量化失败:', error);
      showMessage('error', '文档向量化失败，请检查API密钥是否正确');
    } finally {
      setIsVectorizing(false);
    }
  };

  // 批量向量化所有文档
  const vectorizeAllDocuments = async () => {
    try {
      setIsVectorizing(true);
      
      const unvectorizedDocs = documents.filter(doc => !doc.vectorized);
      if (unvectorizedDocs.length === 0) {
        showMessage('info', '所有文档都已向量化');
        return;
      }

      const updatedDocs = [...documents];
      
      for (const doc of unvectorizedDocs) {
        const embeddingResult = await aiService.createEmbedding(doc.content, {
          model: ZhipuModel.EMBEDDING_3,
          dimensions: 768
        });
        
        const index = updatedDocs.findIndex(d => d.id === doc.id);
        if (index !== -1) {
          updatedDocs[index] = {
            ...updatedDocs[index],
            embedding: embeddingResult.data[0].embedding,
            vectorized: true
          };
        }
      }

      setDocuments(updatedDocs);
      showMessage('success', `成功向量化 ${unvectorizedDocs.length} 个文档`);
    } catch (error) {
      console.error('批量向量化失败:', error);
      showMessage('error', '批量向量化失败，请检查API密钥是否正确');
    } finally {
      setIsVectorizing(false);
    }
  };

  // 语义搜索
  const semanticSearch = async () => {
    if (!searchQuery.trim()) {
      showMessage('error', '请输入搜索关键词');
      return;
    }

    try {
      setIsSearching(true);
      
      // 确保所有文档都已向量化
      const unvectorizedDocs = documents.filter(doc => !doc.vectorized);
      if (unvectorizedDocs.length > 0) {
        showMessage('info', '正在向量化未处理的文档...');
        await Promise.all(
          unvectorizedDocs.map(async (doc) => {
            const embeddingResult = await aiService.createEmbedding(doc.content, {
              model: ZhipuModel.EMBEDDING_3,
              dimensions: 768
            });
            setDocuments(prev => prev.map(d => 
              d.id === doc.id 
                ? { ...d, embedding: embeddingResult.data[0].embedding, vectorized: true }
                : d
            ));
          })
        );
      }

      // 向量化查询
      const queryEmbedding = await aiService.createEmbedding(searchQuery, {
        model: ZhipuModel.EMBEDDING_3,
        dimensions: 768
      });

      // 计算相似度
      const results = documents
        .filter(doc => doc.vectorized && doc.embedding)
        .map(doc => ({
          doc,
          score: aiService.cosineSimilarity(
            queryEmbedding.data[0].embedding,
            doc.embedding!
          )
        }))
        .sort((a, b) => b.score - a.score);

      setSearchResults(results);
      showMessage('success', `找到 ${results.length} 个相关文档`);
    } catch (error) {
      console.error('搜索失败:', error);
      showMessage('error', '搜索失败，请检查API密钥是否正确');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* 消息提示 */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.type === 'success' && <CheckCircle size={20} />}
          {message.type === 'error' && <AlertCircle size={20} />}
          {message.type === 'info' && <Search size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：文档管理 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="text-blue-600" />
                知识库管理
              </h2>
              <button
                onClick={vectorizeAllDocuments}
                disabled={isVectorizing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isVectorizing ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    处理中...
                  </>
                ) : (
                  <>
                    <FileText />
                    批量向量化
                  </>
                )}
              </button>
            </div>

            {/* 文档上传 */}
            <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">添加新文档</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">文档标题</label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入文档标题"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">文档内容</label>
                <textarea
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                  placeholder="输入文档内容"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">或上传文件</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.docx"
                    onChange={handleFileUpload}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {uploadedFile && (
                    <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                  )}
                </div>
              </div>
              
              {/* 上传进度显示 */}
              {uploadProgress !== null && (
                <div className="mb-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                      {uploadedFile?.name || 'Document'}
                    </span>
                    <span className="text-xs font-black text-amber-600">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {uploadStatus}
                  </p>
                </div>
              )}

              <button
                onClick={addDocument}
                disabled={!newDocument.title || !newDocument.content}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                <Upload size={18} />
                添加文档
              </button>
            </div>

            {/* 文档列表 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">文档列表</h3>
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 opacity-50" />
                    <p>暂无文档，请添加新文档</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{doc.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(doc.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {doc.content}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {doc.vectorized ? (
                            <span className="text-xs flex items-center gap-1 text-green-600">
                              <CheckCircle size={14} />
                              已向量化
                            </span>
                          ) : (
                            <button
                              onClick={() => vectorizeDocument(doc)}
                              disabled={isVectorizing}
                              className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                            >
                              {isVectorizing ? (
                                <Loader2 className="animate-spin" size={12} />
                              ) : (
                                <FileText size={12} />
                              )}
                              向量化
                            </button>
                          )}
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="text-xs flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            <Trash2 size={12} />
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：智能搜索 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <Search className="text-purple-600" />
              智能语义搜索
            </h2>

            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && semanticSearch()}
                  placeholder="输入搜索关键词..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={semanticSearch}
                  disabled={isSearching}
                  className="flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {isSearching ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* 搜索结果 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">搜索结果</h3>
              <div className="space-y-3">
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Search size={48} className="mx-auto mb-2 opacity-50" />
                    <p>暂无搜索结果，请输入关键词搜索</p>
                  </div>
                ) : (
                  searchResults.map((result, index) => (
                    <div key={result.doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{result.doc.title}</h4>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                            {result.doc.content}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-medium text-purple-600">
                            相似度: {Math.round(result.score * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;