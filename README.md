# NextSched - Appointment Scheduling Platform

A modern, full-stack appointment scheduling application that connects buyers and sellers through seamless calendar integration. Built with Next.js 14, Supabase, and Google Calendar API.

## 🚀 Overview

NextSched is a comprehensive appointment booking platform that allows:
- **Sellers** to manage their availability and receive bookings
- **Buyers** to discover sellers and book appointments
- **Automatic calendar synchronization** with Google Calendar
- **Real-time availability** checking and conflict prevention

## 🏗️ Architecture

### **Frontend (Next.js 14 App Router)**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: React Hooks (useState, useEffect)
- **Authentication**: Supabase Auth with Google OAuth
- **Deployment**: Vercel-ready

### **Backend (API Routes)**
- **Runtime**: Next.js API Routes (Edge/Node.js)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Row Level Security (RLS)
- **External APIs**: Google Calendar API
- **File Upload**: None (future enhancement)

### **Database Schema (Supabase/PostgreSQL)**
```sql
-- Users table with role-based access
users (
  id: UUID PRIMARY KEY,           -- References auth.users
  email: TEXT NOT NULL,
  name: TEXT NOT NULL,
  role: TEXT CHECK IN ('buyer', 'seller'),
  google_refresh_token: TEXT,     -- Encrypted OAuth token
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
)

-- Appointments with calendar integration
appointments (
  id: UUID PRIMARY KEY,
  seller_id: UUID REFERENCES users(id),
  buyer_id: UUID REFERENCES users(id),
  title: TEXT DEFAULT 'Appointment',
  description: TEXT,
  start_time: TIMESTAMPTZ NOT NULL,
  end_time: TIMESTAMPTZ NOT NULL,
  google_event_id: TEXT,          -- Google Calendar event ID
  status: TEXT CHECK IN ('confirmed', 'cancelled'),
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
)
```

## 🛠️ Tech Stack

### **Core Technologies**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Static type checking
- **Tailwind CSS v4**: Utility-first styling
- **Supabase**: Backend-as-a-Service (BaaS)

### **UI Components**
- **shadcn/ui**: Accessible component library
- **Radix UI**: Primitive components
- **Lucide React**: Icon library
- **React Hook Form**: Form management
- **Zod**: Schema validation

### **External Services**
- **Google OAuth**: Authentication provider
- **Google Calendar API**: Calendar integration
- **Vercel**: Hosting platform
- **Vercel Analytics**: Usage tracking

### **Development Tools**
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **GeistSans/GeistMono**: Typography

## 📁 Project Structure

```
nextsched/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/logout/route.ts  # Authentication
│   │   ├── appointments/routes.ts # Booking management
│   │   └── calendar/availability/[sellerId]/routes.ts
│   ├── auth/                     # Authentication pages
│   │   ├── callback/route.ts     # OAuth callback
│   │   ├── login/page.tsx        # Login interface
│   │   └── error/page.tsx        # Error handling
│   ├── buyer/                    # Buyer-specific pages
│   │   └── book/                 # Booking interface
│   ├── seller/                   # Seller-specific pages
│   │   ├── page.tsx             # Seller dashboard
│   │   └── calendar/page.tsx    # Calendar settings
│   ├── appointments/page.tsx     # Appointment management
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── ui/                      # shadcn/ui components
│   ├── logout-button.tsx        # Authentication component
│   └── user-header.tsx          # User navigation
├── lib/                         # Utility libraries
│   ├── supabase/               # Database client
│   ├── google-calendar.ts      # Calendar integration
│   └── utils.ts                # Helper functions
├── hooks/                       # Custom React hooks
├── scripts/                     # Database migrations
└── styles/                      # Global styles
```

## 🔌 API Documentation

### **1. Authentication APIs**

#### `POST /api/auth/logout`
**Purpose**: Sign out the current user

**Request**:
```typescript
// No body required
```

**Response**:
```typescript
// Success
{ success: true }

// Error
{ error: "Error message" }
```

**Status Codes**:
- `200`: Successfully logged out
- `400`: Logout failed

---

### **2. Appointment APIs**

#### `POST /api/appointments`
**Purpose**: Create a new appointment and sync with Google Calendar

**Request**:
```typescript
{
  seller_id: string,           // UUID of the seller
  title: string,               // Appointment title
  description?: string,        // Optional description
  start_time: string,         // ISO datetime string
  end_time: string            // ISO datetime string
}
```

**Response**:
```typescript
// Success
{
  appointment: {
    id: string,
    seller_id: string,
    buyer_id: string,
    title: string,
    description: string | null,
    start_time: string,
    end_time: string,
    google_event_id: string | null,
    status: "confirmed" | "cancelled",
    created_at: string,
    updated_at: string
  },
  message: "Appointment booked successfully"
}

// Error
{ error: "Error message" }
```

**Status Codes**:
- `200`: Appointment created successfully
- `400`: Invalid request data
- `401`: Unauthorized (not logged in)
- `500`: Server error

**Features**:
- Validates user roles (only buyers can create appointments)
- Creates Google Calendar events for both parties
- Handles Google Calendar API failures gracefully
- Stores Google event ID for future reference

---

### **3. Availability APIs**

#### `GET /api/calendar/availability/[sellerId]?date=YYYY-MM-DD`
**Purpose**: Get available time slots for a seller on a specific date

**Parameters**:
- `sellerId`: UUID of the seller (path parameter)
- `date`: Date in YYYY-MM-DD format (query parameter)

**Request**:
```typescript
// GET request, no body
```

**Response**:
```typescript
// Success
{
  availableSlots: [
    {
      start: string,    // ISO datetime string
      end: string       // ISO datetime string
    }
  ]
}

// Error
{ error: "Error message" }
```

**Status Codes**:
- `200`: Successfully retrieved availability
- `400`: Missing or invalid date parameter
- `404`: Seller not found
- `500`: Server error

**Logic**:
1. **Google Calendar Integration**: If seller has connected Google Calendar:
   - Refreshes OAuth token
   - Fetches busy times from Google Calendar API
   - Generates available slots (9 AM - 5 PM, 1-hour intervals)
   - Excludes busy periods from Google Calendar

2. **Default Availability**: If no Google Calendar or API fails:
   - Generates 8 default slots (9:00 AM - 5:00 PM)
   - Each slot is 1 hour long

3. **Database Filtering**: 
   - Queries existing appointments for the date
   - Removes slots that conflict with confirmed appointments
   - Returns final available time slots

---

### **4. Authentication Callback**

#### `GET /auth/callback?code=...&role=...`
**Purpose**: Handle OAuth callback from Google and create user session

**Parameters**:
- `code`: OAuth authorization code (query parameter)
- `role`: User role - "buyer" or "seller" (query parameter)

**Response**:
- **Success**: Redirects to appropriate dashboard
- **Error**: Redirects to `/auth/error`

**Process**:
1. Exchanges OAuth code for session tokens
2. Creates/updates user profile in database
3. Stores Google refresh token (if available)
4. Redirects based on user role:
   - Sellers → `/seller`
   - Buyers → `/buyer/book`

## 🗄️ Database Design

### **Row Level Security (RLS)**
The application implements comprehensive RLS policies:

**Users Table**:
- Users can only view/edit their own profile
- Buyers can view all sellers (for booking)
- Sellers cannot view other sellers

**Appointments Table**:
- Users can only see appointments they're involved in
- Only buyers can create new appointments
- Both parties can update/cancel appointments

### **Indexes for Performance**:
```sql
idx_users_role              -- Fast role-based queries
idx_appointments_seller_id  -- Seller dashboard performance
idx_appointments_buyer_id   -- Buyer dashboard performance  
idx_appointments_start_time -- Date-based availability queries
```

## 🎨 UI/UX Features

### **Design System**
- **shadcn/ui**: Consistent, accessible components
- **Tailwind CSS**: Utility-first styling approach
- **Dark/Light Mode**: Theme support (future enhancement)
- **Responsive Design**: Mobile-first approach
- **Loading States**: Skeleton components and spinners
- **Error Handling**: User-friendly error messages

### **User Experience**
- **Role-based Navigation**: Different interfaces for buyers/sellers
- **Real-time Availability**: Instant slot checking
- **Calendar Integration**: Seamless Google Calendar sync
- **Conflict Prevention**: Automatic double-booking prevention
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

### **Accessibility**
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant colors
- **Focus Management**: Clear focus indicators

## 🔐 Security Features

### **Authentication**
- **OAuth 2.0**: Secure Google authentication
- **Session Management**: Supabase handles JWT tokens
- **CSRF Protection**: Built-in Next.js protection
- **XSS Prevention**: TypeScript + sanitization

### **Authorization**
- **Row Level Security**: Database-level access control
- **Role-based Access**: Buyers vs Sellers permissions
- **API Route Protection**: Middleware authentication
- **Input Validation**: Zod schema validation

### **Data Protection**
- **Encrypted Tokens**: Google refresh tokens are encrypted
- **HTTPS Only**: Secure data transmission
- **Environment Variables**: Sensitive data protection
- **SQL Injection Prevention**: Parameterized queries via Supabase

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm/pnpm/yarn
- Supabase account
- Google Cloud Platform account (for Calendar API)

### **Installation**

1. **Clone the repository**:
```bash
git clone <repository-url>
cd nextsched
```

2. **Install dependencies**:
```bash
npm install
# or
pnpm install
```

3. **Environment Setup**:
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

4. **Database Setup**:
```bash
# Run the SQL script in your Supabase dashboard
psql -f scripts/001_create_tables.sql
```

5. **Run the development server**:
```bash
npm run dev
```

### **Deployment**

**Vercel (Recommended)**:
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Manual Deployment**:
```bash
npm run build
npm start
```
---

**Live Demo**: [nextsched.vercel.app](https://nextsched.vercel.app)
**Repository**: [GitHub](https://github.com/JosephRemingston/nextsched)
**Contact**: [Email](mailto:your-email@example.com)