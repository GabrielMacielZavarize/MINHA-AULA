import { supabase } from './client';
import { createNotification } from './notifications';
import type { Class } from './types';

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
  if ('studentId' in updates) {
    dbUpdates.student_id = updates.studentId === null || updates.studentId === undefined ? null : updates.studentId;
  }
  dbUpdates.updated_at = new Date().toISOString();
  return dbUpdates;
}

export async function getOpenClasses(filters?: { subject?: string; teacherName?: string }) {
  let query = supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey (id, name, subject, avatar),
      class_tags (tags (*))
    `)
    .eq('status', 'open')
    .is('student_id', null)
    .order('date', { ascending: true });

  if (filters?.subject) query = query.ilike('subject', `%${filters.subject}%`);

  const { data, error } = await query;
  if (error) throw error;

  let formattedData = data.map((c: any) => ({
    ...c,
    teacherId: c.teacher_id,
    studentId: c.student_id,
    teacherName: c.teacher?.name,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags: (c.class_tags || []).map((ct: any) => ct.tags),
  }));

  if (filters?.teacherName) {
    const lowerName = filters.teacherName.toLowerCase();
    formattedData = formattedData.filter((c: any) =>
      c.teacherName?.toLowerCase().includes(lowerName),
    );
  }

  return formattedData;
}

export async function getTeacherClasses(teacherId: string) {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      student:profiles!classes_student_id_fkey (name, enrollment_number),
      class_tags (tags (*))
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
    tags: (c.class_tags || []).map((ct: any) => ct.tags),
  }));
}

export async function getStudentClasses(studentId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey (name),
      class_tags (tags (*))
    `)
    .eq('student_id', studentId || user.id)
    .order('date', { ascending: true });

  if (error) throw error;

  return data.map((c: any) => ({
    ...c,
    teacherId: c.teacher_id,
    studentId: c.student_id,
    teacherName: c.teacher?.name,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags: (c.class_tags || []).map((ct: any) => ct.tags),
  }));
}

export async function getPendingClassInvites() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      teacher:profiles!classes_teacher_id_fkey (name, email, phone),
      class_tags (tags (*))
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
    tags: (c.class_tags || []).map((ct: any) => ct.tags),
  }));
}

export async function getMyTeachers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .select(`teacher:profiles!classes_teacher_id_fkey (id, name, email, phone, bio, subject, avatar)`)
    .eq('student_id', user.id)
    .neq('status', 'pending_approval')
    .not('teacher_id', 'is', null);

  if (error) throw error;

  const teachersMap = new Map();
  data.forEach((c: any) => {
    if (c.teacher) teachersMap.set(c.teacher.id, c.teacher);
  });

  return Array.from(teachersMap.values());
}

export async function getClasses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) return [];

  return profile.role === 'teacher'
    ? getTeacherClasses(user.id)
    : getStudentClasses(user.id);
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
    notes: classFields.notes,
  };

  const { data: newClass, error } = await supabase
    .from('classes')
    .insert([dbClass])
    .select()
    .single();

  if (error) throw error;

  if (tags?.length > 0) {
    const classTags = tags.map((tag: any) => ({ class_id: newClass.id, tag_id: tag.id }));
    await supabase.from('class_tags').insert(classTags);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"));
  }

  if (newClass.student_id) {
    await createNotification(
      newClass.student_id,
      "Novo Convite de Aula",
      `Você recebeu um convite para uma aula de ${newClass.subject}.`,
      "info",
      { classId: newClass.id },
    );
  }

  return newClass;
}

export async function bookClass(classId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .update({ status: 'booked', student_id: user.id })
    .eq('id', classId)
    .eq('status', 'open')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClass(classId: string, updates: Partial<Class>) {
  const dbUpdates = mapClassUpdates(updates);

  const { data, error } = await supabase
    .from('classes')
    .update(dbUpdates)
    .eq('id', classId)
    .select()
    .single();

  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"));
  }

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

    await createNotification(data.student_id, title, message, "info", { classId: data.id });
  }

  return data;
}

export async function deleteClass(classId: string) {
  const { error } = await supabase.from('classes').delete().eq('id', classId);
  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"));
  }
}

export async function acceptClassInvite(classId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('classes')
    .update({ status: 'booked', updated_at: new Date().toISOString() })
    .eq('id', classId)
    .eq('student_id', user.id)
    .eq('status', 'pending_approval')
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Convite não encontrado ou já respondido.');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"));
  }

  if (data.teacher_id) {
    await createNotification(
      data.teacher_id,
      "Convite Aceito",
      "Um aluno aceitou seu convite para a aula.",
      "info",
      { classId: data.id },
    );
  }

  return data;
}

export async function rejectClassInvite(classId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('classes')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', classId)
    .eq('student_id', user.id)
    .eq('status', 'pending_approval');

  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("classUpdated"));
  }

  const { data: classData } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', classId)
    .single();

  if (classData?.teacher_id) {
    await createNotification(
      classData.teacher_id,
      "Convite Recusado",
      "Um aluno recusou seu convite para a aula.",
      "info",
      { classId },
    );
  }
}

export async function createRescheduleRequest(
  classId: string,
  studentId: string,
  proposedDate: string,
  proposedTime: string,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data: request, error } = await supabase
    .from('reschedule_requests')
    .insert([{
      class_id: classId,
      teacher_id: user.id,
      student_id: studentId,
      proposed_date: proposedDate,
      proposed_time: proposedTime,
    }])
    .select()
    .single();

  if (error) throw error;
  return request;
}

export async function respondToReschedule(requestId: string, status: 'accepted' | 'rejected') {
  const { data: request, error: fetchError } = await supabase
    .from('reschedule_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('reschedule_requests')
    .update({ status })
    .eq('id', requestId);

  if (updateError) throw updateError;

  if (status === 'accepted') {
    await supabase
      .from('classes')
      .update({ date: request.proposed_date, time: request.proposed_time })
      .eq('id', request.class_id);
  }

  await supabase.from('notifications').insert([{
    user_id: request.teacher_id,
    title: `Remarcação ${status === 'accepted' ? 'Aceita' : 'Recusada'}`,
    message: `O aluno ${status === 'accepted' ? 'aceitou' : 'recusou'} a remarcação da aula.`,
    type: 'info',
    metadata: { requestId, classId: request.class_id },
  }]);
}

export async function getTags() {
  const { data, error } = await supabase.from('tags').select('*');
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
