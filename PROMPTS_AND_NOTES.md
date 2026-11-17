# Prompts and Notes

## Original prompt
Build "SoCal Trail Log", a static full-stack app (HTML/CSS/vanilla JS + Supabase) in 6 phases. See the course submission for the full prompt text.

## Phase 1: Scaffold
- Created folders, README, .gitignore, shared CSS, `config.js`, `supabaseClient.js`, `auth.js`, `data.js`, `layout.js`.
- `data/trails.json` has 9 trails with the same columns as the future `trails` table.
- Decisions:
  - Supabase SDK is dynamically imported only when `config.js` has real values, so demo mode works offline.
  - Header/footer/demo banner/toasts are injected by `layout.js` so every page shares one copy.
  - Supabase SDK pinned to 2.45.4 via jsDelivr.
- Stats are my best estimates from memory (not verified against a live source). The site footer says they are approximate.
- Problems: none yet. `image_credit` is empty until Phase 2.

## Phase 2: Photos from Wikimedia Commons
- Searched the Commons API (generator=search, imageinfo/extmetadata), kept only CC0 / Public domain / CC BY / CC BY-SA, landscape, >=1600px wide.
- Downloaded 1600px versions, recompressed with `sharp` (JPEG, all under 400KB) into `assets/img/trails/<slug>.jpg`.
- Author, license, license URL and source page saved in `data/credits.json`; `image_credit` in `data/trails.json` now holds the caption.
- Problems hit:
  - No Python installed, so I used Node for all scripts.
  - Commons rate-limited me ("too many requests"); added delays between calls.
  - First picks for Cowles (street scene), Mt. Woodson (watermark "HikingGuy.com"), San Jacinto (hazy aerial) and Mt. Wilson (hazy) looked poor on visual review and were replaced.
- Photos that are not a perfect match (swap them if you find better; see credits.json for sources):
  - Mt. Wilson: marine layer view from the summit area, not the Chantry Flat trail.
  - San Jacinto Peak: snowy face of the mountain from a distance.
  - Cowles Mountain: view of the mountain over San Carlos homes.
  - Mt. Woodson: boulder on the Mt. Woodson trail (not Potato Chip Rock itself).
  - Iron Mountain: distant view of the mountain from Black Mountain.
  - Cucamonga Peak, Mt. Baldy, San Bernardino Peak and San Gorgonio show the peaks (or the trail area) directly.
- No gradient placeholders needed; every trail has a photo.
- Licenses were read from API metadata; I did not independently verify the uploader's claim.

## Phase 3: Public pages
- Built `index.html` (hero, Six-Pack explainer, search/region/difficulty filters, sort by name/distance/elevation), `trail.html?id=<slug>`, `contact.html`, `credits.html`, each with its own `js/<page>.js`. Added a shared `esc()` helper (in `layout.js`) so trail text is HTML-escaped before rendering.
- Contact form validates, then inserts into `contact_messages`; in demo mode it shows a "backend not configured" toast instead of failing.
- "Log this hike" and the nav's My Hikes / Log in links point to pages that arrive in Phase 4.
- Tested in headless Chrome (puppeteer-core) at 375, 768 and 1280px on all four pages: no horizontal overflow, no console errors, filter and mobile menu work, screenshots reviewed.
- Problems hit:
  - `npx serve` redirects `trail.html?id=x` to `/trail` and drops the query string, so the trail page said "not found". This is a serve quirk, not an app bug (GitHub Pages keeps the query). I tested with a plain Node static server instead.
  - A favicon 404 showed up as a console error; fixed with an inline `<link rel="icon" href="data:,">`.
  - The first batch of file writes silently failed (shell syntax error) and had to be redone.
- Hero photo is the San Gorgonio image (already listed in credits.html).

## Phase 4: Auth, My Hikes, Admin
- `login.html` (log in / sign up / reset password in one page; the reset email returns to the same page and shows a "choose a new password" form), `my-hikes.html` (mark completed with date and note, update, remove, Six-Pack progress bar), `admin.html` (Trails and Messages tabs, add/edit dialog with validation and photo upload to the `trail-photos` bucket, delete confirmations via `<dialog>`, toasts instead of `alert()`).
- Non-admins are redirected home from admin.html, but this is only convenience: the real protection is the RLS policies in Phase 5.
- Decisions:
  - Used upsert on `user_hikes (user_id, trail_id)` so "Update" and "Mark completed" share one code path; needs the unique constraint and an update policy in the schema.
  - Contact message text is HTML-escaped when shown in the admin inbox.
  - The login page registers the `PASSWORD_RECOVERY` listener before any await (and also checks `#type=recovery` in the URL) so the event can't be missed.
- Testing: demo mode on all three pages at 375/768/1280px (friendly "backend not configured" message, no console errors, no overflow). Because Supabase isn't connected yet, I also ran my-hikes and admin in headless Chrome against a mocked Supabase REST API with a fake admin session: save/remove hike, progress 0/6 -> 1/6, trail add with validation, confirm dialog, message inbox. No console errors.
- NOT tested against a real Supabase project: actual sign-up/login/reset emails, real RLS behavior, photo upload to storage. These need your keys (Phase 6 checklist).

## Phase 5: Supabase schema, seed, setup guide
- `supabase/schema.sql`: 4 tables, `is_admin()` (security definer, fixed search_path), RLS on every table, `trail-photos` public bucket with admin-only write policies. Re-runnable (`if not exists`, `drop policy if exists`).
- `supabase/seed.sql` is generated from `data/trails.json` so both stay identical; uses `on conflict (slug) do nothing`.
- `supabase/README.md`: run order, config values, auth redirect URLs for password reset, how to make yourself admin.
- Extra beyond the spec: length/CHECK constraints on contact messages and note, so anonymous inserts can't store huge payloads.
- Validation: ran schema.sql twice and seed.sql twice in a real Postgres engine (PGlite) with a stub `auth`/`storage` schema, then tested RLS as anon / normal user / admin: 29 checks, all passed (public read, admin-only trail writes, own-rows-only hikes, contact insert-only for anon, admin-only message read/delete, storage policies, upsert on hikes).
- Limits of that test: Supabase's real auth.uid() and storage tables are stubbed; it proves the policy logic, not the hosted service. `updated_at` is set by the admin page code, not a DB trigger.

## Phase 6: Testing, git, deploy
- You pasted real Supabase values into `config.js` (publishable/anon key only). Ran all 7 pages in headless Chrome against the live project at 375/768/1280px: 9 trails loaded from Supabase, no demo banner, no console errors, no horizontal overflow; `admin.html` redirects an anonymous visitor home.
- All asset and link paths are relative, so the site works under `/socal-trail-log/`.
- Checked the repo for secrets: only the anon/publishable key is present; no service_role key.
- Problem: GitHub CLI (`gh`) is not installed on this machine, so I could not create the repo or enable Pages. Local git repo is initialized and committed; steps to install gh, create the repo and enable Pages are in the final message / below.
- Not verified yet: the live URL (nothing deployed), real sign-up/login/reset emails, admin photo upload, and the signed-in flows against the real project.
