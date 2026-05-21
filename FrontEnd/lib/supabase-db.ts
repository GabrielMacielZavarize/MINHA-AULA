// Barrel re-export — preserves backward compatibility for all existing imports
export { supabase } from './supabase/client';
export type { UserRole, Profile, Student, ClassTag, Class, Payment, RescheduleRequest, Notification } from './supabase/types';
export { getProfile, createProfile, updateProfile, searchTeachers } from './supabase/profiles';
export {
  getOpenClasses,
  getTeacherClasses,
  getStudentClasses,
  getPendingClassInvites,
  getMyTeachers,
  getClasses,
  createClass,
  bookClass,
  updateClass,
  deleteClass,
  acceptClassInvite,
  rejectClassInvite,
  createRescheduleRequest,
  respondToReschedule,
  getTags,
  createTag,
} from './supabase/classes';
export { getStudents, getAllStudents, getStudentByEnrollment, createStudent, updateStudent, deleteStudent } from './supabase/students';
export { getPayments, createPayment, updatePayment, deletePayment } from './supabase/payments';
export {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from './supabase/notifications';
