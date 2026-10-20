import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';

export const SalesChart: React.FC = () => {
  const { dailySalesTrend, settings } = useStore();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxRevenue = Math.max(...dailySalesTrend.map((d) => d.totalRevenue), 500);
  const total7DayRevenue = dailySalesTrend.reduce((acc, d) => acc + d.totalRevenue, 0);
  const total7DayOrders = dailySalesTrend.reduce((acc, d) => acc + d.transactionsCount, 0);

  // SVG dimensions
  const height = 200;
  const paddingBottom = 32;
  const paddingTop = 20;
  const chartHeight = height - paddingBottom - paddingTop;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            7-Day Sales Performance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily retail revenue and bill volume
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">7-Day Revenue: </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {settings.currencySymbol}
              {total7DayRevenue.toLocaleString()}
            </span>
          </div>
          <span className="text-slate-300" aria-hidden="true">
            ·
          </span>
          <div>
            <span className="text-slate-400">Transactions: </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {total7DayOrders} bills
            </span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative pt-6">
        {/* Tooltip */}
        {hoveredIndex !== null && dailySalesTrend[hoveredIndex] && (
          <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs px-2.5 py-1 rounded shadow-md pointer-events-none z-10 flex items-center gap-2">
            <span className="font-medium text-slate-300">
              {dailySalesTrend[hoveredIndex].displayDate}:
            </span>
            <span className="font-semibold text-emerald-400 tabular-nums">
              {settings.currencySymbol}
              {dailySalesTrend[hoveredIndex].totalRevenue.toLocaleString()}
            </span>
            <span className="text-slate-400 text-[11px] tabular-nums">
              ({dailySalesTrend[hoveredIndex].transactionsCount} bills)
            </span>
          </div>
        )}

        <div className="h-52 w-full flex items-end gap-2 sm:gap-4 pt-4">
          {dailySalesTrend.map((day, idx) => {
            const barHeightPercent = maxRevenue > 0 ? (day.totalRevenue / maxRevenue) * 100 : 0;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Value above bar */}
                <div
                  className={`text-[10px] font-mono tabular-nums mb-1 transition-opacity ${
                    isHovered
                      ? 'text-slate-900 font-semibold opacity-100'
                      : 'text-slate-400 opacity-0 sm:opacity-75'
                  }`}
                >
                  {day.totalRevenue > 0 ? `${settings.currencySymbol}${day.totalRevenue}` : '0'}
                </div>

                {/* Bar */}
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t flex items-end overflow-hidden h-[130px]">
                  <div
                    style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                    className={`w-full transition-all duration-200 rounded-t ${
                      isHovered
                        ? 'bg-emerald-500'
                        : day.totalRevenue > 0
                        ? 'bg-slate-800'
                        : 'bg-slate-200'
                    }`}
                  />
                </div>

                {/* X-axis label */}
                <div className="mt-2 text-center">
                  <span
                    className={`block text-[11px] font-medium transition-colors ${
                      isHovered ? 'text-slate-900 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {day.displayDate.split(',')[0]}
                  </span>
                  <span className="block text-[10px] text-slate-400 tabular-nums">
                    {day.displayDate.split(' ')[1]} {day.displayDate.split(' ')[2]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
