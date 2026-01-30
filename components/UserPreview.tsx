
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductProject, AIProvider, KnowledgeType } from '../types';
import { 
  Mic, Send, Camera, Volume2, Video, X, Sparkles, Globe, Waves, 
  PlayCircle, FileText, ChevronRight
} from 'lucide-react';
import { aiService } from '../services/aiService';

const UserPreview: React.FC<{ projects: ProductProject[] }> = ({ projects }) => {
  const { projectId } = useParams();
  const project = projects.find(p => p.id === projectId);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string, image?: string}[]>([
    { role: 'assistant', text: `您好！我是 ${project?.name || '产品'} 的 AI 专家。我已经加载了最新的产品说明书和视频教程，请问有什么可以帮您？` }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  if (!project) return <div className="p-10 text-center text-white bg-slate-900 h-screen flex items-center justify-center">Invalid Project</div>;

  const handleSend = async (text?: string, image?: string) => {
    const msgText = text || inputValue;
    if (!msgText && !image) return;

    setMessages(prev => [...prev, { role: 'user', text: msgText, image }]);
    setInputValue('');
    setIsTyping(true);

    try {
      let response = '';
      if (image) {
        response = await aiService.analyzeInstallation(image, project.config.visionPrompt, project.config.provider);
      } else {
        response = await aiService.getSmartResponse(msgText, project.knowledgeBase, project.config.provider, project.config.systemInstruction);
      }
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Service busy. 请稍后再试。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const playTTS = async (text: string) => {
    const audioData = await aiService.generateSpeech(text, project.config.voiceName || 'Kore', project.config.provider);
    if (audioData) {
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      audio.play();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-lg mx-auto bg-[#0a0c10] shadow-2xl relative overflow-hidden font-sans border-x border-white/5">
      <header className="bg-[#0f1218]/80 backdrop-blur-3xl p-6 text-white shrink-0 border-b border-white/5 z-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 purple-gradient-btn rounded-2xl flex items-center justify-center">
               <Sparkles size={24} />
             </div>
             <div>
                <h1 className="font-black text-lg">{project.name}</h1>
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                   <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                   Expert Mode 专家模式
                </p>
             </div>
          </div>
          <div className="p-2.5 bg-white/5 rounded-xl">
             {project.config.provider === AIProvider.ZHIPU ? <Sparkles size={18} className="text-red-500" /> : <Globe size={18} className="text-blue-500" />}
          </div>
        </div>
        
        {project.config.videoGuides.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {project.config.videoGuides.map(v => (
              <button 
                key={v.id}
                onClick={() => setActiveVideo(v.url)}
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 whitespace-nowrap"
              >
                <PlayCircle size={14} className="text-violet-500" /> {v.title}
              </button>
            ))}
          </div>
        )}
      </header>

      {activeVideo && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6">
          <button onClick={() => setActiveVideo(null)} className="absolute top-8 right-8 text-white p-3 bg-white/10 rounded-full"><X size={28}/></button>
          <video src={activeVideo} controls autoPlay className="w-full rounded-[2rem] shadow-2xl border border-white/10" />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] ${m.role === 'user' ? 'order-1' : 'order-2'}`}>
              <div className={`p-5 rounded-[2rem] shadow-xl text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-100 rounded-tl-none border border-white/5'
              }`}>
                {m.image && <img src={m.image} className="rounded-2xl mb-4" />}
                <p>{m.text}</p>
              </div>
              {m.role === 'assistant' && (
                <div className="flex gap-4 mt-3 pl-1">
                  <button onClick={() => playTTS(m.text)} className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-violet-400">
                    <Volume2 size={12}/> Audio 播放语音
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex gap-2 p-4 bg-white/5 w-fit rounded-2xl rounded-tl-none">
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
           </div>
        )}
      </div>

      <div className="p-6 bg-[#0f1218]/80 backdrop-blur-3xl border-t border-white/5">
        <div className="flex items-center gap-3">
          {project.config.visionEnabled && (
            <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-violet-400"><Camera size={22}/></button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if(f){ const r = new FileReader(); r.onload=()=>handleSend("分析照片 Analyze photo", r.result as string); r.readAsDataURL(f); }
          }} />
          <div className="flex-1 relative">
            <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="问我关于此产品的问题..."
              className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            <button onClick={() => handleSend()} className="absolute right-2 top-2 p-2.5 purple-gradient-btn text-white rounded-xl"><Send size={18}/></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPreview;
