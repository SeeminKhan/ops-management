#!/usr/bin/env node

/**
 * Benne Ops - Demo Data Setup Script
 * 
 * This script creates demo users and data in Supabase for testing and development.
 * It uses the Supabase Admin API with the service role key to create users and profiles.
 * 
 * Usage: npm run setup:demo
 * 
 * Prerequisites:
 * 1. Run database migrations (001_initial_schema.sql)
 * 2. Create .env.setup with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 3. Ensure the service role key has admin privileges
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

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('');
  console.error('Please create a .env.setup file with:');
  console.error('  SUPABASE_URL=your_supabase_project_url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('');
  console.error('See .env.setup.example for template');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Demo data definitions
const OUTLETS = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    name: 'Juhu',
    location: 'Juhu, Mumbai'
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    name: 'Chowpatty',
    location: 'Chowpatty, Mumbai'
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    name: 'Bandra',
    location: 'Bandra, Mumbai'
  }
];

const DEMO_USERS = [
  {
    email: 'manager@benne.demo',
    password: 'Manager2024!',
    fullName: 'Sarah Johnson',
    role: 'operations_manager',
    outletId: null
  },
  {
    email: 'staff.juhu@benne.demo',
    password: 'Staff2024!',
    fullName: 'Rajesh Kumar',
    role: 'outlet_staff',
    outletId: 'a1111111-1111-1111-1111-111111111111'
  },
  {
    email: 'staff.chowpatty@benne.demo',
    password: 'Staff2024!',
    fullName: 'Priya Sharma',
    role: 'outlet_staff',
    outletId: 'a2222222-2222-2222-2222-222222222222'
  },
  {
    email: 'staff.bandra@benne.demo',
    password: 'Staff2024!',
    fullName: 'Amit Patel',
    role: 'outlet_staff',
    outletId: 'a3333333-3333-3333-3333-333333333333'
  }
];

/**
 * Create or verify outlets exist
 */
async function setupOutlets() {
  console.log('\n📍 Setting up outlets...');
  
  for (const outlet of OUTLETS) {
    try {
      // Check if outlet exists
      const { data: existing } = await supabase
        .from('outlets')
        .select('id')
        .eq('id', outlet.id)
        .single();

      if (existing) {
        console.log(`  ✓ Outlet "${outlet.name}" already exists`);
        continue;
      }

      // Create outlet
      const { error } = await supabase
        .from('outlets')
        .insert({
          id: outlet.id,
          name: outlet.name,
          location: outlet.location
        });

      if (error) {
        console.error(`  ✗ Failed to create outlet "${outlet.name}":`, error.message);
      } else {
        console.log(`  ✓ Created outlet "${outlet.name}"`);
      }
    } catch (error) {
      console.error(`  ✗ Error processing outlet "${outlet.name}":`, error.message);
    }
  }
}

/**
 * Create or update a demo user
 */
async function createDemoUser(userData) {
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === userData.email);

    let userId;

    if (existingUser) {
      console.log(`  ℹ User ${userData.email} already exists (ID: ${existingUser.id})`);
      userId = existingUser.id;
      
      // Optionally update password
      // Uncomment if you want to reset passwords on every run
      // await supabase.auth.admin.updateUserById(userId, { password: userData.password });
      // console.log(`  ✓ Updated password for ${userData.email}`);
    } else {
      // Create new user with admin API
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: userData.fullName
        }
      });

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      userId = newUser.user.id;
      console.log(`  ✓ Created user ${userData.email} (ID: ${userId})`);
    }

    // Upsert profile (create or update)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: userData.fullName,
        role: userData.role,
        outlet_id: userData.outletId
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      throw new Error(`Failed to create/update profile: ${profileError.message}`);
    }

    console.log(`  ✓ Created/updated profile for ${userData.fullName} (${userData.role})`);

    return { success: true, userId, email: userData.email };
  } catch (error) {
    console.error(`  ✗ Error setting up user ${userData.email}:`, error.message);
    return { success: false, email: userData.email, error: error.message };
  }
}

/**
 * Setup all demo users
 */
async function setupUsers() {
  console.log('\n👥 Setting up demo users...');
  
  const results = [];
  
  for (const userData of DEMO_USERS) {
    const result = await createDemoUser(userData);
    results.push(result);
  }

  return results;
}

/**
 * Display summary of operations
 */
function displaySummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SETUP SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✓ Successfully set up: ${successful.length}/${results.length} users`);
  
  if (successful.length > 0) {
    console.log('\n✅ Ready to use:');
    successful.forEach(r => {
      console.log(`   • ${r.email}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(r => {
      console.log(`   • ${r.email}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🚀 DEMO CREDENTIALS');
  console.log('='.repeat(60));
  console.log('\nOperations Manager:');
  console.log('  Email:    manager@benne.demo');
  console.log('  Password: Manager2024!');
  console.log('  Access:   Full system access, all outlets');
  
  console.log('\nOutlet Staff (Juhu):');
  console.log('  Email:    staff.juhu@benne.demo');
  console.log('  Password: Staff2024!');
  console.log('  Access:   Juhu outlet only');

  console.log('\nOutlet Staff (Chowpatty):');
  console.log('  Email:    staff.chowpatty@benne.demo');
  console.log('  Password: Staff2024!');
  console.log('  Access:   Chowpatty outlet only');

  console.log('\nOutlet Staff (Bandra):');
  console.log('  Email:    staff.bandra@benne.demo');
  console.log('  Password: Staff2024!');
  console.log('  Access:   Bandra outlet only');

  console.log('\n' + '='.repeat(60));
  console.log('');
  console.log('🎯 Next steps:');
  console.log('  1. Start the dev server: npm run dev');
  console.log('  2. Open http://localhost:5173');
  console.log('  3. Sign in with any of the credentials above');
  console.log('  4. Test creating and managing issues');
  console.log('');
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Benne Ops - Demo Data Setup');
  console.log('='.repeat(60));
  
  try {
    // Test connection
    console.log('\n🔌 Testing Supabase connection...');
    const { data, error } = await supabase.from('outlets').select('count').limit(1);
    if (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
    console.log('  ✓ Connected to Supabase successfully');

    // Setup outlets
    await setupOutlets();

    // Setup users and profiles
    const results = await setupUsers();

    // Display summary
    displaySummary(results);

    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nPlease check:');
    console.error('  1. Database migrations have been run (001_initial_schema.sql)');
    console.error('  2. .env.setup has correct SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('  3. The service role key has admin privileges');
    console.error('  4. Row Level Security policies allow admin operations');
    console.error('');
    process.exit(1);
  }
}

// Run main function
main();
