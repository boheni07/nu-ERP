
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import ProjectContractManager from './components/ProjectContractManager';
import UserList from './components/UserList';
import AIBriefing from './components/AIBriefing';
import DataManager from './components/DataManager';
import TodoList from './components/TodoList';
import Login from './components/Login';
import { Customer, Project, Contract, Payment, User, Activity } from './types';
import { calculateContractMetrics, sortPayments, calculatePaymentStatus } from './utils';
import { apiService } from './services/apiService';
import { SAMPLE_CUSTOMERS, SAMPLE_PROJECTS, SAMPLE_CONTRACTS, SAMPLE_PAYMENTS, SAMPLE_USERS } from './data/sampleData';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // 활동 로깅 헬퍼
  const logActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setActivities(prev => [...prev, newActivity].slice(-20)); // 최근 20건만 유지
  }, []);

  // 초기 데이터 로드 (DB Fetch)
  useEffect(() => {
    const initApp = async () => {
      try {
        const data = await apiService.fetchAllData();
        setCustomers(data.customers);
        setProjects(data.projects);
        setContracts(data.contracts);
        setPayments(data.payments);

        // 유저 데이터가 비어있으면 샘플 유저 로드
        if (data.users.length === 0) {
          setUsers(SAMPLE_USERS);
          await apiService.saveUsers(SAMPLE_USERS);
        } else {
          setUsers(data.users);
        }

        // 로컬 스토리지에서 세션 확인
        const savedUser = localStorage.getItem('nu_erp_session');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          logActivity({ type: 'LOGIN', category: 'USER', targetName: user.name, description: '시스템에 접속했습니다.' });
        }
      } catch (err) {
        console.error("Failed to load data from DBMS:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, [logActivity]);

  // Login/Logout Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nu_erp_session', JSON.stringify(user));
    logActivity({ type: 'LOGIN', category: 'USER', targetName: user.name, description: '시스템에 로그인했습니다.' });
  };

  const handleLogout = () => {
    if (currentUser) {
      logActivity({ type: 'SYSTEM', category: 'USER', targetName: currentUser.name, description: '로그아웃했습니다.' });
    }
    setCurrentUser(null);
    localStorage.removeItem('nu_erp_session');
    setActiveTab('dashboard');
  };

  // 현재 사용자 계정 정보 업데이트
  const updateCurrentUser = (updated: User) => {
    const nextUsers = users.map(u => u.id === updated.id ? updated : u);

    setIsSyncing(true);
    setCurrentUser(updated);
    setUsers(nextUsers);

    // 로컬 세션 정보 갱신
    localStorage.setItem('nu_erp_session', JSON.stringify(updated));

    // DBMS 동기화
    apiService.saveUsers(nextUsers)
      .then(() => {
        logActivity({ type: 'UPDATE', category: 'USER', targetName: updated.name, description: '본인의 계정 정보를 수정했습니다.' });
      })
      .catch(err => {
        console.error("Failed to sync user update:", err);
        alert("데이터 동기화 실패 (User Update)");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  // 상태 변경 시 DB 동기화 헬퍼
  const sync = async (fn: () => void, saveFn: (data: any) => Promise<void>, data: any) => {
    setIsSyncing(true);
    fn();
    try {
      await saveFn(data);
    } catch (err) {
      alert("데이터 동기화에 실패했습니다. 연결 상태를 확인하세요.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Data Management Functions
  const restoreData = async (data: any) => {
    setIsSyncing(true);
    setCustomers(data.customers || []);
    setProjects(data.projects || []);
    setContracts(data.contracts || []);
    setPayments(data.payments || []);
    setUsers(data.users || []);

    try {
      // 순차적으로 저장하며 고아 데이터(Orphan Data) 제거
      await apiService.saveUsers(data.users || []);
      await apiService.saveCustomers(data.customers || []);

      const validProjects = data.projects || [];
      await apiService.saveProjects(validProjects);

      // 프로젝트가 존재하는 계약만 필터링 (String 변환 비교)
      const projectIds = validProjects.map((p: Project) => String(p.id));
      const validContracts = (data.contracts || []).filter((c: Contract) => projectIds.includes(String(c.projectId)));

      const droppedContracts = (data.contracts || []).length - validContracts.length;
      if (droppedContracts > 0) {
        console.warn(`Dropped ${droppedContracts} orphan contracts`);
        if (validContracts.length === 0 && (data.contracts || []).length > 0) {
          throw new Error(`계약 정보 ${droppedContracts}건이 프로젝트와 연결되지 않아 복원할 수 없습니다. (프로젝트 ID 불일치)`);
        }
      }

      // [Fix] DB 스키마에 없는 'updatedPayments' 필드 제거 및 스냅샷 데이터 정제
      const sanitizedContracts = validContracts.map((c: any) => {
        const { updatedPayments, ...rest } = c;
        return rest;
      });

      await apiService.saveContracts(sanitizedContracts);

      // 계약이 존재하는 결제만 필터링 (String 변환 비교)
      const contractIds = validContracts.map((c: Contract) => String(c.id));
      const validPayments = (data.payments || []).filter((p: Payment) => contractIds.includes(String(p.contractId)));

      const droppedPayments = (data.payments || []).length - validPayments.length;
      if (droppedPayments > 0) {
        console.warn(`Dropped ${droppedPayments} orphan payments`);
        if (validPayments.length === 0 && (data.payments || []).length > 0) {
          throw new Error(`결제 정보 ${droppedPayments}건이 계약 정보와 연결되지 않아 복원할 수 없습니다.`);
        }
      }



      await apiService.savePayments(validPayments);

      logActivity({ type: 'SYSTEM', category: 'USER', targetName: 'Database', description: '데이터를 복원했습니다.' });
    } catch (err: any) {
      console.error("Restore failed:", err);
      alert(`데이터 복원 실패: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInitSampleData = async () => {
    setIsSyncing(true);

    // 1. 상태 업데이트
    setCustomers(SAMPLE_CUSTOMERS);
    setProjects(SAMPLE_PROJECTS);
    setContracts(SAMPLE_CONTRACTS);
    setPayments(SAMPLE_PAYMENTS);
    setUsers(SAMPLE_USERS);

    // 2. 비동기 DB 저장
    try {
      await Promise.all([
        apiService.saveCustomers(SAMPLE_CUSTOMERS),
        apiService.saveProjects(SAMPLE_PROJECTS),
        apiService.saveContracts(SAMPLE_CONTRACTS),
        apiService.savePayments(SAMPLE_PAYMENTS),
        apiService.saveUsers(SAMPLE_USERS)
      ]);
    } catch (err) {
      console.error("Sample data init failed", err);
    } finally {
      setIsSyncing(false);
      setActiveTab('dashboard');
      logActivity({ type: 'SYSTEM', category: 'USER', targetName: 'Sample Data', description: '표준 데이터를 로드했습니다.' });
    }
  };

  const addCustomer = (customer: Customer) => {
    const next = [...customers, customer];
    sync(() => setCustomers(next), apiService.saveCustomers, next);
    logActivity({ type: 'CREATE', category: 'CUSTOMER', targetName: customer.name, description: '새 거래처를 등록했습니다.' });
  };

  const updateCustomer = (updated: Customer) => {
    const next = customers.map(c => c.id === updated.id ? updated : c);
    sync(() => setCustomers(next), apiService.saveCustomers, next);
    logActivity({ type: 'UPDATE', category: 'CUSTOMER', targetName: updated.name, description: '거래처 정보를 수정했습니다.' });
  };

  const deleteCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    const nextCust = customers.filter(c => c.id !== id);
    const customerProjects = projects.filter(p => p.customerId === id).map(p => p.id);
    const nextProj = projects.filter(p => p.customerId !== id);
    const targetContracts = contracts.filter(c => customerProjects.includes(c.projectId)).map(c => c.id);
    const nextCont = contracts.filter(c => !customerProjects.includes(c.projectId));
    const nextPay = payments.filter(p => !targetContracts.includes(p.contractId));

    setIsSyncing(true);
    setCustomers(nextCust);
    setProjects(nextProj);
    setContracts(nextCont);
    setPayments(nextPay);

    Promise.all([
      apiService.saveCustomers(nextCust),
      apiService.saveProjects(nextProj),
      apiService.saveContracts(nextCont),
      apiService.savePayments(nextPay)
    ])
      .then(() => {
        if (target) logActivity({ type: 'DELETE', category: 'CUSTOMER', targetName: target.name, description: '거래처 및 관련 데이터를 삭제했습니다.' });
      })
      .catch(err => {
        console.error("Delete customer failed:", err);
        alert("삭제 작업 동기화 실패. 새로고침 후 다시 시도하세요.");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const addProject = (project: Project) => {
    const next = [...projects, project];
    sync(() => setProjects(next), apiService.saveProjects, next);
    logActivity({ type: 'CREATE', category: 'PROJECT', targetName: project.name, description: '새 프로젝트를 생성했습니다.' });
  };

  const updateProject = (project: Project) => {
    const next = projects.map(p => p.id === project.id ? project : p);
    sync(() => setProjects(next), apiService.saveProjects, next);
    logActivity({ type: 'UPDATE', category: 'PROJECT', targetName: project.name, description: '프로젝트 설정을 변경했습니다.' });
  };

  const deleteProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    const nextProj = projects.filter(p => p.id !== id);
    const targetContracts = contracts.filter(c => c.projectId === id).map(c => c.id);
    const nextCont = contracts.filter(c => c.projectId !== id);
    const nextPay = payments.filter(p => !targetContracts.includes(p.contractId));

    setIsSyncing(true);
    setProjects(nextProj);
    setContracts(nextCont);
    setPayments(nextPay);

    Promise.all([
      apiService.saveProjects(nextProj),
      apiService.saveContracts(nextCont),
      apiService.savePayments(nextPay)
    ])
      .then(() => {
        if (target) logActivity({ type: 'DELETE', category: 'PROJECT', targetName: target.name, description: '프로젝트를 삭제했습니다.' });
      })
      .catch(err => {
        console.error("Delete project failed:", err);
        alert("삭제 작업 동기화 실패");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const addContract = (contract: Contract) => {
    const next = [...contracts, contract];
    sync(() => setContracts(next), apiService.saveContracts, next);
    logActivity({ type: 'CREATE', category: 'CONTRACT', targetName: contract.name, description: '신규 계약을 체결했습니다.' });
  };

  const updateContract = (contract: Contract) => {
    const contractPayments = payments.filter(p => p.contractId === contract.id);
    const metrics = calculateContractMetrics(contract, contractPayments);
    const next = contracts.map(c => c.id === contract.id ? { ...contract, ...metrics } : c);
    sync(() => setContracts(next), apiService.saveContracts, next);
    logActivity({ type: 'UPDATE', category: 'CONTRACT', targetName: contract.name, description: '계약 조건을 변경했습니다.' });
  };

  const deleteContract = (id: string) => {
    const target = contracts.find(c => c.id === id);
    const nextCont = contracts.filter(c => c.id !== id);
    const nextPay = payments.filter(p => p.contractId !== id);
    setIsSyncing(true);
    setContracts(nextCont);
    setPayments(nextPay);
    Promise.all([
      apiService.saveContracts(nextCont),
      apiService.savePayments(nextPay)
    ])
      .then(() => {
        if (target) logActivity({ type: 'DELETE', category: 'CONTRACT', targetName: target.name, description: '계약을 파기했습니다.' });
      })
      .catch(err => {
        console.error("Delete contract failed:", err);
        alert("삭제 작업 동기화 실패");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const addPayment = (payment: Payment) => {
    const nextPay = [...payments, payment];
    const nextCont = contracts.map(c => {
      if (c.id === payment.contractId) {
        const metrics = calculateContractMetrics(c, nextPay.filter(p => p.contractId === c.id));
        return { ...c, ...metrics };
      }
      return c;
    });

    setIsSyncing(true);
    setPayments(nextPay);
    setContracts(nextCont);
    Promise.all([
      apiService.savePayments(nextPay),
      apiService.saveContracts(nextCont)
    ])
      .then(() => {
        logActivity({ type: 'CREATE', category: 'PAYMENT', targetName: payment.item, description: '결제 마일스톤을 추가했습니다.' });
      })
      .catch(err => {
        console.error("Add payment failed:", err);
        alert("결제 추가 실패");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const updatePayment = (updated: Payment) => {
    let nextPayments = [...payments];
    const contractPayments = sortPayments(nextPayments.filter(p => p.contractId === updated.contractId));
    const currentIndex = contractPayments.findIndex(p => p.id === updated.id);

    if (updated.completionDate || updated.status === '완료') {
      for (let i = 0; i < currentIndex; i++) {
        if (!contractPayments[i].completionDate) {
          alert(`이전 결제 단계(${contractPayments[i].item})가 아직 완료되지 않았습니다.\n순차적으로 완료 처리를 진행해주세요.`);
          return;
        }
      }
    }

    const original = payments.find(p => p.id === updated.id);
    const isReverting = original?.completionDate && !updated.completionDate;

    if (isReverting) {
      for (let i = currentIndex; i < contractPayments.length; i++) {
        const targetId = contractPayments[i].id;
        const pIdx = nextPayments.findIndex(p => p.id === targetId);
        if (pIdx > -1) {
          if (targetId === updated.id) {
            nextPayments[pIdx] = updated;
          } else {
            nextPayments[pIdx] = {
              ...nextPayments[pIdx],
              completionDate: undefined,
              invoiceDate: undefined,
              status: calculatePaymentStatus({ ...nextPayments[pIdx], completionDate: undefined, invoiceDate: undefined })
            };
          }
        }
      }
    } else {
      nextPayments = nextPayments.map(p => p.id === updated.id ? updated : p);
    }

    const nextCont = contracts.map(c => {
      if (c.id === updated.contractId) {
        const metrics = calculateContractMetrics(c, nextPayments.filter(p => p.contractId === c.id));
        return { ...c, ...metrics };
      }
      return c;
    });

    setIsSyncing(true);
    setPayments(nextPayments);
    setContracts(nextCont);
    Promise.all([
      apiService.savePayments(nextPayments),
      apiService.saveContracts(nextCont)
    ])
      .then(() => {
        logActivity({ type: 'UPDATE', category: 'PAYMENT', targetName: updated.item, description: `결제 상태를 [${updated.status}]로 업데이트했습니다.` });
      })
      .catch(err => {
        console.error("Update payment failed:", err);
        alert("결제 업데이트 실패");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const deletePayment = (paymentId: string, contractId: string) => {
    const target = payments.find(p => p.id === paymentId);
    const nextPay = payments.filter(p => p.id !== paymentId);
    const nextCont = contracts.map(c => {
      if (c.id === contractId) {
        const metrics = calculateContractMetrics(c, nextPay.filter(p => p.contractId === contractId));
        return { ...c, ...metrics };
      }
      return c;
    });

    setIsSyncing(true);
    setPayments(nextPay);
    setContracts(nextCont);
    Promise.all([
      apiService.savePayments(nextPay),
      apiService.saveContracts(nextCont)
    ])
      .then(() => {
        if (target) logActivity({ type: 'DELETE', category: 'PAYMENT', targetName: target.item, description: '결제 내역을 삭제했습니다.' });
      })
      .catch(err => {
        console.error("Delete payment failed:", err);
        alert("결제 삭제 실패");
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const addUser = (user: User) => {
    const next = [...users, user];
    sync(() => setUsers(next), apiService.saveUsers, next);
    logActivity({ type: 'CREATE', category: 'USER', targetName: user.name, description: '신규 사용자를 등록했습니다.' });
  };

  const updateUser = (user: User) => {
    const next = users.map(u => u.id === user.id ? user : u);
    sync(() => setUsers(next), apiService.saveUsers, next);
    logActivity({ type: 'UPDATE', category: 'USER', targetName: user.name, description: '사용자 정보를 수정했습니다.' });
  };

  const deleteUser = (id: string) => {
    const target = users.find(u => u.id === id);
    const next = users.filter(u => u.id !== id);
    sync(() => setUsers(next), apiService.saveUsers, next);
    if (target) logActivity({ type: 'DELETE', category: 'USER', targetName: target.name, description: '사용자 권한을 회수했습니다.' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-6">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
        <h1 className="text-2xl font-black tracking-tighter mb-2">nu-ERP Smart Management</h1>
        <p className="text-slate-400 font-medium animate-pulse">DBMS로부터 데이터를 안전하게 불러오고 있습니다...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      currentUser={currentUser}
      onLogout={handleLogout}
      activities={activities}
      onUpdateCurrentUser={updateCurrentUser}
    >
      {/* Sync Status Overlay */}
      {isSyncing && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-bottom-4">
          <div className="w-3 h-3 bg-indigo-500 rounded-full animate-ping"></div>
          <span className="text-xs font-black uppercase tracking-widest">Database Syncing...</span>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <Dashboard customers={customers} projects={projects} contracts={contracts} payments={payments} />
      )}
      {activeTab === 'customers' && (
        <CustomerList customers={customers} projects={projects} contracts={contracts} onAdd={addCustomer} onUpdate={updateCustomer} onDelete={deleteCustomer} />
      )}
      {activeTab === 'projects' && (
        <ProjectContractManager customers={customers} projects={projects} contracts={contracts} payments={payments} onAddProject={addProject} onUpdateProject={updateProject} onDeleteProject={deleteProject} onAddContract={addContract} onUpdateContract={updateContract} onDeleteContract={deleteContract} onAddPayment={addPayment} onUpdatePayment={updatePayment} onDeletePayment={deletePayment} />
      )}
      {activeTab === 'todo' && (
        <TodoList customers={customers} projects={projects} contracts={contracts} payments={payments} onUpdatePayment={updatePayment} />
      )}
      {activeTab === 'users' && (
        <UserList users={users} onAdd={addUser} onUpdate={updateUser} onDelete={deleteUser} />
      )}
      {activeTab === 'reports' && (
        <AIBriefing customers={customers} projects={projects} contracts={contracts} payments={payments} />
      )}
      {activeTab === 'data-management' && (
        <DataManager data={{ customers, projects, contracts, payments, users }} onRestore={restoreData} onReset={() => restoreData({})} onInitSample={handleInitSampleData} />
      )}
    </Layout>
  );
};

export default App;
