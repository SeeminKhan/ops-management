Benne Ops - Multi-Outlet Operations Management

A lightweight operations management application for managing issues across multiple outlets. Built with React, TypeScript, and Supabase.

Note: This is an independent concept project not affiliated with Benne.

OVERVIEW

Benne Ops is an internal operations tool that enables teams to report, track, and resolve issues across multiple locations. The application provides:

- Role-based access control (Operations Manager and Outlet Staff)
- Issue reporting with categories and priority levels
- Real-time status tracking and assignment
- Attachment management with image uploads
- Activity history and audit trails
- CSV export for reporting
- In-app notifications
- Mobile-responsive interface

KEY FEATURES

Operations Manager
- Dashboard with key metrics (open issues, high priority, overdue, etc.)
- View and filter issues across all outlets
- Assign issues to team members
- Update issue status and priority
- Add resolution notes and track resolution
- Upload and manage attachments
- Export issues to CSV
- Receive notifications for high-priority issues

Outlet Staff
- Report new issues with detailed information
- View issues for assigned outlet
- Add photos and attachments to issues
- Track issue progress
- View resolution notes

TECHNOLOGY STACK

Frontend
- React 19 with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Vite for build tooling
- Lucide React for icons

Backend
- Supabase PostgreSQL database
- Supabase Authentication
- Supabase Storage for file uploads
- Row Level Security policies for access control

REQUIREMENTS

- Node.js 18 or higher
- npm or yarn
- Supabase account (free tier available at supabase.com)

QUICK START

1. Install dependencies:
   npm install

2. Set up environment variables:
   cp .env.example .env
   
   Edit .env and add your Supabase credentials:
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

3. Start development server:
   npm run dev

4. Open http://localhost:5173

For detailed setup instructions, see SETUP.md
For deployment instructions, see DEPLOYMENT.md

DEVELOPMENT

Available scripts:

npm run dev      - Start development server
npm run build    - Build for production
npm run preview  - Preview production build
npm run lint     - Run ESLint
npm run setup:demo - Create demo users (requires .env.setup)

BUILD FOR PRODUCTION

npm run build

Output will be in the dist/ directory.

DEPLOYMENT

Deploy to Vercel in minutes:

1. Push code to GitHub
2. Import repository to Vercel
3. Add environment variables in Vercel settings
4. Deploy

See DEPLOYMENT.md for complete deployment guide.

PROJECT STRUCTURE

benne-ops/
├── src/
│   ├── components/      - Reusable UI components
│   ├── contexts/        - React contexts (Authentication)
│   ├── hooks/           - Custom React hooks
│   ├── lib/             - Supabase client and utilities
│   ├── pages/           - Route pages
│   ├── types/           - TypeScript type definitions
│   ├── App.tsx          - Main app component with routing
│   ├── main.tsx         - Application entry point
│   └── index.css        - Global styles
├── supabase/
│   └── migrations/      - Database migration scripts
├── scripts/             - Setup and utility scripts
├── public/              - Static assets
└── Configuration files (vite.config.ts, tailwind.config.js, etc.)

DATABASE SCHEMA

Tables

outlets
- id: UUID primary key
- name: Outlet name
- location: Location description
- created_at: Timestamp

profiles
- id: UUID (linked to auth.users)
- full_name: User full name
- role: User role (operations_manager or outlet_staff)
- outlet_id: Assigned outlet (null for managers)
- created_at: Timestamp

issues
- id: UUID primary key
- title: Issue title
- description: Detailed description
- category: Category (maintenance, equipment, inventory, quality, other)
- priority: Priority level (low, medium, high)
- status: Current status (open, in_progress, resolved)
- outlet_id: Outlet where issue occurred
- reported_by: User who reported issue
- assigned_to: User assigned to resolve
- resolution_note: Resolution details
- due_date: Due date (auto-calculated from priority)
- resolved_at: Resolution timestamp
- created_at: Creation timestamp
- updated_at: Last update timestamp

issue_activity
- id: UUID primary key
- issue_id: Related issue
- actor_id: User who made change
- activity_type: Type of change
- old_value: Previous value
- new_value: New value
- created_at: Timestamp

issue_attachments
- id: UUID primary key
- issue_id: Related issue
- uploaded_by: User who uploaded
- file_name: Original filename
- file_path: Path in storage
- file_size: File size in bytes
- content_type: MIME type
- created_at: Timestamp

notifications
- id: UUID primary key
- recipient_id: Target user
- issue_id: Related issue (if applicable)
- notification_type: Type of notification
- title: Notification title
- message: Notification message
- is_read: Read status
- created_at: Timestamp

DEMO CREDENTIALS

After setup, use these credentials to test:

Manager
Email: manager@benne.demo
Password: Manager2024!
Access: All outlets, full control

Outlet Staff
Email: staff.juhu@benne.demo
Password: Staff2024!
Access: Juhu outlet, can report and view issues

Additional staff accounts:
staff.chowpatty@benne.demo
staff.bandra@benne.demo

SECURITY

Security measures implemented:

- Row Level Security (RLS) on all database tables
- Role-based access control enforced at database level
- Authentication required for all pages
- Environment variables protect sensitive data
- Service role keys never exposed to frontend
- Input validation on all forms
- XSS protection via React
- CSRF tokens handled by Supabase

DOCUMENTATION

- QUICKSTART.md - Get started in 5 minutes
- SETUP.md - Complete setup guide
- DEPLOYMENT.md - Production deployment guide
- SUPABASE_SETUP.md - Detailed Supabase configuration

SUPPORT

For help with:
- Supabase: https://supabase.com/docs
- React: https://react.dev
- Vite: https://vite.dev
- Tailwind CSS: https://tailwindcss.com

LICENSE

MIT

Built as a production-ready operations management application.
