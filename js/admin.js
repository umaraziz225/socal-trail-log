import { initLayout, esc, toast } from "./layout.js";
import { supabase } from "./supabaseClient.js";
import { getUser, isAdmin } from "./auth.js";

await initLayout();
const $ = (id) => document.getElementById(id);

if (!supabase) {
  $("msg").hidden = false;
  $("msg").innerHTML = 'The admin dashboard needs the backend, which isn\'t configured yet. <a href="index.html">Back home</a>.';
} else if (!(await isAdmin(await getUser()))) {
  location.replace("index.html"); // RLS is the real gate; this just avoids a dead page.
} else {
  $("app").hidden = false;
  let trails = [];
  let editing = null;

  const confirmDelete = (text) => new Promise((res) => {
    $("confirmText").textContent = text;
    $("confirm").addEventListener("close", () => res($("confirm").returnValue === "yes"), { once: true });
    $("confirm").showModal();
  });

  // ---- tabs
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
    $("tab-trails").hidden = b.dataset.tab !== "trails";
    $("tab-messages").hidden = b.dataset.tab !== "messages";
    if (b.dataset.tab === "messages") loadMessages();
  }));

  // ---- trails
  async function loadTrails() {
    const { data, error } = await supabase.from("trails").select("*").order("name");
    if (error) return toast("Could not load trails: " + error.message, "err");
    trails = data;
    $("rows").innerHTML = trails.map((t) => `<tr data-id="${esc(t.id)}">
      <td>${esc(t.name)}</td><td>${esc(t.region)}</td><td>${esc(t.difficulty)}</td><td>${t.distance_miles}</td><td>${t.elevation_gain_ft}</td>
      <td class="actions"><button class="btn" data-edit>Edit</button> <button class="btn btn-danger" data-del>Delete</button></td></tr>`).join("");
  }
  $("rows").addEventListener("click", async (e) => {
    const t = trails.find((x) => x.id === e.target.closest("tr")?.dataset.id);
    if (!t) return;
    if (e.target.matches("[data-edit]")) openForm(t);
    if (e.target.matches("[data-del]") && (await confirmDelete(`Delete "${t.name}"? This also removes users' hike logs for it.`))) {
      const { error } = await supabase.from("trails").delete().eq("id", t.id);
      if (error) return toast("Delete failed: " + error.message, "err");
      toast("Trail deleted.");
      loadTrails();
    }
  });

  const F = { name: "f-name", slug: "f-slug", region: "f-region", difficulty: "f-difficulty", distance_miles: "f-distance", elevation_gain_ft: "f-gain", summit_elevation_ft: "f-summit", est_time: "f-time", trailhead: "f-trailhead", description: "f-desc", image_credit: "f-credit" };
  function openForm(t) {
    editing = t;
    $("formTitle").textContent = t ? "Edit trail" : "Add trail";
    for (const [k, id] of Object.entries(F)) $(id).value = t?.[k] ?? (k === "difficulty" ? "Moderate" : "");
    $("f-six").checked = !!t?.is_six_pack;
    $("f-image").value = "";
    $("err").textContent = "";
    $("editor").showModal();
  }
  $("add").addEventListener("click", () => openForm(null));
  $("cancel").addEventListener("click", () => $("editor").close());
  $("f-name").addEventListener("input", () => {
    if (!editing) $("f-slug").value = $("f-name").value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  });

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const row = { is_six_pack: $("f-six").checked };
    for (const [k, id] of Object.entries(F)) row[k] = $(id).value.trim();
    for (const k of ["distance_miles", "elevation_gain_ft", "summit_elevation_ft"]) row[k] = Number(row[k]);
    const file = $("f-image").files[0];
    const missing = ["name", "slug", "region", "est_time", "trailhead", "description"].find((k) => !row[k]);
    const err = missing ? "Please fill in all required fields."
      : !/^[a-z0-9-]+$/.test(row.slug) ? "Slug may only contain lowercase letters, numbers and hyphens."
      : !(row.distance_miles > 0) || !(row.elevation_gain_ft >= 0) || !(row.summit_elevation_ft >= 0) ? "Distance, elevation gain and summit elevation must be valid numbers."
      : file && file.size > 5 * 1024 * 1024 ? "Photo must be under 5 MB." : "";
    $("err").textContent = err;
    if (err) return;

    $("save").disabled = true;
    try {
      if (file) {
        const path = `${row.slug}-${Date.now()}.${file.name.split(".").pop().toLowerCase()}`;
        const { error } = await supabase.storage.from("trail-photos").upload(path, file, { contentType: file.type });
        if (error) throw error;
        row.image_url = supabase.storage.from("trail-photos").getPublicUrl(path).data.publicUrl;
      } else if (editing) row.image_url = editing.image_url;
      row.updated_at = new Date().toISOString();
      const { error } = editing ? await supabase.from("trails").update(row).eq("id", editing.id) : await supabase.from("trails").insert(row);
      if (error) throw error;
      toast(editing ? "Trail updated." : "Trail added.");
      $("editor").close();
      loadTrails();
    } catch (ex) {
      $("err").textContent = ex.message;
      toast("Save failed.", "err");
    } finally {
      $("save").disabled = false;
    }
  });

  // ---- messages
  async function loadMessages() {
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) return toast("Could not load messages: " + error.message, "err");
    $("messages").innerHTML = data.length ? data.map((m) => `<article class="panel" data-id="${esc(m.id)}">
      <p><strong>${esc(m.name)}</strong> &lt;<a href="mailto:${esc(m.email)}">${esc(m.email)}</a>&gt; &middot; ${new Date(m.created_at).toLocaleString()}</p>
      <p class="pre">${esc(m.message)}</p><button class="btn btn-danger" data-delmsg>Delete</button></article>`).join("") : "<p>No messages yet.</p>";
  }
  $("messages").addEventListener("click", async (e) => {
    if (!e.target.matches("[data-delmsg]")) return;
    if (!(await confirmDelete("Delete this message?"))) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", e.target.closest("article").dataset.id);
    if (error) return toast("Delete failed: " + error.message, "err");
    toast("Message deleted.");
    loadMessages();
  });

  loadTrails();
}
