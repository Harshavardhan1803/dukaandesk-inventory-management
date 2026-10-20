import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    text: string;
    isPositive?: boolean;
    isNegative?: boolean;
    isWarning?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 transition-colors ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-700">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
        
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            {trend && (
              <span
                className={`font-medium ${
                  trend.isWarning
                    ? 'text-amber-600'
                    : trend.isNegative
                    ? 'text-rose-600'
                    : trend.isPositive
                    ? 'text-emerald-600'
                    : 'text-slate-600'
                }`}
              >
                {trend.text}
              </span>
            )}
            {trend && subtitle && <span aria-hidden="true">·</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
