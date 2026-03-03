# CRM Pro - Production-Ready PWA CRM System

A fully functional PWA CRM system for teams of 3-10 people, built with Next.js 15, TypeScript, TailwindCSS, and Prisma.

## Features

### Core Features
- **Authentication** - Email/password login with role-based access (Admin/Manager)
- **Task Management** - Kanban board with drag-and-drop, overdue tracking
- **Client Management** - Full CRUD operations with contact history
- **Deal Pipeline** - Sales pipeline with stages and probability tracking
- **Analytics Dashboard** - KPIs, charts, and team performance metrics
- **PWA Support** - Installable app with offline support

### Technical Features
- **Row Level Security** - Database-level access control
- **Responsive Design** - Mobile-first with bottom navigation
- **Dark/Light Theme** - Automatic system detection
- **Real-time Updates** - SWR for data synchronization
- **Type-Safe** - Full TypeScript coverage

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, ShadCN UI
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Database**: SQLite (Prisma) / PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **PWA**: Service Worker, Web App Manifest
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd crm-pro

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
bun run db:generate

# Push database schema
bun run db:push

# Seed the database (creates admin + 5 managers)
curl -X POST http://localhost:3000/api/seed
```

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional: Supabase
# NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Running the Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crm.com | admin123 |
| Manager 1 | manager1@crm.com | manager123 |
| Manager 2 | manager2@crm.com | manager123 |
| Manager 3 | manager3@crm.com | manager123 |
| Manager 4 | manager4@crm.com | manager123 |
| Manager 5 | manager5@crm.com | manager123 |

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Authentication page |
| `/` (Today) | Dashboard with today's tasks and overdue items |
| `/tasks` | Kanban board with drag-and-drop |
| `/clients` | Client management with CRUD |
| `/deals` | Sales pipeline management |
| `/analytics` | KPIs and performance charts |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/tasks` | List/Create tasks |
| GET/PUT/DELETE | `/api/tasks/[id]` | Task CRUD |
| GET/POST | `/api/clients` | List/Create clients |
| GET/PUT/DELETE | `/api/clients/[id]` | Client CRUD |
| GET/POST | `/api/deals` | List/Create deals |
| GET/PUT/DELETE | `/api/deals/[id]` | Deal CRUD |
| POST | `/api/seed` | Seed database |
| DELETE | `/api/seed` | Clear database |

## PWA Installation

### Desktop (Chrome/Edge)
1. Navigate to the app URL
2. Click the install icon in the address bar
3. Click "Install"

### Mobile (iOS)
1. Open in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Mobile (Android)
1. Open in Chrome
2. Tap the menu button
3. Select "Add to Home Screen"

## Deploying to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Import project in Vercel Dashboard
3. Configure environment variables
4. Deploy

### Environment Variables for Vercel

Set these in your Vercel project settings:

```
DATABASE_URL=<your-database-url>
NEXTAUTH_URL=<your-vercel-url>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

## Using with Supabase

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Run SQL Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase-schema.sql`
3. Execute the SQL

### 3. Configure Environment

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 4. Enable Auth

1. Go to Authentication > Providers
2. Enable Email provider
3. Configure email templates

## Project Structure

```
├── prisma/
│   └── schema.prisma       # Database schema
├── public/
│   ├── icons/              # PWA icons
│   ├── manifest.json       # PWA manifest
│   ├── sw.js              # Service worker
│   └── offline.html       # Offline page
├── src/
│   ├── app/
│   │   ├── (app)/         # Authenticated routes
│   │   │   ├── page.tsx   # Today/Dashboard
│   │   │   ├── tasks/     # Tasks page
│   │   │   ├── clients/   # Clients page
│   │   │   ├── deals/     # Deals page
│   │   │   └── analytics/ # Analytics page
│   │   ├── (auth)/        # Auth routes
│   │   │   └── login/     # Login page
│   │   ├── api/           # API routes
│   │   └── layout.tsx     # Root layout
│   ├── components/
│   │   ├── layout/        # Layout components
│   │   ├── providers/     # Context providers
│   │   └── ui/            # UI components (ShadCN)
│   ├── hooks/             # Custom hooks
│   ├── lib/
│   │   ├── auth/          # Auth configuration
│   │   ├── db.ts          # Prisma client
│   │   └── utils.ts       # Utility functions
│   └── stores/            # Zustand stores
├── supabase-schema.sql    # Supabase SQL schema
└── package.json
```

## Scripts

```bash
bun run dev       # Start development server
bun run build     # Build for production
bun run lint      # Run ESLint
bun run db:push   # Push schema changes
bun run db:generate # Generate Prisma client
```

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues or questions, please open an issue on GitHub.
