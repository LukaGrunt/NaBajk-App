# Supabase Setup Instructions

Follow these steps to set up your NaBajk backend in Supabase.

## Step 1: Run Database Schema

1. Go to your Supabase project: https://zymssfxffkymkkfndssf.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `01-schema.sql`
5. Paste it into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned" - this means all tables were created!

**What this does:**
- Creates 5 database tables: `user_profiles`, `routes`, `group_rides`, `group_ride_rsvps`, `user_favourites`
- Adds indexes for faster queries
- Sets up automatic `updated_at` timestamps

## Step 2: Enable Row Level Security (RLS)

1. Still in the **SQL Editor**, create another new query
2. Copy the entire contents of `02-rls-policies.sql`
3. Paste and click **Run**
4. Success means your security policies are active!

**What this does:**
- Enables Row Level Security on all tables
- Sets up policies so users can only modify their own data
- Allows public read access to routes and group rides
- Protects user favorites and profiles

## Step 3: Create Storage Buckets

1. Click on **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Create these 3 buckets:

### Bucket 1: route-images
- Name: `route-images`
- Public bucket: **Yes** ✓
- Click **Create bucket**

### Bucket 2: gpx-files
- Name: `gpx-files`
- Public bucket: **No** (keep private)
- Click **Create bucket**

### Bucket 3: user-avatars
- Name: `user-avatars`
- Public bucket: **Yes** ✓
- Click **Create bucket**

## Step 4: Configure Storage Policies

For each bucket, we need to set up access policies:

### For `route-images` bucket:

1. Click on the `route-images` bucket
2. Go to **Policies** tab
3. Click **New Policy** > **Create a policy from scratch**
4. Add these 2 policies:

**Policy 1 - Public Read:**
- Policy name: `Public can view route images`
- Allowed operation: **SELECT**
- Target roles: `public`
- USING expression: `true`
- Click **Review** > **Save policy**

**Policy 2 - Authenticated Upload:**
- Policy name: `Authenticated users can upload route images`
- Allowed operation: **INSERT**
- Target roles: `authenticated`
- WITH CHECK expression: `true`
- Click **Review** > **Save policy**

### For `gpx-files` bucket:

**Policy 1 - Authenticated Read/Upload:**
- Policy name: `Authenticated users can manage GPX files`
- Allowed operation: **SELECT, INSERT**
- Target roles: `authenticated`
- USING expression: `(bucket_id = 'gpx-files')`
- Click **Review** > **Save policy**

### For `user-avatars` bucket:

**Policy 1 - Public Read:**
- Policy name: `Public can view avatars`
- Allowed operation: **SELECT**
- Target roles: `public`
- USING expression: `true`
- Click **Review** > **Save policy**

**Policy 2 - Users Upload Own Avatar:**
- Policy name: `Users can upload own avatar`
- Allowed operation: **INSERT**
- Target roles: `authenticated`
- WITH CHECK expression: `(bucket_id = 'user-avatars')`
- Click **Review** > **Save policy**

## Step 5: Enable Authentication Providers

1. Click on **Authentication** in the left sidebar
2. Click on **Providers**
3. Enable these providers:

### Email (Magic Link)
- Already enabled by default
- Users will receive magic links to sign in

### Google OAuth (Optional but recommended)
- Click on **Google**
- Toggle **Enable Sign in with Google**
- You'll need to set up Google OAuth credentials later
- For now, you can skip this and enable it later

## Verification Checklist

After completing all steps, verify:

- [ ] 5 tables visible in **Database** > **Tables**
- [ ] RLS enabled on all tables (green shield icon)
- [ ] 3 storage buckets created in **Storage**
- [ ] Storage policies configured for each bucket
- [ ] Email auth enabled in **Authentication** > **Providers**

## Next Steps

Once this setup is complete, you can:
1. Seed initial route data (mock routes → real database)
2. Create the GPX parser Edge Function
3. Migrate mobile app to use real Supabase data
4. Build the admin dashboard

## Troubleshooting

**"Relation already exists" error:**
- Tables may have been partially created. Drop them and re-run the schema:
  ```sql
  DROP TABLE IF EXISTS user_favourites CASCADE;
  DROP TABLE IF EXISTS group_ride_rsvps CASCADE;
  DROP TABLE IF EXISTS group_rides CASCADE;
  DROP TABLE IF EXISTS routes CASCADE;
  DROP TABLE IF EXISTS user_profiles CASCADE;
  ```

**"Permission denied" when testing:**
- Make sure RLS policies were applied correctly
- Check that you're authenticated when testing operations

**Storage bucket policies not working:**
- Verify policy target roles are correct (`public` vs `authenticated`)
- Check USING/WITH CHECK expressions match the bucket_id
