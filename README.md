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
