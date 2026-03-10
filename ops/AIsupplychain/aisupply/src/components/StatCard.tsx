import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}

export function StatCard({ title, value, subtext, icon: Icon, trend, trendValue, className }: StatCardProps) {
  return (
    <div className={cn("bg-eco-card backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-lg text-white", className)}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/5 rounded-lg">
          <Icon className="w-6 h-6 text-eco-emerald-400" />
        </div>
        {trend && (
          <div className={cn("flex items-center text-sm font-medium", trend === 'up' ? "text-eco-emerald-400" : "text-red-400")}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <div className="text-3xl font-bold mb-2 tracking-tight">{value}</div>
      <p className="text-sm text-gray-500">{subtext}</p>
    </div>
  );
}
