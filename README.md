# smart008

## 智能客服系统

基于React + Vite + 智谱AI的智能客服系统，支持二维码扫码接入、知识库检索、多模态分析等功能。

## 功能特性

- ✅ 二维码扫码接入（100个复杂链接循环使用）
- ✅ 完整的RAG知识库检索
- ✅ 智谱AI模型集成（GLM-4.7、Embedding-3等）
- ✅ 多模态分析（图片、视频）
- ✅ 语音处理（语音识别、语音合成）
- ✅ 视频客服功能
- ✅ 数据分析统计
- ✅ Vercel Serverless Functions部署

## 技术栈

- **前端**: React 19.2.4 + Vite 6.2.0 + Tailwind CSS 4.1.18
- **后端**: Vercel Serverless Functions
- **AI**: 智谱AI API
- **部署**: Vercel

## 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **配置环境变量**
   在Vercel中设置 `ZHIPU_API_KEY`

3. **本地运行**
   ```bash
   npm run dev
   ```

4. **构建部署**
   ```bash
   npm run build
   ```

## 部署方式

1. **Vercel一键部署**
   - 推送到GitHub仓库
   - 在Vercel中导入项目
   - 配置环境变量
   - 点击部署

2. **Serverless Functions**
   - API路径: `/api/zhipu/*`
   - OCR处理: `/api/ocr`

## 项目结构

```
├── api/                # Vercel Serverless Functions
├── components/         # React组件
├── services/           # 服务层（AI服务、链接服务等）
├── App.tsx             # 应用入口
└── package.json        # 依赖配置
```
