export interface FootballField {
  id: string;
  name: string;
  type: 'stadium' | 'hybrid' | 'indoor';
  format: '11v11' | '7v7' | '5v5';
  basePrice: number;
  primePrice: number;
  rating: number;
  image: string;
  features: string[];
}

export type BookingStatus = 'confirmed' | 'pending' | 'canceled';

export interface Booking {
  id: string;
  fieldId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "17:30 - 19:00"
  userName: string;
  userPhone: string;
  userEmail?: string;
  price: number;
  status: BookingStatus;
  gameType?: 'friendly' | 'tournament' | 'practice' | 'league';
  notes?: string;
  createdAt: string;
}

export interface TimeSlotState {
  time: string;
  isBooked: boolean;
  booking?: Booking;
}

export interface DailySummary {
  date: string;
  revenue: number;
  bookingCount: number;
  occupancyRate: number;
}
