
export type CustomerType = '공공' | '교육' | '영리' | '기타';

export interface Customer {
  id: string;
  name: string;        // 기관(기업)명: 필수, 중복체크
  regNo: string;       // 사업자등록번호: 필수, 중복체크
  type: CustomerType;  // 구분
  ceoName: string;     // 대표자명
  bizType: string;     // 업태
  bizItem: string;     // 종목
  financeDept: string; // 담당부서
  managerName: string; // 담당자명
  phone: string;       // 연락처
  email: string;       // 이메일
  bankName: string;    // 은행명
  accountNo: string;   // 계좌번호
  accountHolder: string; // 예금주
  zipCode: string;     // 우편번호
  address: string;     // 주소
  notes: string;       // 비고
}

export type ProjectStatus = '준비' | '진행중' | '지연중' | '완료';

export interface Project {
  id: string;
  name: string;
  customerId: string;
  startDate?: string;
  endDate?: string;
  budget: number;
  deptName: string;
  managerName: string;
  managerPhone: string;
  notes: string;
  status?: ProjectStatus; // 추가된 상태 필드
}

export type ContractCategory = '매출' | '매입';
export type ContractType = '개발' | '유지보수' | '물품' | '기타';
export type ContractStatus = '준비' | '계약' | '진행중' | '완료(미결제)' | '종료';

export interface Contract {
  id: string;
  name: string;
  projectId: string;
  customerId: string;
  category: ContractCategory;
  type: ContractType;
  amount: number;
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  accumulatedPayment: number;
  balance: number;
  registeredBalance: number;
  status: ContractStatus;
  notes?: string;
}

export type PaymentItem = '선금' | '기성' | '잔금';
export type PaymentStatus = '예정' | '청구' | '지연' | '완료';

export interface Payment {
  id: string;
  contractId: string;
  item: PaymentItem;
  amount: number;
  scheduledDate: string;
  invoiceDate?: string;
  completionDate?: string;
  status: PaymentStatus;
}

export interface User {
  id: string; // 사용자 아이디 (PK)
  password: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  notes: string;
}

export interface Member extends User {}

export interface Activity {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SYSTEM';
  category: 'CUSTOMER' | 'PROJECT' | 'CONTRACT' | 'PAYMENT' | 'USER';
  description: string;
  timestamp: string;
  targetName: string;
}
