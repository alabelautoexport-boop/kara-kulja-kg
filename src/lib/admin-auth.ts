import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("is_admin");

  if (error) return false;
  return data === true;
}

export async function loginAdmin(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Неверный email или пароль.");

  if (!(await isCurrentUserAdmin())) {
    await supabase.auth.signOut();
    throw new Error("У этой учётной записи нет прав администратора.");
  }
}

export async function logoutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Не удалось завершить сеанс.");
}
