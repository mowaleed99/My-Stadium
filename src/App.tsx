import React, { useState, useMemo } from 'react';
import { 
  PITCH_FIELDS, 
  TIME_SLOTS, 
  PRESEEDED_BOOKINGS, 
  isPrimeSlot 
} from './constants';
import { Booking, FootballField, BookingStatus } from './types';
import { PitchVisualizer } from './components/PitchVisualizer';
import { DashboardStats } from './components/DashboardStats';
import { BookingSuccessModal } from './components/BookingSuccessModal';

import { 
  MapPin, 
  Clock, 
  Compass, 
  Layers, 
  Calendar, 
  Phone, 
  Check, 
  X, 
  AlertCircle, 
  User, 
  Mail, 
  MessageCircle,
  Plus
} from 'lucide-react';

export default function App() {
  // Application Mode: 'public' (Booking portal) or 'admin' (Dashboard view)
  const [appMode, setAppMode] = useState<'public' | 'admin'>('public');

  // Local database of bookings
  const [bookings, setBookings] = useState<Booking[]>(PRESEEDED_BOOKINGS);

  // Selected date, default is today "2026-05-15"
  const [selectedDate, setSelectedDate] = useState<string>('2026-05-15');

  // Selected field in public view
  const [selectedFieldId, setSelectedFieldId] = useState<string>(PITCH_FIELDS[0].id);

  // Selected time slot
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Holds state of the newly created booking for success modal presentation
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const [latestBookingField, setLatestBookingField] = useState<FootballField | null>(null);

  // Public & Admin Form Data
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [gameType, setGameType] = useState<any>('friendly');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Admin and Manual booking fields
  const [adminSelectedFieldId, setAdminSelectedFieldId] = useState<string>(PITCH_FIELDS[0].id);
  const [isAddingManualBooking, setIsAddingManualBooking] = useState(false);
  const [manualSlot, setManualSlot] = useState('');
  
  // Custom inspection state (Admin edits slot)
  const [inspectedBooking, setInspectedBooking] = useState<Booking | null>(null);

  // 7 continuous selectable days in 2026-05-15 with native Arabic names
  const calendarDays = useMemo(() => {
    const days = [];
    const baseDate = new Date(2026, 4, 15); // May 15, 2026
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      const dayName = arabicDays[d.getDay()];
      const dayNum = d.getDate();
      days.push({ formattedDate, dayName, dayNum });
    }
    return days;
  }, []);

  const currentPublicField = useMemo(() => {
    return PITCH_FIELDS.find(f => f.id === selectedFieldId) || PITCH_FIELDS[0];
  }, [selectedFieldId]);

  // Compute availability list for public view
  const publicSlotsState = useMemo(() => {
    return TIME_SLOTS.map(slot => {
      const b = bookings.find(
        book => 
          book.fieldId === selectedFieldId && 
          book.date === selectedDate && 
          book.timeSlot === slot &&
          book.status !== 'canceled'
      );
      return {
        time: slot,
        isBooked: !!b,
        booking: b
      };
    });
  }, [bookings, selectedFieldId, selectedDate]);

  // Compute availability list for admin view
  const adminSlotsState = useMemo(() => {
    return TIME_SLOTS.map(slot => {
      const b = bookings.find(
        book => 
          book.fieldId === adminSelectedFieldId && 
          book.date === selectedDate && 
          book.timeSlot === slot &&
          book.status !== 'canceled'
      );
      return {
        time: slot,
        isBooked: !!b,
        booking: b
      };
    });
  }, [bookings, adminSelectedFieldId, selectedDate]);

  // Public Booking Submit (WhatsApp Redirect)
  const handlePlaceBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setFormError('يرجى تحديد فترة زمنية أولاً.');
      return;
    }

    const message = `مرحباً، أريد حجز ملعب الجراش يوم ${selectedDate} الفترة ${selectedSlot}.`;
    const whatsappUrl = `https://wa.me/201000000000?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Change booking status inside Admin Panel
  const updateBookingStatus = (id: string, nextStatus: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: nextStatus } : b));
    if (inspectedBooking && inspectedBooking.id === id) {
      setInspectedBooking(prev => prev ? { ...prev, status: nextStatus } : null);
    }
  };

  // Cancel/Removes a booking
  const handleCancelBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setInspectedBooking(null);
  };

  // Manually adds booking as administrator
  const handleAdminManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim() || !manualSlot) {
      setFormError('الرجاء ملء جميع الحقول وتحديد الفترة والاسم.');
      return;
    }

    const activeField = PITCH_FIELDS.find(f => f.id === adminSelectedFieldId) || PITCH_FIELDS[0];
    const price = isPrimeSlot(manualSlot) ? activeField.primePrice : activeField.basePrice;

    const newBooking: Booking = {
      id: `m-${Date.now()}`,
      fieldId: adminSelectedFieldId,
      date: selectedDate,
      timeSlot: manualSlot,
      userName: userName.trim(),
      userPhone: userPhone.trim(),
      userEmail: userEmail ? userEmail.trim() : undefined,
      price,
      status: 'confirmed',
      gameType,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const isSlotTaken = bookings.some(
      b => b.date === selectedDate && b.fieldId === adminSelectedFieldId && b.timeSlot === manualSlot && b.status !== 'canceled'
    );

    if (isSlotTaken) {
      setFormError('عذراً، هذه الفترة محجوزة بالفعل في هذا الملعب!');
      return;
    }

    setBookings(prev => [...prev, newBooking]);
    setIsAddingManualBooking(false);

    // Reset fields
    setUserName('');
    setUserPhone('');
    setUserEmail('');
    setNotes('');
    setFormError('');
    setManualSlot('');
  };

  return (
    <div className="min-h-screen bg-[#070b09] text-zinc-100 font-sans antialiased text-right selection:bg-emerald-500 selection:text-black" dir="rtl">
      
      {/* TOP HEADER BRAND BAR */}
      <header className="sticky top-0 z-40 bg-[#09100c] border-b border-[#14261a] px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/20">
            <span className="font-sans font-black text-sm text-black tracking-tighter">GOAL</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white font-sans">
                ملعب الجراش الخماسي
              </h1>
              <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-sm animate-pulse" />
            </div>
            <p className="text-[10px] text-zinc-400 font-sans font-medium">
              طنطا - محلة مرحوم
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex bg-[#0f1913] p-1 rounded-xl border border-[#1b3223] w-full sm:w-auto">
          <button
            id="btn-switch-public"
            onClick={() => { setAppMode('public'); setFormError(''); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              appMode === 'public'
                ? 'bg-[#152e1d] text-emerald-400 border border-[#234b31]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>بوابة الحجز المباشر</span>
          </button>
          
          <button
            id="btn-switch-admin"
            onClick={() => { setAppMode('admin'); setFormError(''); }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              appMode === 'admin'
                ? 'bg-[#152e1c] text-emerald-400 border border-[#234b31]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>لوحة تحكم المشرف</span>
          </button>
        </div>
      </header>

      {/* HORIZONTAL DATE TIMELINE STRIP */}
      <section id="date-selector-line" className="bg-[#0b120e] border-b border-[#14261a] py-3.5 px-4 md:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-zinc-400 shrink-0">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold font-sans text-emerald-400">
              اختر تاريخ حجز مباراة:
            </span>
          </div>

          {/* Touch-Friendly horizontal scrolling strip of dates */}
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none snap-x self-end md:self-auto">
            {calendarDays.map((day) => {
              const isSelected = selectedDate === day.formattedDate;
              return (
                <button
                  key={day.formattedDate}
                  onClick={() => {
                    setSelectedDate(day.formattedDate);
                    setSelectedSlot(null); // Reset select slot
                  }}
                  className={`flex-shrink-0 snap-start flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 border ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-500 text-black shadow-md font-bold'
                      : 'bg-[#121a15] border-[#1f3727] text-zinc-300 hover:text-zinc-100 hover:border-emerald-600/40'
                  }`}
                >
                  <div className={`text-[10px] font-bold ${isSelected ? 'text-black' : 'text-zinc-400'}`}>
                    {day.dayName}
                  </div>
                  <div className={`w-[1px] h-3.5 ${isSelected ? 'bg-black/30' : 'bg-emerald-900'}`} />
                  <div className="text-xs font-extrabold font-mono">
                    {day.dayNum}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CORE WORKFLOW AREA */}
      <main id="main-application-view" className="max-w-7xl mx-auto px-4 md:px-8 py-6 relative z-10 flex-1">
        
        {/* VIEW 1: USER PUBLIC PORTAL */}
        {appMode === 'public' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Hand: Main Field Details, features, Slot Grid */}
            <div className="col-span-1 lg:col-span-7 space-y-6">
              
              {/* Arena Details Block */}
              <div className="bg-[#0b120d] rounded-2xl overflow-hidden border border-[#14261a] transition-all">
                <div className="h-44 relative overflow-hidden flex flex-col justify-end p-5">
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={currentPublicField.image} 
                      alt={currentPublicField.name} 
                      className="w-full h-full object-cover brightness-[0.35] saturate-[0.8] contrast-[1.1]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b120d] via-[#0b120d]/20 to-transparent" />
                  </div>

                  <div className="relative z-10 text-right">
                    <div className="flex items-center gap-2 mb-1.5 justify-start">
                      <span className="text-[9px] font-bold bg-[#10b981] text-black px-2 py-0.5 rounded">
                        نجيل صناعي عالي الجودة
                      </span>
                      <span className="text-xs text-amber-400 font-bold bg-black/75 px-2 py-0.5 rounded">
                        ★ {currentPublicField.rating.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {currentPublicField.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 justify-start">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>طنطا - محلة مرحوم</span>
                    </p>
                  </div>
                </div>

                {/* Sub Features */}
                <div className="px-4 py-3 bg-[#080d09] border-t border-[#14261a] text-[10.5px] text-zinc-400 flex flex-wrap gap-x-5 gap-y-1.5 rounded-b-2xl">
                  {currentPublicField.features.map((feat, index) => (
                    <span key={index} className="flex items-center gap-1.5 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Booking slots zone */}
              <div id="booking-slots-zone" className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-black text-white tracking-tight">
                      الأوقات وفترات اللعب المتاحة لليوم
                    </h2>
                    <p className="text-[11px] text-zinc-400">
                      الفترة القياسية المريحة تمتد على مدار ٩٠ دقيقة (ساعة ونصف).
                    </p>
                  </div>
                  <div className="flex gap-2.5 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded bg-[#10b981]" /> متاح فوري
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500" /> محجوز مسبقاً
                    </span>
                  </div>
                </div>

                {/* Custom layout touch friendly slots cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {publicSlotsState.map(({ time, isBooked, booking }) => {
                    const isPrime = isPrimeSlot(time);
                    const isCurrentlySelected = selectedSlot === time;
                    const price = isPrime ? currentPublicField.primePrice : currentPublicField.basePrice;

                    return (
                      <button
                        key={time}
                        onClick={() => {
                          if (!isBooked) {
                            setSelectedSlot(time);
                            setFormError('');
                          } else {
                            setFormError(`عذراً، الفترة "${time}" محجوزة مسبقاً للاسم: ${booking?.userName}`);
                          }
                        }}
                        disabled={isBooked}
                        className={`p-3.5 text-center border transition-all duration-200 relative flex flex-col justify-between items-center rounded-xl min-h-[96px] ${
                          isBooked
                            ? 'bg-[#121212] border-zinc-800 text-zinc-600 cursor-not-allowed opacity-40'
                            : isCurrentlySelected
                            ? 'bg-[#122c18] border-emerald-400 text-white shadow-md ring-2 ring-emerald-500/30'
                            : 'bg-[#0b100c] border-[#16271a] text-zinc-350 hover:border-emerald-500/35'
                        }`}
                      >


                        {isPrime && (
                          <span className={`text-[8.5px] px-2 py-0.5 rounded font-bold mb-1.5 ${
                            isCurrentlySelected ? 'bg-white/20 text-white font-extrabold' : isBooked ? 'bg-zinc-805 text-zinc-550' : 'bg-[#122316] text-[#4ade80]'
                          }`}>
                            ⭐ فترة ذروة
                          </span>
                        )}

                        <span className="text-xs font-bold font-mono tracking-tight block">
                          {time}
                        </span>

                        <div className="mt-2 text-center">
                          <span className={`text-sm font-extrabold leading-none block ${isBooked ? 'text-zinc-500 font-medium' : isCurrentlySelected ? 'text-white' : 'text-emerald-400'}`}>
                            {isBooked ? 'محجوز' : `${price} ج.م`}
                          </span>
                          {!isBooked && (
                            <span className={`text-[8.5px] font-medium block mt-1 ${isCurrentlySelected ? 'text-emerald-300' : 'text-zinc-500'}`}>
                              لكل ٩٠ دقيقة
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Hand Sticky Reservation Card */}
            <div className="col-span-1 lg:col-span-5">
                <div className="glass-panel rounded-3xl p-5 border border-emerald-950/30 sticky top-24 space-y-4">
                <div className="border-b border-emerald-950/20 pb-3">
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    الخطوة ٢: أدخل بيانات كابتن الفريق
                  </span>
                  <h3 className="text-sm font-black text-white mt-1">
                    أدخل بيانات كابتن الموعد المختار
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    سيتم تأكيد اللعب في ملعب <span className="text-emerald-400 font-semibold">{currentPublicField.name}</span> بتاريخ <span className="text-emerald-400 font-semibold">{selectedDate}</span>.
                  </p>
                </div>

                {selectedSlot ? (
                  <form onSubmit={handlePlaceBookingSubmit} className="space-y-4">
                    {/* Summary row */}
                    <div className="bg-[#070e0a] rounded-xl p-3 border border-emerald-950/40 flex items-center justify-between">
                      <div>
                        <p className="text-[8.5px] text-white/40">توقيت الحجز</p>
                        <p className="text-xs font-bold text-white font-mono mt-0.5">{selectedSlot}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-[8.5px] text-white/40">السعر</p>
                        <p className="text-sm font-black text-emerald-400">
                          {currentPublicField.basePrice} ج.م
                        </p>
                      </div>
                    </div>

                    {formError && (
                      <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-400">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* WhatsApp book trigger */}
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-black font-black rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-[#25D366]/20 transition-all font-sans duration-300 pointer-events-auto"
                    >
                      <MessageCircle className="w-5 h-5 fill-current" />
                      <span className="text-xs">تأكيد الحجز عبر الواتساب</span>
                    </button>
                    
                    <p className="text-[9.5px] text-zinc-500 text-center uppercase tracking-wider">
                      🔒 يتم الدفع نقداً أو فودافون كاش في الملعب.
                    </p>
                  </form>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-white">لم يتم اختيار أي فترة بعد!</h4>
                      <p className="text-[11px] text-zinc-400 max-w-[210px] mx-auto leading-relaxed">
                        الرجاء تحديد موعد وفترة الإيجار من القائمة للتواصل للحجز.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: STAFF ADMIN HUB */}
        {appMode === 'admin' && (
          <div className="space-y-6">
            
            {/* Admin Header Title */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
              <div>
                <h2 className="text-lg font-black text-white">
                  منصة الإشراف اليومية والمكاسب: <span className="text-emerald-400 font-mono text-sm">مكتب التحكم العام</span>
                </h2>
                <span className="text-[11px] text-zinc-400 leading-none">
                  عرض حركات الإيجار، الإيرادات الحية المستحقة وسجل الحجوزات لتاريخ اليوم: <span className="text-emerald-400 font-bold">{selectedDate}</span>.
                </span>
              </div>
              
              <button
                onClick={() => {
                  setFormError('');
                  setIsAddingManualBooking(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:brightness-110 text-neutral-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-md hover:shadow-emerald-500/10 transition-all font-sans"
              >
                <Plus className="w-4 h-4 text-neutral-950" />
                <span>إدخال حجز يدوي مباشر</span>
              </button>
            </div>

            {/* Live stats display in Arabic */}
            <DashboardStats 
              bookings={bookings} 
              fields={PITCH_FIELDS} 
              selectedDate={selectedDate} 
            />

            {/* Management Schedule Table Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Field timeline lists */}
              <div className="col-span-1 lg:col-span-8 space-y-4">
                
                {/* Scheduling list layout */}
                <div className="glass-panel rounded-3xl overflow-hidden border border-emerald-900/20">
                  <div className="px-5 py-3.5 bg-zinc-950/40 border-b border-emerald-950/20 flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      حصص وتخصيص الفترات الزمنية لليوم
                    </span>
                    <span className="text-[10.5px] text-zinc-400">
                      مواعيد ملعب الحقل المحدد
                    </span>
                  </div>

                  <div className="divide-y divide-emerald-950/10">
                    {adminSlotsState.map(({ time, isBooked, booking }) => (
                      <div
                        key={time}
                        className={`p-4 transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                          isBooked 
                            ? 'bg-gradient-to-l from-emerald-950/10 via-transparent to-transparent' 
                            : 'bg-transparent hover:bg-white/[0.01]'
                        }`}
                      >
                        {/* Time indicator and type tag */}
                        <div className="flex items-center gap-3 shrink-0 min-w-[130px]">
                          <span className="font-mono text-xs text-white font-bold">
                            {time}
                          </span>
                          {isPrimeSlot(time) ? (
                            <span className="text-[8px] bg-emerald-500/10 text-[#4ade80] font-bold px-1.5 py-0.5 rounded">
                              🔥 ذروة
                            </span>
                          ) : (
                            <span className="text-[8px] bg-zinc-800 text-zinc-500 font-bold px-1.5 py-0.5 rounded">
                              عادي
                            </span>
                          )}
                        </div>

                        {/* Booking owner details */}
                        <div className="flex-1 min-w-0">
                          {isBooked && booking ? (
                            <div className="flex items-start gap-2.5">
                              <div className="w-1 h-8 rounded-full bg-[#10b981] mt-1 shrink-0" />
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-white">
                                    {booking.userName}
                                  </span>
                                  {booking.gameType && (
                                    <span className="text-[9px] px-1.5 py-[0.5px] rounded bg-white/5 border border-white/10 text-emerald-400">
                                      {booking.gameType === 'friendly' ? 'ودي' : booking.gameType === 'practice' ? 'تدريب' : booking.gameType === 'tournament' ? 'بطولة' : 'دوري'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                                  <span className="font-mono">{booking.userPhone}</span>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-bold">{booking.price} ج.م</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 italic">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                              الفترة شاغرة حالياً • متاحة للاعبينا للحجز
                            </div>
                          )}
                        </div>

                        {/* Management action button triggers */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isBooked && booking ? (
                            <button
                              onClick={() => setInspectedBooking(booking)}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white hover:text-emerald-400 text-[10.5px] font-bold rounded-lg transition-all"
                            >
                              تفاصيل الحجز وإلغائه
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setAdminSelectedFieldId(adminSelectedFieldId);
                                setSelectedDate(selectedDate);
                                setManualSlot(time);
                                setIsAddingManualBooking(true);
                              }}
                              className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10.5px] font-bold rounded-lg transition-all"
                            >
                              + تخصيص ولعب فوري
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Right Hand detail column */}
              <div className="col-span-1 lg:col-span-4 space-y-6">
                
                {/* Field Details & Pricing */}
                <div className="glass-panel p-5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-400 font-bold block">
                      تفاصيل الملعب وأسعار الفترات
                    </span>
                    <span className="inline-block w-4 h-4 bg-[#10b981]/15 border border-[#10b981]/30 rounded-full animate-pulse" />
                  </div>
                  
                  <div className="bg-zinc-950/40 rounded-2xl p-4 border border-emerald-950/20 text-[11px] text-zinc-300 space-y-3.5">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">اسم المرفق:</span>
                      <span className="font-bold text-white">ملعب الجراش</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">مواصفات النجيل:</span>
                      <span className="font-bold text-white">نجيل صناعي عالي الجودة</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-zinc-500">سعة اللعب:</span>
                      <span className="font-bold text-emerald-400">خماسي (5 ضد 5)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">سعر الفترة:</span>
                      <span className="font-mono text-emerald-450 font-extrabold text-xs">150 ج.م / فترة</span>
                    </div>
                  </div>
                </div>

                {/* Operations instructions card */}
                <div className="glass-panel p-5 rounded-3xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">سياسة الإيجار اليومي</h4>
                  <ul className="text-[11px] text-zinc-400 space-y-2.5 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] font-bold">✓</span>
                      <span>يجب التواجد قبل موعد الحجز بـ 10 دقائق.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10b981] font-bold">✓</span>
                      <span>يتم حجز الملاعب ودفع الرسوم قبل بدء المباراة.</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-16 bg-[#030605] border-t border-emerald-950/20 py-8 px-4 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
          <div className="space-y-3">
            <div className="flex items-center gap-2 justify-start">
              <span className="font-sans font-black text-white text-base">
                ملعب الجراش
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              أفضل ملعب خماسي في طنطا - محلة مرحوم. نهدف لتقديم تجربة رياضية مميزة لأبناء المنطقة بأسعار مناسبة.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-sans">
              ساعات العمل والعنوان
            </h4>
            <div className="text-xs text-zinc-400 space-y-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>طنطا - قرية محلة مرحوم</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>طوال أيام الأسبوع: من الساعة ٠٤:٠٠ م وحتى ٠٢:٠٠ ص</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-sans">
              للتواصل والحجز السريع
            </h4>
            <div className="text-xs text-[#22c55e] space-y-1.5 font-bold">
              <p>واتساب: 01000000000</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-emerald-950/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
          <p>© ٢٠٢٦ ملعب الجراش الخماسي. جميع الحقوق محفوظة.</p>
        </div>
      </footer>

      {/* MODALS OVERLAYS */}

      {/* 1. PUBLIC TICKET SUCCESS MODAL */}
      <BookingSuccessModal 
        booking={latestBooking}
        field={latestBookingField}
        onClose={() => {
          setLatestBooking(null);
          setLatestBookingField(null);
        }}
      />

      {/* 2. ADMIN BOOKING INSPECTION & MANAGEMENT */}
      {inspectedBooking && (
        <div id="booking-management-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" dir="rtl">
          <div className="w-full max-w-md glass-panel-heavy rounded-3xl overflow-hidden relative border border-emerald-500/20 shadow-2xl">
            
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  مركز تحكم الإشراف اليومي
                </p>
                <h3 className="text-sm font-black text-white mt-0.5">
                  تفاصيل وتأكيد فترات اللعب
                </h3>
              </div>
              <button
                onClick={() => setInspectedBooking(null)}
                className="text-white/40 hover:text-white bg-white/5 p-1.5 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#020503] rounded-2xl p-4 border border-emerald-950/40 text-xs space-y-3 text-right">
                <div className="flex justify-between">
                  <span className="text-zinc-500">اسم كابتن الحجز المسؤول:</span>
                  <span className="font-extrabold text-white">{inspectedBooking.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم المحمول للتواصل:</span>
                  <span className="font-mono text-white text-left">{inspectedBooking.userPhone}</span>
                </div>
                {inspectedBooking.userEmail && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">البريد الإلكتروني:</span>
                    <span className="text-white">{inspectedBooking.userEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-500">تاريخ الحجز المعتمد:</span>
                  <span className="font-bold text-white">{inspectedBooking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">الفترة الزمنية المختارة:</span>
                  <span className="font-bold text-emerald-400 font-mono">{inspectedBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">تكلفة فترة اللعب المستحقة:</span>
                  <span className="font-black text-[#4ade80]">{inspectedBooking.price} ج.م</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">حالة عملية الحجز اليوم:</span>
                  <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                    inspectedBooking.status === 'confirmed' 
                      ? 'bg-emerald-500/10 text-[#4ade80] border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {inspectedBooking.status === 'confirmed' ? 'تم التأكيد' : 'في انتظار التأكيد'}
                  </span>
                </div>
                {inspectedBooking.notes && (
                  <div className="border-t border-emerald-950/20 mt-3 pt-2.5">
                    <p className="text-[10px] text-zinc-500 uppercase">ملاحظات وطلبات اللاعب:</p>
                    <p className="italic text-zinc-300 mt-1 max-h-16 overflow-y-auto leading-relaxed">{inspectedBooking.notes}</p>
                  </div>
                )}
              </div>

              {/* Approve/Cancelling buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {inspectedBooking.status === 'pending' ? (
                  <button
                    onClick={() => updateBookingStatus(inspectedBooking.id, 'confirmed')}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs rounded-xl transition-all"
                  >
                    تصديق وتأكيد الحجز فوري
                  </button>
                ) : (
                  <button
                    onClick={() => updateBookingStatus(inspectedBooking.id, 'pending')}
                    className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all"
                  >
                    تغيير الحالة لمعلق
                  </button>
                )}

                <button
                  onClick={() => handleCancelBooking(inspectedBooking.id)}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all"
                >
                  إلغاء تماماً وتفريغ الحقل
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setInspectedBooking(null)}
                  className="text-[10px] text-zinc-400 hover:underline hover:text-white"
                >
                  إغلاق والرجوع للجدول
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. ADMIN TOOLS: DIRECT MANUAL SUBMISSION ENTRY OVERLAY */}
      {isAddingManualBooking && (
        <div id="booking-manual-addition-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" dir="rtl">
          <div className="w-full max-w-md glass-panel-heavy rounded-3xl overflow-hidden relative border border-emerald-500/20 shadow-2xl">
            
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  أدوات مجمع الملاعب
                </p>
                <h3 className="text-sm font-black text-white mt-0.5">
                  تسجيل حجز يدوي مباشر وتثبيته
                </h3>
              </div>
              <button
                onClick={() => { setIsAddingManualBooking(false); setFormError(''); }}
                className="text-white/40 hover:text-white bg-white/5 p-1.5 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminManualSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                  اختر وقت فترة اللعب للحجز *
                </label>
                <select
                  required
                  value={manualSlot}
                  onChange={(e) => setManualSlot(e.target.value)}
                  className="w-full bg-[#030604] border border-emerald-950 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/60 font-mono"
                >
                  <option value="">-- اختر موعد متاح من القائمة --</option>
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t} {isPrimeSlot(t) ? '(فترة ذروة ⭐)' : '(فترة عادية)'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                  اسم الكابتن المسؤول عن حجز فريقه *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كابتن حازم إمام"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#030604] border border-emerald-950 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                  رقم الهاتف المحمول للتواصل والتأكيد *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: +201001234567"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-[#030604] border border-emerald-950 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/60 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                    تصنيف وترتيب المباراة
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value as any)}
                    className="w-full bg-[#030604] border border-emerald-950 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500/60"
                  >
                    <option value="friendly">حجز كورة ودي</option>
                    <option value="practice">تمرين أكاديمية</option>
                    <option value="tournament">دورة كرة قدم / بطولة</option>
                    <option value="league">دوري رسمي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 font-bold mb-1 font-sans">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    placeholder="hazem@emam.eg"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-[#030604] border border-emerald-950 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 font-bold mb-1">
                  ملاحظات وطلبات خاصة (أو تفاصيل الدفع المُقدّم)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: تم إيداع عربون الحجز بقيمة ٢٠٠ جنيهاً فودافون كاش."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#030604] border border-emerald-950 rounded-xl p-3 text-xs text-white placeholder-zinc-700 focus:outline-none resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-400 font-bold text-right">{formError}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-400 hover:brightness-110 text-neutral-950 font-black text-xs rounded-xl transition-all"
                >
                  تأليف وتسجيل الحجز فوري بجدول الملعب
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingManualBooking(false); setFormError(''); }}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all"
                >
                  إلغاء التخصيص
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
