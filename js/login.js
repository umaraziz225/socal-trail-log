import { initLayout, toast } from "./layout.js";
import { supabase } from "./supabaseClient.js";

const $ = (id) => document.getElementById(id);
if (!supabase) {
  await initLayout();
  $("box").hidden = true;
  $("unconfigured").hidden = false;
} else {
  const modes = {
    login: ["Log in", "Log in", true, true],
    signup: ["Sign up", "Create account", true, true],
    reset: ["Reset password", "Send reset email", true, false],
    recover: ["Choose a new password", "Save new password", false, true],
  };
  let mode = "login";
  const setMode = (m) => {
    mode = m;
    const [title, btn, showEmail, showPw] = modes[m];
    $("title").textContent = title;
    $("submit").textContent = btn;
    $("emailRow").hidden = !showEmail;
    $("pwRow").hidden = !showPw;
    $("password").autocomplete = m === "login" ? "current-password" : "new-password";
    $("err").textContent = "";
    document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", b.dataset.mode === m));
  };
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  // The reset email link returns here with a recovery session.
  const recovering = () => { setMode("recover"); document.querySelector(".tabs").hidden = true; };
  supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") recovering(); });
  await initLayout();
  if (location.hash.includes("type=recovery")) recovering();

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("email").value.trim(), password = $("password").value;
    const bad = mode !== "recover" && !$("email").checkValidity() ? "Enter a valid email."
      : mode !== "reset" && password.length < 6 ? "Password must be at least 6 characters." : "";
    $("err").textContent = bad;
    if (bad) return;
    let error;
    if (mode === "login") {
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      if (!error) return (location.href = "my-hikes.html");
    } else if (mode === "signup") {
      let data;
      ({ data, error } = await supabase.auth.signUp({ email, password }));
      if (!error) {
        if (data.session) return (location.href = "my-hikes.html");
        return toast("Account created. Check your email to confirm it, then log in.");
      }
    } else if (mode === "reset") {
      ({ error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
      if (!error) return toast("If that email has an account, a reset link is on its way.");
    } else {
      ({ error } = await supabase.auth.updateUser({ password }));
      if (!error) { toast("Password updated."); return setTimeout(() => (location.href = "my-hikes.html"), 800); }
    }
    $("err").textContent = error.message;
  });
}
