# Supabase setup

1. Create a project at https://supabase.com (free tier is fine).
2. **SQL Editor -> New query**: paste all of `schema.sql`, run. Then paste `seed.sql`, run. (Order matters: schema first.)
3. **Project Settings -> API**: copy the Project URL and the `anon` public key into `js/config.js`. Never use or commit the `service_role` key.
4. **Authentication -> URL Configuration**: set Site URL to `https://umaraziz225.github.io/socal-trail-log/` and add the same URL (and `http://localhost:8000/login.html` for local testing) under Redirect URLs, so password-reset links come back to the site.
5. Sign up on the site's Sign up tab (confirm the email if asked).

## Make yourself an admin
After signing up, go to **Authentication -> Users**, copy your user's UUID, and run in the SQL editor:

```sql
insert into public.admins (user_id) values ('PASTE-YOUR-USER-UUID-HERE');
```

Log out and back in; an "Admin" link appears in the nav. Admins can only be added this way (no policy allows inserting into `admins` from the site).

## Notes
- `seed.sql` is safe to re-run: existing slugs are skipped.
- The `trail-photos` storage bucket is created by `schema.sql`. Seed trails use photos shipped in `assets/img/trails/`; admin uploads go to the bucket.
- The built-in Supabase email sender is rate-limited; for heavier use configure custom SMTP.
