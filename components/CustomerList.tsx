
import React, { useState } from 'react';
import { Customer, CustomerType, Project, Contract } from '../types';
import { formatPhoneNumber, formatRegNumber } from '../utils';
import { Plus, Search, AlertCircle, Users, Pencil, Trash2, Info, TriangleAlert, Building2, CreditCard, UserCircle } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  projects: Project[];
  contracts: Contract[];
  onAdd: (customer: Customer) => void;
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, projects, contracts, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  
  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.regNo.includes(searchTerm)
  );

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    type: '영리',
    name: '',
    regNo: '',
    ceoName: '',
    bizType: '',
    bizItem: '',
    financeDept: '',
    managerName: '',
    phone: '',
    email: '',
    bankName: '',
    accountNo: '',
    accountHolder: '',
    zipCode: '',
    address: '',
    notes: ''
  });

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setShowErrors(true);

    const isRegNoValid = newCustomer.regNo?.replace(/\D/g, '').length === 10;

    if (!newCustomer.name?.trim() || !newCustomer.regNo || !isRegNoValid || !newCustomer.type) {
      setErrorText('기관명 및 사업자등록번호(10자리)는 필수 항목입니다.');
      return;
    }

    const isDuplicateName = customers.some(c => c.id !== editingId && c.name.trim() === newCustomer.name?.trim());
    const isDuplicateRegNo = customers.some(c => c.id !== editingId && c.regNo.replace(/\D/g, '') === newCustomer.regNo?.replace(/\D/g, ''));

    if (isDuplicateName) {
      setErrorText('이미 등록된 기관(기업)명입니다.');
      return;
    }
    if (isDuplicateRegNo) {
      setErrorText('이미 등록된 사업자등록번호입니다.');
      return;
    }

    if (editingId) {
      onUpdate({
        ...newCustomer,
        id: editingId,
        name: newCustomer.name?.trim(),
      } as Customer);
    } else {
      onAdd({
        ...newCustomer,
        id: Date.now().toString(),
        name: newCustomer.name?.trim(),
        bizType: newCustomer.bizType || '',
        bizItem: newCustomer.bizItem || '',
        zipCode: newCustomer.zipCode || '',
        address: newCustomer.address || '',
        notes: newCustomer.notes || ''
      } as Customer);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewCustomer({
      type: '영리',
      name: '',
      regNo: '',
      ceoName: '',
      bizType: '',
      bizItem: '',
      financeDept: '',
      managerName: '',
      phone: '',
      email: '',
      bankName: '',
      accountNo: '',
      accountHolder: '',
      zipCode: '',
      address: '',
      notes: ''
    });
    setErrorText(null);
    setShowErrors(false);
    setEditingId(null);
  };

  const handleEdit = (customer: Customer) => {
    setNewCustomer({ ...customer });
    setEditingId(customer.id);
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-all font-medium
    ${hasError ? 'border-rose-500 ring-rose-100 focus:ring-rose-500 bg-rose-50/10' : 'border-slate-200 focus:ring-indigo-500'}
  `;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="기관명 또는 사업자번호로 검색"
            className="w-full pl-11 pr-4 py-2 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-slate-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          <Plus size={18} />
          거래처 등록
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">구분</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">기관(기업)명</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">사업자번호</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">대표자 / 업태 / 종목</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">담당자 / 연락처</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold text-sm">
                  등록된 거래처가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-widest uppercase ${
                      customer.type === '공공' ? 'bg-blue-100 text-blue-700' :
                      customer.type === '교육' ? 'bg-purple-100 text-purple-700' :
                      customer.type === '영리' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{customer.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{customer.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-slate-600 font-bold">{customer.regNo}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-700">{customer.ceoName || '-'}</div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {customer.bizType || '업태 미등록'} / {customer.bizItem || '종목 미등록'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-slate-700">{customer.managerName || '-'}</div>
                    <div className="text-xs text-slate-400 font-bold">{customer.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="수정"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(customer)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TriangleAlert size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">거래처를 삭제하시겠습니까?</h3>
              <p className="text-slate-500 text-sm font-bold mb-6">
                <span className="text-indigo-600">'{deleteTarget.name}'</span> 거래처 정보가 영구적으로 삭제됩니다.
              </p>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left mb-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Info size={14} /> 연관 데이터 삭제 내역
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">연결된 프로젝트</span>
                    <span className="font-black text-rose-500">{projects.filter(p => p.customerId === deleteTarget.id).length}건</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
                <button onClick={confirmDelete} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-rose-700 transition-all">삭제 확인</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-indigo-600" />
                <h3 className="text-xl font-black text-slate-800">
                  {editingId ? '거래처 정보 수정' : '신규 거래처 등록'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-10">
              {errorText && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl font-bold flex items-center gap-3">
                  <TriangleAlert size={18} />
                  {errorText}
                </div>
              )}
              
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest border-b pb-2">
                  <Building2 size={18} /> 기본 정보 (사업자)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="기관(기업)명" required error={showErrors && !newCustomer.name?.trim()}>
                    <input required type="text" className={inputClass(showErrors && !newCustomer.name?.trim())} value={newCustomer.name || ''} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="공식 상호명 입력 (중복 불가)" />
                  </FormField>
                  <FormField label="사업자등록번호" required error={showErrors && (!newCustomer.regNo || newCustomer.regNo.replace(/\D/g, '').length !== 10)}>
                    <input required placeholder="000-00-00000 (중복 불가)" type="text" className={inputClass(showErrors && (!newCustomer.regNo || newCustomer.regNo.replace(/\D/g, '').length !== 10))} value={newCustomer.regNo || ''} onChange={(e) => setNewCustomer({...newCustomer, regNo: formatRegNumber(e.target.value)})} maxLength={12} />
                  </FormField>
                  <FormField label="구분" required error={showErrors && !newCustomer.type}>
                    <select required className={inputClass(showErrors && !newCustomer.type)} value={newCustomer.type} onChange={(e) => setNewCustomer({...newCustomer, type: e.target.value as CustomerType})}>
                      <option value="영리">영리</option>
                      <option value="공공">공공</option>
                      <option value="교육">교육</option>
                      <option value="기타">기타</option>
                    </select>
                  </FormField>
                  <FormField label="대표자 성명">
                    <input type="text" className={inputClass(false)} value={newCustomer.ceoName || ''} onChange={(e) => setNewCustomer({...newCustomer, ceoName: e.target.value})} placeholder="대표자 이름" />
                  </FormField>
                  <FormField label="업태">
                    <input type="text" className={inputClass(false)} value={newCustomer.bizType || ''} onChange={(e) => setNewCustomer({...newCustomer, bizType: e.target.value})} placeholder="예: 서비스, 제조업" />
                  </FormField>
                  <FormField label="종목">
                    <input type="text" className={inputClass(false)} value={newCustomer.bizItem || ''} onChange={(e) => setNewCustomer({...newCustomer, bizItem: e.target.value})} placeholder="예: 소프트웨어 개발" />
                  </FormField>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest border-b pb-2">
                  <UserCircle size={18} /> 담당자 및 연락처
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="실무담당자">
                    <input type="text" className={inputClass(false)} value={newCustomer.managerName || ''} onChange={(e) => setNewCustomer({...newCustomer, managerName: e.target.value})} />
                  </FormField>
                  <FormField label="연락처">
                    <input type="text" className={inputClass(false)} value={newCustomer.phone || ''} onChange={(e) => setNewCustomer({...newCustomer, phone: formatPhoneNumber(e.target.value)})} placeholder="010-0000-0000" />
                  </FormField>
                  <FormField label="이메일" error={showErrors && !!newCustomer.email && !validateEmail(newCustomer.email)}>
                    <input type="email" className={inputClass(showErrors && !!newCustomer.email && !validateEmail(newCustomer.email))} value={newCustomer.email || ''} onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="mail@example.com" />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField label="우편번호">
                    <input type="text" className={inputClass(false)} value={newCustomer.zipCode || ''} onChange={(e) => setNewCustomer({...newCustomer, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5)})} placeholder="5자리 숫자" maxLength={5} />
                  </FormField>
                  <div className="md:col-span-3">
                    <FormField label="주소">
                      <input type="text" className={inputClass(false)} value={newCustomer.address || ''} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="도로명/지번 주소 입력" />
                    </FormField>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-sm uppercase tracking-widest border-b pb-2">
                  <CreditCard size={18} /> 결제 및 은행 정보
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="은행명">
                    <input type="text" className={inputClass(false)} value={newCustomer.bankName || ''} onChange={(e) => setNewCustomer({...newCustomer, bankName: e.target.value})} />
                  </FormField>
                  <FormField label="계좌번호">
                    <input type="text" className={inputClass(false)} value={newCustomer.accountNo || ''} onChange={(e) => setNewCustomer({...newCustomer, accountNo: e.target.value})} placeholder="'-' 제외 입력" />
                  </FormField>
                  <FormField label="예금주">
                    <input type="text" className={inputClass(false)} value={newCustomer.accountHolder || ''} onChange={(e) => setNewCustomer({...newCustomer, accountHolder: e.target.value})} />
                  </FormField>
                </div>
              </section>

              <FormField label="비고 (특이사항)">
                <textarea className={inputClass(false) + " h-24 resize-none"} value={newCustomer.notes || ''} onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})} placeholder="거래처 관리 참고사항 입력" />
              </FormField>

              <div className="pt-6 flex justify-end gap-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">
                  {editingId ? '수정 완료' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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

export default CustomerList;
