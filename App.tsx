
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  Search, 
  Bell, 
  User,
  ChevronRight,
  MoreVertical,
  QrCode,
  BookOpen,
  Mic,
  Eye,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { ProductProject, ProjectStatus, ProjectConfig, AIProvider } from './types';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import Analytics from './components/Analytics';
import UserPreview from './components/UserPreview';
import Settings from './components/Settings';

const Sidebar = () => {
  return (
    <div className="w-72 glass-card flex flex-col h-screen sticky top-0 z-20">
      <div className="p-8">
        <div className="flex items-center gap-3 text-violet-600 font-black text-2xl tracking-tight">
          <div className="purple-gradient-btn p-2 rounded-2xl text-white shadow-lg gold-border-glow">
            <Sparkles size={24} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-slate-800">SmartGuide</span>
            <span className="text-[10px] text-amber-500 uppercase font-black tracking-[0.2em] mt-1">AI Platform</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <SidebarLink to="/" icon={<LayoutDashboard size={20} />} labelEn="Dashboard" labelZh="控制面板" />
        <SidebarLink to="/projects" icon={<Package size={20} />} labelEn="Products" labelZh="产品管理" />
        <SidebarLink to="/analytics" icon={<BarChart3 size={20} />} labelEn="Analytics" labelZh="数据分析" />
        <SidebarLink to="/settings" icon={<SettingsIcon size={20} />} labelEn="API Settings" labelZh="接口设置" />
      </nav>

      <div className="p-6 border-t border-slate-200">
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 group hover:border-amber-500/30 transition-all">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            PRO STATUS <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]"></div>
          </p>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-[1px] border border-slate-200">
            <div className="purple-gradient-btn h-full w-2/3 rounded-full"></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-black uppercase tracking-tighter">12 / 20 Projects 已用项目</p>
        </div>
      </div>
    </div>
  );
};

const SidebarLink = ({ to, icon, labelEn, labelZh }: { to: string, icon: React.ReactNode, labelEn: string, labelZh: string }) => (
  <Link 
    to={to} 
    className="flex items-center gap-4 px-5 py-4 text-slate-500 hover:bg-slate-100 hover:text-amber-500 rounded-2xl transition-all duration-500 group relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <span className="group-hover:scale-110 transition-transform z-10 group-hover:text-amber-500">{icon}</span>
    <div className="flex flex-col z-10">
      <span className="text-sm font-black tracking-wide text-slate-700 group-hover:text-amber-500 transition-colors uppercase">{labelZh}</span>
      <span className="text-[9px] opacity-50 uppercase font-black group-hover:opacity-100 group-hover:text-amber-600 transition-all">{labelEn}</span>
    </div>
  </Link>
);

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProductProject[]>(() => {
    const saved = localStorage.getItem('smartguide_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: any) => ({
        ...p,
        config: {
          provider: AIProvider.GEMINI,
          videoGuides: [],
          ...p.config
        }
      }));
    }
    return [
      {
        id: 'proj_1',
        name: 'SmartHome Pro Hub',
        description: 'Next-gen automation controller for modern homes. 下一代智能家居控制器。',
        status: ProjectStatus.ACTIVE,
        config: {
          provider: AIProvider.GEMINI,
          voiceName: 'Zephyr',
          visionEnabled: true,
          visionPrompt: 'Check if all cables are plugged in and the LED is glowing green.',
          systemInstruction: 'You are a technical support expert for SmartHome Pro products.',
          videoGuides: []
        },
        knowledgeBase: [
          { id: 'k1', title: 'Initial Setup', type: 'text' as any, content: 'Plug in the device and wait 60 seconds.', createdAt: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('smartguide_projects', JSON.stringify(projects));
  }, [projects]);

  const addProject = (name: string, description: string) => {
    const newProject: ProductProject = {
      id: `proj_${Date.now()}`,
      name,
      description,
      status: ProjectStatus.DRAFT,
      config: {
        provider: AIProvider.GEMINI,
        voiceName: 'Zephyr',
        visionEnabled: false,
        visionPrompt: 'Please verify if the installation matches the manual.',
        systemInstruction: 'You are a helpful product assistant.',
        videoGuides: []
      },
      knowledgeBase: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setProjects([...projects, newProject]);
  };

  const updateProject = (updated: ProductProject) => {
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <Router>
      <div className="flex min-h-screen">
        <Routes>
          <Route path="/view/:projectId" element={<UserPreview projects={projects} />} />
          <Route path="*" element={
            <>
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0">
                <header className="h-24 border-b border-slate-200 bg-white/80 flex items-center justify-between px-12 sticky top-0 z-10 backdrop-blur-2xl">
                  <div className="flex items-center gap-4 bg-slate-100 border border-slate-200 px-6 py-3 rounded-2xl w-[450px] shadow-inner focus-within:border-amber-500/50 transition-all">
                    <Search size={18} className="text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="搜索资产或向导 Search guide assets..." 
                      className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-500 font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-10">
                    <button className="text-slate-500 hover:text-amber-500 transition-all relative">
                      <Bell size={24} />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-4 border-white shadow-lg"></span>
                    </button>
                    <div className="flex items-center gap-5 pl-10 border-l border-slate-200">
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-700 leading-none uppercase tracking-wide">Alex Merchant</p>
                        <p className="text-[10px] text-amber-500 uppercase font-black mt-2 tracking-[0.2em] opacity-80">PRO Admin</p>
                      </div>
                      <div className="w-12 h-12 rounded-2xl purple-gradient-btn gold-border-glow flex items-center justify-center text-white shadow-2xl">
                        <User size={24} />
                      </div>
                    </div>
                  </div>
                </header>

                <main className="p-12 pb-24">
                  <Routes>
                    <Route path="/" element={<Dashboard projects={projects} />} />
                    <Route path="/projects" element={<ProjectList projects={projects} onAdd={addProject} />} />
                    <Route path="/projects/:id" element={<ProjectDetail projects={projects} onUpdate={updateProject} />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
