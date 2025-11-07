# Vercel Deployment Checklist

## Environment Variables

**CRITICAL**: You must set these environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important Notes:**
- These must be set for **Production**, **Preview**, and **Development** environments
- Make sure there are no extra spaces or quotes around the values
- After adding/updating variables, **redeploy** your application

## Supabase Configuration

### 1. Site URL Configuration

In your Supabase Dashboard:

1. Go to **Authentication > URL Configuration**
2. Add your Vercel domain to **Site URL**:
   - Production: `https://your-app.vercel.app`
   - Or your custom domain if you have one
3. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/reset-password`
   - Add your custom domain if applicable

### 2. Verify RLS Policies

Make sure these RLS policies exist in Supabase:

```sql
-- Allow authenticated users to read admin_users
CREATE POLICY "Allow authenticated users to read admin_users" 
ON admin_users 
FOR SELECT 
USING (auth.role() = 'authenticated');
```

## Common Issues

### Issue: Admin access works locally but not on Vercel

**Possible Causes:**

1. **Environment variables not set in Vercel**
   - Check Vercel dashboard > Settings > Environment Variables
   - Ensure variables are set for Production environment
   - Redeploy after adding variables

2. **Different Supabase project**
   - Verify you're using the same Supabase project URL locally and in Vercel
   - Check that `admin_users` table has your email in the production Supabase project

3. **Session not persisting**
   - Check browser console for session errors
   - Verify Supabase redirect URLs include your Vercel domain
   - Clear browser cache and cookies, then try logging in again

4. **RLS policies blocking access**
   - Verify the RLS policy exists and is active
   - Check Supabase logs for RLS errors

5. **Build cache issues**
   - In Vercel, go to Settings > General > Clear Build Cache
   - Redeploy the application

### Debugging Steps

1. **Check browser console** on Vercel:
   - Open DevTools (F12)
   - Look for admin check logs
   - Check for error messages

2. **Verify environment variables are loaded**:
   - The console should show configuration validation
   - If you see "⚠️ Supabase Configuration Issues", env vars aren't set correctly

3. **Check Supabase logs**:
   - Go to Supabase Dashboard > Logs > Postgres Logs
   - Look for RLS policy errors

4. **Test with a fresh browser session**:
   - Open incognito/private window
   - Navigate to your Vercel URL
   - Try logging in

## After Fixing Issues

1. **Redeploy** your Vercel application
2. **Clear browser cache** and cookies
3. **Test in incognito mode** to ensure it's not a caching issue
4. **Check the browser console** for detailed logs

## Verification

To verify everything is working:

1. ✅ Environment variables are set in Vercel
2. ✅ Supabase site URL includes your Vercel domain
3. ✅ Supabase redirect URLs include your Vercel domain
4. ✅ RLS policy "Allow authenticated users to read admin_users" exists
5. ✅ Your email exists in the `admin_users` table
6. ✅ Application is redeployed after making changes

