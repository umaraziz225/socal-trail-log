import { initLayout, esc } from "./layout.js";
import { loadTrails, loadCredits } from "./data.js";

await initLayout();
const [trails, credits] = await Promise.all([loadTrails(), loadCredits()]);
document.getElementById("list").innerHTML = trails.filter((t) => credits[t.slug]).map((t) => {
  const c = credits[t.slug];
  return `<li><strong>${esc(t.name)}</strong>: ${esc(c.author)}, <a href="${esc(c.license_url || c.source)}" rel="noopener">${esc(c.license)}</a> (<a href="${esc(c.source)}" rel="noopener">source</a>)</li>`;
}).join("");
