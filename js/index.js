import { initLayout, esc, toast } from "./layout.js";
import { loadTrails } from "./data.js";

await initLayout();
const $ = (id) => document.getElementById(id);
let trails = [];
try { trails = await loadTrails(); } catch (e) { toast("Could not load trails.", "err"); }

$("region").insertAdjacentHTML("beforeend", [...new Set(trails.map((t) => t.region))].sort().map((r) => `<option>${esc(r)}</option>`).join(""));

function render() {
  const q = $("q").value.trim().toLowerCase(), region = $("region").value, diff = $("diff").value, sort = $("sort").value;
  const list = trails
    .filter((t) => (!region || t.region === region) && (!diff || t.difficulty === diff) && (!q || `${t.name} ${t.trailhead}`.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : a[sort] - b[sort]));
  $("count").textContent = `${list.length} trail${list.length === 1 ? "" : "s"}`;
  $("grid").innerHTML = list.map((t) => `
    <a class="card" href="trail.html?id=${encodeURIComponent(t.slug)}">
      ${t.image_url ? `<img src="${esc(t.image_url)}" alt="${esc(t.name)}" loading="lazy">` : '<div class="ph" role="img" aria-label="No photo"></div>'}
      <div class="body">
        ${t.is_six_pack ? '<span class="badge">Six-Pack</span> ' : ""}<span class="badge">${esc(t.difficulty)}</span>
        <h3>${esc(t.name)}</h3>
        <p class="meta">${esc(t.region)}<br>${t.distance_miles} mi &middot; ${t.elevation_gain_ft.toLocaleString()} ft gain</p>
      </div>
    </a>`).join("") || "<p>No trails match your filters.</p>";
}
for (const id of ["q", "region", "diff", "sort"]) $(id).addEventListener("input", render);
render();
