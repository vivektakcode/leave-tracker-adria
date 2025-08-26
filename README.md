# Leave Tracker v1 - Vercel KV Edition

A modern, scalable leave management system built with Next.js and Vercel KV (Redis). This system provides persistent data storage that survives deployments and scales automatically.

## 🚀 Features

### ✅ **Authentication & User Management**
- Simple username/password authentication
- 6 predefined employees (1 admin + 5 regular users)
- Role-based access control (admin/user)

### ✅ **Leave Balance Management**
- Three types of leave:
  - **Casual Leave**: Personal and casual time off
  - **Sick Leave**: Medical and health-related leave  
  - **Privilege Leave**: Annual and earned leave
- Visual progress bars showing leave usage
- Real-time balance updates

### ✅ **Admin Panel**
- View all leave requests
- Approve/reject leave requests
- Add comments to decisions
- View employee information and leave balances
- Automatic leave balance updates on approval

### ✅ **User Dashboard**
- Beautiful leave balance display
- Quick action buttons
- Recent activity tracking
- Responsive design for all devices

### ✅ **Vercel KV Integration**
- **Persistent storage** that survives deployments
- **Global availability** across all regions
- **Automatic scaling** with your application
- **Free tier** with 100MB storage (more than enough!)

## 👥 **Demo Users**

| Username | Password | Role | Department |
|----------|----------|------|------------|
| `admin` | `admin123` | Admin | Management |
| `john` | `john123` | User | Engineering |
| `sarah` | `sarah123` | User | Marketing |
| `mike` | `mike123` | User | Sales |
| `emma` | `emma123` | User | HR |
| `alex` | `alex123` | User | Finance |

## 🛠️ **Technology Stack**

- **Frontend**: Next.js 14 + React 18
- **Styling**: Tailwind CSS
- **Database**: Vercel KV (Redis)
- **Authentication**: Custom JSON-based system
- **Deployment**: Vercel (automatic)

## 📁 **Project Structure**

```
Leave Tracker/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── init-db/       # Database initialization
│   │   └── leave-requests/ # Leave request CRUD
│   ├── layout.tsx         # Root layout with auth provider
│   └── page.tsx           # Main login/dashboard page
├── components/             # React components
│   ├── LeaveBalanceDashboard.tsx  # Main dashboard
│   ├── AdminPanel.tsx     # Admin interface
│   ├── LeaveRequestForm.tsx # Leave request form
│   └── MyRequestsList.tsx # User's leave requests
├── contexts/               # React contexts
│   └── JsonAuthContext.tsx # Authentication context
├── lib/                    # Utility libraries
│   └── vercelKVService.ts # Vercel KV service layer
├── data/                   # Sample data (for reference)
│   ├── employees.json     # Employee data structure
│   └── leave-requests.json # Leave request structure
└── vercel.json            # Vercel deployment config
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ (recommended: v22.17.1)
- npm or yarn
- Vercel account (free)

### **Local Development**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leave-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Vercel KV (Required for local dev)**
   ```bash
   # Create Vercel KV database
   npx vercel kv create
   
   # This will add environment variables to .env.local
   ```

4. **Start the development server**
   ```bash
   # Use the provided script (recommended)
   chmod +x start-dev.sh
   ./start-dev.sh
   
   # Or manually with Node.js v22+
   ~/.nvm/versions/node/v22.17.1/bin/npm run dev
   ```

5. **Initialize the database**
   ```bash
   # Visit: http://localhost:4444/api/init-db
   # This will create sample employees and leave requests
   ```

6. **Open your browser**
   - Navigate to: `http://localhost:4444`
   - Use any of the demo credentials above

## 🌐 **Vercel Deployment**

### **Step 1: Deploy to Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Step 2: Set up Vercel KV**
1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Storage tab**
4. **Create KV Database**
5. **Copy environment variables**

### **Step 3: Configure Environment Variables**
In your Vercel project settings, add:
```env
KV_URL=your-redis-url
KV_REST_API_URL=your-rest-api-url
KV_REST_API_TOKEN=your-token
KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
```

### **Step 4: Initialize Production Database**
Visit: `https://your-app.vercel.app/api/init-db`

## 🔧 **Configuration**

### **Port Configuration**
The application runs on port 4444 by default. To change this:

1. Edit `package.json`:
   ```json
   "scripts": {
     "dev": "next dev -p 3000"  // Change 4444 to your preferred port
   }
   ```

2. Or use the `start-dev.sh` script and modify the port there.

### **Vercel KV Configuration**
The system automatically uses Vercel KV when deployed. For local development, you need to:

1. **Create KV database**: `npx vercel kv create`
2. **Set environment variables** in `.env.local`
3. **Initialize database** via `/api/init-db` endpoint

## 📊 **Data Structure**

### **Employee Schema**
```json
{
  "id": "emp001",
  "username": "admin",
  "password": "admin123",
  "name": "Admin User",
  "email": "admin@company.com",
  "role": "admin",
  "department": "Management",
  "leaveBalance": {
    "casual": 15,
    "sick": 20,
    "privilege": 25
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### **Leave Request Schema**
```json
{
  "id": "req001",
  "employeeId": "emp002",
  "employeeName": "John Doe",
  "leaveType": "casual",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "reason": "Personal work",
  "status": "pending",
  "requestedAt": "2024-01-10T10:00:00Z"
}
```

## 🎯 **Usage Guide**

### **For Regular Employees**
1. **Login** with your username/password
2. **View Dashboard** showing your leave balances
3. **Request Leave** using the form
4. **View History** of your requests

### **For Administrators**
1. **Login** with admin credentials
2. **View Dashboard** with admin panel button
3. **Access Admin Panel** to manage requests
4. **Process Leave Requests** (approve/reject)
5. **Monitor Employee** leave balances

## 🔮 **Future Enhancements (v2)**

- **Real-time Updates**: WebSocket integration
- **Email Notifications**: Request status updates
- **Calendar Integration**: Visual leave calendar
- **Reports & Analytics**: Leave usage statistics
- **Mobile App**: React Native version
- **Advanced Authentication**: OAuth, 2FA

## 💡 **Key Benefits of Vercel KV**

- **Free Tier**: 100MB storage (you need ~1KB!)
- **Persistent**: Data survives deployments
- **Fast**: Redis-based, very quick
- **Scalable**: Grows with your needs
- **Integrated**: Works seamlessly with Vercel
- **Real-time**: Can handle concurrent users

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Vercel KV Connection Error**
   ```bash
   # Check environment variables
   # Ensure KV database is created
   # Verify tokens are correct
   ```

2. **Database Not Initialized**
   ```bash
   # Visit: /api/init-db
   # Check console for errors
   # Verify KV permissions
   ```

3. **Authentication Fails**
   - Verify username/password from demo credentials
   - Check browser console for errors
   - Ensure database is initialized

### **Development Tips**

- **Hot Reload**: Changes automatically reflect in browser
- **Console Logging**: Check browser console for detailed logs
- **API Testing**: Use `/api/init-db` to reset database
- **Environment Variables**: Keep `.env.local` for local development

## 📝 **Contributing**

This is a v1 system designed for simplicity. For contributions:

1. **Fork** the repository
2. **Create** a feature branch
3. **Test** thoroughly with demo users
4. **Submit** a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 **Support**

For support or questions:
- Check the troubleshooting section above
- Review the code comments for implementation details
- Open an issue for bugs or feature requests

---

**Built with ❤️ for simple, effective leave management with Vercel KV** 