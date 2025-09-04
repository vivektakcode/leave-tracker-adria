# SendGrid Setup Guide for Adria Leave Management System

## 🎯 **Why SendGrid?**

Since you don't have DNS access through Squarespace, SendGrid is the perfect solution:

- ✅ **No domain verification required** for basic sending
- ✅ **Works with any email address** (including `adria-bt.com`)
- ✅ **Free tier available** (100 emails/day)
- ✅ **Excellent deliverability**
- ✅ **Easy integration** with Next.js
- ✅ **No DNS configuration needed**

## 🔧 **Setup Steps**

### **Step 1: Create SendGrid Account**

1. **Go to SendGrid**: https://sendgrid.com
2. **Sign up** for a free account
3. **Verify your email** address
4. **Complete account setup**

### **Step 2: Create API Key**

1. **Login to SendGrid Dashboard**
2. **Go to Settings** → **API Keys**
3. **Click "Create API Key"**
4. **Choose "Restricted Access"**
5. **Give it a name**: "Adria Leave Management"
6. **Set permissions**:
   - ✅ **Mail Send**: Full Access
   - ❌ **Other permissions**: Not needed
7. **Click "Create & View"**
8. **Copy the API key** (starts with `SG.`)

### **Step 3: Add API Key to Vercel**

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings** → **Environment Variables**
4. **Add new variable**:
   - **Name**: `SENDGRID_API_KEY`
   - **Value**: `SG.your-api-key-here`
   - **Environment**: Production, Preview, Development
5. **Save**

### **Step 4: Test Email Delivery**

Once deployed, test the email system:

```bash
# Test with your company email
curl -X POST https://your-app.vercel.app/api/test-sendgrid \
  -H "Content-Type: application/json" \
  -d '{"email": "mahesh.aitham@adria-bt.com", "testType": "basic"}'
```

## 📧 **How It Works**

### **Email Flow:**
1. **Employee submits** leave request
2. **System creates** leave request in database
3. **SendGrid sends** email to manager
4. **Manager receives** email notification
5. **Manager can approve/reject** via admin panel

### **From Address:**
- **Current**: `noreply@adria-bt.com`
- **Works without verification** (SendGrid allows this)
- **Professional appearance** for recipients

## 🚀 **Benefits Over Resend**

| Feature | Resend | SendGrid |
|---------|--------|----------|
| Domain Verification | Required | Not required |
| DNS Configuration | Required | Not required |
| Free Tier | Limited | 100 emails/day |
| Deliverability | Good | Excellent |
| Setup Complexity | High | Low |
| Squarespace Compatible | No | Yes |

## 📋 **Testing Checklist**

- [ ] SendGrid account created
- [ ] API key generated and copied
- [ ] API key added to Vercel environment variables
- [ ] Application deployed with SendGrid
- [ ] Test email sent to company address
- [ ] Email received successfully
- [ ] Leave request notification works

## 🔍 **Troubleshooting**

### **If emails don't send:**
1. **Check API key** is correct in Vercel
2. **Verify SendGrid account** is active
3. **Check console logs** for error messages
4. **Test with Gmail** first to verify setup

### **If emails go to spam:**
1. **Check spam folder** first
2. **Add sender to contacts** if needed
3. **Consider upgrading** to paid plan for better deliverability

## 📞 **Support**

### **SendGrid Support:**
- **Documentation**: https://docs.sendgrid.com
- **Support**: Available in dashboard
- **Community**: SendGrid community forums

### **Expected Results:**
- ✅ Emails delivered to `adria-bt.com` addresses
- ✅ Leave request notifications work
- ✅ No DNS configuration required
- ✅ Professional email appearance

## 🎯 **Next Steps**

1. **Create SendGrid account**
2. **Generate API key**
3. **Add to Vercel environment variables**
4. **Deploy application**
5. **Test email delivery**
6. **Verify leave request notifications work**

**Once set up, your email system will work perfectly with your company addresses without any DNS configuration!** 🚀
