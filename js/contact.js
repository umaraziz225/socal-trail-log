import { initLayout, toast } from "./layout.js";
import { supabase } from "./supabaseClient.js";

await initLayout();
const f = document.getElementById("form"), err = document.getElementById("err");
f.addEventListener("submit", async (e) => {
  e.preventDefault();
  const row = { name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim() };
  err.textContent = !row.name || !row.message ? "Please fill in your name and message." : !row.email || !f.email.checkValidity() ? "Please enter a valid email." : "";
  if (err.textContent) return;
  if (!supabase) return toast("Backend not configured yet, so messages can't be sent in demo mode.", "err");
  const { error } = await supabase.from("contact_messages").insert(row);
  if (error) return toast("Could not send your message. Try again later.", "err");
  f.reset();
  toast("Message sent. Thank you!");
});
