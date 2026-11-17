import { initLayout, esc } from "./layout.js";
import { loadTrails, loadCredits } from "./data.js";

await initLayout();
const id = new URLSearchParams(location.search).get("id");
const out = document.getElementById("detail");
try {
  const [trails, credits] = await Promise.all([loadTrails(), loadCredits()]);
  const t = trails.find((x) => x.slug === id || x.id === id);
  if (!t) throw new Error("not found");
  document.title = `${t.name} | SoCal Trail Log`;
  const c = credits[t.slug];
  const caption = c ? `<a href="${esc(c.source)}" rel="noopener">${esc(c.caption)}</a>` : esc(t.image_credit);
  const stats = [["Distance", `${t.distance_miles} mi`], ["Elevation gain", `${t.elevation_gain_ft.toLocaleString()} ft`], ["Summit", `${t.summit_elevation_ft.toLocaleString()} ft`], ["Difficulty", t.difficulty], ["Est. time", t.est_time]];
  out.innerHTML = `
    <p><a href="index.html#trails">&larr; All trails</a></p>
    <article class="detail">
      <figure>
        ${t.image_url ? `<img src="${esc(t.image_url)}" alt="${esc(t.name)}">` : ""}
        <figcaption>${caption}</figcaption>
      </figure>
      <div>
        ${t.is_six_pack ? '<span class="badge">Six-Pack peak</span>' : ""}
        <h1>${esc(t.name)}</h1>
        <p>${esc(t.region)} &middot; Trailhead: ${esc(t.trailhead)}</p>
        <dl class="stats">${stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
        <p>${esc(t.description)}</p>
        <p><a class="btn" href="my-hikes.html">Log this hike</a></p>
        <p class="note">Stats are approximate; check current conditions and permits before hiking.</p>
      </div>
    </article>`;
} catch {
  out.innerHTML = '<h1>Trail not found</h1><p><a href="index.html">Back to all trails</a></p>';
}
