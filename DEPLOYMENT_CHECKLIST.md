# 🚀 Vercel KV Deployment Checklist

## ✅ **Pre-Deployment Setup**

### **1. Install Dependencies**
```bash
npm install
# This will install @vercel/kv
```

### **2. Create Vercel KV Database**
```bash
# Create KV database (this will add env vars to .env.local)
npx vercel kv create

# Verify environment variables were added
cat .env.local
```

### **3. Test Local Development**
```bash
# Start development server
./start-dev.sh

# Visit: http://localhost:4444/api/init-db
# This should initialize the database with sample data

# Test login with demo users
# Username: admin, Password: admin123
```

## 🌐 **Vercel Deployment Steps**

### **Step 1: Deploy to Vercel**
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel (if not already logged in)
vercel login

# Deploy to production
vercel --prod
```

### **Step 2: Configure Vercel KV in Production**
1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Select your project**
3. **Go to Storage tab**
4. **Create KV Database** (if not already created)
5. **Copy the environment variables**

### **Step 3: Set Environment Variables**
In your Vercel project settings → Environment Variables, add:
```env
KV_URL=your-redis-url
KV_REST_API_URL=your-rest-api-url
KV_REST_API_TOKEN=your-token
KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
```

### **Step 4: Initialize Production Database**
Visit: `https://your-app.vercel.app/api/init-db`

## 🔍 **Verification Steps**

### **1. Check Database Connection**
- Visit: `/api/init-db`
- Should see: `{"success":true,"message":"Database is ready"}`

### **2. Test Authentication**
- Login with demo credentials
- Should see dashboard with leave balances

### **3. Test Leave Request Flow**
- Submit a leave request
- Check admin panel for pending requests
- Approve/reject a request
- Verify leave balance updates

### **4. Check Data Persistence**
- Restart the application
- Data should persist (unlike JSON files)

## 🐛 **Common Issues & Solutions**

### **Issue: "Cannot find module '@vercel/kv'**
**Solution:**
```bash
npm install @vercel/kv
```

### **Issue: KV Connection Error**
**Solution:**
- Verify environment variables in Vercel
- Check KV database is created
- Ensure tokens are correct

### **Issue: Database Not Initialized**
**Solution:**
- Visit `/api/init-db` endpoint
- Check browser console for errors
- Verify KV permissions

### **Issue: Environment Variables Not Loading**
**Solution:**
- Redeploy after setting env vars
- Check Vercel project settings
- Verify variable names match exactly

## 📱 **Testing Checklist**

### **✅ Authentication**
- [ ] Admin login works
- [ ] User login works
- [ ] Logout works
- [ ] Session persists

### **✅ Dashboard**
- [ ] Leave balances display correctly
- [ ] Progress bars work
- [ ] Quick action buttons functional

### **✅ Leave Requests**
- [ ] Form submission works
- [ ] Date validation works
- [ ] Balance checking works
- [ ] Request saved to KV

### **✅ Admin Panel**
- [ ] All requests visible
- [ ] Approve/reject works
- [ ] Comments saved
- [ ] Leave balances update

### **✅ Data Persistence**
- [ ] Data survives page refresh
- [ ] Data survives app restart
- [ ] Data survives deployment

## 🎯 **Success Indicators**

### **✅ **Deployment Successful When:**
1. **App loads** without errors
2. **Database initializes** via `/api/init-db`
3. **Login works** with demo credentials
4. **Leave requests** can be created and processed
5. **Data persists** across restarts
6. **Admin panel** shows all requests
7. **Leave balances** update correctly

### **🚨 **Red Flags (Fix Before Going Live):**
- Database connection errors
- Authentication failures
- Data not persisting
- API endpoints returning 500 errors
- Environment variables missing

## 🔄 **Post-Deployment**

### **1. Monitor Performance**
- Check Vercel analytics
- Monitor KV usage
- Watch for errors in logs

### **2. Test All Features**
- Run through complete user flow
- Test admin functions
- Verify data persistence

### **3. Update Documentation**
- Update README with live URL
- Document any configuration changes
- Note any environment-specific settings

## 🎉 **Congratulations!**

Your Leave Tracker is now running on Vercel with persistent KV storage!

**Key Benefits Achieved:**
- ✅ **Persistent data** that survives deployments
- ✅ **Global availability** across all regions  
- ✅ **Automatic scaling** with your application
- ✅ **Free tier** with 100MB storage
- ✅ **Professional deployment** on Vercel

**Next Steps:**
- Share the live URL with your team
- Test with real users
- Monitor usage and performance
- Plan v2 features (real-time, notifications, etc.)

---

**Need Help?** Check the troubleshooting section in README.md or open an issue! 