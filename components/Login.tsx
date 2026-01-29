
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, User as UserIcon, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // 실제 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = users.find(u => u.id === id && u.password === password);

    if (user) {
      onLogin(user);
    } else {
      setError('아이디 또는 비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-['Pretendard']">
      {/* Left Decoration Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white" size={28} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">nu-ERP</h1>
          </div>
          <h2 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight">
            Smart Enterprise<br />
            Management System
          </h2>
          <p className="text-slate-400 text-lg font-medium leading-relaxed">
            계약 관리부터 AI 기반 재무 분석까지,<br />
            스마트한 기업 운영을 위한 통합 ERP 솔루션입니다.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-indigo-400 font-black text-2xl mb-1 tracking-tighter">100%</div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Data Integrity</div>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-emerald-400 font-black text-2xl mb-1 tracking-tighter">Real-time</div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">AI Insights</div>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Element */}
        <div className="absolute bottom-0 left-0 p-8 opacity-10">
          <div className="text-[12rem] font-black text-white leading-none tracking-tighter select-none">NU</div>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-24 bg-white relative">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center lg:text-left space-y-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h3>
            <p className="text-slate-500 font-medium">인증 정보를 입력하여 시스템에 접속하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <UserIcon size={20} />
                  </div>
                  <input
                    type="text"
                    required
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="아이디를 입력하세요"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Password</label>
                  <button type="button" className="text-[11px] font-bold text-indigo-600 hover:underline">Forgot password?</button>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-2xl flex items-center gap-3 animate-in shake duration-300">
                <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse"></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-10 border-t border-slate-100 text-center">
             <div className="bg-slate-50 p-4 rounded-2xl inline-block">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Demo Credentials</p>
                <code className="text-xs font-bold text-slate-600">ID: admin / PW: password123</code>
             </div>
          </div>
          
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2025 nu-ERP Smart Systems. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
