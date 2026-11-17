import { supabase } from "./supabaseClient.js";

// Same row shape in both modes (data/trails.json mirrors the trails table).
export async function loadTrails() {
  if (supabase) {
    const { data, error } = await supabase.from("trails").select("*").order("name");
    if (error) throw error;
    return data;
  }
  const res = await fetch("data/trails.json");
  if (!res.ok) throw new Error("Could not load data/trails.json");
  return res.json();
}

export async function loadCredits() {
  const res = await fetch("data/credits.json");
  return res.ok ? res.json() : {};
}
