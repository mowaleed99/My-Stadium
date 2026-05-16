import { FootballField, Booking } from './types';

export const FIELD_INFO: FootballField = {
  id: 'field-1',
  name: 'ملعب الجراش (طنطا - محلة مرحوم)',
  type: 'indoor', // standard turf pitch
  format: '5v5',
  basePrice: 150, // Typical local pricing or just set to a simple fixed number
  primePrice: 150, // Keeping it the same to avoid typescript errors if used elsewhere
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

export const TIME_SLOTS = [
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '20:00 - 21:00',
  '21:00 - 22:00',
  '22:00 - 23:00',
  '23:00 - 00:00',
  '00:00 - 01:00',
  '01:00 - 02:00'
];

export function isPrimeSlot(slot: string): boolean {
  return false; // No complex pricing
}

// Preseeded list of realistic bookings for Cairo venue (May 15, 2026)
export const PRESEEDED_BOOKINGS: Booking[] = [
  {
    id: 'b-101',
    fieldId: 'field-1',
    date: '2026-05-15',
    timeSlot: '17:00 - 18:00',
    userName: 'كابتن أحمد حسن',
    userPhone: '01001234567',
    price: 150,
    status: 'confirmed',
    gameType: 'friendly',
    notes: 'حجز أسبوعي متكرر لجروب الأصدقاء.',
    createdAt: '2026-05-14T10:00:00Z'
  },
  {
    id: 'b-102',
    fieldId: 'field-1',
    date: '2026-05-15',
    timeSlot: '18:00 - 19:00',
    userName: 'أكاديمية الفرسان',
    userPhone: '01112223333',
    price: 150,
    status: 'confirmed',
    gameType: 'practice',
    notes: 'تمرين الناشئين للمرحلة العمرية تحت ١٤ سنة.',
    createdAt: '2026-05-13T14:30:00Z'
  },
  {
    id: 'b-103',
    fieldId: 'field-1',
    date: '2026-05-15',
    timeSlot: '21:00 - 22:00',
    userName: 'كابتن محمود رضا',
    userPhone: '01224445555',
    price: 150,
    status: 'pending',
    gameType: 'friendly',
    notes: 'مباراة ودية تحدي كاش مع فريق مدينة نصر.',
    createdAt: '2026-05-15T09:12:00Z'
  },
  {
    id: 'b-104',
    fieldId: 'field-1',
    date: '2026-05-16',
    timeSlot: '20:00 - 21:00',
    userName: 'كابتن مصطفى يونس',
    userPhone: '01550987654',
    price: 150,
    status: 'confirmed',
    gameType: 'tournament',
    notes: 'مباراة ربع النهائي لدورة رمضان الودية.',
    createdAt: '2026-05-14T15:22:00Z'
  }
];
