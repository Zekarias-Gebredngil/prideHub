export type BookingStatus =
  | 'PENDING' | 'CONSULTATION' | 'QUOTATION' | 'CONFIRMED'
  | 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export type EventType =
  | 'WEDDING' | 'BIRTHDAY' | 'CORPORATE' | 'GRADUATION'
  | 'ENGAGEMENT' | 'BABY_SHOWER' | 'TRADITIONAL_WEDDING' | 'CONCERT' | 'CONFERENCE' | 'OTHER';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMethod = 'CHAPA' | 'TELEBIRR' | 'STRIPE' | 'BANK_TRANSFER' | 'CASH';

export interface Booking {
  id: string;
  bookingNumber: string;
  clientId: string;
  assignedTo?: string;
  packageId?: string;
  venueId?: string;
  eventType: EventType;
  eventDate: string;
  guestCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  specialRequests?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; fullName: string; email: string; avatar?: string };
  planner?: { id: string; fullName: string; email: string };
  package?: { id: string; name: string; tier: string };
  venue?: { id: string; name: string; city: string };
  items?: BookingItem[];
  invoices?: Invoice[];
  payments?: Payment[];
  tasks?: Task[];
}

export interface BookingItem {
  id: string;
  bookingId: string;
  serviceId?: string;
  vendorId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  bookingId: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmt: number;
  total: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate?: string;
  paidAt?: string;
  pdfUrl?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  paidAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface TimelineEntry {
  id: string;
  title: string;
  description?: string;
  date: string;
  isDone: boolean;
  sortOrder: number;
}
