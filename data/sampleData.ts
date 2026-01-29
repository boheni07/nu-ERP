
import { Customer, Project, Contract, Payment, User } from '../types';

const today = new Date().toISOString().split('T')[0];
const getRelativeDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const SAMPLE_USERS: User[] = [
  { id: 'admin', password: 'password123', name: '김철수 실장', position: '총괄관리자', phone: '010-1111-2222', email: 'admin@nu-erp.com', notes: '시스템 전체 관리 권한' },
  { id: 'manager01', password: 'password123', name: '이영희 팀장', position: '전략영업팀장', phone: '010-3333-4444', email: 'yh.lee@nu-erp.com', notes: '계약 및 고객 관리 담당' },
  { id: 'staff02', password: 'password123', name: '박지민 대리', position: '재무회계대리', phone: '010-5555-6666', email: 'jm.park@nu-erp.com', notes: '수금 및 계산서 발행 실무' }
];

export const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: '(주)테크솔루션',
    regNo: '123-81-56789',
    type: '영리',
    ceoName: '홍길동',
    bizType: '서비스',
    bizItem: 'IT 컨설팅',
    financeDept: '경영지원팀',
    managerName: '강호동',
    phone: '02-555-1234',
    email: 'hd.kang@techsol.co.kr',
    bankName: '국민은행',
    accountNo: '445566-01-223344',
    accountHolder: '(주)테크솔루션',
    zipCode: '06123',
    address: '서울특별시 강남구 봉은사로 456',
    notes: '오랜 협력 관계의 VIP 거래처'
  },
  {
    id: 'CUST-002',
    name: '미래대학교 산학협력단',
    regNo: '204-82-11223',
    type: '교육',
    ceoName: '김미래',
    bizType: '교육/연구',
    bizItem: '학술연구',
    financeDept: '산학회계과',
    managerName: '이연구',
    phone: '031-777-8888',
    email: 'research@mirae.ac.kr',
    bankName: '우리은행',
    accountNo: '1002-111-222333',
    accountHolder: '미래대학교',
    zipCode: '13456',
    address: '경기도 성남시 수정구 미래로 1',
    notes: 'R&D 국책과제 주요 수행처'
  },
  {
    id: 'CUST-003',
    name: '한국산업진흥원(KIPA)',
    regNo: '101-81-99887',
    type: '공공',
    ceoName: '최진흥',
    bizType: '공공기관',
    bizItem: '산업지원',
    financeDept: '운영지원부',
    managerName: '정행정',
    phone: '053-123-0000',
    email: 'hj.jung@kipa.or.kr',
    bankName: '농협은행',
    accountNo: '301-5566-7788-99',
    accountHolder: '한국산업진흥원',
    zipCode: '41068',
    address: '대구광역시 동구 첨단로 100',
    notes: 'B2G 디지털 전환 사업 발주처'
  },
  {
    id: 'CUST-004',
    name: '(주)글로벌네트워크',
    regNo: '110-86-44556',
    type: '영리',
    ceoName: 'James Lee',
    bizType: '도소매',
    bizItem: '통신장비',
    financeDept: '회계팀',
    managerName: '박장비',
    phone: '02-333-4444',
    email: 'jb.park@globalnet.com',
    bankName: '하나은행',
    accountNo: '123-456789-00101',
    accountHolder: '(주)글로벌네트워크',
    zipCode: '04512',
    address: '서울특별시 중구 을지로 12',
    notes: '해외 수출입 관련 파트너'
  },
  {
    id: 'CUST-005',
    name: '서울시청 디지털정책관',
    regNo: '104-83-00123',
    type: '공공',
    ceoName: '서울시장',
    bizType: '지자체',
    bizItem: '공공행정',
    financeDept: '정보시스템과',
    managerName: '김서울',
    phone: '02-120-0000',
    email: 'seoul_it@seoul.go.kr',
    bankName: '신한은행',
    accountNo: '110-001-998877',
    accountHolder: '서울특별시청',
    zipCode: '04524',
    address: '서울특별시 중구 세종대로 110',
    notes: '스마트시티 고도화 사업 대상'
  }
];

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'PROJ-100',
    name: '차세대 통합 ERP 및 SCM 구축',
    customerId: 'CUST-001',
    startDate: getRelativeDate(-120),
    endDate: getRelativeDate(240),
    budget: 1200000000,
    deptName: '솔루션본부',
    managerName: '이혁진',
    managerPhone: '010-1212-3434',
    notes: '사내 최대 규모의 통합 구축 프로젝트',
    status: '진행중'
  },
  {
    id: 'PROJ-200',
    name: 'AI 기반 스마트 캠퍼스 행정 고도화',
    customerId: 'CUST-002',
    startDate: getRelativeDate(-30),
    endDate: getRelativeDate(330),
    budget: 450000000,
    deptName: 'AI사업팀',
    managerName: '박지수',
    managerPhone: '010-5656-7878',
    notes: '생성형 AI 기술을 활용한 학사 행정 지원',
    status: '진행중'
  },
  {
    id: 'PROJ-300',
    name: '공공 데이터 개방 및 통합 플랫폼 개발',
    customerId: 'CUST-003',
    startDate: getRelativeDate(-15),
    endDate: getRelativeDate(165),
    budget: 320000000,
    deptName: '플랫폼개발팀',
    managerName: '최현석',
    managerPhone: '010-9090-1212',
    notes: '범정부 클라우드 표준 아키텍처 적용',
    status: '진행중'
  }
];

export const SAMPLE_CONTRACTS: Contract[] = [
  // Project 100 - Contracts
  {
    id: 'CONT-101',
    name: '[매출] ERP 핵심 모듈 소프트웨어 라이선스',
    projectId: 'PROJ-100',
    customerId: 'CUST-001',
    category: '매출',
    type: '물품',
    amount: 500000000,
    signedDate: getRelativeDate(-125),
    startDate: getRelativeDate(-120),
    endDate: getRelativeDate(-110),
    accumulatedPayment: 500000000,
    balance: 0,
    registeredBalance: 0,
    status: '종료'
  },
  {
    id: 'CONT-102',
    name: '[매출] 시스템 통합 구축 및 커스터마이징 컨설팅',
    projectId: 'PROJ-100',
    customerId: 'CUST-001',
    category: '매출',
    type: '개발',
    amount: 700000000,
    signedDate: getRelativeDate(-125),
    startDate: getRelativeDate(-120),
    endDate: getRelativeDate(240),
    accumulatedPayment: 210000000,
    balance: 490000000,
    registeredBalance: 490000000,
    status: '진행중'
  },
  // Project 200 - Contracts
  {
    id: 'CONT-201',
    name: '[매출] 학사 행정 자동화 알고리즘 개발',
    projectId: 'PROJ-200',
    customerId: 'CUST-002',
    category: '매출',
    type: '개발',
    amount: 300000000,
    signedDate: getRelativeDate(-35),
    startDate: getRelativeDate(-30),
    endDate: getRelativeDate(330),
    accumulatedPayment: 90000000,
    balance: 210000000,
    registeredBalance: 0,
    status: '진행중'
  },
  {
    id: 'CONT-202',
    name: '[매출] AI 솔루션 초기 설정 및 사용자 교육',
    projectId: 'PROJ-200',
    customerId: 'CUST-002',
    category: '매출',
    type: '기타',
    amount: 150000000,
    signedDate: getRelativeDate(-35),
    startDate: getRelativeDate(-30),
    endDate: getRelativeDate(30),
    accumulatedPayment: 0,
    balance: 150000000,
    registeredBalance: 150000000,
    status: '진행중'
  },
  // Project 300 - Contracts
  {
    id: 'CONT-301',
    name: '[매출] 플랫폼 아키텍처 설계 및 인프라 구축',
    projectId: 'PROJ-300',
    customerId: 'CUST-003',
    category: '매출',
    type: '개발',
    amount: 200000000,
    signedDate: getRelativeDate(-20),
    startDate: getRelativeDate(-15),
    endDate: getRelativeDate(165),
    accumulatedPayment: 60000000,
    balance: 140000000,
    registeredBalance: 140000000,
    status: '진행중'
  },
  {
    id: 'CONT-302',
    name: '[매출] 공공 데이터 보안 취약점 점검 서비스',
    projectId: 'PROJ-300',
    customerId: 'CUST-003',
    category: '매출',
    type: '유지보수',
    amount: 120000000,
    signedDate: getRelativeDate(-20),
    startDate: getRelativeDate(-15),
    endDate: getRelativeDate(15),
    accumulatedPayment: 0,
    balance: 120000000,
    registeredBalance: 120000000,
    status: '진행중'
  }
];

export const SAMPLE_PAYMENTS: Payment[] = [
  // CONT-101 (총 2건: 선금, 잔금 완료)
  { id: 'PAY-101-1', contractId: 'CONT-101', item: '선금', amount: 250000000, scheduledDate: getRelativeDate(-120), completionDate: getRelativeDate(-118), status: '완료' },
  { id: 'PAY-101-2', contractId: 'CONT-101', item: '잔금', amount: 250000000, scheduledDate: getRelativeDate(-115), completionDate: getRelativeDate(-110), status: '완료' },
  
  // CONT-102 (총 2건: 선금 완료, 잔금 예정)
  { id: 'PAY-102-1', contractId: 'CONT-102', item: '선금', amount: 210000000, scheduledDate: getRelativeDate(-118), completionDate: getRelativeDate(-115), status: '완료' },
  { id: 'PAY-102-2', contractId: 'CONT-102', item: '잔금', amount: 490000000, scheduledDate: getRelativeDate(240), status: '예정' },
  
  // CONT-201 (총 2건: 선금 완료, 기성 청구중)
  { id: 'PAY-201-1', contractId: 'CONT-201', item: '선금', amount: 90000000, scheduledDate: getRelativeDate(-25), completionDate: getRelativeDate(-20), status: '완료' },
  { id: 'PAY-201-2', contractId: 'CONT-201', item: '기성', amount: 210000000, scheduledDate: today, invoiceDate: today, status: '청구' },
  
  // CONT-202 (총 2건: 선금 지연, 잔금 예정)
  { id: 'PAY-202-1', contractId: 'CONT-202', item: '선금', amount: 45000000, scheduledDate: getRelativeDate(-5), status: '지연' },
  { id: 'PAY-202-2', contractId: 'CONT-202', item: '잔금', amount: 105000000, scheduledDate: getRelativeDate(30), status: '예정' },
  
  // CONT-301 (총 2건: 선금 완료, 잔금 예정)
  { id: 'PAY-301-1', contractId: 'CONT-301', item: '선금', amount: 60000000, scheduledDate: getRelativeDate(-10), completionDate: getRelativeDate(-5), status: '완료' },
  { id: 'PAY-301-2', contractId: 'CONT-301', item: '잔금', amount: 140000000, scheduledDate: getRelativeDate(160), status: '예정' },
  
  // CONT-302 (총 2건: 선금 청구중, 잔금 예정)
  { id: 'PAY-302-1', contractId: 'CONT-302', item: '선금', amount: 36000000, scheduledDate: today, invoiceDate: today, status: '청구' },
  { id: 'PAY-302-2', contractId: 'CONT-302', item: '잔금', amount: 84000000, scheduledDate: getRelativeDate(15), status: '예정' }
];
