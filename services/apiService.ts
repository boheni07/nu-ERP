
import { Customer, Project, Contract, Payment, User } from '../types';

/**
 * 이 서비스는 실제 운영 단계에서 fetch('/api/...') 호출로 대체됩니다.
 * 지금은 DBMS 통신 과정을 시뮬레이션하기 위해 비동기(Promise)로 처리합니다.
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getStorage = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setStorage = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const apiService = {
  // GET: 데이터 전체 조회
  fetchAllData: async () => {
    await delay(600); // 네트워크 지연 시뮬레이션
    return {
      customers: getStorage('nu_customers'),
      projects: getStorage('nu_projects'),
      contracts: getStorage('nu_contracts'),
      payments: getStorage('nu_payments'),
      users: getStorage('nu_users'),
    };
  },

  // POST/PUT/DELETE: 각 도메인별 처리
  saveCustomers: async (data: Customer[]) => {
    await delay(300);
    setStorage('nu_customers', data);
  },

  saveProjects: async (data: Project[]) => {
    await delay(300);
    setStorage('nu_projects', data);
  },

  saveContracts: async (data: Contract[]) => {
    await delay(300);
    setStorage('nu_contracts', data);
  },

  savePayments: async (data: Payment[]) => {
    await delay(300);
    setStorage('nu_payments', data);
  },

  saveUsers: async (data: User[]) => {
    await delay(300);
    setStorage('nu_users', data);
  }
};
