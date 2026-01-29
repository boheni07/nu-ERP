
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend 
} from 'recharts';
import { Customer, Project, Contract, Payment } from '../types';
import { formatCurrency } from '../utils';
import { 
  TrendingUp, AlertCircle, DollarSign, Briefcase, ArrowUpRight, 
  ArrowDownRight, Activity, Wallet, CalendarRange, Clock, 
  CheckCircle2, PieChart as PieIcon, Layers, Target, FileText
} from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  payments: Payment[];
}

const Dashboard: React.FC<DashboardProps> = ({ projects, contracts, payments }) => {
  // 1. 핵심 재무 지표 계산
  const stats = useMemo(() => {
    const sales = contracts.filter(c => c.category === '매출');
    const purchases = contracts.filter(c => c.category === '매입');

    const totalSales = sales.reduce((sum, c) => sum + c.amount, 0);
    const totalPurchases = purchases.reduce((sum, c) => sum + c.amount, 0);
    
    const collected = payments
      .filter(p => p.status === '완료' && contracts.find(c => c.id === p.contractId)?.category === '매출')
      .reduce((sum, p) => sum + p.amount, 0);

    const paid = payments
      .filter(p => p.status === '완료' && contracts.find(c => c.id === p.contractId)?.category === '매입')
      .reduce((sum, p) => sum + p.amount, 0);

    const margin = totalSales - totalPurchases;
    const marginRate = totalSales > 0 ? (margin / totalSales) * 100 : 0;
    const collectionRate = totalSales > 0 ? (collected / totalSales) * 100 : 0;

    return { totalSales, totalPurchases, margin, marginRate, collected, paid, collectionRate };
  }, [contracts, payments]);

  // 2. 상태 분포 데이터 (프로젝트 & 계약)
  const statusColors: Record<string, string> = {
    '준비': '#94a3b8',
    '진행중': '#6366f1',
    '지연중': '#f43f5e',
    '완료': '#10b981',
    '계약': '#8b5cf6',
    '완료(미결제)': '#f59e0b',
    '종료': '#475569'
  };

  const projectStatusData = useMemo(() => {
    const counts = projects.reduce((acc, p) => {
      const status = p.status || '준비';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const contractStatusData = useMemo(() => {
    const counts = contracts.reduce((acc, c) => {
      const status = c.status || '준비';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [contracts]);

  // 3. 15개월 동적 자금 흐름 추이 데이터 (가장 먼 예정일의 다음달 기준 역산)
  const monthlyTrend = useMemo(() => {
    // 1. 데이터 중 가장 늦은 날짜 찾기 (없으면 오늘)
    let maxDate = new Date();
    if (payments.length > 0) {
      const dates = payments.map(p => new Date(p.scheduledDate).getTime());
      maxDate = new Date(Math.max(...dates));
    }

    // 2. 기준 종료일을 가장 늦은 날짜의 '다음 달'로 설정
    const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);

    // 3. 해당 월부터 과거 15개월 생성 (i = -14 to 0)
    const months = [];
    for (let i = -14; i <= 0; i++) {
      const d = new Date(endDate.getFullYear(), endDate.getMonth() + i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const mPayments = payments.filter(p => p.scheduledDate.startsWith(monthStr));
      const sIn = mPayments.filter(p => contracts.find(c => c.id === p.contractId)?.category === '매출').reduce((sum, p) => sum + p.amount, 0);
      const pOut = mPayments.filter(p => contracts.find(c => c.id === p.contractId)?.category === '매입').reduce((sum, p) => sum + p.amount, 0);

      months.push({
        name: `${d.getMonth() + 1}월`,
        fullDate: `${d.getFullYear()}.${d.getMonth() + 1}`,
        매출: sIn,
        매입: pOut
      });
    }
    return months;
  }, [payments, contracts]);

  // 4. 결제 단계별 퍼널 데이터
  const pipelineData = useMemo(() => {
    const salesPayments = payments.filter(p => contracts.find(c => c.id === p.contractId)?.category === '매출');
    const scheduled = salesPayments.filter(p => p.status === '예정' || p.status === '지연').reduce((sum, p) => sum + p.amount, 0);
    const invoiced = salesPayments.filter(p => p.status === '청구').reduce((sum, p) => sum + p.amount, 0);
    const completed = salesPayments.filter(p => p.status === '완료').reduce((sum, p) => sum + p.amount, 0);
    const total = scheduled + invoiced + completed;

    return { 
      total,
      stages: [
        { label: '입금 예정', amount: scheduled, color: 'bg-slate-200', text: 'text-slate-600', percent: total > 0 ? (scheduled/total)*100 : 0 },
        { label: '청구 완료', amount: invoiced, color: 'bg-amber-400', text: 'text-amber-900', percent: total > 0 ? (invoiced/total)*100 : 0 },
        { label: '수금 완료', amount: completed, color: 'bg-indigo-600', text: 'text-white', percent: total > 0 ? (completed/total)*100 : 0 }
      ]
    };
  }, [payments, contracts]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="매출 총액" 
          value={formatCurrency(stats.totalSales)} 
          subValue={`목표 대비 ${stats.collectionRate.toFixed(1)}% 수금`}
          icon={<DollarSign size={20} className="text-indigo-600" />}
          trend={{ label: "수금완료", value: formatCurrency(stats.collected), isPositive: true }}
        />
        <StatCard 
          title="매입 총액" 
          value={formatCurrency(stats.totalPurchases)} 
          subValue={`지급 완료: ${formatCurrency(stats.paid)}`}
          icon={<Wallet size={20} className="text-rose-500" />}
          trend={{ label: "미지급", value: formatCurrency(stats.totalPurchases - stats.paid), isPositive: false }}
        />
        <StatCard 
          title="예상 영업이익" 
          value={formatCurrency(stats.margin)} 
          subValue={`이익률: ${stats.marginRate.toFixed(1)}%`}
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          trend={{ label: "수익 구간", value: "안정적", isPositive: true }}
        />
        <StatCard 
          title="운영 효율성" 
          value={`${projects.length} Projects`} 
          subValue={`진행중인 계약 ${contracts.filter(c => c.status === '진행중').length}건`}
          icon={<Activity size={20} className="text-amber-500" />}
          trend={{ label: "지연 리스크", value: `${payments.filter(p => p.status === '지연').length}건`, isPositive: false }}
        />
      </div>

      {/* 15개월 자금 흐름 추이 (Full Width) */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8 px-2">
          <div>
            <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
              <CalendarRange size={24} className="text-indigo-500" />
              15개월 자금 흐름 추이 분석
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Dynamic Cash-flow Lifecycle Analysis</p>
          </div>
          <div className="flex gap-6 px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              <span className="text-xs font-black text-slate-600">매출 (In)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.5)]"></div>
              <span className="text-xs font-black text-slate-600">매입 (Out)</span>
            </div>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                fontSize={11} 
                fontWeight={900} 
                tick={{ fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
                dy={15} 
              />
              <YAxis 
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} 
                fontSize={10} 
                fontWeight={700}
                tick={{ fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                labelStyle={{ fontWeight: 900, color: '#1e293b', marginBottom: '8px', fontSize: '14px' }}
                formatter={(val: number) => [formatCurrency(val), '']}
              />
              <Area type="monotone" dataKey="매출" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" animationDuration={1500} />
              <Area type="monotone" dataKey="매입" stroke="#fb7185" strokeWidth={5} fillOpacity={1} fill="url(#colorPurchases)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상태 맵 섹션 (프로젝트 & 계약 병렬 배치) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 프로젝트 상태 맵 */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <PieIcon size={20} className="text-emerald-500" />
                프로젝트 헬스 맵
              </h3>
              <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest">Project Portfolio Distribution</p>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black">Total: {projects.length}</div>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#cbd5e1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{projects.length}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">Projects</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {projectStatusData.map(item => (
              <div key={item.name} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[item.name] }}></div>
                <span className="text-[11px] font-black text-slate-600">{item.name}</span>
                <span className="ml-auto text-xs font-black text-slate-400 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 계약 상태 비중 */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" />
                계약 수명주기 비중
              </h3>
              <p className="text-slate-400 text-[10px] font-black mt-1 uppercase tracking-widest">Contract Lifecycle Status</p>
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black">Total: {contracts.length}</div>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contractStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {contractStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#cbd5e1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{contracts.length}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">Contracts</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {contractStatusData.map(item => (
              <div key={item.name} className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[item.name] }}></div>
                <span className="text-[11px] font-black text-slate-600">{item.name}</span>
                <span className="ml-auto text-xs font-black text-slate-400 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 결제 파이프라인 */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <Layers size={20} className="text-indigo-500" />
                결제 파이프라인 진행도
              </h3>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Revenue Collection Pipeline</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 block uppercase">Total Contract Value</span>
              <span className="text-xl font-black text-slate-900">{formatCurrency(pipelineData.total)}</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="h-14 w-full flex rounded-2xl overflow-hidden shadow-inner bg-slate-100">
              {pipelineData.stages.map((stage, i) => (
                <div 
                  key={i} 
                  className={`${stage.color} h-full transition-all duration-1000 flex items-center justify-center overflow-hidden`}
                  style={{ width: `${stage.percent}%` }}
                >
                  {stage.percent > 10 && (
                    <span className={`${stage.text} text-[10px] font-black whitespace-nowrap px-2`}>
                      {stage.percent.toFixed(0)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {pipelineData.stages.map((stage, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-sm ${stage.color}`}></div>
                    <span className="text-[11px] font-black text-slate-500 uppercase">{stage.label}</span>
                  </div>
                  <div className="text-sm font-black text-slate-800 font-mono">
                    {formatCurrency(stage.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 인텔리전스 리스크 요약 */}
        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-black text-indigo-400 text-lg flex items-center gap-2 mb-8">
              <Target size={20} />
              인텔리전스 리스크 요약
            </h3>
            <div className="space-y-6">
              <RiskItem 
                title="수금 지연 경보" 
                value={payments.filter(p => p.status === '지연').length} 
                unit="건" 
                desc="예정일이 경과된 미수금이 존재합니다. 우선 조치가 필요합니다." 
                level="high"
              />
              <div className="h-px bg-slate-800 w-full" />
              <RiskItem 
                title="진행 계약 성숙도" 
                value={contracts.filter(c => c.status === '진행중').length} 
                unit="건" 
                desc="현재 활발하게 매출을 발생시키고 있는 계약 수량입니다." 
                level="normal"
              />
              <div className="h-px bg-slate-800 w-full" />
              <div className="flex justify-between items-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                 <div>
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-widest block mb-1">AI Recommendation</span>
                    <p className="text-xs text-slate-300 font-medium">현금 흐름 최적화를 위해 지연 결제 건에 대한 재청구를 권장합니다.</p>
                 </div>
                 <button className="p-2 bg-indigo-500 rounded-xl hover:bg-indigo-400 transition-colors">
                    <ArrowUpRight size={20} />
                 </button>
              </div>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-rose-500/10 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subValue, icon, trend }: { 
  title: string, value: string, subValue?: string, icon: React.ReactNode, trend?: { label: string, value: string, isPositive?: boolean }
}) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:border-indigo-200 transition-all group overflow-hidden relative">
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">{icon}</div>
      {trend && (
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${
          trend.isPositive === undefined ? 'bg-slate-100 text-slate-500' :
          trend.isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {trend.value}
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
      <p className="text-slate-400 text-[10px] font-bold mt-2">{subValue}</p>
      {trend && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{trend.label}</span>
          <div className={`w-8 h-1 rounded-full ${trend.isPositive ? 'bg-emerald-200' : 'bg-rose-200'}`}></div>
        </div>
      )}
    </div>
  </div>
);

const RiskItem = ({ title, value, unit, desc, level }: { title: string, value: number, unit: string, desc: string, level: 'high' | 'normal' }) => (
  <div className="flex gap-4">
    <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border font-black text-lg ${
      level === 'high' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
    }`}>
      {value}
    </div>
    <div>
      <h5 className="text-sm font-black text-slate-100 mb-1">{title}</h5>
      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default Dashboard;
