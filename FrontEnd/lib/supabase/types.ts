export type UserRole = 'teacher' | 'student';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  subject?: string;
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  hourlyRate?: number;
  createdAt?: string;
  updatedAt?: string;
  enrollmentNumber?: string;
}

export interface Student extends Profile {
  hourlyRate?: number;
  notes?: string;
}

export interface ClassTag {
  id: string;
  name: string;
  color: string;
}

export interface Class {
  id: string;
  teacherId: string;
  studentId?: string | null;
  teacherName?: string;
  studentName?: string;
  studentEnrollment?: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  value: number;
  status: 'open' | 'booked' | 'completed' | 'cancelled' | 'rescheduled' | 'pending_approval';
  notes?: string;
  tags?: ClassTag[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  teacherId: string;
  classId?: string;
  amount: number;
  status: 'paid' | 'pending';
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  subject?: string;
  date?: string;
}

export interface RescheduleRequest {
  id: string;
  classId: string;
  teacherId: string;
  studentId: string;
  proposedDate: string;
  proposedTime: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'reschedule';
  read: boolean;
  metadata?: any;
  createdAt: string;
}
