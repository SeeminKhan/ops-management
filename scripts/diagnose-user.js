#!/usr/bin/env node

/**
 * Benne Ops - User Diagnostic Script
 * 
 * This script checks if a user exists and has a proper profile.
 * Use this when you get "No role assigned" errors.
 * 
 * Usage: node scripts/diagnose-user.js <email>
 * Example: node scripts/diagnose-user.js manager@benne.demo
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment from .env.setup
config({ path: resolve(__dirname, '../.env.setup') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing .env.setup configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/diagnose-user.js <email>');
  console.error('Example: node scripts/diagnose-user.js manager@benne.demo');
  process.exit(1);
}

async function diagnoseUser(email) {
  console.log(`\n🔍 Diagnosing user: ${email}`);
  console.log('='.repeat(60));

  try {
    // 1. Check if user exists in auth.users
    console.log('\n1️⃣ Checking Supabase Auth...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users?.find(u => u.email === email);

    if (!authUser) {
      console.log('❌ User not found in Supabase Auth');
      console.log('   Solution: Run npm run setup:demo to create the user');
      return;
    }

    console.log('✅ User exists in Auth');
    console.log(`   User ID: ${authUser.id}`);
    console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);

    // 2. Check if profile exists
    console.log('\n2️⃣ Checking profile in database...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Profile not found in profiles table');
      console.log('   Error:', profileError?.message);
      console.log(`   Solution: Run this SQL in Supabase SQL Editor:`);
      console.log('');
      console.log(`   INSERT INTO profiles (id, full_name, role, outlet_id)`);
      console.log(`   VALUES ('${authUser.id}', 'User Name', 'operations_manager', NULL);`);
      console.log('');
      console.log('   Or re-run: npm run setup:demo');
      return;
    }

    console.log('✅ Profile exists');
    console.log(`   Full Name: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Outlet ID: ${profile.outlet_id || 'None (Manager)'}`);

    // 3. Check outlet if staff
    if (profile.outlet_id) {
      console.log('\n3️⃣ Checking outlet assignment...');
      const { data: outlet } = await supabase
        .from('outlets')
        .select('*')
        .eq('id', profile.outlet_id)
        .single();

      if (!outlet) {
        console.log('❌ Assigned outlet not found');
        console.log(`   Outlet ID: ${profile.outlet_id}`);
        console.log('   Solution: Update outlet_id in profile or create the outlet');
      } else {
        console.log('✅ Outlet assignment valid');
        console.log(`   Outlet: ${outlet.name} (${outlet.location})`);
      }
    }

    // 4. Test RLS policies
    console.log('\n4️⃣ Testing Row Level Security policies...');
    
    // Try to read the profile as the user would
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (testError) {
      console.log('⚠️  RLS Policy might be blocking profile read');
      console.log('   Error:', testError.message);
      console.log('   This could be the issue!');
    } else {
      console.log('✅ RLS policies allow profile read');
    }

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSIS SUMMARY');
    console.log('='.repeat(60));
    
    if (authUser && profile && !profileError) {
      console.log('\n✅ User is properly configured!');
      console.log('\nIf you still see "No role assigned", try:');
      console.log('  1. Sign out completely from the app');
      console.log('  2. Clear browser cache and cookies');
      console.log('  3. Sign in again');
      console.log('  4. Check browser console (F12) for errors');
    } else {
      console.log('\n❌ Issues found - see solutions above');
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error.message);
  }
}

diagnoseUser(email);
