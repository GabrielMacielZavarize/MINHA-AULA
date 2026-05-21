import { supabase } from './client';
import { createNotification } from './notifications';

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
    date: p.class?.date || p.created_at,
  }));
}

export async function createPayment(payment: any) {
  const dbPayment = {
    student_id: payment.studentId,
    teacher_id: payment.teacherId,
    class_id: payment.classId,
    amount: payment.amount,
    status: payment.status,
  };

  const { data, error } = await supabase
    .from('payments')
    .insert([dbPayment])
    .select()
    .single();

  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("paymentUpdated"));
  }

  return {
    id: data.id,
    studentId: data.student_id,
    teacherId: data.teacher_id,
    classId: data.class_id,
    amount: data.amount,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePayment(paymentId: string, updates: any) {
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

  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("paymentUpdated"));
  }

  if (data.status === 'paid' && data.student_id) {
    await createNotification(
      data.student_id,
      "Pagamento Confirmado",
      "O pagamento da sua aula foi confirmado.",
      "info",
      { paymentId: data.id },
    );
  }

  return {
    id: data.id,
    studentId: data.student_id,
    teacherId: data.teacher_id,
    classId: data.class_id,
    amount: data.amount,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deletePayment(paymentId: string) {
  const { error } = await supabase.from('payments').delete().eq('id', paymentId);
  if (error) throw error;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent("paymentUpdated"));
  }
}
