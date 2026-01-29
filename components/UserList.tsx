
import React, { useState } from 'react';
import { User } from '../types';
import { formatPhoneNumber } from '../utils';
import { Plus, Search, Pencil, Trash2, Eye, EyeOff, AlertCircle, TriangleAlert, Info, UserCog } from 'lucide-react';

interface UserListProps {
  users: User[];
  onAdd: (user: User) => void;
  onUpdate: (user: User) => void;
  onDelete: (id: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onAdd, onUpdate, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const [newUser, setNewUser] = useState<User>({
    id: '',
    password: '',
    name: '',
    position: '',
    phone: '',
    email: '',
    notes: ''
  });

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * 아이디 유효성 검사: 영문으로 시작, 영문/숫자 조합만 허용
   */
  const validateId = (id: string) => /^[a-zA-Z][a-zA-Z0-9]*$/.test(id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setShowErrors(true);

    if (!newUser.id || !newUser.name || !newUser.password) {
      setErrorText('필수 항목(*)을 모두 입력해주세요.');
      return;
    }

    if (!validateId(newUser.id)) {
      setErrorText('아이디는 영문으로 시작해야 하며 영문과 숫자 조합만 가능합니다.');
      return;
    }

    const isDuplicateId = users.some(u => u.id === newUser.id && editingId === null);
    if (isDuplicateId && !editingId) {
      setErrorText('이미 사용 중인 아이디입니다.');
      return;
    }

    if (editingId) {
      onUpdate(newUser);
    } else {
      onAdd(newUser);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewUser({
      id: '',
      password: '',
      name: '',
      position: '',
      phone: '',
      email: '',
      notes: ''
    });
    setEditingId(null);
    setShowErrors(false);
    setErrorText(null);
    setShowPassword(false);
  };

  const handleEdit = (user: User) => {
    setNewUser({ ...user });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  const inputClass = (hasError: boolean) => `
    w-full px-4 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-all font-medium
    ${hasError ? 'border-rose-500 ring-rose-100 focus:ring-rose-500 bg-rose-50/10' : 'border-slate-200 focus:ring-indigo-500'}
  `;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="사용자명 또는 아이디로 검색"
            className="w-full pl-11 pr-4 py-2 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium bg-slate-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          <Plus size={18} />
          사용자 추가
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">아이디</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">성명</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">직위</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">연락처 / 이메일</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold text-sm">
                  등록된 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-indigo-600 font-black">{user.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-black text-slate-800">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-600">
                    {user.position || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-700">{user.phone || '-'}</div>
                    <div className="text-xs text-slate-400 font-medium">{user.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="수정"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(user)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <UserCog size={24} className="text-indigo-600" />
                <h3 className="text-xl font-black text-slate-800">
                  {editingId ? '사용자 정보 수정' : '신규 사용자 등록'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {errorText && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl font-bold flex items-center gap-3">
                  <TriangleAlert size={18} />
                  {errorText}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="아이디" required error={showErrors && (!newUser.id || !validateId(newUser.id))}>
                  <input 
                    required 
                    type="text" 
                    readOnly={!!editingId}
                    className={inputClass(showErrors && (!newUser.id || !validateId(newUser.id))) + (editingId ? ' bg-slate-50 text-slate-400' : '')} 
                    value={newUser.id} 
                    onChange={(e) => setNewUser({...newUser, id: e.target.value})} 
                    placeholder="영문 시작 조합" 
                  />
                </FormField>
                <FormField label="비밀번호" required error={showErrors && !newUser.password}>
                  <div className="relative">
                    <input 
                      required 
                      type={showPassword ? 'text' : 'password'} 
                      className={inputClass(showErrors && !newUser.password) + " pr-12"} 
                      value={newUser.password} 
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                      placeholder="비밀번호 입력" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormField>
                <FormField label="성명" required error={showErrors && !newUser.name}>
                  <input 
                    required 
                    type="text" 
                    className={inputClass(showErrors && !newUser.name)} 
                    value={newUser.name} 
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})} 
                    placeholder="사용자 성명" 
                  />
                </FormField>
                <FormField label="직위">
                  <input 
                    type="text" 
                    className={inputClass(false)} 
                    value={newUser.position} 
                    onChange={(e) => setNewUser({...newUser, position: e.target.value})} 
                    placeholder="예: 과장, 책임연구원" 
                  />
                </FormField>
                <FormField label="연락처">
                  <input 
                    type="text" 
                    className={inputClass(false)} 
                    value={newUser.phone} 
                    onChange={(e) => setNewUser({...newUser, phone: formatPhoneNumber(e.target.value)})} 
                    placeholder="010-0000-0000 / 02-0000-0000" 
                  />
                </FormField>
                <FormField label="이메일">
                  <input 
                    type="email" 
                    className={inputClass(false)} 
                    value={newUser.email} 
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                    placeholder="example@nu.com" 
                  />
                </FormField>
              </div>

              <FormField label="비고">
                <textarea 
                  className={inputClass(false) + " h-24 resize-none"} 
                  value={newUser.notes} 
                  onChange={(e) => setNewUser({...newUser, notes: e.target.value})} 
                  placeholder="특이사항 입력"
                />
              </FormField>

              <div className="pt-6 flex justify-end gap-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm hover:bg-slate-50 transition-colors">취소</button>
                <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all">
                  {editingId ? '수정 완료' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <TriangleAlert size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">사용자를 삭제하시겠습니까?</h3>
              <p className="text-slate-500 text-sm font-bold mb-6">
                아이디 <span className="text-indigo-600 font-black">'{deleteTarget.id}'</span> ({deleteTarget.name}) 사용자가 시스템에서 영구 삭제됩니다.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={() => setDeleteTarget(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm">취소</button>
                <button onClick={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold text-sm">삭제 확인</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fixed: Added optional children to satisfy React 18 type requirements and usage
const FormField = ({ label, required, error, children }: { label: string, required?: boolean, error?: boolean, children?: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
      {label} {required && <span className="text-rose-500 font-black">*</span>}
      {error && <AlertCircle size={14} className="text-rose-500 animate-pulse ml-auto" />}
    </label>
    {children}
  </div>
);

export default UserList;
