'use client';

import { useMemo, useState } from 'react';

interface CalendarViewProps {
  dates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ dates, selectedDate, onDateSelect }: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const dateSet = useMemo(() => new Set(dates), [dates]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  const cells: { day: number; iso: string }[] = [];
  for (let i = 0; i < firstDayOffset; i++) {
    cells.push({ day: 0, iso: '' });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      iso: `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`,
    });
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 max-w-3xl mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-bold text-slate-900">{monthLabel}</span>
        <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((cell, i) =>
          cell.day === 0 ? (
            <div key={i} />
          ) : (
            <button
              key={cell.iso}
              onClick={() => onDateSelect(cell.iso)}
              className={`flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 h-10 ${
                cell.iso === selectedDate
                  ? 'bg-teal-600 text-white shadow-sm'
                  : cell.iso === today.toISOString().slice(0, 10)
                  ? 'bg-teal-50 text-teal-700'
                  : dateSet.has(cell.iso)
                  ? 'bg-cyan-50 text-slate-800 border border-emerald-400'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cell.day}
            </button>
          )
        )}
      </div>
    </div>
  );
}
