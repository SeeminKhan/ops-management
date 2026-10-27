-- Add 10 Fresh Demo Issues (Simple version for Supabase SQL Editor)
-- Run this AFTER updating outlet staff email addresses in Supabase Auth

-- Step 1: Clear all existing issues and related data
DELETE FROM notifications;
DELETE FROM issue_activity;
DELETE FROM issue_attachments;
DELETE FROM issues;

-- Step 2: Get user IDs (retrieve them first, then use in INSERT)
-- Find the IDs by running this query first if needed:
-- SELECT id, full_name, role FROM profiles;

-- Assuming you have:
-- - Manager ID
-- - Staff IDs for each outlet

-- Insert 10 demo issues
-- JUHU OUTLET: 3 issues
INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'Ice machine compressor noise' as title,
  'Ice machine making loud grinding noise. Affects nearby service area. May need replacement of compressor unit.' as description,
  'equipment' as category,
  'high' as priority,
  'open' as status,
  'a1111111-1111-1111-1111-111111111111' as outlet_id,
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a1111111-1111-1111-1111-111111111111' LIMIT 1) as reported_by,
  (SELECT id FROM profiles WHERE role = 'operations_manager' LIMIT 1) as assigned_to,
  NOW() + INTERVAL '4 hours' as due_date,
  NOW() - INTERVAL '2 hours' as created_at,
  NOW() - INTERVAL '2 hours' as updated_at;

INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'Broken dishwasher cycle timer',
  'Dishwasher cycle timer stuck on 15 minutes. Cannot complete wash cycles. Needs technician repair.',
  'equipment',
  'medium',
  'in_progress',
  'a1111111-1111-1111-1111-111111111111',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a1111111-1111-1111-1111-111111111111' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'operations_manager' LIMIT 1),
  NOW() + INTERVAL '24 hours',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '6 hours';

INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'Low refrigerator stock alerts needed',
  'Need better system to track refrigerator inventory. Running out of items unexpectedly.',
  'inventory',
  'low',
  'open',
  'a1111111-1111-1111-1111-111111111111',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a1111111-1111-1111-1111-111111111111' LIMIT 1),
  NULL,
  NOW() + INTERVAL '72 hours',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days';

-- CHOWPATTY OUTLET: 3 issues
INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'Floor drain clogged near serving station',
  'Water backing up from floor drain near main serving station. Creating slipping hazard. Needs plumbing repair immediately.',
  'maintenance',
  'high',
  'open',
  'a2222222-2222-2222-2222-222222222222',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a2222222-2222-2222-2222-222222222222' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'operations_manager' LIMIT 1),
  NOW() + INTERVAL '2 hours',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes';

INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'Exhaust hood filter replacement due',
  'Exhaust hood filters getting too greasy and reducing ventilation. Fire code requires cleaning/replacement.',
  'maintenance',
  'medium',
  'in_progress',
  'a2222222-2222-2222-2222-222222222222',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a2222222-2222-2222-2222-222222222222' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'operations_manager' LIMIT 1),
  NOW() + INTERVAL '24 hours',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '12 hours';

INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'Menu signage needs reprint',
  'Several menu items have prices crossed out and updated manually. Needs professional reprint for presentation.',
  'quality',
  'low',
  'open',
  'a2222222-2222-2222-2222-222222222222',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a2222222-2222-2222-2222-222222222222' LIMIT 1),
  NULL,
  NOW() + INTERVAL '168 hours',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week';

-- BANDRA OUTLET: 4 issues
INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'POS system connection intermittent',
  'Payment terminal losing connection frequently during peak hours. Causing transaction delays.',
  'equipment',
  'high',
  'open',
  'a3333333-3333-3333-3333-333333333333',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a3333333-3333-3333-3333-333333333333' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'operations_manager' LIMIT 1),
  NOW() + INTERVAL '3 hours',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours';

INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, created_at, updated_at)
SELECT 
  'Kitchen lighting needs upgrade',
  'Several lights flickering and dimming. Affects food prep visibility and safety. Recommend LED upgrade.',
  'maintenance',
  'medium',
  'open',
  'a3333333-3333-3333-3333-333333333333',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a3333333-3333-3333-3333-333333333333' LIMIT 1),
  NULL,
  NOW() + INTERVAL '96 hours',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days';

INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, resolution_note, created_at, updated_at)
SELECT 
  'Staff uniform stock running low',
  'Only 2 sets of staff uniforms remaining in inventory. Need to reorder before they run out.',
  'inventory',
  'medium',
  'resolved',
  'a3333333-3333-3333-3333-333333333333',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a3333333-3333-3333-3333-333333333333' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'operations_manager' LIMIT 1),
  NOW() - INTERVAL '1 day',
  'Reordered 20 new uniform sets. Should arrive within 5 business days.',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day';

INSERT INTO issues (title, description, category, priority, status, outlet_id, reported_by, assigned_to, due_date, resolution_note, created_at, updated_at)
SELECT 
  'Customer feedback board update',
  'Feedback board in lobby needs cleaning and recent comments removed. Looks cluttered.',
  'quality',
  'low',
  'resolved',
  'a3333333-3333-3333-3333-333333333333',
  (SELECT id FROM profiles WHERE role = 'outlet_staff' AND outlet_id = 'a3333333-3333-3333-3333-333333333333' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'operations_manager' LIMIT 1),
  NOW() - INTERVAL '2 days',
  'Cleaned board, removed old feedback cards. Updated with current month comments.',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '2 days';


-- Verify the results
SELECT 
  o.name as outlet,
  COUNT(i.id) as total_issues,
  SUM(CASE WHEN i.status = 'open' THEN 1 ELSE 0 END) as open_count,
  SUM(CASE WHEN i.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
  SUM(CASE WHEN i.status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
  SUM(CASE WHEN i.priority = 'high' THEN 1 ELSE 0 END) as high_priority_count
FROM issues i
RIGHT JOIN outlets o ON i.outlet_id = o.id
GROUP BY o.name
ORDER BY o.name;
