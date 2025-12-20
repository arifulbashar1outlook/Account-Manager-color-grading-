
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon: Icon, colorClass, bgClass }) => {
  const isPremiumColor = colorClass.includes('md-primary');
  
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 flex flex-col justify-between transition-all hover:shadow-xl active:scale-[0.97] shadow-sm group border border-gray-50 dark:border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-2xl ${bgClass} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <p className="text-md-on-surface-variant dark:text-gray-400 text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 whitespace-nowrap">{title}</p>
      </div>
      <div>
        <h3 className={`text-xl font-black tracking-tighter flex items-baseline flex-wrap ${isPremiumColor ? 'text-gold-gradient' : colorClass}`}>
          <span className={`text-[10px] font-bold mr-1 ${isPremiumColor ? 'text-md-primary opacity-60' : 'opacity-40'}`}>Tk</span>
          {Math.abs(amount).toLocaleString('en-US')}
        </h3>
      </div>
    </div>
  );
};

export default SummaryCard;
