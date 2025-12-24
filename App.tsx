
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Menu, 
  CreditCard, 
  HandCoins,
  LayoutDashboard,
  X as XIcon,
  PlusCircle,
  RotateCw,
  CloudUpload,
  CloudDownload,
  Activity,
  Wallet as WalletIcon,
  FileSpreadsheet,
  Target,
  Sparkles,
  Zap,
  ArrowRight,
  PieChart,
  Bot,
  Sun,
  Moon,
  CalendarDays,
  History as HistoryIcon,
  Settings,
  User,
  ExternalLink,
  ChevronRight,
  Coffee,
  ShieldCheck
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Transaction, Account, Category } from './types';
import { 
  getStoredTransactions, saveStoredTransactions, 
  getStoredAccounts, saveStoredAccounts,
  getStoredBazarTemplates, saveStoredBazarTemplates,
  getStoredToBuyList, saveStoredToBuyList
} from './services/storage';
import { pushToSheets, pullFromSheets } from './services/syncService';
import TransactionForm from './components/TransactionForm';
import SummaryCard from './components/SummaryCard';
import BottomNavigation from './components/BottomNavigation';
import SalaryManager from './components/SalaryManager';
import SyncView from './components/SyncView';
import AccountsView from './components/AccountsView';
import LendingView from './components/LendingView';
import BazarView from './components/BazarView';
import HistoryView from './components/HistoryView';
import FullMonthlyReport from './components/FullMonthlyReport';
import AiView from './components/AiView';

const useKeyboardVisibility = () => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        setKeyboardVisible(viewport.height < window.innerHeight * 0.85);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return isKeyboardVisible;
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => getStoredTransactions());
  const [accounts, setAccounts] = useState<Account[]>(() => getStoredAccounts());
  const [bazarTemplates, setBazarTemplates] = useState<string[]>(() => getStoredBazarTemplates());
  const [toBuyList, setToBuyList] = useState<string[]>(() => getStoredToBuyList());
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'error' | 'none'>('none');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  const isKeyboardVisible = useKeyboardVisibility();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSyncPull = useCallback(async (silent = false) => {
    if (!navigator.onLine) {
        if (!silent) alert("Device is offline.");
        return;
    }
    if (!silent) setSyncStatus('syncing');
    const cloudData = await pullFromSheets();
    if (cloudData) {
      setTransactions(cloudData.transactions);
      saveStoredTransactions(cloudData.transactions);
      setAccounts(cloudData.accounts);
      saveStoredAccounts(cloudData.accounts);
      setBazarTemplates(cloudData.templates);
      saveStoredBazarTemplates(cloudData.templates);
      setToBuyList(cloudData.toBuyList);
      saveStoredToBuyList(cloudData.toBuyList);
      setSyncStatus('synced');
    } else if (!silent) {
      setSyncStatus('error');
    }
  }, []);

  const triggerAutoPush = useCallback(async (overrides?: { txs?: Transaction[], accs?: Account[], tmpl?: string[], buy?: string[] }) => {
    if (!navigator.onLine) {
        setSyncStatus('pending');
        return;
    }
    setSyncStatus('syncing');
    const success = await pushToSheets(
      overrides?.txs || transactions, 
      overrides?.accs || accounts, 
      overrides?.tmpl || bazarTemplates, 
      overrides?.buy || toBuyList
    );
    setSyncStatus(success ? 'synced' : 'error');
  }, [transactions, accounts, bazarTemplates, toBuyList]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); triggerAutoPush(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { 
        window.removeEventListener('online', handleOnline); 
        window.removeEventListener('offline', handleOffline); 
    };
  }, [triggerAutoPush]);

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx = {...t, id: uuidv4()};
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveStoredTransactions(updated);
    triggerAutoPush({ txs: updated });
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const updated = transactions.map(t => t.id === updatedTx.id ? updatedTx : t);
    setTransactions(updated);
    saveStoredTransactions(updated);
    triggerAutoPush({ txs: updated });
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveStoredTransactions(updated);
    triggerAutoPush({ txs: updated });
  };

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toISOString().split('T')[0];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const filteredMonth = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === currentMonth && td.getFullYear() === currentYear;
    });
    
    const filteredYear = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getFullYear() === currentYear;
    });

    const todayExp = transactions
      .filter(t => t.date.split('T')[0] === todayStr && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    
    const inc = filteredMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = filteredMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const yearExp = filteredYear.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    
    const dailyAvg = exp / (now.getDate() || 1);
    const projectedExp = dailyAvg * daysInMonth;
    const healthScore = Math.min(100, Math.max(0, inc > 0 ? ((inc - exp) / inc) * 100 : 0));

    const catTotals: Record<string, number> = {};
    filteredMonth.filter(t => t.type === 'expense').forEach(t => {
       catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
    });
    const topCategories = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { inc, exp, todayExp, yearExp, bal: inc - exp, dailyAvg, projectedExp, healthScore, topCategories };
  }, [transactions]);

  const accountBalances = useMemo(() => {
    const b: Record<string, number> = {};
    accounts.forEach(a => b[a.id] = 0);
    transactions.forEach(t => {
      if (t.type === 'income') b[t.accountId] = (b[t.accountId] || 0) + t.amount;
      else if (t.type === 'expense') b[t.accountId] = (b[t.accountId] || 0) - t.amount;
      else if (t.type === 'transfer') {
        b[t.accountId] = (b[t.accountId] || 0) - t.amount;
        if (t.targetAccountId) b[t.targetAccountId] = (b[t.targetAccountId] || 0) + t.amount;
      }
    });
    return b;
  }, [transactions, accounts]);

  return (
    <div className="min-h-screen bg-md-surface dark:bg-zinc-950 pb-32 transition-colors">
      <header className="sticky top-0 z-50 mesh-gradient-primary px-4 pt-safe flex items-center justify-between shadow-lg h-[96px] border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-2xl text-white shadow-md border border-white/20"><LayoutDashboard size={24} /></div>
            <div>
              <h1 className="text-[18px] font-extrabold text-white">Account Manager</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></div>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Premium Active</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="p-3.5 rounded-full bg-white/10 text-white border border-white/20 shadow-sm active:scale-90 transition-all"><Menu size={24}/></button>
      </header>

      <main className="max-w-md mx-auto">
        {activeTab === 'dashboard' && (
          <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Wallets Moved to Top */}
            <div className="space-y-4">
               <h3 className="font-bold text-[11px] uppercase tracking-widest opacity-40 px-1 dark:text-white">Active Wallets</h3>
               <div className="grid gap-3">
                 {accounts.map(acc => (
                   <div key={acc.id} className="glass p-6 rounded-[32px] flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-9 rounded-full" style={{ backgroundColor: acc.color }}></div>
                        <p className="font-extrabold text-lg" style={{ color: acc.color }}>{acc.name}</p>
                      </div>
                      <p className="font-black text-sm" style={{ color: acc.color }}>Tk {accountBalances[acc.id]?.toLocaleString()}</p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Main Balance Card */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden border border-gray-50 dark:border-white/5">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-md-on-surface-variant opacity-60">Monthly Balance</p>
                    <div className="px-4 py-1.5 bg-luxe-sand rounded-full text-[10px] font-bold text-luxe-bronze-text">Health: {summary.healthScore.toFixed(0)}%</div>
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 mb-8">
                    <h2 className="text-5xl font-black text-gold-gradient tracking-tighter">
                      <span className="text-3xl font-extrabold mr-1">Tk</span>
                      {summary.bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>

                  <div className="h-[1px] w-full bg-md-primary/20 dark:bg-white/10 mb-6"></div>

                  <div className="grid grid-cols-2">
                     <div>
                        <p className="text-[10px] font-bold text-md-on-surface-variant/50 uppercase tracking-widest mb-1">Daily Burn</p>
                        <p className="text-xl font-black text-gold-gradient">Tk {summary.dailyAvg.toFixed(0)}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-bold text-md-on-surface-variant/50 uppercase tracking-widest mb-1">Est. Total</p>
                        <p className="text-xl font-black text-gold-gradient">Tk {summary.projectedExp.toFixed(0)}</p>
                     </div>
                  </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <SummaryCard title="Today" amount={summary.todayExp} icon={CalendarDays} colorClass="text-luxe-outflow" bgClass="bg-luxe-outflow" />
               <SummaryCard title="Yearly Out" amount={summary.yearExp} icon={HistoryIcon} colorClass="text-md-primary" bgClass="bg-md-primary" />
               <SummaryCard title="Inflow" amount={summary.inc} icon={TrendingUp} colorClass="text-luxe-inflow" bgClass="bg-luxe-inflow" />
               <SummaryCard title="Outflow" amount={summary.exp} icon={TrendingDown} colorClass="text-luxe-outflow" bgClass="bg-luxe-outflow" />
            </div>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="p-4 space-y-6 pb-32 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 pt-4 pb-2">
              <PlusCircle className="text-md-primary" size={24} />
              <h2 className="text-3xl font-black tracking-tight text-md-on-surface dark:text-white">New Entry</h2>
            </div>
            <SalaryManager onAddTransaction={(t) => { handleAddTransaction(t); setActiveTab('dashboard'); }} accounts={accounts} />
            <TransactionForm onAddTransaction={(t) => { handleAddTransaction(t); setActiveTab('dashboard'); }} accounts={accounts} />
          </div>
        )}

        {activeTab === 'bazar' && <BazarView transactions={transactions} accounts={accounts} templates={bazarTemplates} setTemplates={setBazarTemplates} toBuyList={toBuyList} setToBuyList={setToBuyList} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />}
        {activeTab === 'full-report' && <FullMonthlyReport transactions={transactions} accounts={accounts} />}
        {activeTab === 'history' && <HistoryView transactions={transactions} accounts={accounts} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />}
        
        {activeTab === 'lending' && <LendingView transactions={transactions} accounts={accounts} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} />}
        {activeTab === 'wallet-manager' && <AccountsView accounts={accounts} onUpdateAccounts={accs => { if(typeof accs === 'function') { setAccounts(prev => { const res = accs(prev); triggerAutoPush({ accs: res }); return res; }); } else { setAccounts(accs); triggerAutoPush({ accs }); } }} onBack={() => setActiveTab('dashboard')} />}
        {activeTab === 'sync-setup' && <SyncView onBack={() => setActiveTab('dashboard')} onPullData={handleSyncPull} />}
        {activeTab === 'ai-setup' && <AiView onBack={() => setActiveTab('dashboard')} />}
      </main>

      {!isKeyboardVisible && activeTab === 'dashboard' && <button onClick={() => setActiveTab('input')} className="fixed bottom-[100px] right-6 w-16 h-16 bg-md-primary text-white rounded-[24px] shadow-2xl flex items-center justify-center z-40 border border-white/20 transition-transform active:scale-90 shadow-[0_8px_30px_rgba(197,160,40,0.4)]"><Plus size={32} strokeWidth={3} /></button>}

      {/* Cozy side menu enhancement */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm animate-in fade-in duration-400" onClick={() => setIsMenuOpen(false)}>
           <div className="absolute right-0 top-0 bottom-0 w-[310px] bg-luxe-sand/98 dark:bg-zinc-950/98 backdrop-blur-3xl p-6 pt-safe animate-in slide-in-from-right duration-500 rounded-l-[48px] shadow-[-20px_0_60px_rgba(0,0,0,0.2)] flex flex-col" onClick={e => e.stopPropagation()}>
              
              {/* Refined Header Section */}
              <div className="flex items-center justify-between mb-10 px-2 py-4">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <div className="w-16 h-16 rounded-[24px] mesh-gradient-primary flex items-center justify-center text-white shadow-xl border-2 border-white/40 transform -rotate-3 transition-all hover:rotate-0 hover:scale-105 active:scale-95">
                         <User size={32} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-luxe-sand dark:border-zinc-950 shadow-sm flex items-center justify-center">
                         <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                   </div>
                   <div>
                      <h3 className="font-black text-xl dark:text-white leading-tight">Welcome!</h3>
                      <p className="text-[10px] font-black text-md-primary uppercase tracking-[0.25em] opacity-50 mt-1">Personal Hub</p>
                   </div>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-3.5 bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-2xl transition-all active:scale-90 border border-black/5 dark:border-white/10 shadow-sm"><XIcon size={20} className="dark:text-white opacity-60"/></button>
              </div>

              {/* Menu Content Grouped Elegantly */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-9 pr-1">
                
                {/* Visual Settings Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 ml-4">
                     <Sun size={12} className="text-md-primary opacity-40" />
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-md-on-surface-variant/40">Visual Experience</p>
                  </div>
                  <MenuBtn onClick={() => setDarkMode(!darkMode)} icon={darkMode ? Sun : Moon} label={darkMode ? "Switch to Light" : "Switch to Dark"} description="Gentle on your eyes" />
                </div>

                {/* Account Actions Section */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 ml-4">
                     <WalletIcon size={12} className="text-md-primary opacity-40" />
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-md-on-surface-variant/40">Vault & Cloud</p>
                  </div>
                  <div className="grid gap-2.5">
                    <MenuBtn onClick={() => { triggerAutoPush(); setIsMenuOpen(false); }} icon={CloudUpload} label="Sync: Push" description="Backup to your sheet" color="text-emerald-500" />
                    <MenuBtn onClick={() => { handleSyncPull(); setIsMenuOpen(false); }} icon={CloudDownload} label="Sync: Pull" description="Restore latest data" color="text-amber-500" />
                    <MenuBtn onClick={() => { setActiveTab('sync-setup'); setIsMenuOpen(false); }} icon={FileSpreadsheet} label="Cloud Settings" description="Setup sync URL" />
                    <MenuBtn onClick={() => { setActiveTab('wallet-manager'); setIsMenuOpen(false); }} icon={CreditCard} label="Wallet Manager" description="Manage your accounts" />
                  </div>
                </div>

                {/* Intelligence & Extras */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 ml-4">
                     <Bot size={12} className="text-md-primary opacity-40" />
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] text-md-on-surface-variant/40">Smart Tools</p>
                  </div>
                  <div className="grid gap-2.5">
                    <MenuBtn onClick={() => { setActiveTab('lending'); setIsMenuOpen(false); }} icon={HandCoins} label="Lending & Debt" description="Track who owes who" />
                    <MenuBtn onClick={() => { setActiveTab('ai-setup'); setIsMenuOpen(false); }} icon={Sparkles} label="AI Intelligence" description="Manage Gemini insights" />
                  </div>
                </div>
              </div>

              {/* Menu Footer Cozy Signature */}
              <div className="mt-auto pt-8 border-t border-black/5 dark:border-white/10">
                 <div className="flex flex-col items-center gap-4 opacity-30">
                    <div className="flex items-center gap-3">
                       <Coffee size={14} className="text-md-primary" />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em]">Crafted for Finance</span>
                    </div>
                    <div className="flex items-center justify-between w-full px-4 text-[8px] font-bold uppercase tracking-widest">
                       <span>v2.6.5 Build</span>
                       <div className="flex items-center gap-1">
                          <span>Secure</span>
                          {/* Corrected: Added ShieldCheck to lucide-react imports */}
                          <ShieldCheck size={10} />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      {!isKeyboardVisible && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
};

// Enhanced Cozy Button Component
const MenuBtn = ({ onClick, icon: Icon, label, description, color }: any) => (
  <button 
    onClick={onClick} 
    className="w-full flex items-center gap-4 py-4 px-5 rounded-[30px] bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-left transition-all active:scale-[0.97] border border-black/5 dark:border-white/5 shadow-sm group"
  >
     <div className={`p-3.5 bg-md-primary/10 dark:bg-white/5 rounded-[20px] ${color || 'text-md-primary'} group-hover:scale-110 group-hover:bg-md-primary group-hover:text-white transition-all shadow-inner`}>
        <Icon size={20} strokeWidth={2.5} />
     </div>
     <div className="flex-1">
        <span className="block text-[13px] font-black dark:text-white group-hover:translate-x-1 transition-transform tracking-tight">{label}</span>
        {description && <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:translate-x-1 transition-transform opacity-70">{description}</span>}
     </div>
     <ChevronRight size={16} className="text-gray-300 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
  </button>
);

export default App;
