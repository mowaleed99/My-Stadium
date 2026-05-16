import React from 'react';
import { Booking, FootballField } from '../types';
import { Check, X, Calendar, Clock, User, Phone, MessageSquare } from 'lucide-react';

interface BookingSuccessModalProps {
  booking: Booking | null;
  field: FootballField | null;
  onClose: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  booking,
  field,
  onClose,
}) => {
  if (!booking || !field) return null;

  // Localized game type translation
  const translateGameType = (type?: string) => {
    switch (type) {
      case 'friendly': return 'مباراة ودية / حجز تفاعلي';
      case 'practice': return 'تمرين أكاديمية / تدريب فريق';
      case 'tournament': return 'بطولة مغلّقة / دور كرة';
      case 'league': return 'دوري رسمي منظم';
      default: return 'مباراة ودية';
    }
  };

  // Localized Egyptian WhatsApp message
  const message = `السلام عليكم يا كابتن، إدارة ملعب الجول الخماسي بالتجمع ⚽️! حابب آكد حجز الفترة الخاصة بفريقي:
  - الملعب: ${field.name}
  - نظام اللعب: خماسي (5 ضد 5)
  - التاريخ واليوم: ${booking.date}
  - التوقيت المختار: ${booking.timeSlot}
  - اسم الكابتن المسؤول: ${booking.userName}
  - رقم موبايل التواصل: ${booking.userPhone}
  - طبيعة المباراة: ${translateGameType(booking.gameType)}
  - ملاحظات خاصة: ${booking.notes || 'لا يوجد'}

يرجى إرسال موقع الملعب وتأكيد الحجز. شكراً جزيلاً!`;

  const encodedMessage = encodeURIComponent(message);
  // Using a realistic Egyptian admin phone number: +201009400960
  const whatsappUrl = `https://wa.me/201009400960?text=${encodedMessage}`;

  return (
    <div id="booking-success-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="w-full max-w-md glass-panel-heavy rounded-3xl overflow-hidden relative border border-emerald-500/30 shadow-2xl">
        
        {/* Top Gradient Stripe */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
        
        {/* Close Button top-left in RTL */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          {/* Success Animated Badge */}
          <div className="w-16 h-16 rounded-full bg-[#10b981]/15 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>

          <h3 className="text-xl font-black font-sans text-white tracking-tight">
            تم تسجيل حجزك المبدئي! ⚽️
          </h3>
          <p className="text-xs text-white/70 mt-1 max-w-xs mx-auto leading-relaxed">
            تم إدراج فترتك بنجاح في جدول ملعب الجول الخماسي. يرجى الضغط على زر الواتساب لإتمام التأكيد الفوري واستلام لوكيشن اللعب.
          </p>
          
          {/* Luxury Ticket Box */}
          <div className="my-5 bg-[#090e0b] border border-emerald-950 rounded-2xl p-4 text-right relative overflow-hidden shadow-inner">
            {/* Ticket Cutouts on Left and Right borders */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#050906] border-r border-emerald-950 -translate-y-1/2" />
            <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#050906] border-l border-emerald-950 -translate-y-1/2" />
            
            {/* Ticket Header card */}
            <div className="border-b border-white/5 pb-3 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-sans text-emerald-400 font-extrabold tracking-wider block">
                  بطاقة دخول ملعب الجول الخماسي
                </span>
                <p className="text-xs font-bold text-white mt-1 select-none truncate max-w-[210px]">
                  {field.name}
                </p>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-sans font-extrabold px-3 py-1 rounded-full text-center">
                مؤكد مبوئياً
              </span>
            </div>

            {/* Structured details aligned right */}
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs pr-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500/80 shrink-0" />
                <div>
                  <p className="text-[9.5px] text-white/30 font-semibold">تاريخ اليوم</p>
                  <p className="font-bold text-white mt-0.5">{booking.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500/80 shrink-0" />
                <div>
                  <p className="text-[9.5px] text-white/30 font-semibold">توقيت الفترة</p>
                  <p className="font-bold text-white mt-0.5 font-mono">{booking.timeSlot}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500/80 shrink-0" />
                <div>
                  <p className="text-[9.5px] text-white/30 font-semibold">كابتن الفريق</p>
                  <p className="font-bold text-white mt-0.5 truncate max-w-[120px]">{booking.userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500/80 shrink-0" />
                <div>
                  <p className="text-[9.5px] text-white/30 font-semibold">رقم الواتساب</p>
                  <p className="font-bold text-white mt-0.5 font-mono truncate max-w-[120px]">{booking.userPhone}</p>
                </div>
              </div>
            </div>

            {/* Ticket Cutout dashed line */}
            <div className="border-t border-dashed border-emerald-950 mt-4 pt-3 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-white/30 block">كود معاملة الحجز</span>
                <span className="font-mono text-xs text-white/80 font-bold">{booking.id}</span>
              </div>
              <div className="text-left">
                <span className="text-[9px] text-white/30 block">الإجمالي المستحق بالملعب</span>
                <span className="font-sans font-black text-emerald-400 text-sm">{booking.price} ج.م</span>
              </div>
            </div>

            {/* QR Scanner instructions */}
            <div className="mt-4 flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-emerald-950/20">
              <div className="space-y-0.5 text-right">
                <p className="text-[10px] text-emerald-400 font-extrabold">🚨 خطوة أخيرة هامة للتأكيد</p>
                <p className="text-[9px] text-zinc-400">اضغط بالأسفل لإرسال بيانات حجزك للرقم الرسمي للملعب فوراً.</p>
              </div>
              <div className="w-10 h-10 bg-white p-1 rounded shrink-0 flex flex-wrap gap-0.5 relative justify-center items-center">
                {/* Mocking QR code bricks with tiny blocks */}
                <div className="grid grid-cols-4 gap-0.5 w-full h-full">
                  {[...Array(16)].map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-full h-full ${
                        (idx + 1) % 3 === 0 || idx % 4 === 1 ? 'bg-black' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action triggers with large touch targets */}
          <div className="space-y-2 mt-4">
            <a
              href={whatsappUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-black font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-[#25D366]/20 transition-all font-sans duration-300 pointer-events-auto"
            >
              <MessageSquare className="w-5 h-5 fill-current" />
              <span className="text-xs">إرسال تفاصيل ومكان اللعب عبر الواتساب</span>
            </a>

            <button
              onClick={onClose}
              className="w-full py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white text-xs font-bold rounded-xl transition-all"
            >
              جاهز، الرجوع لجدول الملاعب
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
