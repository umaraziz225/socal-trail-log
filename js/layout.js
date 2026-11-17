// Shared header, footer, demo banner and toast. Every page imports this once.
import { isConfigured } from "./supabaseClient.js";
import { getUser, isAdmin, signOut } from "./auth.js";

const links = [
  ["index.html", "Trails"],
  ["my-hikes.html", "My Hikes"],
  ["contact.html", "Contact"],
];

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function toast(msg, type = "ok") {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.setAttribute("aria-live", "polite");
    document.body.append(box);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  box.append(t);
  setTimeout(() => t.remove(), 4000);
}

export async function initLayout() {
  const page = location.pathname.split("/").pop() || "index.html";
  const user = await getUser();
  const admin = await isAdmin(user);
  const nav = [...links, ...(admin ? [["admin.html", "Admin"]] : [])]
    .map(([h, t]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ""}>${t}</a>`)
    .join("");
  const auth = user ? `<button class="btn btn-ghost" id="logout">Log out</button>` : `<a class="btn" href="login.html">Log in</a>`;

  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#main">Skip to content</a>
    ${isConfigured ? "" : '<div class="banner">Demo mode: backend not connected.</div>'}
    <header class="site-header"><div class="wrap bar">
      <a class="brand" href="index.html">SoCal Trail Log</a>
      <button class="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="Menu">&#9776;</button>
      <nav id="nav">${nav}${auth}</nav>
    </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer"><div class="wrap">
      <nav aria-label="Footer"><a href="index.html">Trails</a><a href="my-hikes.html">My Hikes</a><a href="contact.html">Contact</a><a href="credits.html">Photo credits</a></nav>
      <p>Stats are approximate; check current conditions and permits before hiking.</p>
    </div></footer>`);

  const btn = document.querySelector(".menu-btn");
  btn.addEventListener("click", () => {
    const open = document.getElementById("nav").classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
  });
  document.getElementById("logout")?.addEventListener("click", signOut);
}
