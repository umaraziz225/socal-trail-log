import { supabase } from "./supabaseClient.js";

export async function getUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function isAdmin(user) {
  if (!supabase || !user) return false;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return !!data;
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut();
  location.href = "index.html";
}
