
import React from 'react';
import { ProductProject } from '../types';
import { 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  TrendingUp,
  Package,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', scans: 400, help: 240 },
  { name: 'Tue', scans: 300, help: 139 },
  { name: 'Wed', scans: 200, help: 980 },
  { name: 'Thu', scans: 278, help: 390 },
  { name: 'Fri', scans: 189, help: 480 },
  { name: 'Sat', scans: 239, help: 380 },
  { name: 'Sun', scans: 349, help: 430 },
];

const StatCard = ({ icon, labelEn, labelZh, value, trend }: any) => (
  <div className="glass-card p-8 rounded-[2.5rem] border border-slate-200 relative overflow-hidden group hover:-translate-y-2 duration-500">
    <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-600/10 blur-[60px] group-hover:bg-amber-600/20 transition-all duration-700"></div>
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 bg-violet-500/10 text-violet-600 rounded-2xl border border-violet-500/20 group-hover:border-amber-500/30 group-hover:text-amber-500 transition-all">
        {icon}
      </div>
      <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-pink-500/10 text-pink-600'} shadow-sm`}>
        {trend >= 0 ? '+' : ''}{trend}%
      </span>
    </div>
    <div className="flex flex-col">
      <span className="text-slate-800 font-black text-xl leading-none uppercase">{labelZh}</span>
      <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mt-2">{labelEn}</span>
    </div>
    <p className="text-4xl font-black text-slate-800 mt-4 tracking-tighter group-hover:text-amber-500 transition-colors">{value}</p>
  </div>
);

const Dashboard: React.FC<{ projects: ProductProject[] }> = ({ projects }) => {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter">
            你好, Alex <span className="text-amber-500">Welcome</span>
          </h1>
          <p className="text-slate-600 mt-3 font-medium text-lg">实时监控您的 AI 向导网络 Global network status.</p>
        </div>
        <div className="flex gap-4">
           <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3">
              <Sparkles className="text-amber-500" size={20} />
              <span className="text-xs font-black uppercase tracking-widest text-slate-700">System Optimized 系统已优化</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard icon={<Users size={24}/>} labelZh="累计扫码" labelEn="Total Scans" value="2,842" trend={12} />
        <StatCard icon={<MessageSquare size={24}/>} labelZh="AI 对话数" labelEn="AI Queries" value="1,420" trend={18} />
        <StatCard icon={<CheckCircle2 size={24}/>} labelZh="解决率" labelEn="Resolution" value="94.2%" trend={2} />
        <StatCard icon={<TrendingUp size={24}/>} labelZh="平均时长" labelEn="Avg. Session" value="3m 42s" trend={-5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 glass-card p-12 rounded-[3.5rem] border border-slate-200 shadow-inner">
          <div className="flex justify-between items-center mb-12">
            <div>
               <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">使用趋势 <span className="text-amber-500">Overview</span></h2>
               <p className="text-[10px] text-slate-500 font-black uppercase mt-2 tracking-widest">Real-time performance analytics</p>
            </div>
            <select className="bg-slate-100 border border-slate-200 outline-none text-[10px] font-black uppercase text-slate-700 px-6 py-3 rounded-2xl focus:border-amber-500 transition-all cursor-pointer">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '900'}} dy={20} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: '900'}} />
                <Tooltip 
                  contentStyle={{background: 'rgba(255,255,255,0.95)', borderRadius: '24px', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'}}
                  itemStyle={{fontSize: '12px', fontWeight: '900', color: '#d97706', textTransform: 'uppercase'}}
                />
                <Area type="monotone" dataKey="scans" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-12 rounded-[3.5rem] border border-slate-200 flex flex-col shadow-inner">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">近期项目 <span className="text-amber-500">Recent</span></h2>
            <p className="text-[10px] text-slate-500 font-black uppercase mt-2 tracking-widest">Active Guides</p>
          </div>
          <div className="space-y-6 flex-1">
            {projects.slice(0, 5).map(project => (
              <div key={project.id} className="flex items-center gap-5 p-5 hover:bg-slate-100 rounded-[1.8rem] transition-all cursor-pointer group border border-transparent hover:border-slate-200 hover:scale-[1.02] duration-500">
                <div className="w-16 h-16 purple-gradient-btn text-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-all">
                  <Package size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-800 truncate text-lg group-hover:text-amber-500 transition-colors">{project.name}</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-black mt-1 tracking-widest">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl text-amber-500 opacity-0 group-hover:opacity-100 transition-all shadow-lg">
                  <ArrowUpRight size={20} />
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-5 bg-slate-100 text-slate-700 font-black text-[11px] uppercase tracking-[0.25em] rounded-[1.8rem] hover:bg-amber-500 hover:text-slate-900 transition-all border border-slate-200 shadow-2xl active:scale-95">
            View All 所有产品
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
