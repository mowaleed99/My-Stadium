import React, { useState, useMemo, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import arLocale from '@fullcalendar/core/locales/ar';
import { API_URL, WHATSAPP_NUMBER } from './config';
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
  const expectedAdminToken = (import.meta as any).env.VITE_ADMIN_TOKEN || 'jarash123';

  // Application Mode
  const [appMode, setAppMode] = useState<'public' | 'admin' | 'login'>('public');

  // Simple MVP Auth
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam === expectedAdminToken) {
      localStorage.setItem('isAdmin', 'true');
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      setAppMode('admin');
    } else if (tokenParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [expectedAdminToken]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === expectedAdminToken) {
      localStorage.setItem('isAdmin', 'true');
      setIsAuthenticated(true);
      setAppMode('admin');
      setLoginError('');
      setLoginPassword('');
    } else {
      setLoginError('كلمة المرور غير صحيحة');
    }
  };

  // Local database of bookings
  const [bookings, setBookings] = useState<Booking[]>(PRESEEDED_BOOKINGS);

  // Selected date, default is today "2026-05-15"
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);

  type DailyAvailability = {
    date: string;
    slots: { id: string; time: string; status: string }[];
  };

  // Full calendar state
  const [monthData, setMonthData] = useState<DailyAvailability[]>([]);
  const [calendarRange, setCalendarRange] = useState({ start: '', end: '' });
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Core Booking State
  const [selectedFieldId, setSelectedFieldId] = useState<string>(PITCH_FIELDS[0].id);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);
  const [latestBookingField, setLatestBookingField] = useState<FootballField | null>(null);

  // Form Data
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [gameType, setGameType] = useState<any>('friendly');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Admin / Manual Booking Fields
  const [adminSelectedFieldId, setAdminSelectedFieldId] = useState<string>(PITCH_FIELDS[0].id);
  const [isAddingManualBooking, setIsAddingManualBooking] = useState(false);
  const [manualSlot, setManualSlot] = useState('');
  const [inspectedBooking, setInspectedBooking] = useState<Booking | null>(null);

  // Derived slots for the currently selected date (filling in empty timeslots as available)
  const apiSlots = useMemo(() => {
    if (!selectedDate) return [];
    const day = monthData.find(d => d.date === selectedDate);
    const fetchedSlots = day ? day.slots : [];
    
    return TIME_SLOTS.map(time => {
       const found = fetchedSlots.find(s => s.time === time);
       if (found) return found;
       return { id: `auto-${time}`, time, status: 'available' };
    });
  }, [selectedDate, monthData]);

  // Fetch full month availability with 30s polling
  useEffect(() => {
    if (!calendarRange.start || !calendarRange.end) return;
    
    const fetchRange = () => {
      fetch(`${API_URL}?from=${calendarRange.start}&to=${calendarRange.end}`)
        .then(r => r.json())
        .then(data => { if (data.success) setMonthData(data.data); })
        .catch(() => {});
    };
    
    setIsLoading(true);
    fetchRange();
    
    const interval = setInterval(fetchRange, 30000);
    return () => clearInterval(interval);
  }, [calendarRange.start, calendarRange.end]);

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

  // Optimistic UI for Booking
  const setOptimisticSlotStatus = (date: string, time: string, status: string) => {
    setMonthData(prev => prev.map(day => {
      if (day.date === date) {
        // Find existing slot or append
        const exists = day.slots.find(s => s.time === time);
        if (exists) {
          return { ...day, slots: day.slots.map(s => s.time === time ? { ...s, status } : s) };
        } else {
          return { ...day, slots: [...day.slots, { id: `auto-${time}`, time, status }] };
        }
      }
      return day;
    }));
  };

  // Public Booking Submit — book slot in sheet then open WhatsApp
  const handlePlaceBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setFormError('يرجى تحديد فترة زمنية أولاً.');
      return;
    }

    const params = new URLSearchParams({
      action: 'book',
      date: selectedDate,
      time: selectedSlot,
      name: 'واتساب',
      phone: WHATSAPP_NUMBER
    });
    fetch(`${API_URL}?${params}`).catch(() => {});

    setOptimisticSlotStatus(selectedDate, selectedSlot, 'pending');

    const message = `مرحباً، أريد حجز ملعب الجراش\nالتاريخ: ${selectedDate}\nالوقت: ${selectedSlot}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');

    setSelectedSlot(null);
    setFormError('');
    setIsDayModalOpen(false); // Close modal on success
  };

  // Admin: Approve pending slot → booked
  const approveSlot = (date: string, time: string) => {
    setOptimisticSlotStatus(date, time, 'booked');
    const params = new URLSearchParams({ action: 'approve', date, time });
    fetch(`${API_URL}?${params}`).catch(() => {});
  };

  // Admin: Reject pending slot → available again
  const rejectSlot = (date: string, time: string) => {
    setOptimisticSlotStatus(date, time, 'available');
    const params = new URLSearchParams({ action: 'reject', date, time });
    fetch(`${API_URL}?${params}`).catch(() => {});
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

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (appMode !== 'public') {
                setAppMode('public');
              } else {
                if (isAuthenticated) {
                  setAppMode('admin');
                } else {
                  setAppMode('login');
                }
              }
            }}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/20 transition-all flex items-center gap-2"
          >
            {appMode === 'public' ? (
              <>
                <User className="w-3.5 h-3.5" />
                دخول الإدارة
              </>
            ) : (
              'العودة للحجز'
            )}
          </button>
          {isAuthenticated && appMode === 'admin' && (
            <button
              onClick={() => {
                localStorage.removeItem('isAdmin');
                setIsAuthenticated(false);
                setAppMode('public');
              }}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/20 transition-all"
            >
              تسجيل الخروج
            </button>
          )}
        </div>
      </header>



      {/* CORE WORKFLOW AREA */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10 flex-1">
        
        {/* VIEW 1: ADMIN LOGIN PAGE */}
        {appMode === 'login' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-emerald-500/20 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">تسجيل دخول الإدارة</h2>
              <p className="text-xs text-zinc-400 mb-8">يرجى إدخال كلمة المرور للوصول إلى لوحة التحكم</p>
              
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    placeholder="كلمة المرور"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#030604] border border-emerald-950 rounded-xl py-3 px-4 text-center text-white focus:outline-none focus:border-emerald-500/60 font-mono tracking-widest"
                    autoFocus
                  />
                  {loginError && (
                    <p className="text-rose-400 text-xs mt-2">{loginError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-sm rounded-xl transition-all"
                >
                  دخول
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 2: PUBLIC BOOKING FLOW (FULL MONTH CALENDAR) */}
        {appMode === 'public' && (
          <div className="space-y-6">
            <div className="bg-[#0b120d] rounded-2xl p-4 border border-[#14261a]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-sm font-black text-white tracking-tight">
                    اختر يوم الحجز من النتيجة
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    انقر على اليوم لعرض جميع الفترات المتاحة
                  </p>
                </div>
                <div className="flex gap-2.5 text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-zinc-400"><span className="w-2.5 h-2.5 rounded bg-[#10b981]" /> متاح</span>
                  <span className="flex items-center gap-1 text-zinc-400"><span className="w-2.5 h-2.5 rounded bg-[#f59e0b]" /> محجوز جزئياً</span>
                  <span className="flex items-center gap-1 text-zinc-400"><span className="w-2.5 h-2.5 rounded bg-[#ef4444]" /> محجوز بالكامل</span>
                </div>
              </div>

              {/* FullCalendar Wrapper */}
              <div className="calendar-container rounded-xl overflow-hidden text-xs" dir="ltr">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={arLocale}
                  direction="rtl"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: ''
                  }}
                  events={monthData.map(day => {
                    const totalSlots = TIME_SLOTS.length;
                    const bookedCount = day.slots.filter(s => s.status === 'booked' || s.status === 'pending').length;
                    let color = '#10b981'; // Green
                    if (bookedCount === totalSlots) color = '#ef4444'; // Red
                    else if (bookedCount > 0) color = '#f59e0b'; // Yellow

                    return {
                      start: day.date,
                      display: 'background',
                      backgroundColor: color,
                    };
                  })}
                  datesSet={(arg) => {
                    setCalendarRange({
                      start: arg.startStr.split('T')[0],
                      end: arg.endStr.split('T')[0]
                    });
                  }}
                  dateClick={(arg) => {
                    setSelectedDate(arg.dateStr);
                    setSelectedSlot(null);
                    setIsDayModalOpen(true);
                  }}
                  height="auto"
                />
              </div>
            </div>

            {/* DAY MODAL OVERLAY */}
            {isDayModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="w-full max-w-lg bg-[#070e0a] border border-emerald-950/40 rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-4 border-b border-emerald-950/20 flex justify-between items-center bg-[#0b120d]">
                    <div>
                      <h3 className="text-sm font-black text-white">حجز يوم: <span className="text-emerald-400 font-mono tracking-wider">{selectedDate}</span></h3>
                      <p className="text-[10px] text-zinc-400 mt-1">سعر الفترة الواحدة: {currentPublicField.basePrice} ج.م</p>
                    </div>
                    <button 
                      onClick={() => setIsDayModalOpen(false)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 overflow-y-auto space-y-4">
                    {isLoading ? (
                      <div className="py-10 text-center text-zinc-400 text-xs">جاري تحميل المواعيد...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {apiSlots.map(({ id, time, status }) => {
                          const isBooked  = status === 'booked';
                          const isPending = status === 'pending';
                          const isUnavailable = isBooked || isPending;
                          const isCurrentlySelected = selectedSlot === time;
                          
                          return (
                            <button
                              key={id}
                              onClick={() => {
                                if (!isUnavailable) {
                                  setSelectedSlot(time);
                                  setFormError('');
                                } else {
                                  setFormError(`عذراً، الفترة "${time}" ${isPending ? 'بانتظار التأكيد' : 'محجوزة'}.`);
                                }
                              }}
                              disabled={isUnavailable}
                              className={`p-3 text-center border transition-all duration-200 flex flex-col justify-center items-center rounded-xl h-[80px] ${
                                isBooked ? 'bg-[#121212] border-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed'
                                : isPending ? 'bg-amber-950/30 border-amber-700/50 text-amber-500 cursor-not-allowed'
                                : isCurrentlySelected ? 'bg-[#122c18] border-emerald-400 text-white shadow-md ring-2 ring-emerald-500/30'
                                : 'bg-[#0b100c] border-[#16271a] text-zinc-300 hover:border-emerald-500/35'
                              }`}
                            >
                              <span className="text-xs font-bold font-mono block">{time}</span>
                              <span className={`text-[10px] font-extrabold mt-1 block ${isBooked ? 'text-zinc-500' : isPending ? 'text-amber-500' : 'text-emerald-400'}`}>
                                {isBooked ? 'محجوز' : isPending ? 'بانتظار' : 'متاح'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {formError && (
                      <div className="p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg text-xs text-rose-400 text-center">
                        {formError}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer / Submit */}
                  <div className="p-4 border-t border-emerald-950/20 bg-[#0b120d]">
                    <button
                      onClick={handlePlaceBookingSubmit}
                      disabled={!selectedSlot}
                      className={`w-full py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                        selectedSlot 
                          ? 'bg-[#25D366] hover:bg-[#20ba59] text-black shadow-lg hover:shadow-[#25D366]/20' 
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      تأكيد الفترة المحددة عبر الواتساب
                    </button>
                  </div>
                  
                </div>
              </div>
            )}
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
                    {apiSlots.map(({ id, time, status }) => {
                      const isPending   = status === 'pending';
                      const isBooked    = status === 'booked';
                      const isAvailable = status === 'available';
                      return (
                        <div
                          key={id}
                          className={`p-4 transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                            isBooked  ? 'bg-gradient-to-l from-emerald-950/10 via-transparent to-transparent'
                            : isPending ? 'bg-gradient-to-l from-amber-950/10 via-transparent to-transparent'
                            : 'bg-transparent hover:bg-white/[0.01]'
                          }`}
                        >
                          {/* Time + status badge */}
                          <div className="flex items-center gap-3 shrink-0 min-w-[130px]">
                            <span className="font-mono text-xs text-white font-bold">{time}</span>
                            {isPending && (
                              <span className="text-[8px] bg-amber-500/10 text-amber-400 font-bold px-1.5 py-0.5 rounded">
                                ⏳ بانتظار
                              </span>
                            )}
                            {isBooked && (
                              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                                ✓ محجوز
                              </span>
                            )}
                            {isAvailable && (
                              <span className="text-[8px] bg-zinc-800 text-zinc-500 font-bold px-1.5 py-0.5 rounded">
                                شاغر
                              </span>
                            )}
                          </div>

                          {/* Status description */}
                          <div className="flex-1 min-w-0 text-[11px]">
                            {isBooked && <span className="text-emerald-400 font-bold">تم الحجز والتأكيد</span>}
                            {isPending && <span className="text-amber-400">بانتظار تأكيد الدفع عبر الواتساب</span>}
                            {isAvailable && <span className="text-zinc-500 italic">الفترة شاغرة • متاحة للحجز</span>}
                          </div>

                          {/* Action buttons */}
                          <div className="shrink-0 flex items-center gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => approveSlot(selectedDate, time)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-[10.5px] font-black rounded-lg transition-all"
                                >
                                  ✔ تأكيد
                                </button>
                                <button
                                  onClick={() => rejectSlot(selectedDate, time)}
                                  className="px-3 py-1 bg-rose-900/40 hover:bg-rose-800/60 border border-rose-700/30 text-rose-400 text-[10.5px] font-black rounded-lg transition-all"
                                >
                                  ✖ رفض
                                </button>
                              </>
                            )}
                            {isBooked && (
                              <button
                                onClick={() => rejectSlot(selectedDate, time)}
                                className="px-3 py-1 bg-white/5 hover:bg-rose-900/30 text-zinc-400 hover:text-rose-400 text-[10.5px] font-bold rounded-lg transition-all"
                              >
                                إلغاء
                              </button>
                            )}
                            {isAvailable && (
                              <button
                                onClick={() => {
                                  setManualSlot(time);
                                  setIsAddingManualBooking(true);
                                }}
                                className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10.5px] font-bold rounded-lg transition-all"
                              >
                                + حجز يدوي
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
