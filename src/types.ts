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
  customerName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "16:00"
  endTime: string; // "17:30"
  duration: number;
  price: number;
  status: 'pending' | 'booked' | 'cancelled';
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
