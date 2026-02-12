
import { Customer, Project, Contract, Payment, User } from '../types';
import { supabase } from '../lib/supabase';

/**
 * Supabase를 사용한 실제 데이터 서비스
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  // GET: 데이터 전체 조회
  fetchAllData: async () => {
    // 병렬로 모든 테이블 데이터 조회
    const [
      { data: customers },
      { data: projects },
      { data: contracts },
      { data: payments },
      { data: users },
    ] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('contracts').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('app_users').select('*'),
    ]);

    return {
      customers: (customers || []) as Customer[],
      projects: (projects || []) as Project[],
      contracts: (contracts || []) as Contract[],
      payments: (payments || []) as Payment[],
      users: (users || []) as User[],
    };
  },

  // POST/PUT: 데이터 저장 (Upsert 전략)
  // 현재 앱 구조상 전체 리스트를 받아오므로, 차집합을 계산해 삭제하는 로직이 필요함.
  // 간단한 마이그레이션을 위해, 통째로 upsert 후 없는 것은 delete 하는 방식 채택.

  // --- Granular Operations (Optimized) ---

  // Customers
  createCustomer: async (customer: Customer) => {
    const { error } = await supabase.from('customers').insert(customer);
    if (error) throw error;
  },
  updateCustomer: async (customer: Customer) => {
    const { error } = await supabase.from('customers').update(customer).eq('id', customer.id);
    if (error) throw error;
  },
  deleteCustomer: async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  // Projects
  createProject: async (project: Project) => {
    const { error } = await supabase.from('projects').insert(project);
    if (error) throw error;
  },
  updateProject: async (project: Project) => {
    const { error } = await supabase.from('projects').update(project).eq('id', project.id);
    if (error) throw error;
  },
  deleteProject: async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  // Contracts
  createContract: async (contract: Contract) => {
    const { error } = await supabase.from('contracts').insert(contract);
    if (error) throw error;
  },
  updateContract: async (contract: Contract) => {
    const { error } = await supabase.from('contracts').update(contract).eq('id', contract.id);
    if (error) throw error;
  },
  deleteContract: async (id: string) => {
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) throw error;
  },

  // Payments
  createPayment: async (payment: Payment) => {
    const { error } = await supabase.from('payments').insert(payment);
    if (error) throw error;
  },
  updatePayment: async (payment: Payment) => {
    const { error } = await supabase.from('payments').update(payment).eq('id', payment.id);
    if (error) throw error;
  },
  deletePayment: async (id: string) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
  },

  // Users
  createUser: async (user: User) => {
    const { error } = await supabase.from('app_users').insert(user);
    if (error) throw error;
  },
  updateUser: async (user: User) => {
    const { error } = await supabase.from('app_users').update(user).eq('id', user.id);
    if (error) throw error;
  },
  deleteUser: async (id: string) => {
    const { error } = await supabase.from('app_users').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Bulk Operations (Legacy/Restore) ---

  saveCustomers: async (data: Customer[]) => {
    if (data.length === 0) {
      await supabase.from('customers').delete().neq('id', '0');
      return;
    }
    const { error } = await supabase.from('customers').upsert(data);
    if (error) throw error;

    const currentIds = data.map(d => d.id);
    await supabase.from('customers').delete().not('id', 'in', currentIds);
  },

  saveProjects: async (data: Project[]) => {
    if (data.length === 0) {
      await supabase.from('projects').delete().neq('id', '0');
      return;
    }
    const { error } = await supabase.from('projects').upsert(data);
    if (error) throw error;

    const currentIds = data.map(d => d.id);
    await supabase.from('projects').delete().not('id', 'in', currentIds);
  },

  saveContracts: async (data: Contract[]) => {
    if (data.length === 0) {
      await supabase.from('contracts').delete().neq('id', '0');
      return;
    }
    const { error } = await supabase.from('contracts').upsert(data);
    if (error) throw error;

    const currentIds = data.map(d => d.id);
    await supabase.from('contracts').delete().not('id', 'in', currentIds);
  },

  savePayments: async (data: Payment[]) => {
    if (data.length === 0) {
      await supabase.from('payments').delete().neq('id', '0');
      return;
    }
    const { error } = await supabase.from('payments').upsert(data);
    if (error) throw error;

    const currentIds = data.map(d => d.id);
    await supabase.from('payments').delete().not('id', 'in', currentIds);
  },

  saveUsers: async (data: User[]) => {
    if (data.length === 0) {
      await supabase.from('app_users').delete().neq('id', '0');
      return;
    }
    const { error } = await supabase.from('app_users').upsert(data);
    if (error) throw error;

    const currentIds = data.map(d => d.id);
    await supabase.from('app_users').delete().not('id', 'in', currentIds);
  },

  // --- Utility Operations ---
  clearAllData: async () => {
    // FK 제약 조건을 고려하여 역순으로 삭제
    await supabase.from('payments').delete().neq('id', '0');
    await supabase.from('contracts').delete().neq('id', '0');
    await supabase.from('projects').delete().neq('id', '0');
    await supabase.from('customers').delete().neq('id', '0');
    await supabase.from('app_users').delete().neq('id', '0');
  }
};

