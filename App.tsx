import React from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import ProjectContractManager from './components/ProjectContractManager';
import UserList from './components/UserList';
import AIBriefing from './components/AIBriefing';
import DataManager from './components/DataManager';
import TodoList from './components/TodoList';
import Login from './components/Login';
import { useAppData } from './hooks/useAppData';

const App: React.FC = () => {
  const {
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
  } = useAppData();

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
      {activeTab === 'users' && currentUser.position === '총괄관리자' && (
        <UserList users={users} onAdd={addUser} onUpdate={updateUser} onDelete={deleteUser} />
      )}
      {activeTab === 'reports' && (
        <AIBriefing customers={customers} projects={projects} contracts={contracts} payments={payments} />
      )}
      {activeTab === 'data-management' && currentUser.position === '총괄관리자' && (
        <DataManager data={{ customers, projects, contracts, payments, users }} onRestore={restoreData} onReset={() => restoreData({})} onInitSample={initSampleData} />
      )}
    </Layout>
  );
};

export default App;
