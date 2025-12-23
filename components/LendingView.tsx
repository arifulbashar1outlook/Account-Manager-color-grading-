
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ChevronRight, 
  X, 
  Edit2, 
  AlertTriangle, 
  HandCoins, 
  Clock, 
  ArrowUpCircle, 
  ArrowDownCircle,
  ChevronDown,
  Calendar,
  UserPlus,
  CalendarDays
} from 'lucide-react';
import { Transaction, Category, AccountType, Account } from '../types';
import SwipeableItem from './SwipeableItem';

interface LendingViewProps {
  transactions: Transaction[];
  accounts: Account[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const LendingView: React.FC<LendingViewProps> = ({ transactions, accounts, onAddTransaction, onUpdateTransaction, onDeleteTransaction }) => {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const defaultCash = accounts.find(a => a.id === 'cash')?.id || accounts[0]?.id || '';

  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<AccountType>(defaultCash);
  const [formMode, setFormMode] = useState<'give' | 'receive'>('give');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const [renamingPerson, setRenamingPerson] = useState<{oldName: string, newName: string} | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<string | null>(null);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAccount, setEditAccount] = useState<AccountType>(defaultCash);

  const getPersonData = (t: Transaction) => {
    if (t.category !== Category.LENDING) return null;
    const giveMatch = t.description.match(/(Lent to|Given to)\s+(.*)/i);
    const receiveMatch = t.description.match(/(Returned by|Received from)\s+(.*)/i);
    if (giveMatch) return { name: giveMatch[2].trim(), type: 'give', amount: t.amount };
    if (receiveMatch) return { name: receiveMatch[2].trim(), type: 'receive', amount: t.amount };
    return null;
  };

  const peopleData = useMemo(() => {
    const people: Record<string, { balance: number, lastTxDate: string }> = {};
    transactions.forEach(t => {
      const data = getPersonData(t);
      if (!data) return;
      if (!people[data.name]) people[data.name] = { balance: 0, lastTxDate: t.date };
      if (data.type === 'give') people[data.name].balance += data.amount;
      else people[data.name].balance -= data.amount;
      if (new Date(t.date) > new Date(people[data.name].lastTxDate)) people[data.name].lastTxDate = t.date;
    });
    return Object.entries(people).map(([name, data]) => ({ name, ...data })).sort((a, b) => new Date(b.lastTxDate).getTime() - new Date(a.lastTxDate).getTime());
  }, [transactions]);

  const filteredPeople = peopleData.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const personTransactions = useMemo(() => {
    if (!selectedPerson) return [];
    return transactions.filter(t => {
      const data = getPersonData(t);
      return data && data.name === selectedPerson;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPerson]);

  const handleTransaction = () => {
    if (!amount || !selectedPerson) return;
    const description = formMode === 'give' ? `Given to ${selectedPerson}` : `Received from ${selectedPerson}`;
    const type = formMode === 'give' ? 'expense' : 'income';
    onAddTransaction({ amount: parseFloat(amount), type, category: Category.LENDING, description, date: new Date(date).toISOString(), accountId: account });
    setAmount('');
  };

  const handleAddNewPerson = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPersonName.trim()) return;
    setSelectedPerson(newPersonName.trim());
    setNewPersonName('');
    setIsAddingNew(false);
  };

  const startEditing = (t: Transaction) => {
    setEditingTx(t);
    setEditDesc(t.description);
    setEditAmount(t.amount.toString());
    try {
        const d = new Date(t.date);
        const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setEditDate(localIso);
    } catch (e) {
        setEditDate(new Date().toISOString().slice(0, 16));
    }
    setEditAccount(t.accountId);
  };

  const saveEdit = () => {
    if (!editingTx || !editDesc || !editAmount) return;
    onUpdateTransaction({ ...editingTx, description: editDesc, amount: parseFloat(editAmount), date: new Date(editDate).toISOString(), accountId: editAccount });
    setEditingTx(null);
  };

  if (!selectedPerson) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-md-surface dark:bg-zinc-950 pb-32 animate-in fade-in duration-300">
         {/* Add New Person Modal */}
         {isAddingNew && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="glass rounded-[32px] shadow-2xl w-full max-w-sm p-8 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-md-primary/10 rounded-xl text-md-primary">
                        <UserPlus size={20} />
                     </div>
                     <h3 className="text-xl font-extrabold tracking-tight dark:text-white">Add New Person</h3>
                  </div>
                  <form onSubmit={handleAddNewPerson} className="space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-md-primary opacity-60 ml-1">Full Name</label>
                        <input 
                           type="text" 
                           value={newPersonName} 
                           onChange={(e) => setNewPersonName(e.target.value)} 
                           placeholder="Enter name..."
                           className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 rounded-2xl font-semibold text-sm outline-none dark:text-white border border-transparent focus:border-md-primary/30"
                           autoFocus 
                        />
                     </div>
                     <div className="flex gap-2 pt-4">
                        <button 
                           type="button" 
                           onClick={() => setIsAddingNew(false)} 
                           className="flex-1 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-md-on-surface-variant hover:bg-black/5 rounded-2xl"
                        >
                           Cancel
                        </button>
                        <button 
                           type="submit" 
                           className="flex-[2] py-4 bg-md-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                        >
                           Start Tracking
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         <div className="px-6 pt-4 space-y-6">
            <div className="flex items-center gap-3 pt-4 pb-2">
               <HandCoins className="text-md-primary" size={24} />
               <h2 className="text-3xl font-black tracking-tight text-md-on-surface dark:text-white">Lending</h2>
            </div>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-md-on-surface-variant opacity-40"><Search size={20} /></div>
                <input 
                  type="text" 
                  placeholder="Search name..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full glass px-12 py-4 rounded-[24px] text-sm font-semibold outline-none border-none focus:ring-2 focus:ring-md-primary/20 transition-all shadow-sm dark:text-white" 
                />
                <button 
                  type="button" 
                  onClick={() => setIsAddingNew(true)} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-md-primary text-white rounded-2xl shadow-md active:scale-90 transition-all"
                >
                  <Plus size={20} />
                </button>
            </div>
         </div>
         <div className="px-4 mt-6 space-y-3">
            {filteredPeople.length === 0 ? (
               <div className="py-20 text-center opacity-30 flex flex-col items-center gap-5">
                  <div className="p-8 bg-black/5 rounded-[40px]"><HandCoins size={56} strokeWidth={1} /></div>
                  <p className="font-medium text-[10px] uppercase tracking-[0.3em]">No lending records found</p>
                  <button onClick={() => setIsAddingNew(true)} className="mt-2 px-6 py-3 bg-md-primary/10 text-md-primary rounded-2xl text-[10px] font-black uppercase tracking-widest">Add First Person</button>
               </div>
            ) : (
               filteredPeople.map(p => (
                  <div key={p.name} onClick={() => setSelectedPerson(p.name)} className="glass p-5 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col gap-4 cursor-pointer active:scale-[0.98] transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-[18px] bg-md-primary/10 text-md-primary flex items-center justify-center font-black text-lg shadow-inner">{p.name.charAt(0).toUpperCase()}</div>
                              <div>
                                 <h3 className="font-bold text-sm dark:text-white leading-tight">{p.name}</h3>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-luxe-bronze opacity-60">Balance: Tk {Math.abs(p.balance).toLocaleString()}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${p.balance > 0 ? 'bg-luxe-outflow/10 text-luxe-outflow' : p.balance < 0 ? 'bg-luxe-inflow/10 text-luxe-inflow' : 'bg-gray-100 text-gray-400'}`}>
                                 {p.balance > 0 ? 'They Owe' : p.balance < 0 ? 'You Owe' : 'Settled'}
                              </span>
                              <ChevronRight size={18} className="text-gray-300" />
                           </div>
                        </div>
                  </div>
               ))
            )}
         </div>
      </div>
    );
  }

  return (
      <div className="max-w-md mx-auto min-h-screen bg-md-surface dark:bg-zinc-950 pb-32 animate-in slide-in-from-right duration-400">
         {editingTx && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                <div className="glass rounded-[32px] shadow-2xl w-full max-w-sm p-8 space-y-6">
                    <h3 className="text-xl font-extrabold tracking-tight dark:text-white">Edit Record</h3>
                    <div className="space-y-4">
                       <input type="text" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 rounded-2xl outline-none font-semibold text-sm dark:text-white border border-transparent focus:border-md-primary/30" />
                       <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 rounded-2xl font-black text-sm dark:text-white border border-transparent focus:border-md-primary/30" />
                       <input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 rounded-2xl font-bold text-sm dark:text-white border border-transparent focus:border-md-primary/30" />
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-black/5">
                        <button type="button" onClick={() => { if(confirm("Delete record?")) { onDeleteTransaction(editingTx.id); setEditingTx(null); } }} className="p-3 text-luxe-outflow hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setEditingTx(null)} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest">Cancel</button>
                            <button type="button" onClick={saveEdit} className="px-6 py-3 bg-md-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">Save</button>
                        </div>
                    </div>
                </div>
            </div>
         )}
         <div className="p-4 space-y-6">
            <button onClick={() => setSelectedPerson(null)} className="flex items-center gap-2 text-md-primary px-2"><ArrowLeft size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Back to List</span></button>
            
            <div className="glass p-6 rounded-[32px] shadow-sm space-y-6 border-black/5">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-md-primary text-white flex items-center justify-center font-black text-xl shadow-lg border border-white/20">{selectedPerson.charAt(0).toUpperCase()}</div>
                   <div>
                      <h2 className="text-xl font-black tracking-tight dark:text-white">{selectedPerson}</h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-md-primary opacity-60">Lending Relationship</p>
                   </div>
                </div>

                <div className="flex glass bg-black/5 dark:bg-white/5 p-1 rounded-full shadow-inner">
                    <button onClick={() => setFormMode('give')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${formMode === 'give' ? 'bg-luxe-outflow text-white shadow-md' : 'text-md-on-surface-variant opacity-60'}`}>Give</button>
                    <button onClick={() => setFormMode('receive')} className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all ${formMode === 'receive' ? 'bg-luxe-inflow text-white shadow-md' : 'text-md-on-surface-variant opacity-60'}`}>Receive</button>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-[9px] font-black uppercase tracking-widest text-md-primary opacity-60 mb-2 block ml-1">Transaction Date</label>
                        <div className="relative">
                            <input 
                                type="date" 
                                value={date} 
                                onChange={e => setDate(e.target.value)} 
                                className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 rounded-2xl outline-none font-bold text-sm dark:text-white border border-transparent focus:border-md-primary/30" 
                            />
                            <CalendarDays size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-md-primary opacity-40 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 opacity-60">Tk</span>
                           <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-10 pr-4 py-4 bg-black/5 dark:bg-white/5 rounded-2xl outline-none font-black text-lg dark:text-white border border-transparent focus:border-md-primary/30" />
                        </div>
                        <button onClick={handleTransaction} disabled={!amount} className="bg-md-primary text-white px-6 rounded-2xl disabled:opacity-50 shadow-lg active:scale-95 transition-all"><Plus size={24} strokeWidth={3} /></button>
                    </div>

                    <div className="flex items-center gap-3 px-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Wallet:</label>
                        <select 
                            value={account}
                            onChange={(e) => setAccount(e.target.value)}
                            className="text-[10px] border-none bg-transparent outline-none font-black text-md-primary uppercase tracking-tight"
                        >
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 ml-2">
                   <HandCoins size={14} className="text-md-primary" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-md-on-surface-variant opacity-60">Relationship History</h4>
                </div>
                <div className="space-y-3">
                    {personTransactions.length === 0 ? (
                       <div className="py-12 text-center opacity-30">
                          <p className="font-black text-[9px] uppercase tracking-widest">No transactions yet</p>
                       </div>
                    ) : (
                       personTransactions.map(t => {
                           const data = getPersonData(t)!;
                           return (
                               <SwipeableItem key={t.id} onEdit={() => startEditing(t)}>
                                   <div onClick={() => startEditing(t)} className="glass p-5 rounded-[28px] border border-gray-50 dark:border-zinc-800 shadow-sm flex items-center justify-between cursor-pointer hover:bg-white transition-all">
                                       <div className="flex items-center gap-4">
                                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${data.type === 'give' ? 'bg-luxe-outflow/10 text-luxe-outflow' : 'bg-luxe-inflow/10 text-luxe-inflow'}`}>
                                              {data.type === 'give' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                           </div>
                                           <div>
                                              <p className="font-bold text-sm dark:text-white">{data.type === 'give' ? 'You Lent' : 'They Paid'}</p>
                                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60">{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                           </div>
                                       </div>
                                       <p className={`font-black text-sm ${data.type === 'give' ? 'text-luxe-outflow' : 'text-luxe-inflow'}`}>
                                          {data.type === 'give' ? '-' : '+'} Tk {t.amount.toLocaleString()}
                                       </p>
                                   </div>
                               </SwipeableItem>
                           );
                       })
                    )}
                </div>
            </div>
         </div>
      </div>
  );
};

export default LendingView;
