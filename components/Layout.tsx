
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FolderKanban, Bot, Settings, UserCog, 
  Database, ClipboardList, DatabaseZap, LogOut, X, Mail, Phone, 
  ShieldCheck, History, ArrowRight, User as UserIcon, Activity as ActivityIcon,
  CircleCheck, Clock, AlertTriangle, Trash2, PlusCircle, Edit3, Eye, EyeOff, Save
} from 'lucide-react';
import { User, Activity } from '../types';
import { formatPhoneNumber } from '../utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  activities: Activity[];
  onUpdateCurrentUser: (updatedUser: User) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser, onLogout, activities, onUpdateCurrentUser }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Edit Form State
  const [editUser, setEditUser] = useState<User>({ ...currentUser });
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (isEditModalOpen) {
      setEditUser({ ...currentUser });
      setErrorText(null);
    }
  }, [isEditModalOpen, currentUser]);

  const menuGroups = [
    {
      items: [
        { id: 'dashboard', label: '종합 대시보드', icon: LayoutDashboard },
        { id: 'reports', label: 'AI 분석', icon: Bot },
      ]
    },
    {
      items: [
        { id: 'projects', label: '프로젝트/계약', icon: FolderKanban },
        { id: 'todo', label: '처리할 일', icon: ClipboardList },
      ]
    },
    {
      items: [
        { id: 'customers', label: '거래처 관리', icon: Users },
        { id: 'users', label: '사용자 관리', icon: UserCog },
      ]
    },
    {
      items: [
        { id: 'data-management', label: '데이터 관리', icon: Database },
      ]
    }
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'CREATE': return <PlusCircle size={14} className="text-emerald-500" />;
      case 'UPDATE': return <Edit3 size={14} className="text-indigo-500" />;
      case 'DELETE': return <Trash2 size={14} className="text-rose-500" />;
      default: return <ActivityIcon size={14} className="text-slate-400" />;
    }
  };

  const handleUpdateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser.name || !editUser.password) {
      setErrorText('성명과 비밀번호는 필수 입력 사항입니다.');
      return;
    }
    onUpdateCurrentUser(editUser);
    setIsEditModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-['Pretendard']">
      <aside className="w-64 bg-slate-900 text-white fixed h-full transition-all flex flex-col z-20">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-indigo-400">
            <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center text-white text-xs shadow-lg shadow-indigo-500/20">NU</div>
            nu-ERP
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Smart Enterprise System</p>
        </div>
        
        <nav className="mt-2 px-3 space-y-4 flex-1 overflow-y-auto scrollbar-hide">
          {menuGroups.map((group, gIndex) => (
            <div key={gIndex} className="space-y-1">
              {gIndex > 0 && <div className="mx-4 my-4 border-t border-slate-800 opacity-50" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      activeTab === item.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 translate-x-1' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 cursor-pointer transition-all group">
            <Settings size={18} className="group-hover:rotate-45 transition-transform" />
            <span className="text-sm font-bold">환경 설정</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-4 lg:p-6 min-h-screen flex flex-col relative">
        <header className="flex justify-between items-center mb-6 bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-white sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {menuGroups.flatMap(g => g.items).find(m => m.id === activeTab)?.label}
              </h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-tighter">Real-time Data Synchronized</p>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg ml-4">
              <DatabaseZap size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">DBMS CONNECTED</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full shadow-inner">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live System</span>
            </div>
            
            <div className="flex items-center gap-4 border-l pl-6 border-slate-100">
              <div className="text-right">
                <span className="block text-sm font-black text-slate-800 leading-none">{currentUser.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{currentUser.position || 'Staff'}</span>
              </div>
              <div className="relative group" onClick={() => setIsProfileOpen(true)}>
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} 
                  className="w-10 h-10 rounded-2xl border-2 border-white shadow-md cursor-pointer transition-transform group-hover:scale-105 active:scale-95" 
                  alt="avatar" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </div>
      </main>

      {/* User Profile & Activity Drawer */}
      {isProfileOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-all animate-in fade-in duration-300" onClick={() => setIsProfileOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-500 ease-out">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <UserIcon size={20} className="text-indigo-600" />
                사용자 프로필
              </h3>
              <button onClick={() => setIsProfileOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-8 text-center bg-gradient-to-b from-slate-50 to-white">
                <div className="relative w-28 h-28 mx-auto mb-6">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} 
                    className="w-full h-full rounded-[2.5rem] border-4 border-white shadow-xl" 
                    alt="profile large" 
                  />
                  <div className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-2xl border-4 border-white shadow-lg">
                    <ShieldCheck size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{currentUser.name}</h2>
                <p className="text-indigo-600 text-xs font-black uppercase tracking-[0.2em] mt-1">{currentUser.position || 'Staff'}</p>
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</span>
                    <p className="text-xs font-bold text-slate-700 truncate">{currentUser.email || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</span>
                    <p className="text-xs font-bold text-slate-700">{currentUser.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                  <History size={18} className="text-slate-400" />
                  Recent Activity History
                </h4>
                
                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                  {activities.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock size={32} className="mx-auto text-slate-200 mb-3" />
                      <p className="text-slate-400 text-xs font-bold">이번 세션에 기록된 활동이 없습니다.</p>
                    </div>
                  ) : (
                    activities.slice().reverse().map((activity) => (
                      <div key={activity.id} className="relative pl-10 group">
                        <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 shadow-sm group-hover:border-indigo-500 transition-colors">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-black text-slate-900">{activity.targetName}</span> 
                            <span className="text-slate-500 mx-1">{activity.description}</span>
                          </p>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span>{activity.timestamp}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                            <span className="text-indigo-500">{activity.category}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 space-y-3">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <UserCog size={18} /> 계정 정보 수정
              </button>
              <button 
                onClick={() => { setIsProfileOpen(false); onLogout(); }}
                className="w-full py-3 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut size={18} /> 로그아웃
              </button>
            </div>
          </div>
        </>
      )}

      {/* Account Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <UserCog size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">계정 설정</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Your Personal Profile</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateAccount} className="p-8 space-y-6">
              {errorText && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-3">
                  <AlertTriangle size={18} />
                  {errorText}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">사용자 ID (수정불가)</label>
                  <div className="relative group">
                    <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text" 
                      readOnly 
                      value={editUser.id}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-mono text-sm outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">비밀번호</label>
                  <div className="relative group">
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 z-10"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={editUser.password}
                      onChange={(e) => setEditUser({...editUser, password: e.target.value})}
                      className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">성명</label>
                  <input 
                    type="text" 
                    required
                    value={editUser.name}
                    onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">직위</label>
                  <input 
                    type="text" 
                    value={editUser.position}
                    onChange={(e) => setEditUser({...editUser, position: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                    placeholder="예: 과장, 책임연구원"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">연락처</label>
                  <div className="relative group">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={editUser.phone}
                      onChange={(e) => setEditUser({...editUser, phone: formatPhoneNumber(e.target.value)})}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">이메일</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="email" 
                      value={editUser.email}
                      onChange={(e) => setEditUser({...editUser, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all"
                      placeholder="example@nu.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">개인 메모 (비고)</label>
                <textarea 
                  value={editUser.notes}
                  onChange={(e) => setEditUser({...editUser, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                  placeholder="참고사항 입력"
                />
              </div>

              <div className="pt-6 grid grid-cols-2 gap-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-4 border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all active:scale-95"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Save size={18} /> 설정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
