import { initLayout, esc, toast } from "./layout.js";
import { supabase } from "./supabaseClient.js";
import { getUser } from "./auth.js";
import { loadTrails } from "./data.js";

await initLayout();
const $ = (id) => document.getElementById(id);
const say = (t) => { $("msg").hidden = false; $("msg").innerHTML = t; };

const user = await getUser();
if (!supabase) say('My Hikes needs the backend, which isn\'t configured yet. <a href="index.html">Browse trails</a>.');
else if (!user) say('Please <a href="login.html">log in or sign up</a> to track your hikes.');
else {
  $("app").hidden = false;
  const trails = (await loadTrails()).sort((a, b) => b.is_six_pack - a.is_six_pack || a.name.localeCompare(b.name));
  const done = new Map();

  async function refresh() {
    const { data, error } = await supabase.from("user_hikes").select("*").eq("user_id", user.id);
    if (error) return toast("Could not load your hikes.", "err");
    done.clear();
    data.forEach((h) => done.set(h.trail_id, h));
    render();
  }

  function render() {
    const six = trails.filter((t) => t.is_six_pack), n = six.filter((t) => done.has(t.id)).length;
    $("count").textContent = `${n}/${six.length}`;
    $("bar").style.width = `${(n / six.length) * 100}%`;
    $("bar").parentElement.setAttribute("aria-valuenow", n);
    $("list").innerHTML = trails.map((t) => {
      const h = done.get(t.id);
      return `<form class="hike" data-id="${esc(t.id)}">
        <h3><a href="trail.html?id=${encodeURIComponent(t.slug)}">${esc(t.name)}</a> ${t.is_six_pack ? '<span class="badge">Six-Pack</span>' : ""} ${h ? '<span class="badge done">Completed</span>' : ""}</h3>
        <div class="row">
          <div><label>Date<input type="date" name="date" required max="${new Date().toISOString().slice(0, 10)}" value="${esc(h?.completed_on ?? "")}"></label></div>
          <div class="grow"><label>Note<input name="note" maxlength="300" value="${esc(h?.note ?? "")}"></label></div>
          <button class="btn" type="submit">${h ? "Update" : "Mark completed"}</button>
          ${h ? '<button class="btn btn-danger" type="button" data-remove>Remove</button>' : ""}
        </div></form>`;
    }).join("");
  }

  $("list").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.date.value) return toast("Pick the date you completed it.", "err");
    const { error } = await supabase.from("user_hikes").upsert(
      { user_id: user.id, trail_id: f.dataset.id, completed_on: f.date.value, note: f.note.value.trim() },
      { onConflict: "user_id,trail_id" });
    if (error) return toast("Could not save: " + error.message, "err");
    toast("Saved.");
    refresh();
  });
  $("list").addEventListener("click", async (e) => {
    if (!e.target.matches("[data-remove]")) return;
    const { error } = await supabase.from("user_hikes").delete().eq("user_id", user.id).eq("trail_id", e.target.closest("form").dataset.id);
    if (error) return toast("Could not remove: " + error.message, "err");
    toast("Removed.");
    refresh();
  });
  refresh();
}
