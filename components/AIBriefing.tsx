
import React, { useState, useEffect } from 'react';
import { Customer, Project, Contract, Payment } from '../types';
import { getAIBriefing } from '../services/geminiService';
import { Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';

interface AIBriefingProps {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  payments: Payment[];
}

const AIBriefing: React.FC<AIBriefingProps> = (data) => {
  const [briefing, setBriefing] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    const result = await getAIBriefing(data);
    setBriefing(result || '브리핑을 생성할 수 없습니다.');
    setLoading(false);
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-500 rounded-xl shadow-inner">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black">AI 재무 분석 비서</h3>
            {/* Updated UI text to reflect Gemini 3 Pro version */}
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-0.5">Gemini 3 Pro Real-time Analysis</p>
          </div>
        </div>
        <button 
          onClick={fetchBriefing}
          disabled={loading}
          className="p-2 hover:bg-indigo-500 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-black">데이터 심층 분석 중...</p>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap text-slate-700 leading-relaxed text-base font-medium shadow-inner">
              {briefing}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ActionCard title="미수금 리스크" description="지연 결제 3건 발견. 즉각 청구 필요." icon={<Sparkles size={18} className="text-amber-500" />} />
          <ActionCard title="예산 최적화" description="프로젝트 가용 예산 40% 잔여. 추가 인력 검토." icon={<Sparkles size={18} className="text-indigo-500" />} />
          <ActionCard title="성장 예측" description="다음 분기 매출 15% 상승 예상." icon={<Sparkles size={18} className="text-emerald-500" />} />
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
  <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all hover:border-indigo-200 cursor-default">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h4 className="font-black text-slate-800 text-sm">{title}</h4>
    </div>
    <p className="text-sm text-slate-500 leading-snug font-medium">{description}</p>
  </div>
);

export default AIBriefing;
