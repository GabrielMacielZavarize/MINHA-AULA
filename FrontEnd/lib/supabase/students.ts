import { supabase } from './client';

export async function getStudents() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: classes, error } = await supabase
    .from('classes')
    .select('student:profiles!classes_student_id_fkey (*)')
    .eq('teacher_id', user.id)
    .not('student_id', 'is', null);

  if (error) throw error;

  const studentsMap = new Map();
  classes.forEach((c: any) => {
    if (c.student) studentsMap.set(c.student.id, c.student);
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
  return data.map((s: any) => ({ ...s, enrollmentNumber: s.enrollment_number }));
}

export async function getStudentByEnrollment(enrollmentNumber: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .eq('enrollment_number', enrollmentNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return { ...data, enrollmentNumber: data.enrollment_number };
}

export async function createStudent(_student: any) {
  console.warn("createStudent is deprecated in Marketplace mode");
  return null;
}

export async function updateStudent(_studentId: string, _updates: any) {
  console.warn("updateStudent is restricted");
  return null;
}

export async function deleteStudent(_studentId: string) {
  console.warn("deleteStudent is restricted");
  return null;
}
