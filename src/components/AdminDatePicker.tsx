import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react';

interface Props {
  selectedDate: string;
  onChange: (date: string) => void;
}

export function AdminDatePicker({ selectedDate, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const parsedDate = new Date(selectedDate);
  const [viewDate, setViewDate] = useState(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dayNames = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#070e0a] hover:bg-[#0b1610] border border-emerald-950/60 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold outline-none transition-all focus:border-emerald-500 shadow-sm shadow-emerald-900/10"
      >
        <Calendar className="w-4 h-4" />
        <span>{selectedDate}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 w-64 bg-[#0b120d] border border-emerald-900/40 rounded-2xl shadow-2xl shadow-black/80 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-emerald-900/30 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-sm font-black text-white">
              {monthNames[viewDate.getMonth()]} <span className="text-emerald-500">{viewDate.getFullYear()}</span>
            </div>
            <button onClick={handleNextMonth} className="p-1 hover:bg-emerald-900/30 rounded-lg text-zinc-400 hover:text-emerald-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-zinc-500">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (d === null) return <div key={`empty-${i}`} className="h-8" />;
              
              const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={i}
                  onClick={() => {
                    onChange(dateStr);
                    setIsOpen(false);
                  }}
                  className={`h-8 w-full rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                      : isToday 
                        ? 'border border-emerald-500/50 text-emerald-400' 
                        : 'text-zinc-300 hover:bg-emerald-900/20 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
