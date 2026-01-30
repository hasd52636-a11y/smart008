
import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductProject, ProjectStatus, KnowledgeType, KnowledgeItem, AIProvider, VideoGuide } from '../types';
import { 
  ArrowLeft, Save, Trash2, Plus, FileText, Mic, QrCode, Settings,
  ShieldCheck, Video, Globe, Sparkles, Play, Info, Download, 
  ExternalLink, Copy, Upload, FileUp, X, CheckCircle
} from 'lucide-react';
import { aiService } from '../services/aiService';

interface ProjectDetailProps {
  projects: ProductProject[];
  onUpdate: (updated: ProductProject) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projects, onUpdate }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find(p => p.id === id);
  const [activeTab, setActiveTab] = useState('knowledge');
  const [localProject, setLocalProject] = useState<ProductProject | null>(project ? JSON.parse(JSON.stringify(project)) : null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!localProject) return <div className="p-10 text-white font-bold text-center">Project not found</div>;

  const handleSave = () => {
    onUpdate(localProject);
    alert('配置已同步 Configuration Synced!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fixing type error by casting Array.from(files) to File[] to ensure 'name' and 'size' properties are accessible
    const newItems: KnowledgeItem[] = (Array.from(files) as File[]).map(f => ({
      id: `k_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: f.name,
      content: `[File Context Placeholder] This file "${f.name}" has been uploaded. AI will parse its contents during inference.`,
      type: f.name.endsWith('.pdf') ? KnowledgeType.PDF : KnowledgeType.TEXT,
      fileName: f.name,
      fileSize: `${(f.size / 1024).toFixed(1)} KB`,
      createdAt: new Date().toISOString()
    }));

    if (localProject) {
      setLocalProject({
        ...localProject,
        knowledgeBase: [...localProject.knowledgeBase, ...newItems]
      });
    }
  };

  const handleManualVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newVideo: VideoGuide = {
        id: `v_${Date.now()}`,
        title: file.name,
        url: reader.result as string,
        type: 'upload',
        status: 'ready'
      };
      if (localProject) {
        setLocalProject({
          ...localProject,
          config: {
            ...localProject.config,
            videoGuides: [...localProject.config.videoGuides, newVideo]
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const productGuideUrl = `${window.location.origin}${window.location.pathname}#/view/${id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(productGuideUrl)}&color=7c3aed&bgcolor=ffffff`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/projects')} className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-slate-500 hover:text-violet-600 transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{localProject.name}</h1>
            <p className="text-slate-600 font-medium flex items-center gap-2 mt-1">
              {localProject.config.provider === AIProvider.ZHIPU ? <><Sparkles size={14} className="text-red-500" /> Zhipu GLM Cluster</> : <><Globe size={14} className="text-blue-500" /> Gemini Ultra Node</>}
            </p>
          </div>
        </div>
        <button onClick={handleSave} className="purple-gradient-btn text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3">
          <Save size={20} /> Sync 同步更改
        </button>
      </div>

      <div className="flex flex-wrap gap-3 p-2 bg-slate-100 border border-slate-200 backdrop-blur-3xl rounded-[2.5rem] w-fit">
        <TabButton id="knowledge" labelZh="多维知识库" labelEn="RAG Knowledge" active={activeTab === 'knowledge'} onClick={setActiveTab} icon={<FileText size={20}/>} />
        <TabButton id="video" labelZh="引导视频" labelEn="Video Guides" active={activeTab === 'video'} onClick={setActiveTab} icon={<Video size={20}/>} />
        <TabButton id="qr" labelZh="发布部署" labelEn="Deployment" active={activeTab === 'qr'} onClick={setActiveTab} icon={<QrCode size={20}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {activeTab === 'knowledge' && (
            <div className="space-y-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-200 hover:border-violet-500/50 bg-slate-100 p-12 rounded-[3rem] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="p-5 bg-violet-500/10 text-violet-600 rounded-full group-hover:scale-110 transition-transform">
                  <FileUp size={40} />
                </div>
                <div>
                  <h4 className="text-slate-800 font-bold text-lg">点击或拖拽上传文档 Click to Upload</h4>
                  <p className="text-slate-500 text-sm mt-1">支持 PDF, TXT, DOCX. 系统将自动分片并进行 Embedding 处理。</p>
                </div>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              </div>

              <div className="grid gap-6">
                {localProject.knowledgeBase.map((item) => (
                  <div key={item.id} className="glass-card p-6 rounded-[2rem] border border-slate-200 group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                        {item.type === KnowledgeType.PDF ? <FileText size={24} className="text-amber-500"/> : <FileText size={24}/>}
                      </div>
                      <div className="flex-1">
                        <input 
                          className="bg-transparent border-none outline-none font-bold text-slate-800 w-full"
                          value={item.title}
                          onChange={(e) => setLocalProject({...localProject, knowledgeBase: localProject.knowledgeBase.map(i => i.id === item.id ? {...i, title: e.target.value} : i)})}
                        />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{item.type} • {item.fileSize || 'Manual'}</p>
                      </div>
                      <button onClick={() => setLocalProject({...localProject, knowledgeBase: localProject.knowledgeBase.filter(i => i.id !== item.id)})} className="p-2 text-slate-500 hover:text-pink-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 rounded-[3rem] border border-white/10 flex flex-col justify-between group">
                  <div>
                    <Sparkles className="text-violet-500 mb-6" size={32} />
                    <h4 className="text-xl font-bold text-white">AI 智能合成 Video AI</h4>
                    <p className="text-sm text-slate-400 mt-2">基于产品描述自动生成虚拟引导视频。</p>
                  </div>
                  <button 
                    disabled={isGeneratingVideo}
                    onClick={async () => {
                      setIsGeneratingVideo(true);
                      const url = await aiService.generateVideoGuide(`Installation for ${localProject.name}`, localProject.config.provider);
                      if (localProject) {
                        setLocalProject({
                          ...localProject,
                          config: {...localProject.config, videoGuides: [...localProject.config.videoGuides, { id: `v_${Date.now()}`, title: 'AI Generated Guide', url: url || '', type: 'ai', status: 'ready' }]}
                        });
                      }
                      setIsGeneratingVideo(false);
                    }}
                    className="mt-8 py-4 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-2xl font-black text-xs uppercase hover:bg-violet-500 hover:text-white transition-all"
                  >
                    {isGeneratingVideo ? 'Generating...' : 'Start AI Generation'}
                  </button>
                </div>

                <div className="glass-card p-8 rounded-[3rem] border border-white/10 flex flex-col justify-between group">
                  <div>
                    <Upload className="text-amber-500 mb-6" size={32} />
                    <h4 className="text-xl font-bold text-white">商家专业上传 Upload</h4>
                    <p className="text-sm text-slate-400 mt-2">上传 100% 准确的实拍安装视频（推荐）。</p>
                  </div>
                  <button onClick={() => videoInputRef.current?.click()} className="mt-8 py-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl font-black text-xs uppercase hover:bg-amber-500 hover:text-slate-900 transition-all">
                    Upload MP4/MOV
                  </button>
                  <input type="file" ref={videoInputRef} onChange={handleManualVideoUpload} accept="video/*" className="hidden" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {localProject.config.videoGuides.map(v => (
                  <div key={v.id} className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 group bg-black/40">
                    {v.type === 'upload' ? (
                      <video src={v.url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-violet-500/20"><Video size={40}/></div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                       <button onClick={() => {
                         if (localProject) {
                           setLocalProject({...localProject, config: {...localProject.config, videoGuides: localProject.config.videoGuides.filter(vg => vg.id !== v.id)}});
                         }
                       }} className="p-3 bg-red-500/20 text-red-400 rounded-full"><Trash2 size={20}/></button>
                       <span className="text-[10px] text-white font-black uppercase tracking-widest">{v.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
             <div className="glass-card p-12 rounded-[4rem] border border-slate-200 flex flex-col md:flex-row items-center gap-12">
               <div className="w-64 h-64 bg-white p-4 rounded-[3rem] shadow-2xl">
                 <img src={qrImageUrl} className="w-full h-full rounded-[2rem]" />
               </div>
               <div className="flex-1 space-y-6">
                 <h3 className="text-3xl font-black text-slate-800">产品“数字身份证”</h3>
                 <p className="text-slate-600 font-medium">该二维码直接链接到产品的 RAG 知识库与视觉 AI 节点。印刷在包装上后，用户可获得实时的精准售后支持。</p>
                 <div className="flex gap-4">
                    <button className="px-8 py-3.5 gold-gradient-btn text-slate-900 font-black rounded-2xl text-sm flex items-center gap-2">
                       <Download size={20}/> Download PNG
                    </button>
                    <button onClick={() => window.open(`#/view/${id}`, '_blank')} className="px-8 py-3.5 bg-slate-100 border border-slate-200 text-slate-800 font-black rounded-2xl text-sm">
                       Preview 预览
                    </button>
                 </div>
               </div>
             </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="glass-card p-8 rounded-[3rem] border border-slate-200">
              <h4 className="text-slate-800 font-bold mb-6 flex items-center gap-2"><ShieldCheck size={20} className="text-violet-600"/> RAG 运行状态</h4>
              <div className="space-y-5">
                 <StatusRow label="Embedding Node" value="ACTIVE" color="text-emerald-600" />
                 <StatusRow label="Vector Index" value={`${localProject.knowledgeBase.length} Chunks`} />
                 <StatusRow label="Rerank Model" value="Enabled" />
                 <StatusRow label="TTS Provider" value={localProject.config.provider === AIProvider.ZHIPU ? 'Zhipu GLM' : 'Gemini'} />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, value, color = "text-slate-800" }: any) => (
  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
    <span className="text-slate-500">{label}</span>
    <span className={color}>{value}</span>
  </div>
);

const TabButton = ({ id, labelZh, labelEn, active, onClick, icon }: any) => (
  <button onClick={() => onClick(id)} className={`flex items-center gap-3 px-8 py-3 rounded-[2rem] font-bold text-sm transition-all duration-500 ${active ? 'purple-gradient-btn text-white shadow-xl scale-105' : 'text-slate-600 hover:text-slate-900'}`}>
    {icon}
    <div className="flex flex-col items-start leading-none">
       <span className="text-[11px] font-black">{labelZh}</span>
       <span className="text-[9px] opacity-60 uppercase font-black tracking-tighter">{labelEn}</span>
    </div>
  </button>
);

export default ProjectDetail;
