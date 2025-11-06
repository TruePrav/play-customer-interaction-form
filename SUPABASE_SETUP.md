# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a name for your project (e.g., "play-customer-interactions")
4. Set a database password
5. Choose a region close to your users

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL
3. Copy your anon/public key

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Enable Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable Email authentication
3. Configure your site URL (e.g., `http://localhost:3000` for development)
4. Add redirect URLs for your domain:
   - For development: `http://localhost:3000/auth/reset-password`
   - For production: `https://yourdomain.com/auth/reset-password`
   - Also add: `http://localhost:3000/**` (for development) and `https://yourdomain.com/**` (for production)
5. Make sure "Enable email confirmations" is configured as needed for your use case

## 5. Create the Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the interactions table
CREATE TABLE interactions (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  staff_name TEXT NOT NULL,
  channel TEXT NOT NULL,
  other_channel TEXT,
  branch TEXT,
  category TEXT NOT NULL,
  other_category TEXT,
  wanted_item TEXT NOT NULL,
  purchased BOOLEAN,
  out_of_stock BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create admin users table
CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_interactions_timestamp ON interactions(timestamp);
CREATE INDEX idx_interactions_staff_name ON interactions(staff_name);
CREATE INDEX idx_interactions_channel ON interactions(channel);
CREATE INDEX idx_interactions_category ON interactions(category);

-- Enable Row Level Security (RLS)
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anonymous insert interactions" ON interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin read interactions" ON interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email'
    )
  );

-- Allow authenticated users to check if they are admin
-- This policy allows any authenticated user to read admin_users to check their own admin status
CREATE POLICY "Allow authenticated users to read admin_users" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');
```

## 6. Create Admin Users

After running the SQL above, you need to create admin users. You can do this in two ways:

### Option A: Through Supabase Dashboard
1. Go to Authentication > Users
2. Click "Add user" and create admin accounts
3. Then go to Table Editor > admin_users
4. Add entries for each admin user's email

### Option B: Through SQL
```sql
-- Insert admin users (replace with actual admin emails)
INSERT INTO admin_users (email, name) VALUES 
  ('admin@playbarbados.com', 'Admin User'),
  ('manager@playbarbados.com', 'Manager');
```

## 7. Test the Integration

Once you've set up the environment variables, created the tables, and added admin users:

1. **Customer Form**: Visit `/interactions` - should work without authentication
2. **Admin Dashboard**: Visit `/admin` - should require login
3. **Login**: Use the admin credentials you created
4. **Data**: Form submissions should save to Supabase and be visible in admin dashboard
5. **Password Reset**: 
   - Click "Forgot your password?" on the login page
   - Enter your admin email address
   - Check your email for the reset link
   - Click the link to reset your password
   - The link should redirect to `/auth/reset-password` (make sure this URL is in your Supabase redirect URLs)

## 8. Password Reset Setup

The application includes a password reset feature:

1. **Forgot Password Page**: `/auth/forgot-password` - Users can request a password reset link
2. **Reset Password Page**: `/auth/reset-password` - Users can set a new password after clicking the reset link

**Important**: Make sure you've added the reset password URL to your Supabase redirect URLs (see step 4 above). The reset link from Supabase will redirect to this page.

## 9. Set Up Form Options Tables (Optional but Recommended)

To enable dynamic form options management in the admin panel, run the SQL migration file:

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run the contents of `database_migration_form_options.sql` (located in the project root)
3. This will create tables for managing:
   - Staff members
   - Channels
   - Categories
   - Branches

After running this migration:
- You can manage form options through the "Form Settings" tab in the admin panel
- The customer interaction form will automatically use the options from the database
- You can add, edit, reorder, and activate/deactivate options without code changes
