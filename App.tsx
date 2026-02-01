
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom';
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
  Sparkles,
  Video,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { ProductProject, ProjectStatus, ProjectConfig, AIProvider } from './types';
import { projectService } from './services/projectService';
import { linkService } from './services/linkService';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import Analytics from './components/Analytics';
import UserPreview from './components/UserPreview';
import VideoChat from './components/VideoChat';
import Settings from './components/Settings';
import KnowledgeBase from './components/KnowledgeBase';
import SmartSearch from './components/SmartSearch';
import ErrorBoundary from './components/ErrorBoundary';

// 链接入口处理组件 - 用于处理复杂链接，直接渲染用户界面而不重定向
const LinkEntryHandler: React.FC<{ projects: ProductProject[] }> = ({ projects }) => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [projectId, setProjectId] = useState<string | null>(null);
  
  React.useEffect(() => {
    const handleLinkEntry = async () => {
      console.log('=== 扫码链接处理开始 ===');
      console.log('shortCode:', shortCode);
      console.log('当前URL:', window.location.href);
      
      if (!shortCode) {
        console.log('shortCode为空，显示错误');
        setError('无效的链接');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        // 检查linkService的状态
        console.log('linkService状态检查:');
        console.log('开始查找shortCode对应的项目ID');
        // 注意：complexLinks和projectLinks是私有属性，无法直接访问
        
        // 根据shortCode获取对应的项目ID
        console.log('查找shortCode对应的项目ID...');
        const id = linkService.getProjectIdByShortCode(shortCode);
        console.log('找到的项目ID:', id);
        
        if (id) {
          // 验证项目是否存在且可用
          console.log('验证项目:', id);
          const validation = await projectService.validateProjectId(id);
          console.log('项目验证结果:', validation);
          
          if (validation.valid && validation.project) {
            console.log('项目验证成功，直接渲染用户界面');
            setProjectId(id);
            setLoading(false);
          } else {
            console.log('项目验证失败:', validation.error);
            setError(validation.error || '项目不可用');
            setLoading(false);
          }
        } else {
          console.log('未找到对应的项目，可能是无效的二维码');
          setError('无效的二维码或链接已过期');
          setLoading(false);
        }
      } catch (error) {
        console.error('链接处理失败:', error);
        setError('链接处理失败，请稍后重试');
        setLoading(false);
      }
    };

    handleLinkEntry();
  }, [shortCode]);
  
  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-violet-500/30 p-12 shadow-2xl text-center">
          <div className="w-16 h-16 bg-violet-500/20 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-2xl font-black text-violet-800 mb-4">正在验证二维码...</h2>
          <p className="text-slate-600">请稍候，正在为您准备专属服务...</p>
        </div>
      </div>
    );
  }

  // 显示错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-red-500/30 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-black text-red-800 mb-4">二维码验证失败</h1>
            <p className="text-slate-600 text-center mb-4">{error}</p>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>可能的原因：</strong><br/>
                • 二维码已过期或无效<br/>
                • 产品服务已暂停<br/>
                • 网络连接问题<br/>
                • 请联系中恒创世技术支持
              </p>
            </div>
            
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-violet-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-violet-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 项目验证成功，直接渲染用户界面
  if (projectId) {
    console.log('项目验证成功，渲染UserPreview组件，projectId:', projectId);
    return <UserPreview projects={projects} projectId={projectId} />;
  }

  return null;
};

// 公共欢迎页面组件 - 用户访问根路径时显示
const PublicWelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] border-2 border-violet-500/30 p-12 shadow-2xl text-center">
        <div className="w-24 h-24 bg-violet-500/20 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <MessageSquare size={48} />
        </div>
        
        <h1 className="text-4xl font-black text-violet-800 mb-6">AI虚拟客服</h1>
        <p className="text-xl text-slate-600 mb-8">中恒创世科技智能产品服务平台</p>
        
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-violet-800 mb-4">🤖 如何使用</h2>
          <div className="text-left space-y-4 text-slate-700">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
              <div>
                <p className="font-bold">购买中恒创世产品</p>
                <p className="text-sm text-slate-600">在产品包装上找到专属二维码</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
              <div>
                <p className="font-bold">扫描二维码</p>
                <p className="text-sm text-slate-600">使用手机扫码软件或浏览器扫描</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
              <div>
                <p className="font-bold">开始智能对话</p>
                <p className="text-sm text-slate-600">获得专业的安装指导和技术支持</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800">联系我们</h3>
          
          <div className="flex items-center justify-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-violet-600 uppercase tracking-widest">中恒创世技术支持</p>
              <p className="text-violet-900 font-bold">400-888-6666</p>
            </div>
          </div>
          
          {/* 测试链接区域 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-blue-800 mb-3">🧪 测试扫码功能</h4>
            <div className="space-y-2">
              <Link 
                to="/view/p1" 
                className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                测试项目 - 直接访问
              </Link>
              <Link 
                to="/view/proj_1" 
                className="block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
              >
                SmartHome Pro Hub
              </Link>
              <Link 
                to="/view/proj_2" 
                className="block w-full text-center bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors"
              >
                SmartThermostat
              </Link>
              <Link 
                to="/admin" 
                className="block w-full text-center bg-amber-600 text-white py-2 px-4 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
              >
                商家后台管理
              </Link>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 mt-8">
            © 2024 中恒创世科技有限公司 版权所有
          </p>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ projects }: { projects: ProductProject[] }) => {
  return (
    <div className="w-72 glass-card flex flex-col h-screen sticky top-0 z-20">
      <div className="p-8">
        <div className="flex items-center gap-3 text-violet-600 font-black text-2xl tracking-tight">
          <div className="purple-gradient-btn p-2 rounded-2xl text-white shadow-lg gold-border-glow">
            <MessageSquare size={24} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-slate-800">AI虚拟客服</span>
            <span className="text-[10px] text-amber-500 uppercase font-black tracking-[0.2em] mt-1">AI Service</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <SidebarLink to="/admin/dashboard" icon={<LayoutDashboard size={20} />} labelEn="Dashboard" labelZh="控制面板" />
        <SidebarLink to="/admin/projects" icon={<Package size={20} />} labelEn="Products" labelZh="产品管理" />
        <SidebarLink to="/admin/analytics" icon={<BarChart3 size={20} />} labelEn="Analytics" labelZh="数据分析" />
        <SidebarLink to="/admin/settings" icon={<SettingsIcon size={20} />} labelEn="API Settings" labelZh="API设置" />
        {/* 商家后台专有功能 */}
        <div className="px-5 py-2 mt-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">内容管理</span>
        </div>
        <SidebarLink to="/admin/knowledge" icon={<BookOpen size={20} />} labelEn="Knowledge Base" labelZh="知识库" />
        <SidebarLink to="/admin/search" icon={<Search size={20} />} labelEn="Smart Search" labelZh="智能搜索" />
      </nav>

      <div className="p-6 border-t border-slate-200">
        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 group hover:border-amber-500/30 transition-all">
          <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center justify-between">
            PRO STATUS <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_#f59e0b]"></div>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden p-[1px] border border-slate-200">
            <div className="purple-gradient-btn h-full" style={{ width: `${Math.min((projects.length / 20) * 100, 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 mt-3 font-black uppercase tracking-tighter">{projects.length} / 20 Projects 已用项目</p>
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
  const [projects, setProjects] = useState<ProductProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // 从项目服务加载所有项目（商家后台使用）
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const allProjects = await projectService.getAllProjects();
        setProjects(allProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const addProject = async (name: string, description: string) => {
    const newProject: ProductProject = {
      id: `proj_${Date.now()}`,
      name,
      description,
      status: ProjectStatus.DRAFT,
      config: {
        provider: AIProvider.ZHIPU,
        voiceName: 'tongtong',
        visionEnabled: true,
        visionPrompt: '请分析安装照片，检查产品安装是否正确，并提供专业的安装指导建议。',
        systemInstruction: '您是中恒创世科技的专业产品技术支持专家。请基于产品知识库提供准确的技术支持和安装指导。',
        videoGuides: [],
        multimodalEnabled: true,
        videoChatEnabled: true,
        videoChatPrompt: '您是中恒创世科技的专业技术支持专家。请仔细分析用户提供的视频内容，识别产品使用或安装过程中的具体问题，并基于产品知识库提供准确的解决方案。\n\n分析重点：\n1. 产品型号识别与规格确认\n2. 安装步骤的正确性检查\n3. 连接线路与接口状态\n4. 设备指示灯与显示状态\n5. 操作流程的规范性\n6. 潜在安全隐患识别\n\n回复要求：\n- 使用专业但易懂的语言\n- 提供具体的操作步骤\n- 标注重要的安全注意事项\n- 如需更换配件，请说明具体型号\n- 优先引用官方知识库内容\n- 必要时建议联系中恒创世技术支持热线',
        avatarEnabled: true,
        annotationEnabled: true
      },
      knowledgeBase: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const success = await projectService.createProject(newProject);
    if (success) {
      setProjects([...projects, newProject]);
    }
  };

  const updateProject = async (updated: ProductProject) => {
    const success = await projectService.updateProject(updated);
    if (success) {
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
    }
  };

  const toggleProjectStatus = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      const updatedProject = {
        ...project,
        status: project.status === 'active' ? 'draft' : 'active',
        updatedAt: new Date().toISOString()
      };
      await updateProject(updatedProject);
    }
  };

  const deleteProject = async (id: string) => {
    const success = await projectService.deleteProject(id);
    if (success) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <Router>
      <div className="flex min-h-screen">
        <Routes>
          {/* 用户端路由（扫码进入） - 绝对安全隔离 */}
          <Route path="/view/:id" element={
            <ErrorBoundary>
              <UserPreview projects={projects} />
            </ErrorBoundary>
          } />
          <Route path="/video/:id" element={
            <ErrorBoundary>
              <VideoChat />
            </ErrorBoundary>
          } />
          {/* 链接入口路由 - 用于处理复杂链接的重定向 */}
          <Route path="/entry/:shortCode" element={
            <ErrorBoundary>
              <LinkEntryHandler projects={projects} />
            </ErrorBoundary>
          } />
          
          {/* 商家后台路由 - 需要明确路径访问 */}
          <Route path="/merchant" element={<Navigate to="/merchant/dashboard" replace />} />
          <Route path="/merchant/*" element={
            <>
              <Sidebar projects={projects} />
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
                    <Route path="/dashboard" element={<Dashboard projects={projects} />} />
                    <Route path="/projects" element={<ProjectList projects={projects} onAdd={addProject} onToggleStatus={toggleProjectStatus} onDelete={deleteProject} />} />
                    <Route path="/projects/:id" element={<ProjectDetail projects={projects} onUpdate={updateProject} />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/knowledge" element={<KnowledgeBase />} />
                    <Route path="/search" element={<SmartSearch />} />
                  </Routes>
                </main>
              </div>
            </>
          } />
          
          {/* 默认路由 - 重定向到商家后台 */}
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* 商家后台路由 - 需要明确路径访问 */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/*" element={
            <>
              <Sidebar projects={projects} />
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
                    <Route path="/dashboard" element={<Dashboard projects={projects} />} />
                    <Route path="/projects" element={<ProjectList projects={projects} onAdd={addProject} onToggleStatus={toggleProjectStatus} onDelete={deleteProject} />} />
                    <Route path="/projects/:id" element={<ProjectDetail projects={projects} onUpdate={updateProject} />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                    {/* 商家后台专有功能 */}
                    <Route path="/knowledge" element={<KnowledgeBase />} />
                    <Route path="/search" element={<SmartSearch />} />
                  </Routes>
                </main>
              </div>
            </>
          } />
          
          {/* 未匹配路由重定向到公共欢迎页面 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
