# Supabase Setup Guide

## Phase 2: Free PostgreSQL Database with Supabase

### Why Supabase Instead of Vercel KV?

✅ **Free Tier Available**: 500MB database, 50,000 monthly active users
✅ **PostgreSQL**: Enterprise-grade database with full SQL support
✅ **Real-time**: Built-in real-time subscriptions
✅ **Authentication**: Built-in auth system (optional)
✅ **Dashboard**: Easy-to-use web interface for data management

### Setup Steps

#### 1. Create Supabase Account

1. **Go to [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign up with GitHub/Google**
4. **Create new organization**

#### 2. Create New Project

1. **Click "New Project"**
2. **Choose organization**
3. **Enter project name**: `leave-tracker-adria`
4. **Enter database password** (save this!)
5. **Choose region** (closest to your users)
6. **Click "Create new project"**

#### 3. Get Your Credentials

After project creation, go to **Settings** → **API**:

- **Project URL**: `https://your-project-id.supabase.co`
- **Anon Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 4. Create Database Tables

Go to **SQL Editor** and run this SQL:

```sql
-- Create employees table
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) NOT NULL,
  department TEXT NOT NULL,
  leaveBalance JSONB NOT NULL DEFAULT '{"casual": 0, "sick": 0, "privilege": 0}',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leave_requests table
CREATE TABLE leave_requests (
  id TEXT PRIMARY KEY,
  employeeId TEXT NOT NULL,
  employeeName TEXT NOT NULL,
  leaveType TEXT CHECK (leaveType IN ('casual', 'sick', 'privilege')) NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
  requestedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processedAt TIMESTAMP WITH TIME ZONE,
  processedBy TEXT,
  comments TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_employees_username ON employees(username);
CREATE INDEX idx_leave_requests_employeeId ON leave_requests(employeeId);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_requestedAt ON leave_requests(requestedAt);
```

#### 5. Set Environment Variables

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
   ```

**For Local Development:**
1. Create `.env.local` file
2. Add the same variables

#### 6. Deploy and Test

1. **Push your code** (already done)
2. **Vercel will auto-deploy** with new environment variables
3. **Visit your app** and test login functionality
4. **Data will be stored in Supabase** instead of JSON

### Features Now Available

🚀 **Real-time Data Persistence**
- Employee data stored in PostgreSQL
- Leave requests persisted across deployments
- Real-time balance updates

🔒 **Production-Ready Database**
- ACID compliance
- Automatic backups
- SQL query support
- Row Level Security (optional)

📊 **Leave Management System**
- Create, approve, reject leave requests
- Automatic balance calculations
- Audit trail for all actions

### Local Development

For local development:
1. Create `.env.local` with your Supabase credentials
2. The app will automatically use Supabase
3. All data will be stored in your cloud database

### Database Management

**View Data:**
- Go to **Table Editor** in Supabase dashboard
- View `employees` and `leave_requests` tables
- Edit data directly if needed

**Monitor Usage:**
- **Settings** → **Usage** shows your current usage
- Free tier: 500MB database, 50K monthly active users

### Next Steps

After successful deployment:
1. Test all functionality in production
2. Monitor database usage
3. Consider adding real-time subscriptions
4. Implement Row Level Security for production

### Troubleshooting

**Common Issues:**
- **"Invalid API key"**: Check your anon key in environment variables
- **"Table doesn't exist"**: Run the SQL commands in Supabase SQL Editor
- **"Connection failed"**: Verify your project URL and region

**Need Help?**
- Supabase has excellent documentation
- Community Discord: [discord.supabase.com](https://discord.supabase.com)
- GitHub Discussions: [github.com/supabase/supabase](https://github.com/supabase/supabase) 