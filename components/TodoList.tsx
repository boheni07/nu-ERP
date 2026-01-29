
import React, { useMemo, useState } from 'react';
import { Customer, Project, Contract, Payment } from '../types';
import { formatCurrency, getWorkingDaysDiff } from '../utils';
import { PaymentModal } from './modals/PaymentModal';
import {
  CheckCircle2,
  Building,
  ArrowRight,
  Send,
  Flame,
  Star,
  CalendarCheck,
  ChevronRight,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';

interface TodoListProps {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  payments: Payment[];
  onUpdatePayment: (payment: Payment) => void;
}

const TodoList: React.FC<TodoListProps> = ({ customers, projects, contracts, payments, onUpdatePayment }) => {
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // 데이터 가공 및 분류 로직
  const processedData = useMemo(() => {
    // 1. Payments Processing
    const paymentItems = payments.filter(p => p.status !== '완료').map(p => {
      const contract = contracts.find(c => c.id === p.contractId);
      const project = projects.find(proj => proj.id === contract?.projectId);
      const customer = customers.find(cust => cust.id === project?.customerId);
      const daysDiff = getWorkingDaysDiff(p.scheduledDate);

      const labelSuffix = contract?.category === '매출' ? '수금' : '결제';

      return {
        ...p,
        type: 'PAYMENT' as const,
        daysDiff,
        contractName: contract?.name,
        projectName: project?.name,
        customerName: customer?.name,
        category: contract?.category,
        title: `${p.item} ${labelSuffix}`,
        dateLabel: `${labelSuffix} 예정일`
      };
    });

    // 1. 긴급 (Urgent): 지연되었거나 오늘/내일 마감인 건
    const urgent = paymentItems.filter(p => p.daysDiff <= 1);

    // 2. 중요 (Important): 5일 이내 마감인데 계산서 미발행이거나 고액건 (5,000만원 이상)
    const important = paymentItems.filter(p =>
      !urgent.find(u => u.id === p.id) &&
      ((p.daysDiff <= 5 && !p.invoiceDate) || p.amount >= 50000000)
    );

    // 3. 예정 (Upcoming): 10일 이내의 나머지 건들
    const upcoming = paymentItems.filter(p =>
      !urgent.find(u => u.id === p.id) &&
      !important.find(i => i.id === p.id) &&
      p.daysDiff <= 10
    );

    return { urgent, important, upcoming, totalCount: paymentItems.length };
  }, [payments, contracts, projects, customers]);

  if (processedData.totalCount === 0) {
    return (
      <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-slate-100 shadow-sm animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CalendarCheck size={48} className="text-indigo-400" />
        </div>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight">완벽한 업무 상태입니다!</h3>
        <p className="text-slate-400 text-sm mt-4 font-bold max-w-sm mx-auto leading-relaxed">
          현재 처리 대기 중인 결제나 임박한 계약 건이 없습니다.<br />
          팀의 업무 리스크가 0% 입니다.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-6 duration-700">

        {/* 1. Header Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatWidget
            title="긴급 대응"
            count={processedData.urgent.length}
            icon={<Flame size={20} />}
            color="rose"
            desc="지연 및 금일/익일 마감"
          />
          <StatWidget
            title="핵심 관리"
            count={processedData.important.length}
            icon={<Star size={20} />}
            color="indigo"
            desc="5일내 미청구 / 5천만원↑"
          />
          <StatWidget
            title="진행 예정"
            count={processedData.upcoming.length}
            icon={<CalendarCheck size={20} />}
            color="emerald"
            desc="10일 이내 도래"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

          {/* Urgent Column */}
          <div className="space-y-6">
            <SectionHeader icon={<Flame className="text-rose-500" />} title="URGENT" color="text-rose-600" count={processedData.urgent.length} />
            <div className="space-y-4">
              {processedData.urgent.length > 0 ? (
                processedData.urgent.sort((a, b) => a.daysDiff - b.daysDiff).map(item => (
                  <TodoItemCard key={item.id} item={item} theme="rose" onUpdate={onUpdatePayment} onEdit={() => setEditingPayment(item)} />
                ))
              ) : (
                <EmptyState message="지연된 업무가 없습니다." />
              )}
            </div>
          </div>

          {/* Important Column */}
          <div className="space-y-6">
            <SectionHeader icon={<Star className="text-indigo-500" />} title="IMPORTANT" color="text-indigo-600" count={processedData.important.length} />
            <div className="space-y-4">
              {processedData.important.length > 0 ? (
                processedData.important.sort((a, b) => a.daysDiff - b.daysDiff).map(item => (
                  <TodoItemCard key={item.id} item={item} theme="indigo" onUpdate={onUpdatePayment} onEdit={() => setEditingPayment(item)} />
                ))
              ) : (
                <EmptyState message="중요 관리 대상이 없습니다." />
              )}
            </div>
          </div>

          {/* Upcoming Column */}
          <div className="space-y-6">
            <SectionHeader icon={<CalendarCheck className="text-emerald-500" />} title="UPCOMING" color="text-emerald-600" count={processedData.upcoming.length} />
            <div className="space-y-4">
              {processedData.upcoming.length > 0 ? (
                processedData.upcoming.sort((a, b) => a.daysDiff - b.daysDiff).map(item => (
                  <TodoItemCard key={item.id} item={item} theme="emerald" onUpdate={onUpdatePayment} onEdit={() => setEditingPayment(item)} />
                ))
              ) : (
                <EmptyState message="예정된 업무가 깨끗합니다." />
              )}
            </div>
          </div>
        </div>

        {/* Critical Risks Alert Bar */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <AlertTriangle size={32} className="text-amber-400" />
              </div>
              <div>
                <h4 className="text-xl font-black tracking-tight">System Risk Intelligence</h4>
                <p className="text-slate-400 text-sm font-medium">현재 전체 결제 내역 중 지연 상태인 자산은 <span className="text-white font-black">{formatCurrency(processedData.urgent.filter(i => i.type === 'PAYMENT').reduce((s, i) => s + i.amount, 0))}</span> 입니다.</p>
              </div>
            </div>
            <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2">
              리스크 관리 모드 실행 <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        contractId={editingPayment?.contractId || null}
        editingPayment={editingPayment}
        onSave={onUpdatePayment}
        contracts={contracts}
        payments={payments}
      />
    </>
  );
};

// --- Sub Components ---



// Fixed: Added optional key to props to allow usage in lists without TS errors
const TodoItemCard = ({ item, theme, onUpdate, onEdit }: { item: any, theme: 'rose' | 'indigo' | 'emerald', onUpdate: (p: Payment) => void, onEdit: () => void, key?: React.Key }) => {
  const [editMode, setEditMode] = useState<{ field: 'invoiceDate' | 'completionDate', value: string } | null>(null);

  const themeStyles = {
    rose: 'border-rose-100 hover:border-rose-300',
    indigo: 'border-indigo-100 hover:border-indigo-300',
    emerald: 'border-emerald-100 hover:border-emerald-300'
  };

  const badgeStyles = {
    rose: 'bg-rose-50 text-rose-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    emerald: 'bg-emerald-50 text-emerald-700'
  };

  const cleanUpdate = (updates: Partial<Payment>) => {
    // UI에서만 사용하는 필드 제거하고 순수 Payment 객체로 복원
    const { daysDiff, contractName, projectName, customerName, category, dateLabel, title, type, ...paymentData } = item;
    onUpdate({ ...paymentData, ...updates });
    setEditMode(null);
  };

  const startEdit = (field: 'invoiceDate' | 'completionDate') => {
    setEditMode({ field, value: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className={`bg-white p-4 rounded-3xl border shadow-sm transition-all hover:shadow-lg ${themeStyles[theme]} group`}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              <Building size={12} />
              <span className="truncate max-w-[120px]">{item.customerName}</span>
              <ArrowRight size={10} />
              <span className="text-slate-500 truncate">{item.projectName}</span>
            </div>
            <h4 className="text-base font-black text-slate-900 truncate leading-tight flex items-center gap-2">
              {item.title}
            </h4>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap shrink-0 ${badgeStyles[theme]}`}>
            {item.daysDiff < 0 ? `${Math.abs(item.daysDiff)}일 지연` : item.daysDiff === 0 ? 'D-Day' : `${item.daysDiff}일 전`}
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-slate-50 pt-4">
          <div>
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{item.dateLabel || 'Target Date'}</div>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(item.amount)}</div>
          </div>

          <div className="flex gap-2">
            {editMode ? (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className="px-2 py-1.5 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editMode.value}
                  onChange={(e) => setEditMode({ ...editMode, value: e.target.value })}
                  autoFocus
                />
                <button
                  onClick={() => cleanUpdate({ [editMode.field]: editMode.value, status: editMode.field === 'invoiceDate' ? '청구' : '완료' })}
                  className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                >
                  <Check size={16} /> {/* Changed from CheckCircle2 to Check */}
                </button>
                <button
                  onClick={() => setEditMode(null)}
                  className="p-1.5 text-slate-400 bg-slate-50 rounded-lg hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                {!item.type?.includes('CONTRACT') && (
                  <>
                    {!item.invoiceDate ? (
                      <button
                        onClick={() => startEdit('invoiceDate')}
                        className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90"
                        title="계산서 발행"
                      >
                        <Send size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit('completionDate')}
                        className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-90"
                        title="입금 완료"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </>
                )}

                <button onClick={onEdit} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all active:scale-90">
                  <ChevronRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ icon, title, color, count }: { icon: React.ReactNode, title: string, color: string, count: number }) => (
  <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-50">
    <div className="flex items-center gap-3">
      {icon}
      <h3 className={`font-black tracking-tight ${color}`}>{title}</h3>
    </div>
    <span className="px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-xs font-black">{count}</span>
  </div>
);

const StatWidget = ({ title, count, icon, color, desc }: { title: string, count: number, icon: React.ReactNode, color: 'rose' | 'indigo' | 'emerald', desc: string }) => {
  const styles = {
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <span className={`p-1.5 rounded-lg ${styles[color]}`}>
            {icon}
          </span>
          <h4 className="text-slate-700 font-bold text-base tracking-tight">{title}</h4>
        </div>
        <p className="text-slate-400 text-[10px] font-medium pl-1 leading-tight">{desc}</p>
      </div>
      <div className="text-4xl font-black text-slate-800 tracking-tighter">{count}</div>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
      <CalendarCheck size={24} />
    </div>
    <p className="text-slate-400 text-xs font-bold">{message}</p>
  </div>
);

export default TodoList;
