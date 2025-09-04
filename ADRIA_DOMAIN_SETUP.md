# Adria Domain Setup Guide for Resend Email Delivery

## 🎯 **Objective**
Configure `adria-bt.com` domain in Resend to enable email delivery to company addresses.

## 📧 **Current Issue**
- Emails are being sent but failing delivery to `adria-bt.com` addresses
- Resend dashboard shows only 6-day-old emails (Gmail addresses)
- Recent emails to company addresses are not being delivered

## 🔧 **Solution: Domain Verification**

### **Step 1: Add Domain to Resend**

1. **Login to Resend Dashboard**
   - Go to: https://resend.com/domains
   - Click **"Add Domain"**

2. **Enter Domain**
   - Domain: `adria-bt.com`
   - Click **"Add Domain"**

### **Step 2: DNS Configuration**

Resend will provide DNS records to add to your domain:

#### **Required DNS Records:**
```
Type: TXT
Name: @
Value: resend-verification-[random-string]

Type: CNAME
Name: resend
Value: resend.com

Type: MX (if not already configured)
Name: @
Value: mx.resend.com
Priority: 10
```

### **Step 3: Add DNS Records**

#### **For Adria IT Team:**
1. **Access DNS Management**
   - Login to your domain registrar (where `adria-bt.com` is registered)
   - Go to DNS management section

2. **Add TXT Record**
   - Type: `TXT`
   - Name: `@` (or leave blank)
   - Value: `resend-verification-[provided-string]`
   - TTL: `3600` (or default)

3. **Add CNAME Record**
   - Type: `CNAME`
   - Name: `resend`
   - Value: `resend.com`
   - TTL: `3600` (or default)

4. **Verify MX Record**
   - Ensure MX record points to your email server
   - Or add: `mx.resend.com` with priority `10`

### **Step 4: Wait for Verification**

- **DNS Propagation**: 5-30 minutes
- **Resend Verification**: Check dashboard for status
- **Status**: Should show "Verified" when complete

### **Step 5: Test Email Delivery**

Once verified, test with company addresses:

```bash
# Test with company email
curl -X POST https://your-app.vercel.app/api/debug-email \
  -H "Content-Type: application/json" \
  -d '{"email": "mahesh.aitham@adria-bt.com", "testType": "domain"}'
```

## 📋 **Action Items**

### **For Development Team:**
- ✅ **Updated**: From address changed to `noreply@adria-bt.com`
- 🔄 **Next**: Deploy updated email configuration
- 🔄 **Next**: Test email delivery after domain verification

### **For IT Team:**
- 🔄 **Add Domain**: `adria-bt.com` to Resend
- 🔄 **DNS Records**: Add TXT and CNAME records
- 🔄 **Verify**: Wait for domain verification
- 🔄 **Test**: Confirm email delivery works

## 🚨 **Important Notes**

### **Before Domain Verification:**
- Emails will continue to fail delivery
- Resend dashboard won't show recent emails
- System will show "email sent" but no actual delivery

### **After Domain Verification:**
- Emails will be delivered successfully
- Resend dashboard will show all sent emails
- Company addresses will receive notifications

## 🔍 **Verification Checklist**

- [ ] Domain added to Resend dashboard
- [ ] TXT record added to DNS
- [ ] CNAME record added to DNS
- [ ] Domain shows "Verified" status in Resend
- [ ] Test email sent successfully
- [ ] Email appears in Resend dashboard
- [ ] Manager receives email notification

## 📞 **Support**

### **If DNS Issues:**
- Contact your domain registrar support
- Check DNS propagation: https://dnschecker.org
- Verify records are correct

### **If Resend Issues:**
- Check Resend dashboard for error messages
- Contact Resend support if needed
- Verify API key permissions

## 🎯 **Expected Results**

After successful domain verification:
- ✅ Emails delivered to `adria-bt.com` addresses
- ✅ Resend dashboard shows all sent emails
- ✅ Managers receive leave request notifications
- ✅ System works as intended for company use

## 📧 **Updated Configuration**

The system now uses:
- **From Address**: `Leave Management <noreply@adria-bt.com>`
- **Target Domain**: `adria-bt.com` (verified)
- **Email Service**: Resend with domain verification
