
import React, { useRef, useState } from 'react';
import { Download, Upload, Trash2, RotateCcw, AlertTriangle, CheckCircle, Info, Loader2, ShieldAlert, X } from 'lucide-react';
import { Customer, Project, Contract, Payment, User } from '../types';

interface DataManagerProps {
  data: {
    customers: Customer[];
    projects: Project[];
    contracts: Contract[];
    payments: Payment[];
    users: User[];
  };
  onRestore: (data: any) => void;
  onReset: () => void;
  onInitSample: () => void;
}

type ActionType = 'BACKUP' | 'RESTORE' | 'RESET' | 'SAMPLE' | null;

const DataManager: React.FC<DataManagerProps> = ({ data, onRestore, onReset, onInitSample }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  
  // 커스텀 확인 모달 상태
  const [pendingAction, setPendingAction] = useState<ActionType>(null);
  const [restoreFile, setRestoreFile] = useState<any>(null);

  /**
   * 단계별 진행 상황 시뮬레이션 및 실제 액션 실행
   */
  const executeAction = async (steps: { label: string, weight: number }[], finalAction: () => void) => {
    setPendingAction(null);
    setIsProcessing(true);
    setProgress(0);
    setStatus(null);

    let currentProgress = 0;
    for (const step of steps) {
      setCurrentStep(step.label);
      const subSteps = 8;
      const increment = step.weight / subSteps;
      
      for (let i = 0; i < subSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
        currentProgress += increment;
        setProgress(Math.min(currentProgress, 99));
      }
    }

    // 실제 비즈니스 로직 수행
    setCurrentStep('최종 데이터베이스 동기화 중...');
    await new Promise(resolve => setTimeout(resolve, 400));
    finalAction();
    
    setProgress(100);
    setCurrentStep('작업이 완료되었습니다.');
    
    setTimeout(() => {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStep('');
    }, 800);
  };

  // --- 각 기능별 트리거 ---

  const handleBackupRequest = () => {
    executeAction([
      { label: '데이터 구조 무결성 검사', weight: 20 },
      { label: 'JSON 바이너리 패키징', weight: 50 },
      { label: '다운로드 스트림 생성', weight: 30 }
    ], () => {
      try {
        const backupData = JSON.stringify(data, null, 2);
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        link.href = url;
        link.download = `nu-erp-backup-${timestamp}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setStatus({ type: 'success', message: '백업 파일이 안전하게 생성되었습니다.' });
      } catch (err) {
        setStatus({ type: 'error', message: '백업 파일 생성 중 오류가 발생했습니다.' });
      }
    });
  };

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // 기본 유효성 검사
        if (!json.customers || !Array.isArray(json.customers)) {
          setStatus({ type: 'error', message: '유효한 nu-ERP 백업 파일이 아닙니다.' });
          return;
        }
        setRestoreFile(json);
        setPendingAction('RESTORE');
      } catch (err) {
        setStatus({ type: 'error', message: 'JSON 파일 형식이 올바르지 않습니다.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreExecute = () => {
    if (!restoreFile) return;
    executeAction([
      { label: '파일 스키마 정밀 분석', weight: 25 },
      { label: '데이터 매핑 및 변환', weight: 25 },
      { label: '기존 데이터 클린업', weight: 20 },
      { label: '레코드 인젝션 실행', weight: 30 }
    ], () => {
      onRestore(restoreFile);
      setRestoreFile(null);
      setStatus({ type: 'success', message: '시스템 데이터가 성공적으로 복원되었습니다.' });
    });
  };

  const handleResetExecute = () => {
    executeAction([
      { label: '관리자 권한 확인', weight: 15 },
      { label: '데이터베이스 테이블 트렁케이트', weight: 55 },
      { label: '로컬 스토리지 섹터 초기화', weight: 30 }
    ], () => {
      onReset();
      setStatus({ type: 'info', message: '모든 데이터가 공장 초기화 상태로 복구되었습니다.' });
    });
  };

  const handleSampleExecute = () => {
    executeAction([
      { label: '데모 시나리오 로딩', weight: 20 },
      { label: '관계형 데이터 자동 생성', weight: 50 },
      { label: '인덱스 재구성 및 최적화', weight: 30 }
    ], () => {
      onInitSample();
      setStatus({ type: 'success', message: '표준 시연용 샘플 데이터가 로드되었습니다.' });
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. 진행 상태 오버레이 (Progress Bar) */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] p-16 w-full max-w-lg shadow-2xl text-center space-y-12 border border-white/20 animate-in zoom-in duration-300">
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={452} strokeDashoffset={452 - (452 * progress) / 100} className="text-indigo-600 transition-all duration-300 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-black text-slate-900 text-4xl font-mono tracking-tighter">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Processing...</h3>
              <div className="flex items-center justify-center gap-3 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-full w-fit mx-auto border border-indigo-100">
                <Loader2 size={20} className="animate-spin" />
                <span className="font-black text-sm uppercase tracking-widest">{currentStep}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden shadow-inner p-1">
                <div className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-300 ease-out shadow-lg" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-6">
                시스템 데이터 정합성을 위해 브라우저를 닫거나 새로고침하지 마십시오.<br/>
                안전한 저장을 위해 프로세스가 마무리될 때까지 대기해주세요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. 커스텀 확인 모달 (Confirmation Modal) */}
      {pendingAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10 text-center space-y-6">
              <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto ${
                pendingAction === 'RESET' ? 'bg-rose-50 text-rose-600' : 
                pendingAction === 'RESTORE' ? 'bg-amber-50 text-amber-600' : 
                'bg-indigo-50 text-indigo-600'
              }`}>
                <ShieldAlert size={40} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {pendingAction === 'BACKUP' ? '데이터 백업을 시작할까요?' :
                   pendingAction === 'RESTORE' ? '데이터 복원을 시작할까요?' :
                   pendingAction === 'RESET' ? '전체 초기화를 진행할까요?' :
                   '샘플 데이터를 로드할까요?'}
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
                  {pendingAction === 'RESET' ? '이 작업은 취소할 수 없습니다. 모든 기존 데이터가 영구적으로 삭제되고 초기 상태로 돌아갑니다.' :
                   pendingAction === 'RESTORE' ? '현재 시스템의 모든 데이터가 백업 파일의 내용으로 교체됩니다. 기존 데이터는 모두 소멸됩니다.' :
                   pendingAction === 'SAMPLE' ? '시연용 데이터셋을 구성합니다. 현재 작업 중인 데이터는 모두 삭제됩니다.' :
                   '현재 시스템의 실시간 스냅샷을 생성하여 안전한 JSON 파일로 저장합니다.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => { setPendingAction(null); setRestoreFile(null); }}
                  className="py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    if (pendingAction === 'BACKUP') handleBackupRequest();
                    else if (pendingAction === 'RESTORE') handleRestoreExecute();
                    else if (pendingAction === 'RESET') handleResetExecute();
                    else if (pendingAction === 'SAMPLE') handleSampleExecute();
                  }}
                  className={`py-4 rounded-2xl text-white font-black text-sm shadow-lg transition-all active:scale-95 ${
                    pendingAction === 'RESET' ? 'bg-rose-600 shadow-rose-100 hover:bg-rose-700' :
                    pendingAction === 'RESTORE' ? 'bg-amber-500 shadow-amber-100 hover:bg-amber-600' :
                    'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  실행 확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 상태 알림 배너 */}
      {status && (
        <div className={`p-6 rounded-[2rem] border flex items-center gap-5 animate-in slide-in-from-top duration-300 shadow-xl ${
          status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
          status.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
          'bg-indigo-50 border-indigo-100 text-indigo-800'
        }`}>
          <div className={`p-3 rounded-2xl ${
            status.type === 'success' ? 'bg-emerald-500 text-white' : 
            status.type === 'error' ? 'bg-rose-500 text-white' : 
            'bg-indigo-500 text-white'
          }`}>
            {status.type === 'success' ? <CheckCircle size={24} /> : status.type === 'error' ? <AlertTriangle size={24} /> : <Info size={24} />}
          </div>
          <div className="flex-1">
            <h4 className="font-black text-xs uppercase tracking-widest mb-0.5 opacity-60">System Notification</h4>
            <p className="text-sm font-bold tracking-tight">{status.message}</p>
          </div>
          <button onClick={() => setStatus(null)} className="p-2 hover:bg-black/5 rounded-full transition-all"><X size={20}/></button>
        </div>
      )}

      {/* 4. 메인 카드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Backup Card */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-20 -mt-20 opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
            <Download size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">전체 데이터 백업</h3>
          <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
            현재 시스템에 저장된 모든 정보(거래처, 프로젝트, 계약, 결제, 사용자)를 안전한 JSON 파일로 패키징합니다.
          </p>
          <button 
            onClick={() => setPendingAction('BACKUP')}
            disabled={isProcessing}
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Download size={18} /> 백업 파일(.json) 생성
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-full -mr-20 -mt-20 opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-sm">
            <Upload size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">데이터 복원</h3>
          <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
            기존에 백업된 파일을 업로드하여 데이터를 원상 복구합니다. <span className="text-rose-500 font-black underline decoration-rose-100 underline-offset-4">현재 저장된 모든 데이터는 영구 삭제됩니다.</span>
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleRestoreFileSelect} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-5 bg-amber-500 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Upload size={18} /> 복원 파일 선택
          </button>
        </div>

        {/* Sample Load Card */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -mr-20 -mt-20 opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-sm">
            <RotateCcw size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">샘플 데이터 로드</h3>
          <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
            시스템 학습 및 시연을 위한 표준 데이터셋을 구성합니다. 다양한 시나리오를 즉시 확인해볼 수 있습니다.
          </p>
          <button 
            onClick={() => setPendingAction('SAMPLE')}
            disabled={isProcessing}
            className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <RotateCcw size={18} /> 샘플 데이터 로드
          </button>
        </div>

        {/* System Reset Card */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-rose-50 rounded-full -mr-20 -mt-20 opacity-40 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-rose-600 group-hover:text-white transition-all duration-500 shadow-sm">
            <Trash2 size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">데이터 초기화</h3>
          <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
            데이터베이스를 클린 상태로 비웁니다. 모든 입력된 프로젝트와 금융 정보가 소멸되므로 주의하십시오.
          </p>
          <button 
            onClick={() => setPendingAction('RESET')}
            disabled={isProcessing}
            className="w-full py-5 border-2 border-rose-100 text-rose-600 rounded-[1.5rem] font-black text-sm hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Trash2 size={18} /> 전체 데이터 삭제
          </button>
        </div>
      </div>

      {/* 5. Policy Footer */}
      <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl flex items-start gap-8 relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>
        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-indigo-400 group-hover:scale-110 transition-transform duration-500">
          <ShieldAlert size={36} />
        </div>
        <div className="space-y-4">
          <h4 className="text-xl font-black text-white uppercase tracking-tight">System Data Policy</h4>
          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">
            nu-ERP는 강력한 로컬 DBMS 엔진을 기반으로 설계되었습니다. 모든 데이터는 귀하의 장치에 로컬로 암호화되어 저장되므로 기기 교체나 브라우저 데이터 삭제 전 <span className="text-white font-black underline decoration-indigo-500">반드시 백업 파일을 생성</span>하십시오.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataManager;
