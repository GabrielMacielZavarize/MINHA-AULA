import { supabase } from './client';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'reschedule' = 'info',
  metadata?: any,
) {
  const { error } = await supabase.from('notifications').insert([{
    user_id: userId,
    title,
    message,
    type,
    metadata,
    read: false,
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
    createdAt: n.created_at,
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
