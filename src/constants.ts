import { FootballField, Booking } from './types';

export const FIELD_INFO: FootballField = {
  id: 'field-1',
  name: 'ملعب الجراش (طنطا - محلة مرحوم)',
  type: 'indoor', // standard turf pitch
  format: '5v5',
  basePrice: 100, // Price PER HOUR (100 EGP/hr means 150 EGP for 1.5 hrs)
  primePrice: 100, 
  rating: 4.8,
  image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop',
  features: [
    'نجيل صناعي عالي الجودة',
    'إضاءة كاشفة ليلية LED ممتازة',
    'أماكن للانتظار ودورات مياه',
    'موقع متميز بقرية محلة مرحوم'
  ]
};

// We keep PITCH_FIELDS as an array containing just this one field to maintain type safety with any components
export const PITCH_FIELDS: FootballField[] = [FIELD_INFO];

// Generate half-hour intervals from 16:00 to 02:00
export const TIME_SLOTS = [
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30', '00:00', '00:30',
  '01:00', '01:30'
];

export const DURATIONS = [
  { label: 'ساعة واحدة', value: 1 },
  { label: 'ساعة ونصف', value: 1.5 },
  { label: 'ساعتان', value: 2 }
];

// We keep PRESEEDED_BOOKINGS empty as we fetch live from the backend now
export const PRESEEDED_BOOKINGS: Booking[] = [];

export function formatTime12Hour(time24: string): string {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 && h !== 24 ? 'م' : 'ص';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
