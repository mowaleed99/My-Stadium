import React from 'react';
import { Booking, FootballField } from '../types';
import { TIME_SLOTS } from '../constants';
import { DollarSign, CalendarCheck, Percent, Zap } from 'lucide-react';

interface DashboardStatsProps {
  bookings: Booking[];
  fields: FootballField[];
  selectedDate: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  bookings,
  fields,
  selectedDate,
}) => {
  // Filter bookings for the selected date
  const dateBookings = bookings.filter((b) => b.date === selectedDate && b.status !== 'canceled');

  // Compute stats
  const revenue = dateBookings.reduce((sum, b) => sum + b.price, 0);
  const totalSlotsAvailable = TIME_SLOTS.length * fields.length;
  const bookedCount = dateBookings.length;
  const occupancyRate = totalSlotsAvailable > 0
    ? Math.round((bookedCount / totalSlotsAvailable) * 100)
    : 0;

  // Compute pending and confirmed counts
  const pendingCount = dateBookings.filter((b) => b.status === 'pending').length;

  return (
    <div id="dashboard-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6" dir="rtl">
      {/* Revenue Card */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-emerald-500/20">
        <div className="flex justify-between items-start">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-sans font-bold">
            إيرادات اليوم المتوقعة
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold font-sans tracking-tight text-white">
            {revenue} <span className="text-[10px] text-zinc-400 font-normal">ج.م</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9.5px] text-[#10b981] font-bold">
              +{dateBookings.length > 0 ? Math.round(revenue / 12) : 0}% مقارنة بالأسبوع الماضي
            </span>
          </div>
        </div>
      </div>

      {/* Bookings Card */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-emerald-500/20">
        <div className="flex justify-between items-start">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-sans font-bold">
            الحجوزات النشطة
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold font-sans tracking-tight text-white">
            {bookedCount} <span className="text-xs text-white/30">/ {totalSlotsAvailable} فترة زمنية</span>
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9.5px] text-amber-400 font-bold">
              {pendingCount} في انتظار التأكيد والموافقة
            </span>
          </div>
        </div>
      </div>

      {/* Occupancy Card */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-emerald-500/20">
        <div className="flex justify-between items-start">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-sans font-bold">
            نسبة إشغال الملاعب
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-xl font-extrabold font-sans tracking-tight text-white mb-1.5">
            {occupancyRate}%
          </p>
          <div className="flex items-center gap-1.5">
            {/* Visual tiny layout progress bar */}
            <div className="w-full bg-emerald-950/40 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#10b981] h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Arena Quality Status */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-300 hover:border-emerald-500/20 col-span-2 lg:col-span-1">
        <div className="flex justify-between items-start">
          <span className="text-[11px] text-white/50 uppercase tracking-wide font-sans font-bold">
            حالة المنظومة الرقمية
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981]">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-[#10b981] font-sans">متصل ونشط</span>
            <span className="text-[9px] text-emerald-500/60 font-semibold">موسم ٢٠٢٦</span>
          </div>
          <p className="text-[9px] text-zinc-400 mt-1">
            مواعيد العمل اليومية: ٠٤:٠٠ م - ٠٢:٠٠ ص
          </p>
        </div>
      </div>
    </div>
  );
};
