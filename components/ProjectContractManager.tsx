
import React, { useState, useMemo, useEffect } from 'react';
import { Customer, Project, Contract, Payment, ContractCategory, ContractType, PaymentItem, PaymentStatus, ProjectStatus } from '../types';
import { formatCurrency, calculateContractMetrics, calculatePaymentStatus, sortPayments, calculateProjectStatus } from '../utils';
import { Plus, ChevronDown, ChevronRight, CheckCircle2, TrendingUp, Search, Trash2, Info, Building, AlertCircle, TriangleAlert, FilePlus2, CalendarDays, Lock, Tag, Clock, Pencil, Check, X, Calendar, Activity } from 'lucide-react';

interface ProjectContractManagerProps {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  payments: Payment[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddContract: (contract: Contract) => void;
  onUpdateContract: (contract: Contract) => void;
  onDeleteContract: (id: string) => void;
  onAddPayment: (payment: Payment) => void;
  onUpdatePayment: (payment: Payment) => void;
  onDeletePayment: (paymentId: string, contractId: string) => void;
}

const ProjectContractManager: React.FC<ProjectContractManagerProps> = ({
  customers, projects, contracts, payments,
  onAddProject, onUpdateProject, onDeleteProject, onAddContract, onUpdateContract, onDeleteContract, onAddPayment, onUpdatePayment, onDeletePayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteContractTarget, setDeleteContractTarget] = useState<Contract | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<{ paymentId: string, contractId: string, itemName: string } | null>(null);

  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjErrors, setShowProjErrors] = useState(false);
  const [projErrorText, setProjErrorText] = useState<string | null>(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState<{ isOpen: boolean, projectId?: string }>({ isOpen: false });
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showContractErrors, setShowContractErrors] = useState(false);
  const [contractErrorText, setContractErrorText] = useState<string | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<{ isOpen: boolean, contractId?: string }>({ isOpen: false });
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showPaymentErrors, setShowPaymentErrors] = useState(false);
  const [paymentErrorText, setPaymentErrorText] = useState<string | null>(null);

  // Quick date edit state
  const [quickDateEdit, setQuickDateEdit] = useState<{ id: string, field: 'invoiceDate' | 'completionDate', value: string } | null>(null);

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers.find(c => c.id === p.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const contractsA = contracts.filter(c => c.projectId === a.id);
        const contractsB = contracts.filter(c => c.projectId === b.id);
        const statusA = calculateProjectStatus(a, contractsA);
        const statusB = calculateProjectStatus(b, contractsB);

        const rankA = statusA === '완료' ? 1 : 0;
        const rankB = statusB === '완료' ? 1 : 0;

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        return (b.startDate || '').localeCompare(a.startDate || '');
      });
  }, [projects, searchTerm, customers, contracts]);

  const toggleProject = (id: string) => {
    setExpandedProjectId(prev => (prev === id ? null : id));
    setExpandedContractId(null);
  };

  const toggleContract = (id: string) => {
    setExpandedContractId(prev => (prev === id ? null : id));
  };

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.name || '알 수 없는 거래처';
  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || '알 수 없는 프로젝트';
  const getContractName = (id: string) => contracts.find(c => c.id === id)?.name || '알 수 없는 계약';

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', customerId: '', budget: 0, deptName: '', managerName: '', managerPhone: '', notes: '', startDate: '', endDate: ''
  });

  const [budgetDisplay, setBudgetDisplay] = useState('');
  const [contractAmountDisplay, setContractAmountDisplay] = useState('');
  const [paymentAmountDisplay, setPaymentAmountDisplay] = useState('');

  const [newContract, setNewContract] = useState<Partial<Contract>>({
    category: '매출', type: '개발', name: '', amount: 0, signedDate: '', startDate: '', endDate: '', notes: '', projectId: '', customerId: ''
  });

  const [newPayment, setNewPayment] = useState<Partial<Payment>>({
    item: '기성', amount: 0, scheduledDate: '', invoiceDate: '', completionDate: ''
  });

  const currentPaymentContract = useMemo(() => {
    if (!isPaymentModalOpen.contractId) return null;
    const contract = contracts.find(c => c.id === isPaymentModalOpen.contractId);
    if (!contract) return null;
    const contractPayments = sortPayments(payments.filter(p => p.contractId === contract.id));
    const metrics = calculateContractMetrics(contract, contractPayments);
    return { contract, metrics, contractPayments };
  }, [isPaymentModalOpen.contractId, contracts, payments]);

  const handleEditProject = (proj: Project) => {
    setProjErrorText(null);
    setEditingProject(proj);
    setNewProject({ ...proj });
    setBudgetDisplay(new Intl.NumberFormat('ko-KR').format(proj.budget));
    setIsProjModalOpen(true);
  };

  const handleEditContract = (contract: Contract) => {
    setContractErrorText(null);
    setEditingContract(contract);
    setNewContract({ ...contract });
    setContractAmountDisplay(new Intl.NumberFormat('ko-KR').format(contract.amount));
    setIsContractModalOpen({ isOpen: true, projectId: contract.projectId });
  };

  const handleEditPayment = (payment: Payment) => {
    setPaymentErrorText(null);
    setEditingPayment(payment);
    setNewPayment({ ...payment });
    setPaymentAmountDisplay(new Intl.NumberFormat('ko-KR').format(payment.amount));
    setIsPaymentModalOpen({ isOpen: true, contractId: payment.contractId });
  };

  const handleBudgetChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = parseInt(digits) || 0;
    setNewProject({ ...newProject, budget: num });
    setBudgetDisplay(new Intl.NumberFormat('ko-KR').format(num));
  };

  const handleContractAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const num = parseInt(digits) || 0;
    setNewContract({ ...newContract, amount: num });
    setContractAmountDisplay(new Intl.NumberFormat('ko-KR').format(num));
  };

  const handlePaymentItemChange = (item: PaymentItem) => {
    if (!currentPaymentContract) return;
    let nextAmount = newPayment.amount || 0;
    let nextDisplay = paymentAmountDisplay;
    if (item === '잔금' && !editingPayment) {
      nextAmount = currentPaymentContract.metrics.registeredBalance;
      nextDisplay = new Intl.NumberFormat('ko-KR').format(nextAmount);
    }
    setNewPayment({ ...newPayment, item, amount: nextAmount });
    setPaymentAmountDisplay(nextDisplay);
    setPaymentErrorText(null);
  };

  const handlePaymentAmountChange = (val: string) => {
    if (!currentPaymentContract) return;
    const digits = val.replace(/\D/g, '');
    const num = parseInt(digits) || 0;
    let nextItem = newPayment.item;
    if (nextItem === '기성' && num === currentPaymentContract.metrics.registeredBalance && num > 0) {
      nextItem = '잔금';
    }
    setNewPayment({ ...newPayment, amount: num, item: nextItem });
    setPaymentAmountDisplay(new Intl.NumberFormat('ko-KR').format(num));
    setPaymentErrorText(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setProjErrorText(null);

    if (!newProject.name || !newProject.customerId) {
      setShowProjErrors(true);
      return;
    }

    if (newProject.startDate && newProject.endDate && newProject.startDate > newProject.endDate) {
      setProjErrorText('프로젝트 종료일은 시작일 이후여야 합니다.');
      return;
    }

    if (editingProject) {
      onUpdateProject({ ...newProject } as Project);
    } else {
      onAddProject({ ...newProject, id: Date.now().toString() } as Project);
    }
    setIsProjModalOpen(false);
    setEditingProject(null);
    setShowProjErrors(false);
    setNewProject({ name: '', customerId: '', budget: 0, deptName: '', managerName: '', managerPhone: '', notes: '', startDate: '', endDate: '' });
    setBudgetDisplay('');
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    setContractErrorText(null);

    if (!newContract.name || !newContract.amount || newContract.amount <= 0 || !newContract.category || !newContract.type || !newContract.projectId || !newContract.customerId) {
      setShowContractErrors(true);
      return;
    }

    if (newContract.startDate && newContract.endDate && newContract.startDate > newContract.endDate) {
      setContractErrorText('계약 완료 예정일은 착수일 이후여야 합니다.');
      return;
    }

    if (editingContract) {
      onUpdateContract({ ...newContract } as Contract);
    } else {
      const baseContract = {
        ...newContract,
        id: Date.now().toString(),
        accumulatedPayment: 0,
        balance: newContract.amount,
        registeredBalance: newContract.amount,
        status: '준비' as const
      } as Contract;
      const metrics = calculateContractMetrics(baseContract, []);
      onAddContract({ ...baseContract, ...metrics });
    }
    setIsContractModalOpen({ isOpen: false });
    setEditingContract(null);
    setShowContractErrors(false);
    setContractAmountDisplay('');
    setNewContract({ category: '매출', type: '개발', name: '', amount: 0, signedDate: '', startDate: '', endDate: '', notes: '', projectId: '', customerId: '' });
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentErrorText(null);

    if (!newPayment.amount || newPayment.amount <= 0 || !newPayment.scheduledDate || !newPayment.item) {
      setShowPaymentErrors(true);
      return;
    }

    if (currentPaymentContract) {
      const availableLimit = editingPayment
        ? currentPaymentContract.metrics.registeredBalance + editingPayment.amount
        : currentPaymentContract.metrics.registeredBalance;

      if (newPayment.amount > availableLimit) {
        setPaymentErrorText(`결제 금액(${formatCurrency(newPayment.amount)})이 등록 가능 잔액(${formatCurrency(availableLimit)})을 초과할 수 없습니다.`);
        return;
      }
    }

    const currentStatus = calculatePaymentStatus(newPayment as Payment);

    if (editingPayment) {
      onUpdatePayment({ ...newPayment, status: currentStatus } as Payment);
    } else {
      onAddPayment({
        ...newPayment,
        id: Date.now().toString(),
        contractId: isPaymentModalOpen.contractId!,
        status: currentStatus
      } as Payment);
    }

    setIsPaymentModalOpen({ isOpen: false });
    setEditingPayment(null);
    setShowPaymentErrors(false);
    setPaymentAmountDisplay('');
    setNewPayment({ item: '기성', amount: 0, scheduledDate: '', invoiceDate: '', completionDate: '' });
  };

  const handleSaveQuickDate = (payment: Payment) => {
    if (!quickDateEdit) return;
    const { field, value } = quickDateEdit;
    if (!value) return;

    const updatedPayment = { ...payment, [field]: value };
    const currentStatus = calculatePaymentStatus(updatedPayment as Payment);
    onUpdatePayment({ ...updatedPayment, status: currentStatus } as Payment);
    setQuickDateEdit(null);
  };

  const confirmDeleteProject = () => {
    if (deleteTarget) {
      onDeleteProject(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const confirmDeleteContract = () => {
    if (deleteContractTarget) {
      onDeleteContract(deleteContractTarget.id);
      setDeleteContractTarget(null);
    }
  };

  const confirmDeletePayment = () => {
    if (deletePaymentTarget) {
      onDeletePayment(deletePaymentTarget.paymentId, deletePaymentTarget.contractId);
      setDeletePaymentTarget(null);
    }
  };

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-3 border rounded-xl focus:ring-2 outline-none text-sm transition-all font-medium
    ${hasError ? 'border-rose-500 ring-rose-100 focus:ring-rose-500 bg-rose-50/10' : 'border-slate-200 focus:ring-indigo-500'}
  `;

  const getProjectStatusBadge = (status: ProjectStatus) => {
    const styles = {
      '완료': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      '지연중': 'bg-rose-100 text-rose-700 border-rose-200',
      '진행중': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      '준비': 'bg-slate-100 text-slate-700 border-slate-200'
    }[status];

    return (
      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider ${styles}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="프로젝트명 또는 거래처 검색"
            className="w-full pl-11 pr-4 py-2 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-slate-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setShowProjErrors(false); setProjErrorText(null); setEditingProject(null); setNewProject({ name: '', customerId: '', budget: 0, deptName: '', managerName: '', managerPhone: '', notes: '', startDate: '', endDate: '' }); setBudgetDisplay(''); setIsProjModalOpen(true); }}
          className="w-full md:w-auto bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md transition-all active:scale-95"
        >
          <Plus size={18} /> 프로젝트 생성
        </button>
      </div>

      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-2xl border-2 border-dashed border-slate-200">
            <Info size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold text-base">데이터가 없습니다.</p>
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const projContracts = contracts.filter(c => c.projectId === proj.id);
            const salesContracts = projContracts.filter(c => c.category === '매출');
            const purchaseContracts = projContracts.filter(c => c.category === '매입');

            const salesTotal = salesContracts.reduce((sum, c) => sum + c.amount, 0);
            const purchaseTotal = purchaseContracts.reduce((sum, c) => sum + c.amount, 0);

            const isExpanded = expandedProjectId === proj.id;
            const projectStatus = calculateProjectStatus(proj, projContracts);

            return (
              <div key={proj.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-200 ${isExpanded ? 'ring-2 ring-indigo-500/20' : ''}`}>
                <div className={`p-3.5 flex items-center gap-6 cursor-pointer hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-indigo-100' : ''}`} onClick={() => toggleProject(proj.id)}>
                  <div className="text-indigo-400 shrink-0">
                    {isExpanded ? <ChevronDown size={24} className="text-indigo-600" /> : <ChevronRight size={24} />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <h4 className="font-black text-slate-900 text-lg truncate flex items-center gap-2">
                        {proj.name}
                      </h4>
                      {getProjectStatusBadge(projectStatus)}
                      <div className="flex items-center gap-1.5 text-slate-400 font-bold text-sm shrink-0 border-l pl-4 border-slate-100">
                        <Building size={14} className="text-slate-300" />
                        <span className="truncate max-w-[250px]">{getCustomerName(proj.customerId)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-black tracking-tight">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock size={12} className="text-slate-400" />
                        <span>기간: {proj.startDate || '-'} ~ {proj.endDate || '-'}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200 hidden md:block"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">매출</span>
                        <span className="text-slate-400 font-bold">{salesContracts.length}건:</span>
                        <span className="text-slate-700 font-mono text-xs">{formatCurrency(salesTotal)}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-200 hidden md:block"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded">매입</span>
                        <span className="text-slate-400 font-bold">{purchaseContracts.length}건:</span>
                        <span className="text-slate-700 font-mono text-xs">{formatCurrency(purchaseTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-2 shrink-0 border-l border-slate-100 pl-6 min-h-[80px]">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditProject(proj); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl text-[11px] font-black transition-all border border-slate-100 shadow-sm active:scale-95"
                      >
                        <Pencil size={14} /> 수정
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(proj); }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl text-[11px] font-black transition-all border border-slate-100 shadow-sm active:scale-95"
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowContractErrors(false);
                        setContractErrorText(null);
                        setEditingContract(null);
                        setNewContract({
                          category: '매출', type: '개발', name: '', amount: 0, signedDate: '', startDate: '', endDate: '', notes: '',
                          projectId: proj.id,
                          customerId: proj.customerId
                        });
                        setIsContractModalOpen({ isOpen: true, projectId: proj.id });
                      }}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-[11px] font-black transition-all shadow-md active:scale-95"
                    >
                      <Plus size={14} /> 신규 계약 등록
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/30">
                    <div className="divide-y divide-slate-100">
                      {projContracts.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm font-bold">등록된 계약이 없습니다.</div>
                      ) : (
                        projContracts.map((contract) => {
                          const contractPayments = sortPayments(payments.filter(p => p.contractId === contract.id));
                          const metrics = calculateContractMetrics(contract, contractPayments);
                          const isContractExpanded = expandedContractId === contract.id;
                          return (
                            <div key={contract.id} className="border-l-[6px] border-slate-100 hover:border-indigo-300 transition-all bg-white">
                              <div
                                className={`p-3.5 pl-6 flex items-center gap-6 cursor-pointer transition-colors ${isContractExpanded ? 'bg-indigo-50' : 'hover:bg-slate-50/50'}`}
                                onClick={() => toggleContract(contract.id)}
                              >
                                <div className="shrink-0 text-slate-300">
                                  {isContractExpanded ? <ChevronDown size={20} className="text-indigo-500" /> : <ChevronRight size={20} />}
                                </div>

                                <div className="flex-1 space-y-4">
                                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                    <h5 className="text-lg font-black text-slate-900 leading-tight">{contract.name}</h5>

                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                                      <Building size={14} />
                                      <span>{getCustomerName(contract.customerId)}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${contract.category === '매출' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                        {contract.category}
                                      </span>
                                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                                        {contract.type}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 border-l pl-4 border-slate-200">
                                      <span className="flex items-center gap-1"><Tag size={12} /> 계약일: {contract.signedDate || '-'}</span>
                                      <span className="flex items-center gap-1"><Clock size={12} /> 기간: {contract.startDate || '-'} ~ {contract.endDate || '-'}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                                    <DataPoint label="계약금액" value={formatCurrency(contract.amount)} />
                                    <DataPoint label="누적 결제액" value={formatCurrency(metrics.accumulatedPayment)} />
                                    <DataPoint label="결제 잔액" value={formatCurrency(metrics.balance)} highlight />
                                    <DataPoint label="등록 잔액" value={formatCurrency(metrics.registeredBalance)} highlight={metrics.registeredBalance > 0} />
                                    <div className="flex items-center border-l pl-4 border-slate-200">
                                      <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest ${metrics.status === '종료' ? 'bg-slate-100 text-slate-500' :
                                        metrics.status === '진행중' ? 'bg-emerald-100 text-emerald-700' :
                                          metrics.status === '완료(미결제)' ? 'bg-amber-100 text-amber-700' :
                                            'bg-indigo-100 text-indigo-700'
                                        }`}>
                                        {metrics.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 border-l border-slate-100 pl-6 min-w-[80px]">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleEditContract(contract); }}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl text-[11px] font-black transition-all border border-slate-100 shadow-sm active:scale-95"
                                  >
                                    <Pencil size={14} /> 수정
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteContractTarget(contract); }}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl text-[11px] font-black transition-all border border-slate-100 shadow-sm active:scale-95"
                                  >
                                    <Trash2 size={14} /> 삭제
                                  </button>
                                </div>
                              </div>

                              {isContractExpanded && (
                                <div className="p-4 bg-slate-50/40 border-y border-slate-100 pl-16">
                                  <div className="max-w-6xl mx-auto space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                      <h6 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <CalendarDays size={14} /> 결제 마일스톤 상세 내역
                                      </h6>
                                      <button
                                        disabled={metrics.registeredBalance <= 0}
                                        onClick={(e) => { e.stopPropagation(); setShowPaymentErrors(false); setEditingPayment(null); setPaymentErrorText(null); setIsPaymentModalOpen({ isOpen: true, contractId: contract.id }); }}
                                        className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border shadow-sm ${metrics.registeredBalance <= 0
                                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border-indigo-100 active:scale-95'
                                          }`}
                                      >
                                        <TrendingUp size={14} /> 결제 정보 등록
                                      </button>
                                    </div>
                                    <div className="space-y-3">
                                      {contractPayments.length === 0 ? (
                                        <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-bold">
                                          등록된 결제 일정이 없습니다.
                                        </div>
                                      ) : (
                                        contractPayments.map(p => {
                                          const isInvoiceEditing = quickDateEdit?.id === p.id && quickDateEdit?.field === 'invoiceDate';
                                          const isCompletionEditing = quickDateEdit?.id === p.id && quickDateEdit?.field === 'completionDate';

                                          return (
                                            <div key={p.id} className="bg-white p-2 rounded-2xl border border-slate-100 flex flex-wrap lg:flex-nowrap justify-between items-center shadow-sm hover:shadow-md transition-all gap-4">
                                              <div className="flex flex-wrap items-center gap-x-10 gap-y-4 flex-1">
                                                <div className="min-w-[80px]">
                                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">항목</div>
                                                  <div className="text-xl font-black text-slate-900">{p.item}</div>
                                                </div>

                                                <div className="min-w-[140px]">
                                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">결제 금액</div>
                                                  <div className="text-lg font-black text-indigo-600 font-mono">{formatCurrency(p.amount)}</div>
                                                </div>

                                                <div>
                                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">결제 예정일</div>
                                                  <div className="text-sm font-bold text-slate-700 font-mono">{p.scheduledDate}</div>
                                                </div>

                                                <div className="min-w-[120px]">
                                                  <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">계산서 발행일</div>
                                                  {p.invoiceDate ? (
                                                    <div className="text-sm font-bold text-slate-600 font-mono">{p.invoiceDate}</div>
                                                  ) : isInvoiceEditing ? (
                                                    <div className="flex items-center gap-1 mt-1">
                                                      <input
                                                        autoFocus
                                                        type="date"
                                                        className="px-2 py-1 border rounded text-xs outline-none focus:ring-1 focus:ring-amber-500"
                                                        value={quickDateEdit.value}
                                                        onChange={(e) => setQuickDateEdit({ ...quickDateEdit, value: e.target.value })}
                                                      />
                                                      <button onClick={() => handleSaveQuickDate(p)} className="p-1 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100"><Check size={14} /></button>
                                                      <button onClick={() => setQuickDateEdit(null)} className="p-1 text-slate-400 bg-slate-50 rounded hover:bg-slate-100"><X size={14} /></button>
                                                    </div>
                                                  ) : (
                                                    <button
                                                      onClick={() => setQuickDateEdit({ id: p.id, field: 'invoiceDate', value: new Date().toISOString().split('T')[0] })}
                                                      className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black hover:bg-amber-100 transition-colors border border-amber-100 mt-0.5"
                                                    >
                                                      <Calendar size={12} /> 등록
                                                    </button>
                                                  )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                  <div className="min-w-[120px]">
                                                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">결제 완료일</div>
                                                    {p.completionDate ? (
                                                      <div className="text-sm font-bold text-slate-600 font-mono">{p.completionDate}</div>
                                                    ) : isCompletionEditing ? (
                                                      <div className="flex items-center gap-1 mt-1">
                                                        <input
                                                          autoFocus
                                                          type="date"
                                                          className="px-2 py-1 border rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                                                          value={quickDateEdit.value}
                                                          onChange={(e) => setQuickDateEdit({ ...quickDateEdit, value: e.target.value })}
                                                        />
                                                        <button onClick={() => handleSaveQuickDate(p)} className="p-1 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100"><Check size={14} /></button>
                                                        <button onClick={() => setQuickDateEdit(null)} className="p-1 text-slate-400 bg-slate-50 rounded hover:bg-slate-100"><X size={14} /></button>
                                                      </div>
                                                    ) : p.invoiceDate ? (
                                                      <button
                                                        onClick={() => setQuickDateEdit({ id: p.id, field: 'completionDate', value: new Date().toISOString().split('T')[0] })}
                                                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black hover:bg-emerald-100 transition-colors border border-emerald-100 mt-0.5"
                                                      >
                                                        <CheckCircle2 size={12} /> 등록
                                                      </button>
                                                    ) : (
                                                      <div className="text-[10px] text-slate-300 font-black italic mt-1.5">계산서 대기</div>
                                                    )}
                                                  </div>

                                                  <div className="pt-4">
                                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${p.status === '완료' ? 'bg-emerald-100 text-emerald-700' :
                                                      p.status === '청구' ? 'bg-amber-100 text-amber-700' :
                                                        p.status === '지연' ? 'bg-rose-100 text-rose-700' :
                                                          'bg-slate-100 text-slate-500'
                                                      }`}>
                                                      {p.status}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="flex flex-col gap-1.5 shrink-0 border-l pl-5 border-slate-100 items-center justify-center min-w-[80px]">
                                                <button
                                                  onClick={() => handleEditPayment(p)}
                                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl text-xs font-black transition-all border border-slate-100 shadow-sm active:scale-95"
                                                >
                                                  <Pencil size={14} /> 수정
                                                </button>
                                                <button
                                                  onClick={() => setDeletePaymentTarget({ paymentId: p.id, contractId: contract.id, itemName: p.item })}
                                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-black transition-all border border-slate-100 shadow-sm active:scale-95"
                                                >
                                                  <Trash2 size={14} /> 삭제
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                    {contract.notes && (
                                      <div className="mt-4 p-4 bg-white/50 rounded-xl border border-slate-100 text-xs text-slate-500 font-medium">
                                        <span className="text-slate-400 font-black mr-2 uppercase tracking-tighter">[비고]</span> {contract.notes}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {isContractModalOpen.isOpen && (
        <Modal title={editingContract ? "계약 정보 수정" : "계약 정보 등록"} onClose={() => { setIsContractModalOpen({ isOpen: false }); setContractAmountDisplay(''); setEditingContract(null); setContractErrorText(null); }}>
          <form onSubmit={handleCreateContract} className="space-y-6">
            {contractErrorText && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl font-bold flex items-center gap-3">
                <TriangleAlert size={18} />
                {contractErrorText}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="계약 명칭" required error={showContractErrors && !newContract.name}>
                <input required type="text" className={inputClass(showContractErrors && !newContract.name)} value={newContract.name} onChange={e => setNewContract({ ...newContract, name: e.target.value })} placeholder="공식 계약명 입력" />
              </FormField>
              <FormField label="프로젝트명 (고정)">
                <div className="w-full px-4 py-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-500 text-sm font-black flex items-center justify-between">
                  <span>{getProjectName(newContract.projectId || '')}</span>
                  <Lock size={14} className="text-slate-300" />
                </div>
              </FormField>
              <FormField label="거래처 (연결)" required error={showContractErrors && !newContract.customerId}>
                <select required className={inputClass(showContractErrors && !newContract.customerId)} value={newContract.customerId || ''} onChange={e => setNewContract({ ...newContract, customerId: e.target.value })}>
                  <option value="">거래처 선택</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="계약 금액" required error={showContractErrors && (!newContract.amount || newContract.amount <= 0)}>
                <input required type="text" className={inputClass(showContractErrors && (!newContract.amount || newContract.amount <= 0)) + " font-mono font-black"} value={contractAmountDisplay} onChange={e => handleContractAmountChange(e.target.value)} placeholder="0" />
              </FormField>
              <FormField label="구분" required error={showContractErrors && !newContract.category}>
                <select required className={inputClass(showContractErrors && !newContract.category)} value={newContract.category} onChange={e => setNewContract({ ...newContract, category: e.target.value as ContractCategory })}>
                  <option value="매출">매출</option>
                  <option value="매입">매입</option>
                </select>
              </FormField>
              <FormField label="유형" required error={showContractErrors && !newContract.type}>
                <select required className={inputClass(showContractErrors && !newContract.type)} value={newContract.type} onChange={e => setNewContract({ ...newContract, type: e.target.value as ContractType })}>
                  <option value="개발">개발</option>
                  <option value="유지보수">유지보수</option>
                  <option value="물품">물품</option>
                  <option value="기타">기타</option>
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <FormField label="계약 체결일">
                <input type="date" className={inputClass(false)} value={newContract.signedDate || ''} onChange={e => setNewContract({ ...newContract, signedDate: e.target.value })} />
              </FormField>
              <FormField label="착수일">
                <input type="date" className={inputClass(false)} value={newContract.startDate || ''} onChange={e => setNewContract({ ...newContract, startDate: e.target.value })} />
              </FormField>
              <FormField label="완료 예정일">
                <input type="date" className={inputClass(false)} value={newContract.endDate || ''} onChange={e => setNewContract({ ...newContract, endDate: e.target.value })} min={newContract.startDate} />
              </FormField>
            </div>
            <FormField label="비고">
              <textarea className={inputClass(false) + " h-20 resize-none"} value={newContract.notes || ''} onChange={e => setNewContract({ ...newContract, notes: e.target.value })} placeholder="계약 관련 특이사항 입력" />
            </FormField>
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={() => { setIsContractModalOpen({ isOpen: false }); setContractAmountDisplay(''); setEditingContract(null); setContractErrorText(null); }} className="px-6 py-2.5 font-bold text-slate-500 text-sm">취소</button>
              <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">{editingContract ? '수정 완료' : '등록 완료'}</button>
            </div>
          </form>
        </Modal>
      )}

      {isProjModalOpen && (
        <Modal title={editingProject ? "프로젝트 정보 수정" : "새 프로젝트 등록"} onClose={() => { setIsProjModalOpen(false); setEditingProject(null); setProjErrorText(null); }}>
          <form onSubmit={handleCreateProject} className="space-y-6">
            {projErrorText && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl font-bold flex items-center gap-3">
                <TriangleAlert size={18} />
                {projErrorText}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="프로젝트 명칭" required error={showProjErrors && !newProject.name}>
                <input required type="text" className={inputClass(showProjErrors && !newProject.name)} value={newProject.name || ''} onChange={e => setNewProject({ ...newProject, name: e.target.value })} placeholder="사업명 입력" />
              </FormField>
              <FormField label="발주기관(거래처)" required error={showProjErrors && !newProject.customerId}>
                <select required className={inputClass(showProjErrors && !newProject.customerId)} value={newProject.customerId || ''} onChange={e => setNewProject({ ...newProject, customerId: e.target.value })}>
                  <option value="">거래처 선택</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="시작일">
                <input type="date" className={inputClass(false)} value={newProject.startDate || ''} onChange={e => setNewProject({ ...newProject, startDate: e.target.value })} />
              </FormField>
              <FormField label="종료일">
                <input type="date" className={inputClass(false)} value={newProject.endDate || ''} onChange={e => setNewProject({ ...newProject, endDate: e.target.value })} min={newProject.startDate} />
              </FormField>
              <FormField label="예산액 (숫자만)">
                <input type="text" className={inputClass(false) + " font-black text-indigo-700 font-mono"} value={budgetDisplay} onChange={e => handleBudgetChange(e.target.value)} placeholder="0" />
              </FormField>
              <FormField label="업무부서명">
                <input type="text" className={inputClass(false)} value={newProject.deptName || ''} onChange={e => setNewProject({ ...newProject, deptName: e.target.value })} placeholder="부서명 입력" />
              </FormField>
              <FormField label="실무담당자">
                <input type="text" className={inputClass(false)} value={newProject.managerName || ''} onChange={e => setNewProject({ ...newProject, managerName: e.target.value })} placeholder="담당자 성명" />
              </FormField>
              <FormField label="연락처">
                <input type="text" className={inputClass(false)} value={newProject.managerPhone || ''} onChange={e => setNewProject({ ...newProject, managerPhone: e.target.value })} placeholder="연락처 입력" />
              </FormField>
            </div>
            <FormField label="비고">
              <textarea className={inputClass(false) + " h-24 resize-none"} value={newProject.notes || ''} onChange={e => setNewProject({ ...newProject, notes: e.target.value })} placeholder="프로젝트 특이사항 입력" />
            </FormField>
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={() => { setIsProjModalOpen(false); setEditingProject(null); setProjErrorText(null); }} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl text-sm transition-colors">취소</button>
              <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">{editingProject ? '수정 완료' : '등록 완료'}</button>
            </div>
          </form>
        </Modal>
      )}

      {isPaymentModalOpen.isOpen && (
        <Modal title={editingPayment ? "결제 마일스톤 수정" : "결제 마일스톤 추가"} onClose={() => { setIsPaymentModalOpen({ isOpen: false }); setPaymentAmountDisplay(''); setEditingPayment(null); setPaymentErrorText(null); }}>
          <form onSubmit={handleCreatePayment} className="space-y-6">
            {paymentErrorText && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl font-bold flex items-center gap-3">
                <TriangleAlert size={18} />
                {paymentErrorText}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="계약명 (고정)">
                <div className="w-full px-4 py-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-500 text-sm font-black flex items-center justify-between">
                  <span>{getContractName(isPaymentModalOpen.contractId || '')}</span>
                  <Lock size={14} className="text-slate-300" />
                </div>
              </FormField>
              <FormField label="상태 (자동 변이)">
                <div className="flex items-center gap-2 py-3 px-1">
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${calculatePaymentStatus(newPayment as Payment) === '완료' ? 'bg-emerald-100 text-emerald-700' :
                    calculatePaymentStatus(newPayment as Payment) === '청구' ? 'bg-amber-100 text-amber-700' :
                      calculatePaymentStatus(newPayment as Payment) === '지연' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-500'
                    }`}>
                    {calculatePaymentStatus(newPayment as Payment)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">* 날짜 입력에 따라 자동 변경됩니다.</span>
                </div>
              </FormField>
              <FormField label="결제 항목" required error={showPaymentErrors && !newPayment.item}>
                <select
                  required
                  className={inputClass(showPaymentErrors && !newPayment.item)}
                  value={newPayment.item}
                  onChange={e => handlePaymentItemChange(e.target.value as PaymentItem)}
                >
                  <option value="선금" disabled={!editingPayment && currentPaymentContract?.contractPayments.some(p => p.item === '선금')}>
                    선금 {!editingPayment && currentPaymentContract?.contractPayments.some(p => p.item === '선금') ? '(이미 등록됨)' : ''}
                  </option>
                  <option value="기성">기성</option>
                  <option value="잔금">잔금</option>
                </select>
              </FormField>
              <FormField label="결제 금액" required error={showPaymentErrors && (!newPayment.amount || newPayment.amount <= 0)}>
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      required
                      type="text"
                      readOnly={newPayment.item === '잔금' && !editingPayment}
                      className={inputClass(showPaymentErrors && (!newPayment.amount || newPayment.amount <= 0)) + " font-mono font-black " + (newPayment.item === '잔금' && !editingPayment ? 'bg-slate-50 text-indigo-600' : '')}
                      value={paymentAmountDisplay}
                      onChange={e => handlePaymentAmountChange(e.target.value)}
                      placeholder="0"
                    />
                    {newPayment.item === '잔금' && !editingPayment && <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />}
                  </div>
                  {!editingPayment && (
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">결제등록 잔액</span>
                      <span className="text-[11px] font-mono font-black text-indigo-500">
                        {formatCurrency(currentPaymentContract?.metrics.registeredBalance || 0)}
                      </span>
                    </div>
                  )}
                </div>
              </FormField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <FormField label="결제 예정일" required error={showPaymentErrors && !newPayment.scheduledDate}>
                <input required type="date" className={inputClass(showPaymentErrors && !newPayment.scheduledDate)} value={newPayment.scheduledDate || ''} onChange={e => setNewPayment({ ...newPayment, scheduledDate: e.target.value })} />
              </FormField>
              <FormField label="계산서 발행일">
                <input type="date" className={inputClass(false)} value={newPayment.invoiceDate || ''} onChange={e => setNewPayment({ ...newPayment, invoiceDate: e.target.value })} />
              </FormField>
              <FormField label="결제 완료일">
                <input type="date" className={inputClass(false)} value={newPayment.completionDate || ''} onChange={e => setNewPayment({ ...newPayment, completionDate: e.target.value })} />
              </FormField>
            </div>
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button type="button" onClick={() => { setIsPaymentModalOpen({ isOpen: false }); setPaymentAmountDisplay(''); setEditingPayment(null); setPaymentErrorText(null); }} className="px-6 py-2.5 font-bold text-slate-500 text-sm">취소</button>
              <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">
                {editingPayment ? '수정 완료' : '결제 등록'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TriangleAlert size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">프로젝트를 삭제하시겠습니까?</h3>
              <p className="text-slate-500 text-sm font-bold mb-6">'{deleteTarget.name}' 관련 모든 하위 계약과 결제 정보가 삭제됩니다.</p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm">취소</button>
                <button onClick={confirmDeleteProject} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm">삭제 확인</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteContractTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TriangleAlert size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">계약을 삭제하시겠습니까?</h3>
              <p className="text-slate-500 text-sm font-bold mb-6">'{deleteContractTarget.name}' 계약 및 관련 결제 정보가 영구 삭제됩니다.</p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => setDeleteContractTarget(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm">취소</button>
                <button onClick={confirmDeleteContract} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm">삭제 확인</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deletePaymentTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TriangleAlert size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">결제 내역을 삭제하시겠습니까?</h3>
              <p className="text-slate-500 text-sm font-bold mb-6">
                <span className="text-indigo-600">'{deletePaymentTarget.itemName}'</span> 항목이 삭제되며 복구할 수 없습니다.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => setDeletePaymentTarget(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm">취소</button>
                <button onClick={confirmDeletePayment} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm">삭제 확인</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DataPoint = ({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-mono font-black ${highlight ? 'text-rose-600' : 'text-slate-700'}`}>
      {value}
    </span>
  </div>
);

// Fixed: Added optional children to satisfy React 18 type requirements and usage
const Modal = ({ title, children, onClose }: { title: string, children?: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50">
        <h3 className="text-xl font-black text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light transition-colors">&times;</button>
      </div>
      <div className="p-8 max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

// Fixed: Added optional children to satisfy React 18 type requirements and usage
const FormField = ({ label, required, error, children }: { label: string, required?: boolean, error?: boolean, children?: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
      {label} {required && <span className="text-rose-500 font-black">*</span>}
      {error && <AlertCircle size={14} className="text-rose-500 animate-pulse ml-auto" />}
    </label>
    {children}
  </div>
);

export default ProjectContractManager;
