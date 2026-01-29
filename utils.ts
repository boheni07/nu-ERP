
import { Contract, Payment, ContractStatus, PaymentStatus, PaymentItem, ProjectStatus, Project } from './types';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
};

/**
 * 국내 전화번호 자동 포맷팅 (02, 010, 031, 062 등 대응)
 */
export const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return digits;
  
  if (digits.startsWith('02')) { // 서울 지역번호 (2자리)
    if (digits.length < 7) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length < 10) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  } else { // 기타 지역번호 및 휴대폰 (3자리)
    if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length < 11) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
};

/**
 * 사업자등록번호 자동 포맷팅 (000-00-00000)
 */
export const formatRegNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
};

export const getItemRank = (item: PaymentItem): number => {
  switch (item) {
    case '선금': return 1;
    case '기성': return 2;
    case '잔금': return 3;
    default: return 99;
  }
};

export const calculatePaymentStatus = (payment: Payment): PaymentStatus => {
  const today = new Date().toISOString().split('T')[0];
  if (payment.completionDate) return '완료';
  if (payment.invoiceDate) return '청구';
  if (payment.scheduledDate < today) return '지연';
  return '예정';
};

export const sortPayments = (payments: Payment[]): Payment[] => {
  return [...payments].sort((a, b) => {
    const rankA = getItemRank(a.item);
    const rankB = getItemRank(b.item);
    if (rankA !== rankB) return rankA - rankB;
    return a.scheduledDate.localeCompare(b.scheduledDate);
  });
};

export const getWorkingDaysDiff = (targetDateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  if (today.getTime() === target.getTime()) return 0;
  
  const isPast = target < today;
  let count = 0;
  const current = new Date(isPast ? target : today);
  const end = new Date(isPast ? today : target);

  while (current < end) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) { 
      count++;
    }
  }

  return isPast ? -count : count;
};

export const calculateContractStatus = (
  contract: Partial<Contract>,
  payments: Payment[]
): ContractStatus => {
  const today = new Date().toISOString().split('T')[0];
  const totalPaid = payments
    .filter(p => p.status === '완료')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const balance = (contract.amount || 0) - totalPaid;

  if (contract.amount && contract.amount > 0 && balance <= 0) return '종료';
  if (contract.endDate && today > contract.endDate && balance > 0) return '완료(미결제)';
  if (contract.startDate && contract.endDate && today >= contract.startDate && today <= contract.endDate) return '진행중';
  if (contract.signedDate && (!contract.startDate || today < contract.startDate)) return '계약';
  
  return '준비';
};

export const calculateProjectStatus = (
  project: Project,
  projectContracts: Contract[]
): ProjectStatus => {
  const today = new Date().toISOString().split('T')[0];
  const allContractsFinished = projectContracts.length > 0 && projectContracts.every(c => c.status === '종료');
  const periodPassed = project.endDate ? today > project.endDate : false;
  const notStarted = project.startDate ? today < project.startDate : false;

  if (allContractsFinished && periodPassed) return '완료';
  if (periodPassed && !allContractsFinished) return '지연중';
  if (notStarted) return '준비';

  return '진행중';
};

export const calculateContractMetrics = (contract: Contract, payments: Payment[]) => {
  const updatedPayments = payments.map(p => ({
    ...p,
    status: calculatePaymentStatus(p)
  }));

  const accumulatedPayment = updatedPayments
    .filter(p => p.status === '완료')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalRegisteredAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
  
  return {
    accumulatedPayment,
    balance: contract.amount - accumulatedPayment,
    registeredBalance: contract.amount - totalRegisteredAmount,
    status: calculateContractStatus(contract, updatedPayments),
    updatedPayments
  };
};
