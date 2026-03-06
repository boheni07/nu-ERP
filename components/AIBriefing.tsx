
import React, { useState, useEffect } from 'react';
import { Customer, Project, Contract, Payment } from '../types';
import { getAIBriefing } from '../services/geminiService';
import { getLocalAIBriefing } from '../services/vllmService';
import { Sparkles, BrainCircuit, RefreshCw, Cpu } from 'lucide-react';

interface AIBriefingProps {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  payments: Payment[];
}

const AIBriefing: React.FC<AIBriefingProps> = (data) => {
  const [briefing, setBriefing] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'vllm'>('gemini');

  const fetchBriefing = async (force = false) => {
    // 1. Check Cache (with model variant)
    const cacheKey = `nu_erp_ai_briefing_${selectedModel}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached && !force) {
      const { text, timestamp } = JSON.parse(cached);
      const lastDate = new Date(timestamp);
      const now = new Date();
      const threshold = new Date();
      threshold.setHours(9, 0, 0, 0);

      const needsUpdate = now >= threshold && lastDate < threshold;

      if (!needsUpdate) {
        setBriefing(text);
        setLastGenerated(timestamp);
        return;
      }
    }

    // 2. Perform Analysis
    setLoading(true);
    let result = '';
    
    if (selectedModel === 'vllm') {
      result = await getLocalAIBriefing(data);
    } else {
      result = await getAIBriefing(data);
    }
    
    const content = result || '브리핑을 생성할 수 없습니다.';
    const currentTime = new Date().toISOString();

    setBriefing(content);
    setLastGenerated(currentTime);

    // 3. Update Cache
    localStorage.setItem(cacheKey, JSON.stringify({
      text: content,
      timestamp: currentTime
    }));

    setLoading(false);
  };

  useEffect(() => {
    fetchBriefing();
  }, [selectedModel]);

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden">
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-500 rounded-xl shadow-inner">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black">AI 재무 분석 비서</h3>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-0.5">
              {selectedModel === 'gemini' ? 'Gemini 3 Pro Real-time Analysis' : 'Local nu-vLLM Deep Analysis'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-indigo-700/50 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setSelectedModel('gemini')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedModel === 'gemini' ? 'bg-white text-indigo-600 shadow-lg' : 'text-indigo-200 hover:text-white'}`}
            >
              GEMINI
            </button>
            <button
              onClick={() => setSelectedModel('vllm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedModel === 'vllm' ? 'bg-white text-indigo-600 shadow-lg' : 'text-indigo-200 hover:text-white'}`}
            >
              nu-vLLM
            </button>
          </div>
          
          <button
            onClick={() => fetchBriefing(true)}
            disabled={loading}
            className="p-2 hover:bg-indigo-500 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-center mb-4">
          <p className="text-slate-400 text-xs font-bold">
            {lastGenerated ? `${selectedModel.toUpperCase()} 분석 실행: ${new Date(lastGenerated).toLocaleString()}` : ''}
          </p>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm font-black">{selectedModel === 'vllm' ? '로컬 서버 연산 중...' : '데이터 심층 분석 중...'}</p>
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
