
import React, { useState, useEffect, useMemo } from 'react';
import { Payment, PaymentItem, Contract, PaymentStatus } from '../../types';
import { formatCurrency, calculatePaymentStatus, calculateContractMetrics, sortPayments } from '../../utils';
import { Lock, AlertCircle, CalendarDays, Tag, Building } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string | null;
    editingPayment: Payment | null;
    onSave: (payment: Payment) => void;
    contracts: Contract[];
    payments: Payment[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen, onClose, contractId, editingPayment, onSave, contracts, payments
}) => {
    const [newPayment, setNewPayment] = useState<Partial<Payment>>({
        item: '기성', amount: 0, scheduledDate: '', invoiceDate: '', completionDate: ''
    });
    const [amountDisplay, setAmountDisplay] = useState('');
    const [showErrors, setShowErrors] = useState(false);

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editingPayment) {
                setNewPayment({ ...editingPayment });
                setAmountDisplay(new Intl.NumberFormat('ko-KR').format(editingPayment.amount));
            } else {
                setNewPayment({
                    item: '기성',
                    amount: 0,
                    scheduledDate: '',
                    invoiceDate: '',
                    completionDate: '',
                    contractId: contractId || ''
                });
                setAmountDisplay('');
            }
            setShowErrors(false);
        }
    }, [isOpen, editingPayment, contractId]);

    const currentPaymentContract = useMemo(() => {
        if (!contractId) return null;
        const contract = contracts.find(c => c.id === contractId);
        if (!contract) return null;
        const contractPayments = sortPayments(payments.filter(p => p.contractId === contract.id));
        const metrics = calculateContractMetrics(contract, contractPayments);
        return { contract, metrics, contractPayments };
    }, [contractId, contracts, payments]);

    const handleAmountChange = (val: string) => {
        const digits = val.replace(/\D/g, '');
        const num = parseInt(digits) || 0;
        setNewPayment(prev => ({ ...prev, amount: num }));
        setAmountDisplay(new Intl.NumberFormat('ko-KR').format(num));
    };

    const calculateStatus = (p: Partial<Payment>) => {
        // Helper to reuse the logic from utils but robustly handled for partial
        if (!p.scheduledDate) return '예정';
        // Just cast to Payment for the utility since it mostly checks date fields
        return calculatePaymentStatus(p as Payment);
    };

    const inputClass = (isError: boolean) => `w-full px-4 py-3 border rounded-xl outline-none transition-all duration-200 font-bold text-sm ${isError
            ? 'border-rose-300 bg-rose-50 text-rose-900 focus:ring-4 focus:ring-rose-100 placeholder:text-rose-300'
            : 'border-slate-200 bg-slate-50 text-slate-700 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 placeholder:text-slate-400'
        }`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPayment.item || !newPayment.amount || newPayment.amount <= 0 || !newPayment.scheduledDate) {
            setShowErrors(true);
            return;
        }

        const payload: Payment = {
            ...newPayment,
            id: editingPayment?.id || Date.now().toString(),
            contractId: contractId!,
            status: calculateStatus(newPayment)
        } as Payment;

        onSave(payload);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Tag size={20} className="text-indigo-500" />
                        {editingPayment ? '결제 마일스톤 수정' : '새 결제 마일스톤 등록'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light transition-colors">&times;</button>
                </div>

                <div className="p-8 max-h-[80vh] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="계약 확인">
                                <div className="w-full px-4 py-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-500 text-sm font-black flex items-center justify-between">
                                    <span>{currentPaymentContract?.contract.name || '계약 정보 없음'}</span>
                                    <Lock size={14} className="text-slate-300" />
                                </div>
                            </FormField>

                            <FormField label="상태 (자동 변이)">
                                <div className="flex items-center gap-2 py-3 px-1">
                                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${calculateStatus(newPayment) === '완료' ? 'bg-emerald-100 text-emerald-700' :
                                            calculateStatus(newPayment) === '청구' ? 'bg-amber-100 text-amber-700' :
                                                calculateStatus(newPayment) === '지연' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-slate-100 text-slate-500'
                                        }`}>
                                        {calculateStatus(newPayment)}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">* 날짜 입력에 따라 자동 변경됩니다.</span>
                                </div>
                            </FormField>

                            <FormField label="결제 항목" required error={showErrors && !newPayment.item}>
                                <select
                                    required
                                    className={inputClass(showErrors && !newPayment.item)}
                                    value={newPayment.item}
                                    onChange={e => setNewPayment({ ...newPayment, item: e.target.value as PaymentItem })}
                                >
                                    <option value="선금" disabled={!editingPayment && currentPaymentContract?.contractPayments.some(p => p.item === '선금')}>
                                        선금 {!editingPayment && currentPaymentContract?.contractPayments.some(p => p.item === '선금') ? '(이미 등록됨)' : ''}
                                    </option>
                                    <option value="기성">기성</option>
                                    <option value="잔금">잔금</option>
                                </select>
                            </FormField>

                            <FormField label="결제 금액" required error={showErrors && (!newPayment.amount || newPayment.amount <= 0)}>
                                <div className="space-y-1.5">
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            // 잔금은 자동 계산 등이 있을 수 있지만 여기서는 단순화
                                            readOnly={newPayment.item === '잔금' && !editingPayment}
                                            className={inputClass(showErrors && (!newPayment.amount || newPayment.amount <= 0)) + " font-mono font-black " + (newPayment.item === '잔금' && !editingPayment ? 'bg-slate-50 text-indigo-600' : '')}
                                            value={amountDisplay}
                                            onChange={e => handleAmountChange(e.target.value)}
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
                            <FormField label="결제 예정일" required error={showErrors && !newPayment.scheduledDate}>
                                <input required type="date" className={inputClass(showErrors && !newPayment.scheduledDate)} value={newPayment.scheduledDate || ''} onChange={e => setNewPayment({ ...newPayment, scheduledDate: e.target.value })} />
                            </FormField>
                            <FormField label="계산서 발행일">
                                <input type="date" className={inputClass(false)} value={newPayment.invoiceDate || ''} onChange={e => setNewPayment({ ...newPayment, invoiceDate: e.target.value })} />
                            </FormField>
                            <FormField label="결제 완료일">
                                <input type="date" className={inputClass(false)} value={newPayment.completionDate || ''} onChange={e => setNewPayment({ ...newPayment, completionDate: e.target.value })} />
                            </FormField>
                        </div>

                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-500 text-sm">취소</button>
                            <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">
                                {editingPayment ? '수정 완료' : '결제 등록'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const FormField = ({ label, required, error, children }: { label: string, required?: boolean, error?: boolean, children?: React.ReactNode }) => (
    <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            {label} {required && <span className="text-rose-500 font-black">*</span>}
            {error && <AlertCircle size={14} className="text-rose-500 animate-pulse ml-auto" />}
        </label>
        {children}
    </div>
);
