import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Types ---

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
  teacherName?: string; // Joined
  studentName?: string; // Joined
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

export async function acceptClassInvite(classId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .update({ 
      status: 'booked',
      updated_at: new Date().toISOString()
    })
    .eq('id', classId)
    .eq('student_id', user.id)
    .eq('status', 'pending_approval')
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Convite não encontrado ou já respondido.')
  }
  
  // Dispatch event to update dashboard
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"))
  }

  // Notify teacher
  if (data.teacher_id) {
    await createNotification(
      data.teacher_id,
      "Convite Aceito",
      "Um aluno aceitou seu convite para a aula.",
      "info",
      { classId: data.id }
    )
  }
  
  return data;
}

export async function rejectClassInvite(classId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('classes')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', classId)
    .eq('student_id', user.id)
    .eq('status', 'pending_approval');

  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"))
  }

  // Notify teacher (we need to fetch class first to get teacher_id, but here we only have classId and user.id)
  // Ideally we should have fetched the class before updating to know the teacher.
  // For now, let's fetch it briefly or skip if too complex. 
  // Actually, let's fetch the teacher_id from the class before update or use a separate query.
  const { data: classData } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
  if (classData?.teacher_id) {
    await createNotification(
      classData.teacher_id,
      "Convite Recusado",
      "Um aluno recusou seu convite para a aula.",
      "info",
      { classId }
    )
  }
}

// --- Profiles ---

function mapProfileFromDb(data: any): Profile {
  return {
    id: data.id,
    role: data.role,
    name: data.name,
    email: data.email,
    phone: data.phone ?? undefined,
    bio: data.bio ?? undefined,
    subject: data.subject ?? undefined,
    avatar: data.avatar ?? undefined,
    address: data.address ?? undefined,
    city: data.city ?? undefined,
    state: data.state ?? undefined,
    zipCode: data.zip_code ?? undefined,
    hourlyRate: data.hourly_rate ?? undefined,
    enrollmentNumber: data.enrollment_number ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function generateEnrollmentNumber(): string {
  // Generate a random 8-digit number
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

function mapProfileToDb(updates: Partial<Profile>) {
  const dbUpdates: Record<string, any> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar
  if (updates.address !== undefined) dbUpdates.address = updates.address
  if (updates.city !== undefined) dbUpdates.city = updates.city
  if (updates.state !== undefined) dbUpdates.state = updates.state
  if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode
  if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate
  if (updates.enrollmentNumber !== undefined) dbUpdates.enrollment_number = updates.enrollmentNumber
  return dbUpdates
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) return null;
  return mapProfileFromDb(data);
}

export async function createProfile(profile: Omit<Profile, 'createdAt' | 'updatedAt'>) {
  const payload = mapProfileToDb(profile)
  if (profile.id) {
    payload.id = profile.id
  }
  // Generate enrollment number for students
  if (profile.role === 'student' && !payload.enrollment_number) {
    let enrollmentNumber: string
    let exists = true
    // Ensure uniqueness
    while (exists) {
      enrollmentNumber = generateEnrollmentNumber()
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('enrollment_number', enrollmentNumber)
        .single()
      exists = !!data
    }
    payload.enrollment_number = enrollmentNumber!
  }
  const { data, error } = await supabase
    .from('profiles')
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return mapProfileFromDb(data);
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(mapProfileToDb(updates))
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapProfileFromDb(data);
}

// --- Classes ---

// Get all open classes (Marketplace) with optional filters
export async function getOpenClasses(filters?: { subject?: string; teacherName?: string }) {
  let query = supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey (id, name, subject, avatar),
      class_tags (
        tags (*)
      )
    `)
    .eq('status', 'open')
    .is('student_id', null)
    .order('date', { ascending: true });

  if (filters?.subject) {
    query = query.ilike('subject', `%${filters.subject}%`);
  }

  // Filtering by teacher name on a joined table is tricky in simple Supabase queries without embedding.
  // We'll fetch and filter in memory for now if teacherName is provided, or we'd need a more complex query.
  // Given the likely scale, in-memory filtering for teacher name after fetching (or using a different query strategy) is acceptable for MVP.
  // However, let's try to use the !inner join trick if possible, but for now let's stick to simple filtering.
  
  const { data, error } = await query;

  if (error) throw error;

  let formattedData = data.map((c: any) => ({
    ...c,
    teacherId: c.teacher_id,
    studentId: c.student_id,
    teacherName: c.teacher?.name,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags: (c.class_tags || []).map((ct: any) => ct.tags)
  }));

  if (filters?.teacherName) {
    const lowerName = filters.teacherName.toLowerCase();
    formattedData = formattedData.filter((c: any) => 
      c.teacherName?.toLowerCase().includes(lowerName)
    );
  }

  return formattedData;
}

export async function searchTeachers(filters?: { subject?: string; name?: string }) {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('name', { ascending: true });

  if (filters?.subject) {
    query = query.ilike('subject', `%${filters.subject}%`);
  }
  if (filters?.name) {
    query = query.ilike('name', `%${filters.name}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data.map(mapProfileFromDb);
}

// Get classes for a specific teacher (My Schedule/Offerings)
export async function getTeacherClasses(teacherId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      student:profiles!classes_student_id_fkey (name, enrollment_number),
      class_tags (
        tags (*)
      )
    `)
    .eq('teacher_id', teacherId)
    .order('date', { ascending: false });

  if (error) throw error;

  return data.map((c: any) => ({
    ...c,
    teacherId: c.teacher_id,
    studentId: c.student_id,
    studentName: c.student?.name,
    studentEnrollment: c.student?.enrollment_number,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags: (c.class_tags || []).map((ct: any) => ct.tags)
  }));
}

// Get classes for a specific student (My Bookings)
export async function getStudentClasses(studentId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  
  const actualStudentId = studentId || user.id;
  
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey (name),
      class_tags (
        tags (*)
      )
    `)
    .eq('student_id', actualStudentId)
    .order('date', { ascending: true });

  if (error) throw error;

  return data.map((c: any) => ({
    ...c,
    teacherId: c.teacher_id,
    studentId: c.student_id,
    teacherName: c.teacher?.name,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags: (c.class_tags || []).map((ct: any) => ct.tags)
  }));
}

// Get pending class invites for current student
export async function getPendingClassInvites() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey (name, email, phone),
      class_tags (
        tags (*)
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'pending_approval')
    .order('date', { ascending: true });

  if (error) throw error;

  return data.map((c: any) => ({
    ...c,
    teacherId: c.teacher_id,
    studentId: c.student_id,
    teacherName: c.teacher?.name,
    teacherEmail: c.teacher?.email,
    teacherPhone: c.teacher?.phone,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags: (c.class_tags || []).map((ct: any) => ct.tags)
  }));
}

// Get teachers that a student has had classes with
export async function getMyTeachers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .select(`
      teacher:profiles!classes_teacher_id_fkey (
        id,
        name,
        email,
        phone,
        bio,
        subject,
        avatar
      )
    `)
    .eq('student_id', user.id)
    .neq('status', 'pending_approval')
    .not('teacher_id', 'is', null);

  if (error) throw error;

  // Deduplicate teachers
  const teachersMap = new Map();
  data.forEach((c: any) => {
    if (c.teacher) {
      teachersMap.set(c.teacher.id, c.teacher);
    }
  });

  return Array.from(teachersMap.values());
}

export async function createClass(classData: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { tags, ...classFields } = classData;

  const dbClass = {
    teacher_id: user.id,
    student_id: classFields.studentId || null,
    subject: classFields.subject,
    date: classFields.date,
    time: classFields.time,
    duration: classFields.duration,
    value: classFields.value,
    status: classFields.studentId ? 'pending_approval' : 'open',
    notes: classFields.notes
  };

  const { data: newClass, error } = await supabase
    .from('classes')
    .insert([dbClass])
    .select()
    .single();

  if (error) throw error;

  if (tags && tags.length > 0) {
    const classTags = tags.map((tag: any) => ({
      class_id: newClass.id,
      tag_id: tag.id
    }));
    await supabase.from('class_tags').insert(classTags);
  }

  // Dispatch event to update all pages
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"))
  }

  // Notify student if assigned
  if (newClass.student_id) {
    await createNotification(
      newClass.student_id,
      "Novo Convite de Aula",
      `Você recebeu um convite para uma aula de ${newClass.subject}.`,
      "info",
      { classId: newClass.id }
    )
  }

  return newClass;
}

export async function bookClass(classId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .update({ 
      status: 'booked',
      student_id: user.id
    })
    .eq('id', classId)
    .eq('status', 'open') // Ensure it's still open
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Tags ---

export async function getTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*');

  if (error) throw error;
  return data;
}

export async function createTag(tag: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .insert([{ ...tag, teacher_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
// --- Classes (General) ---

export async function getClasses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Check role
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  if (error || !profile) {
    // If profile not found or error, return empty array instead of crashing
    // This can happen if the profile creation is still in progress or failed
    return [];
  }
  
  if (profile.role === 'teacher') {
    return getTeacherClasses(user.id);
  } else {
    return getStudentClasses(user.id);
  }
}

export async function updateClass(classId: string, updates: Partial<Class>) {
  const dbUpdates = mapClassUpdates(updates);

  console.log("Updating class with:", dbUpdates);

  const { data, error } = await supabase
    .from('classes')
    .update(dbUpdates)
    .eq('id', classId)
    .select()
    .single();

  if (error) {
    console.error("Supabase update error:", error);
    throw error;
  }

  // Dispatch event to update all pages
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"))
  }

  // Notify student of update
  if (data.student_id) {
    let title = "Aula Atualizada";
    let message = `Sua aula de ${data.subject} foi atualizada.`;
    
    if (dbUpdates.status === 'cancelled') {
      title = "Aula Cancelada";
      message = `Sua aula de ${data.subject} foi cancelada pelo professor.`;
    } else if (dbUpdates.status === 'completed') {
      title = "Aula Concluída";
      message = `Sua aula de ${data.subject} foi marcada como concluída.`;
    }

    await createNotification(
      data.student_id,
      title,
      message,
      "info",
      { classId: data.id }
    )
  }

  return data;
}

export async function deleteClass(classId: string) {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', classId);

  if (error) throw error;

  // Dispatch event to update all pages
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"))
  }
}

// --- Students (Teacher's View) ---

export async function getStudents() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // In marketplace, students are those who booked classes with this teacher
  // We'll fetch unique students from bookings
  const { data: classes, error } = await supabase
    .from('classes')
    .select('student:profiles!classes_student_id_fkey (*)')
    .eq('teacher_id', user.id)
    .not('student_id', 'is', null);

  if (error) throw error;

  // Deduplicate students
  const studentsMap = new Map();
  classes.forEach((c: any) => {
    if (c.student) {
      studentsMap.set(c.student.id, c.student);
    }
  });

  return Array.from(studentsMap.values());
}

export async function getAllStudents() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('name');

  if (error) throw error;
  return data.map((s: any) => ({
    ...s,
    enrollmentNumber: s.enrollment_number
  }));
}

export async function getStudentByEnrollment(enrollmentNumber: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('enrollment_number', enrollmentNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return {
    ...data,
    enrollmentNumber: data.enrollment_number
  };
}

// Stubs for compatibility with legacy hooks (if needed)
export async function createStudent(student: any) {
  console.warn("createStudent is deprecated in Marketplace mode");
  return null;
}

export async function updateStudent(studentId: string, updates: any) {
   // Teachers can't update student profiles directly in this model, 
   // but maybe we allow adding notes? For now, stub or restricted update.
   console.warn("updateStudent is restricted");
   return null;
}

export async function deleteStudent(studentId: string) {
  console.warn("deleteStudent is restricted");
  return null;
}

// --- Payments ---

export async function getPayments() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      student:profiles!payments_student_id_fkey (name),
      class:classes (subject, date)
    `)
    .or(`teacher_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((p: any) => ({
    id: p.id,
    studentId: p.student_id,
    teacherId: p.teacher_id,
    classId: p.class_id,
    amount: p.amount,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    studentName: p.student?.name,
    subject: p.class?.subject,
    date: p.class?.date || p.created_at
  }));
}

export async function createPayment(payment: any) {
  console.log("Creating payment with:", payment);
  const dbPayment = {
    student_id: payment.studentId,
    teacher_id: payment.teacherId,
    class_id: payment.classId,
    amount: payment.amount,
    status: payment.status
  };

  const { data, error } = await supabase
    .from('payments')
    .insert([dbPayment])
    .select()
    .single();

  if (error) {
    console.error("Supabase createPayment error:", error);
    throw error;
  }
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("paymentUpdated"))
  }

  return {
    id: data.id,
    studentId: data.student_id,
    teacherId: data.teacher_id,
    classId: data.class_id,
    amount: data.amount,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function updatePayment(paymentId: string, updates: any) {
  console.log("Updating payment", paymentId, "with:", updates);
  const dbUpdates: any = {};
  if (updates.studentId) dbUpdates.student_id = updates.studentId;
  if (updates.teacherId) dbUpdates.teacher_id = updates.teacherId;
  if (updates.classId) dbUpdates.class_id = updates.classId;
  if (updates.amount) dbUpdates.amount = updates.amount;
  if (updates.status) dbUpdates.status = updates.status;

  const { data, error } = await supabase
    .from('payments')
    .update(dbUpdates)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    console.error("Supabase updatePayment error:", error);
    throw error;
  }
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("paymentUpdated"))
  }

  // Notify student if paid
  if (data.status === 'paid' && data.student_id) {
    await createNotification(
      data.student_id,
      "Pagamento Confirmado",
      `O pagamento da sua aula foi confirmado.`,
      "info",
      { paymentId: data.id }
    )
  }

  return {
    id: data.id,
    studentId: data.student_id,
    teacherId: data.teacher_id,
    classId: data.class_id,
    amount: data.amount,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

export async function deletePayment(paymentId: string) {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId);

  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("paymentUpdated"))
  }
}

// --- Reschedule System ---

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

export async function createRescheduleRequest(classId: string, studentId: string, proposedDate: string, proposedTime: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create request
  const { data: request, error } = await supabase
    .from('reschedule_requests')
    .insert([{
      class_id: classId,
      teacher_id: user.id,
      student_id: studentId,
      proposed_date: proposedDate,
      proposed_time: proposedTime
    }])
    .select()
    .single();

  if (error) throw error;
  return request;
}

// --- Notifications ---

export async function createNotification(userId: string, title: string, message: string, type: 'info' | 'reschedule' = 'info', metadata?: any) {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      title,
      message,
      type,
      metadata,
      read: false
    }]);

  if (error) {
    console.error("Error creating notification:", error);
  }
}

export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    metadata: n.metadata,
    createdAt: n.created_at
  }));
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}



export async function respondToReschedule(requestId: string, status: 'accepted' | 'rejected') {
  const { data: request, error: fetchError } = await supabase
    .from('reschedule_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  
  if (fetchError) throw fetchError;

  // Update request status
  const { error: updateError } = await supabase
    .from('reschedule_requests')
    .update({ status })
    .eq('id', requestId);

  if (updateError) throw updateError;

  // If accepted, update class
  if (status === 'accepted') {
    await supabase
      .from('classes')
      .update({
        date: request.proposed_date,
        time: request.proposed_time
      })
      .eq('id', request.class_id);
  }

  // Notify teacher
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('notifications').insert([{
    user_id: request.teacher_id,
    title: `Remarcação ${status === 'accepted' ? 'Aceita' : 'Recusada'}`,
    message: `O aluno ${status === 'accepted' ? 'aceitou' : 'recusou'} a remarcação da aula.`,
    type: 'info',
    metadata: { requestId, classId: request.class_id }
  }]);
}

function mapClassUpdates(updates: Partial<Class>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.time !== undefined) dbUpdates.time = updates.time;
  if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
  if (updates.value !== undefined) dbUpdates.value = updates.value;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.teacherId !== undefined) dbUpdates.teacher_id = updates.teacherId;
  // Handle studentId - can be null to remove student assignment
  if ('studentId' in updates) {
    dbUpdates.student_id = updates.studentId === null || updates.studentId === undefined ? null : updates.studentId;
  }
  dbUpdates.updated_at = new Date().toISOString();
  return dbUpdates;
}
