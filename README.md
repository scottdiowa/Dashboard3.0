# SE 14th GM Dashboard - Wendy's

A production-ready, professional GM Dashboard for Wendy's SE 14th location with both frontend and backend powered by Supabase.

## 🚀 Features

- **Overview Dashboard**: Key metrics, KPI cards, and trend charts
- **Omega Daily**: Daily business metrics entry and analysis
- **Interviews & Hires**: Candidate tracking and hiring process management
- **SMG**: Customer feedback metrics and analysis
- **Modern UI**: Wendy's-themed design with responsive layout
- **Real-time Data**: Powered by Supabase with Row Level Security

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: TanStack Router
- **State Management**: TanStack Query + React Hook Form
- **Charts**: Recharts
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Validation**: Zod schemas

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Git

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd wendys-gm-dashboard
pnpm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Run the contents of `supabase/seed.sql` to populate sample data
4. Go to Storage and create a bucket named `hiring-docs`
5. Set Storage bucket policies to allow authenticated users to upload files

### 3. Configure Environment

```bash
cp env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_USE_MOCK_DATA=false
```

### 4. Create Test User

1. Go to Supabase Auth > Users
2. Create a new user with email: `gm@se14th.wendys.com` and password: `test123`
3. Copy the user ID from the created user
4. Update the `users` table in SQL Editor with the correct user ID:

```sql
UPDATE users 
SET id = 'actual_user_id_from_auth' 
WHERE email = 'gm@se14th.wendys.com';
```

### 5. Run Development Server

```bash
pnpm dev
```

The dashboard will open at `http://localhost:3000`

### 6. Login

Use the demo credentials:
- **Email**: `gm@se14th.wendys.com`
- **Password**: `test123`

## 🏗️ Project Structure

```
src/
├── components/          # Shared UI components
│   ├── ui/            # shadcn/ui components
│   ├── overview/      # Overview page components
│   ├── omega/         # Omega Daily components
│   ├── interviews/    # Interview components
│   └── smg/          # SMG components
├── features/          # Feature-specific code
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
├── routes/           # TanStack Router routes
└── styles/           # Global styles

supabase/
├── schema.sql        # Database schema
└── seed.sql          # Sample data
```

## 📊 Database Schema

The dashboard uses the following main tables:

- **stores**: Store information
- **users**: User accounts linked to stores
- **omega_daily**: Daily business metrics
- **interviews**: Candidate interviews
- **hires**: Hiring process tracking
- **smg_entries**: Customer feedback metrics

All tables have Row Level Security (RLS) enabled to ensure data isolation between stores.

## 🎨 Customization

### Colors

The dashboard uses Wendy's brand colors defined in `tailwind.config.js`:

- Primary Red: `#E2231A`
- Dark Red: `#B71C13`
- Warm Gray: `#F6F6F6`
- Charcoal: `#1F2937`

### Adding New Features

1. Create new components in `src/components/`
2. Add routes in `src/routes/`
3. Update the navigation in `src/components/RightNavDrawer.tsx`
4. Add database tables and RLS policies as needed

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui
```

## 📦 Building for Production

```bash
# Build the application
pnpm build

# Preview the build
pnpm preview
```

## 🔒 Security Features

- **Authentication**: Supabase Auth with email/password
- **Row Level Security**: Data isolation between stores
- **Protected Routes**: All dashboard routes require authentication
- **Input Validation**: Zod schemas for all forms

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The dashboard can be deployed to any platform that supports static sites:
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any VPS with nginx

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**: Check your environment variables
2. **Authentication Issues**: Ensure the user exists in both Auth and users table
3. **RLS Policy Errors**: Verify RLS policies are correctly set up
4. **Build Errors**: Check Node.js version and dependencies

### Getting Help

1. Check the browser console for errors
2. Verify Supabase project settings
3. Check database logs in Supabase dashboard
4. Ensure all environment variables are set correctly

## 📝 License

This project is proprietary software for Wendy's International, Inc.

## 🤝 Contributing

This dashboard is designed for internal use at Wendy's SE 14th location. For questions or support, contact the development team.

---

**Built with ❤️ for Wendy's SE 14th Team**
