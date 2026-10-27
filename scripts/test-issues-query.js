#!/usr/bin/env node

/**
 * Test if issues can be queried from the database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.setup') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testIssuesQuery() {
  console.log('\n🔍 Testing Issues Query\n');
  console.log('='.repeat(60));

  try {
    // 1. Check if issues exist (using admin client)
    console.log('\n1️⃣ Checking if issues exist in database...');
    const { data: allIssues, error: allError } = await supabase
      .from('issues')
      .select('*');

    if (allError) {
      console.log('❌ Error querying issues:', allError.message);
      return;
    }

    console.log(`✅ Found ${allIssues.length} issues in database`);

    // 2. Try the exact query the dashboard uses
    console.log('\n2️⃣ Testing dashboard query (with joins)...');
    const { data: issuesWithJoins, error: joinError } = await supabase
      .from('issues')
      .select(`
        *,
        outlets (name),
        profiles (full_name)
      `)
      .order('created_at', { ascending: false });

    if (joinError) {
      console.log('❌ Error with dashboard query:', joinError.message);
      console.log('   This might be why the dashboard is empty!');
      return;
    }

    console.log(`✅ Dashboard query works: ${issuesWithJoins.length} issues`);

    // 3. Display sample issues
    if (issuesWithJoins.length > 0) {
      console.log('\n3️⃣ Sample issues:');
      issuesWithJoins.slice(0, 3).forEach((issue, i) => {
        console.log(`\n   ${i + 1}. ${issue.title}`);
        console.log(`      Status: ${issue.status} | Priority: ${issue.priority}`);
        console.log(`      Outlet: ${issue.outlets?.name || 'Unknown'}`);
      });
    }

    // 4. Check RLS policies
    console.log('\n4️⃣ Checking RLS policies on issues table...');
    const { data: policies } = await supabase
      .rpc('pg_policies')
      .select('*')
      .eq('tablename', 'issues')
      .catch(() => ({ data: null }));

    if (policies) {
      console.log(`✅ Found ${policies.length} policies`);
    } else {
      console.log('⚠️  Could not query policies (this is normal)');
    }

    // 5. Get manager user to test their query
    console.log('\n5️⃣ Testing as operations manager...');
    const { data: manager } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'operations_manager')
      .single();

    if (manager) {
      console.log(`   Manager: ${manager.full_name} (${manager.id})`);
      
      // Try to impersonate the manager query
      const { data: managerIssues, error: managerError } = await supabase
        .from('issues')
        .select(`
          *,
          outlets (name),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (managerError) {
        console.log('   ❌ Error:', managerError.message);
      } else {
        console.log(`   ✅ Manager should see ${managerIssues.length} issues`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   Total issues in DB: ${allIssues.length}`);
    console.log(`   Issues with joins: ${issuesWithJoins?.length || 0}`);
    
    if (allIssues.length === 0) {
      console.log('\n⚠️  No issues found! Run the sample data script:');
      console.log('   SQL: supabase/migrations/005_sample_issues.sql');
    } else if (joinError) {
      console.log('\n⚠️  Join query failed - check foreign key references');
    } else {
      console.log('\n✅ Database looks good!');
      console.log('\nIf dashboard is still empty, check:');
      console.log('   1. Browser console (F12) for errors');
      console.log('   2. Network tab to see the actual API response');
      console.log('   3. Sign out and sign in again');
      console.log('   4. Hard refresh: Ctrl+Shift+R');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testIssuesQuery();
