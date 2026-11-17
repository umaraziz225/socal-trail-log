# SoCal Trail Log

A public site showcasing Southern California hikes, centered on the SoCal Six-Pack of Peaks challenge, plus three San Diego favorites. Visitors browse trails; signed-in users track completed hikes; admins manage trails and contact messages.

**Live:** https://umaraziz225.github.io/socal-trail-log/

## Features
- Searchable/filterable trail grid (region, difficulty, sort by distance or elevation)
- Trail detail pages with licensed Wikimedia Commons photos and credits
- Sign up / log in / password reset (Supabase Auth)
- My Hikes with Six-Pack progress
- Admin dashboard: trail CRUD with photo upload, contact message inbox (RLS-enforced)
- Contact form saved to the database
- Responsive, with demo mode when no backend is configured

## Tech stack
Plain HTML, CSS, vanilla JS (ES modules), Supabase JS v2 from a CDN. No build step; hosted on GitHub Pages.

## Folder structure
```
index.html, trail.html, login.html, my-hikes.html, admin.html, contact.html, credits.html
css/styles.css
js/        config.js, supabaseClient.js, auth.js, data.js, layout.js, one file per page
data/      trails.json, credits.json
assets/img/trails/
supabase/  schema.sql, seed.sql, README.md
```

## Run locally
ES modules need a server (not `file://`):
```
python -m http.server 8000
```
Open http://localhost:8000. With placeholder config it runs in demo mode using `data/trails.json`.

## Connect Supabase
See `supabase/README.md`, then paste your project URL and anon key into `js/config.js`. Never commit a service_role key.
