
import { useState, useCallback, useEffect } from 'react';
import { Customer, Project, Contract, Payment, User, Activity } from '../types';
import { apiService } from '../services/apiService';
import { SAMPLE_CUSTOMERS, SAMPLE_PROJECTS, SAMPLE_CONTRACTS, SAMPLE_PAYMENTS, SAMPLE_USERS } from '../data/sampleData';
import { calculateContractMetrics, sortPayments, calculatePaymentStatus } from '../utils';

export const useAppData = () => {
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

    // --- Helper Functions ---

    const logActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
        const newActivity: Activity = {
            ...activity,
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        };
        setActivities(prev => [...prev, newActivity].slice(-20));
    }, []);

    const sync = async (fn: () => void, asyncFn: () => Promise<void>) => {
        setIsSyncing(true);
        fn();
        try {
            await asyncFn();
        } catch (err) {
            console.error("Sync failed:", err);
            alert("데이터 동기화에 실패했습니다.");
        } finally {
            setIsSyncing(false);
        }
    };

    // --- Initialization ---

    useEffect(() => {
        const initApp = async () => {
            try {
                const data = await apiService.fetchAllData();
                setCustomers(data.customers);
                setProjects(data.projects);
                setContracts(data.contracts);
                setPayments(data.payments);

                if (data.users.length === 0) {
                    setUsers(SAMPLE_USERS);
                    await apiService.saveUsers(SAMPLE_USERS);
                } else {
                    setUsers(data.users);
                }
            } catch (err) {
                console.error("Failed to load data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        initApp();
    }, []);

    // --- Auth Handlers ---

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

    const updateCurrentUser = (updated: User) => {
        const nextUsers = users.map(u => u.id === updated.id ? updated : u);
        sync(
            () => {
                setCurrentUser(updated);
                setUsers(nextUsers);
                localStorage.setItem('nu_erp_session', JSON.stringify(updated));
            },
            () => apiService.updateUser(updated)
        );
        logActivity({ type: 'UPDATE', category: 'USER', targetName: updated.name, description: '본인의 계정 정보를 수정했습니다.' });
    };

    // --- Customer Handlers ---

    const addCustomer = (customer: Customer) => {
        const next = [...customers, customer];
        sync(() => setCustomers(next), () => apiService.createCustomer(customer));
        logActivity({ type: 'CREATE', category: 'CUSTOMER', targetName: customer.name, description: '새 거래처를 등록했습니다.' });
    };

    const updateCustomer = (updated: Customer) => {
        const next = customers.map(c => c.id === updated.id ? updated : c);
        sync(() => setCustomers(next), () => apiService.updateCustomer(updated));
        logActivity({ type: 'UPDATE', category: 'CUSTOMER', targetName: updated.name, description: '거래처 정보를 수정했습니다.' });
    };

    const deleteCustomer = (id: string) => {
        const target = customers.find(c => c.id === id);
        const nextCust = customers.filter(c => c.id !== id);

        // Cascade delete simulation for local state
        const customerProjects = projects.filter(p => p.customerId === id).map(p => p.id);
        const nextProj = projects.filter(p => !customerProjects.includes(p.id));
        const targetContracts = contracts.filter(c => customerProjects.includes(c.projectId)).map(c => c.id);
        const nextCont = contracts.filter(c => !targetContracts.includes(c.id));
        const nextPay = payments.filter(p => !targetContracts.includes(p.contractId));

        sync(
            () => {
                setCustomers(nextCust);
                setProjects(nextProj);
                setContracts(nextCont);
                setPayments(nextPay);
            },
            () => apiService.deleteCustomer(id) // DB cascade handles the rest hopefully, or we might need to be explicit if not set up
        );

        if (target) logActivity({ type: 'DELETE', category: 'CUSTOMER', targetName: target.name, description: '거래처 및 관련 데이터를 삭제했습니다.' });
    };

    // --- Project Handlers ---

    const addProject = (project: Project) => {
        const next = [...projects, project];
        sync(() => setProjects(next), () => apiService.createProject(project));
        logActivity({ type: 'CREATE', category: 'PROJECT', targetName: project.name, description: '새 프로젝트를 생성했습니다.' });
    };

    const updateProject = (project: Project) => {
        const next = projects.map(p => p.id === project.id ? project : p);
        sync(() => setProjects(next), () => apiService.updateProject(project));
        logActivity({ type: 'UPDATE', category: 'PROJECT', targetName: project.name, description: '프로젝트 설정을 변경했습니다.' });
    };

    const deleteProject = (id: string) => {
        const target = projects.find(p => p.id === id);
        const nextProj = projects.filter(p => p.id !== id);
        // Cascade
        const targetContracts = contracts.filter(c => c.projectId === id).map(c => c.id);
        const nextCont = contracts.filter(c => c.projectId !== id);
        const nextPay = payments.filter(p => !targetContracts.includes(p.contractId));

        sync(
            () => {
                setProjects(nextProj);
                setContracts(nextCont);
                setPayments(nextPay);
            },
            () => apiService.deleteProject(id)
        );
        if (target) logActivity({ type: 'DELETE', category: 'PROJECT', targetName: target.name, description: '프로젝트를 삭제했습니다.' });
    };

    // --- Contract Handlers ---

    const addContract = (contract: Contract) => {
        const next = [...contracts, contract];
        sync(() => setContracts(next), () => apiService.createContract(contract));
        logActivity({ type: 'CREATE', category: 'CONTRACT', targetName: contract.name, description: '신규 계약을 체결했습니다.' });
    };

    const updateContract = (contract: Contract) => {
        const contractPayments = payments.filter(p => p.contractId === contract.id);
        const metrics = calculateContractMetrics(contract, contractPayments);
        // Be careful not to include extraneous fields, calculateContractMetrics already fixed to not include updatedPayments
        const updated = { ...contract, ...metrics };

        // metrics contains 'status' which is fine
        const next = contracts.map(c => c.id === contract.id ? updated : c);

        sync(() => setContracts(next), () => apiService.updateContract(updated));
        logActivity({ type: 'UPDATE', category: 'CONTRACT', targetName: contract.name, description: '계약 조건을 변경했습니다.' });
    };

    const deleteContract = (id: string) => {
        const target = contracts.find(c => c.id === id);
        const nextCont = contracts.filter(c => c.id !== id);
        const nextPay = payments.filter(p => p.contractId !== id);

        sync(
            () => {
                setContracts(nextCont);
                setPayments(nextPay);
            },
            () => apiService.deleteContract(id)
        );
        if (target) logActivity({ type: 'DELETE', category: 'CONTRACT', targetName: target.name, description: '계약을 파기했습니다.' });
    };

    // --- Payment Handlers ---

    const addPayment = (payment: Payment) => {
        const nextPay = [...payments, payment];

        // Update contract metrics
        const contract = contracts.find(c => c.id === payment.contractId);
        let updatedContract: Contract | null = null;

        if (contract) {
            // Filter payments from nextPay (state)
            const relatedPayments = nextPay.filter(p => p.contractId === contract.id);
            const metrics = calculateContractMetrics(contract, relatedPayments);
            updatedContract = { ...contract, ...metrics };
        }

        const nextCont = updatedContract
            ? contracts.map(c => c.id === updatedContract!.id ? updatedContract! : c)
            : contracts;

        sync(
            () => {
                setPayments(nextPay);
                setContracts(nextCont);
            },
            async () => {
                await apiService.createPayment(payment);
                if (updatedContract) await apiService.updateContract(updatedContract);
            }
        );
        logActivity({ type: 'CREATE', category: 'PAYMENT', targetName: payment.item, description: '결제 마일스톤을 추가했습니다.' });
    };

    const updatePayment = (updated: Payment) => {
        // Logic from App.tsx...
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

        const paymentsToUpdate: Payment[] = [];

        if (isReverting) {
            // Need to revert subsequent payments too
            for (let i = currentIndex; i < contractPayments.length; i++) {
                const targetId = contractPayments[i].id;
                const pIdx = nextPayments.findIndex(p => p.id === targetId);
                if (pIdx > -1) {
                    if (targetId === updated.id) {
                        nextPayments[pIdx] = updated;
                        paymentsToUpdate.push(updated);
                    } else {
                        const reverted = {
                            ...nextPayments[pIdx],
                            completionDate: undefined,
                            invoiceDate: undefined,
                            status: calculatePaymentStatus({ ...nextPayments[pIdx], completionDate: undefined, invoiceDate: undefined })
                        };
                        nextPayments[pIdx] = reverted;
                        paymentsToUpdate.push(reverted);
                    }
                }
            }
        } else {
            nextPayments = nextPayments.map(p => p.id === updated.id ? updated : p);
            paymentsToUpdate.push(updated);
        }

        // Update contract metrics
        const contract = contracts.find(c => c.id === updated.contractId);
        let updatedContract: Contract | null = null;
        if (contract) {
            const metrics = calculateContractMetrics(contract, nextPayments.filter(p => p.contractId === contract.id));
            updatedContract = { ...contract, ...metrics };
        }
        const nextCont = updatedContract
            ? contracts.map(c => c.id === updatedContract!.id ? updatedContract! : c)
            : contracts;

        sync(
            () => {
                setPayments(nextPayments);
                setContracts(nextCont);
            },
            async () => {
                // Optimize: verify if granular update is feasible for multiple items
                for (const p of paymentsToUpdate) {
                    await apiService.updatePayment(p);
                }
                if (updatedContract) await apiService.updateContract(updatedContract);
            }
        );
        logActivity({ type: 'UPDATE', category: 'PAYMENT', targetName: updated.item, description: `결제 상태를 [${updated.status}]로 업데이트했습니다.` });
    };

    const deletePayment = (paymentId: string, contractId: string) => {
        const target = payments.find(p => p.id === paymentId);
        const nextPay = payments.filter(p => p.id !== paymentId);

        const contract = contracts.find(c => c.id === contractId);
        let updatedContract: Contract | null = null;
        if (contract) {
            const metrics = calculateContractMetrics(contract, nextPay.filter(p => p.contractId === contractId));
            updatedContract = { ...contract, ...metrics };
        }
        const nextCont = updatedContract
            ? contracts.map(c => c.id === updatedContract!.id ? updatedContract! : c)
            : contracts;

        sync(
            () => {
                setPayments(nextPay);
                setContracts(nextCont);
            },
            async () => {
                await apiService.deletePayment(paymentId);
                if (updatedContract) await apiService.updateContract(updatedContract);
            }
        );
        if (target) logActivity({ type: 'DELETE', category: 'PAYMENT', targetName: target.item, description: '결제 내역을 삭제했습니다.' });
    };

    // --- User Handlers ---

    const addUser = (user: User) => {
        const next = [...users, user];
        sync(() => setUsers(next), () => apiService.createUser(user));
        logActivity({ type: 'CREATE', category: 'USER', targetName: user.name, description: '신규 사용자를 등록했습니다.' });
    };

    const updateUser = (user: User) => {
        const next = users.map(u => u.id === user.id ? user : u);
        sync(() => setUsers(next), () => apiService.updateUser(user));
        logActivity({ type: 'UPDATE', category: 'USER', targetName: user.name, description: '사용자 정보를 수정했습니다.' });
    };

    const deleteUser = (id: string) => {
        const target = users.find(u => u.id === id);
        const next = users.filter(u => u.id !== id);
        sync(() => setUsers(next), () => apiService.deleteUser(id));
        if (target) logActivity({ type: 'DELETE', category: 'USER', targetName: target.name, description: '사용자 권한을 회수했습니다.' });
    };

    // --- Bulk Management ---
    const restoreData = async (data: any) => {
        setIsSyncing(true);
        // Update local state
        setCustomers(data.customers || []);
        setProjects(data.projects || []);
        setContracts(data.contracts || []);
        setPayments(data.payments || []);
        setUsers(data.users || []);

        try {
            await apiService.saveUsers(data.users || []);
            await apiService.saveCustomers(data.customers || []);
            await apiService.saveProjects(data.projects || []);

            // Contract cleaning logic preserved from App.tsx
            const validProjects = data.projects || [];
            const projectIds = validProjects.map((p: Project) => String(p.id));
            const validContracts = (data.contracts || []).filter((c: Contract) => projectIds.includes(String(c.projectId)));

            // Remove updatedPayments if present in restore data
            const sanitizedContracts = validContracts.map((c: any) => {
                const { updatedPayments, ...rest } = c;
                return rest;
            });

            await apiService.saveContracts(sanitizedContracts);

            const contractIds = validContracts.map((c: Contract) => String(c.id));
            const validPayments = (data.payments || []).filter((p: Payment) => contractIds.includes(String(p.contractId)));

            await apiService.savePayments(validPayments);

            logActivity({ type: 'SYSTEM', category: 'USER', targetName: 'Database', description: '데이터를 복원했습니다.' });
        } catch (err: any) {
            console.error("Restore failed:", err);
            alert(`데이터 복원 실패: ${err.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const initSampleData = async () => {
        setIsSyncing(true);
        setCustomers(SAMPLE_CUSTOMERS);
        setProjects(SAMPLE_PROJECTS);
        setContracts(SAMPLE_CONTRACTS);
        setPayments(SAMPLE_PAYMENTS);
        setUsers(SAMPLE_USERS);

        try {
            await Promise.all([
                apiService.saveCustomers(SAMPLE_CUSTOMERS),
                apiService.saveProjects(SAMPLE_PROJECTS),
                apiService.saveContracts(SAMPLE_CONTRACTS),
                apiService.savePayments(SAMPLE_PAYMENTS),
                apiService.saveUsers(SAMPLE_USERS)
            ]);
            logActivity({ type: 'SYSTEM', category: 'USER', targetName: 'Sample Data', description: '표준 데이터를 로드했습니다.' });
            setActiveTab('dashboard');
        } catch (err) {
            console.error("Sample init failed:", err);
        } finally {
            setIsSyncing(false);
        }
    };


    return {
        activeTab, setActiveTab,
        isLoading, isSyncing,
        currentUser,
        activities,
        customers, projects, contracts, payments, users,
        handleLogin, handleLogout, updateCurrentUser,
        addCustomer, updateCustomer, deleteCustomer,
        addProject, updateProject, deleteProject,
        addContract, updateContract, deleteContract,
        addPayment, updatePayment, deletePayment,
        addUser, updateUser, deleteUser,
        restoreData, initSampleData
    };
};
