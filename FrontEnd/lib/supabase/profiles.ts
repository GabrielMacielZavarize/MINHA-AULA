import { supabase } from './client';
import type { Profile } from './types';

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
  };
}

function mapProfileToDb(updates: Partial<Profile>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
  if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.state !== undefined) dbUpdates.state = updates.state;
  if (updates.zipCode !== undefined) dbUpdates.zip_code = updates.zipCode;
  if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
  if (updates.enrollmentNumber !== undefined) dbUpdates.enrollment_number = updates.enrollmentNumber;
  return dbUpdates;
}

function generateEnrollmentNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
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
  const payload = mapProfileToDb(profile);
  if (profile.id) payload.id = profile.id;

  if (profile.role === 'student' && !payload.enrollment_number) {
    let enrollmentNumber: string;
    let exists = true;
    while (exists) {
      enrollmentNumber = generateEnrollmentNumber();
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('enrollment_number', enrollmentNumber)
        .single();
      exists = !!data;
    }
    payload.enrollment_number = enrollmentNumber!;
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

export async function searchTeachers(filters?: { subject?: string; name?: string }) {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'teacher')
    .order('name', { ascending: true });

  if (filters?.subject) query = query.ilike('subject', `%${filters.subject}%`);
  if (filters?.name) query = query.ilike('name', `%${filters.name}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(mapProfileFromDb);
}
