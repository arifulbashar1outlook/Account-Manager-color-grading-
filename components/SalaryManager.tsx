
import React, { useState, useEffect } from 'react';
import { Plus, ArrowDownCircle, Wallet, ArrowRight, CalendarDays, Tag, Sparkles } from 'lucide-react';
import { Transaction, AccountType, Category, Account } from '../types';

interface SalaryManagerProps {
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  accounts: Account[];
}

const SalaryManager: React.FC<SalaryManagerProps> = ({ onAddTransaction, accounts }) => {
  const [activeTab, setActiveTab] = useState<'salary' | 'received'>('salary');
  
  // Shared Date State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Salary State
  const [salaryAmount, setSalaryAmount] = useState<string>('');
  const [salaryTarget, setSalaryTarget] = useState<string>('');

  // Received Money State
  const [receivedAmount, setReceivedAmount] = useState('');
  const [receivedDesc, setReceivedDesc] = useState('');
  const [receivedCategory, setReceivedCategory] = useState<string>(Category.OTHER);
  const [receivedDestination, setReceivedDestination] = useState<AccountType>('');

  // Ensure accounts are loaded and selection is initialized
  useEffect(() => {
    if (accounts.length > 0) {
      if (!salaryTarget) {
        setSalaryTarget(accounts.find(a => a.id === 'salary')?.id || accounts[0]?.id || '');
      }
      if (!receivedDestination) {
        setReceivedDestination(accounts.find(a => a.id === 'cash')?.id || accounts[0]?.id || '');
      }
    }
  }, [accounts, salaryTarget, receivedDestination]);

  const handleAddSalary = () => {
    if (!salaryAmount || !salaryTarget) return;

    const accName = accounts.find(a => a.id === salaryTarget)?.name || 'Salary Account';

    // Protection against accidental touches
    const confirmMsg = `Are you sure you want to add Tk ${parseFloat(salaryAmount).toLocaleString()} to ${accName}?`;
    if (!window.confirm(confirmMsg)) {
        return;
    }

    onAddTransaction({
      amount: parseFloat(salaryAmount),
      type: 'income',
      category: Category.SALARY,
      description: 'Monthly Salary',
      date: new Date(date).toISOString(), // Ensure ISO string format
      accountId: salaryTarget 
    });

    setSalaryAmount('');
  };

  const handleAddReceivedMoney = () => {
    if (!receivedAmount || !receivedDestination) return;
    onAddTransaction({
      amount: parseFloat(receivedAmount),
      type: 'income',
      category: receivedCategory,
      description: receivedDesc || 'Received Money',
      date: new Date(date).toISOString(), // Ensure ISO string format
      accountId: receivedDestination
    });
    setReceivedAmount('');
    setReceivedDesc('');
    setReceivedCategory(Category.OTHER);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden mb-6 transition-colors duration-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-white/5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('salary')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors min-w-[100px] ${
            activeTab === 'salary' 
              ? 'bg-md-primary/5 text-md-primary border-b-2 border-md-primary' 
              : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Salary
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors min-w-[100px] ${
            activeTab === 'received' 
              ? 'bg-md-primary/5 text-md-primary border-b-2 border-md-primary' 
              : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Receive
        </button>
      </div>

      <div className="p-6">
        {/* --- SALARY TAB --- */}
        {activeTab === 'salary' && (
          <div className="space-y-4">
            <div>
               <label className="block text-[10px] font-black uppercase tracking-widest text-md-primary opacity-60 mb-3">Enter Monthly Salary</label>
               <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/5 rounded-2xl outline-none text-sm font-bold dark:text-white"
                    />
                    <div className="relative flex-[2]">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Tk</span>
                      <input
                          type="number"
                          value={salaryAmount}
                          onChange={(e) => setSalaryAmount(e.target.value)}
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-2xl outline-none text-gray-900 dark:text-white text-lg font-black"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddSalary}
                    disabled={!salaryAmount || !salaryTarget}
                    className="w-full py-4 mesh-gradient-primary text-white rounded-2xl shadow-lg hover:shadow-xl transition-all font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2 border border-white/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    Confirm Salary
                  </button>
               </div>
               <div className="mt-5 flex items-center gap-3 px-1">
                   <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Target Wallet:</label>
                   <select 
                     value={salaryTarget}
                     onChange={(e) => setSalaryTarget(e.target.value)}
                     className="text-[10px] border-none bg-transparent outline-none font-black text-md-primary uppercase tracking-tight"
                   >
                       {accounts.map(a => (
                           <option key={a.id} value={a.id}>{a.name}</option>
                       ))}
                   </select>
               </div>
            </div>
          </div>
        )}

        {/* --- RECEIVED (GENERAL) TAB --- */}
        {activeTab === 'received' && (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-[9px] font-black uppercase tracking-widest text-md-primary opacity-60 mb-2">Date</label>
                   <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-2xl outline-none text-sm font-bold dark:text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-[9px] font-black uppercase tracking-widest text-md-primary opacity-60 mb-2">Amount</label>
                   <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">Tk</span>
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-black/5 dark:bg-white/5 rounded-2xl outline-none text-md-on-surface dark:text-white font-black"
                      />
                   </div>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="block text-[9px] font-black uppercase tracking-widest text-md-primary opacity-60 mb-2">Category</label>
                 <div className="relative">
                    <select
                        value={receivedCategory}
                        onChange={(e) => setReceivedCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-2xl outline-none text-xs font-black uppercase tracking-tight appearance-none dark:text-white"
                    >
                        {Object.values(Category).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                 </div>
               </div>
               <div>
                 <label className="block text-[9px] font-black uppercase tracking-widest text-md-primary opacity-60 mb-2">Deposit To</label>
                 <select
                    value={receivedDestination}
                    onChange={(e) => setReceivedDestination(e.target.value as AccountType)}
                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-2xl outline-none text-xs font-black uppercase tracking-tight dark:text-white"
                  >
                    {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
               </div>
             </div>

             <div>
                 <label className="block text-[9px] font-black uppercase tracking-widest text-md-primary opacity-60 mb-2">Description</label>
                 <input
                    type="text"
                    value={receivedDesc}
                    onChange={(e) => setReceivedDesc(e.target.value)}
                    placeholder="e.g. Gift, Bonus"
                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-2xl outline-none text-sm font-bold dark:text-white"
                  />
             </div>

             <button
              onClick={handleAddReceivedMoney}
              disabled={!receivedAmount || !receivedDestination}
              className="w-full flex items-center justify-center gap-2 mesh-gradient-primary text-white py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 active:scale-[0.98] border border-white/20 mt-2"
            >
              <Sparkles className="w-4 h-4" />
              Receive Money
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryManager;
