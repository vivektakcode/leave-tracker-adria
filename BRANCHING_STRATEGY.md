# 🌿 **Leave Tracker - Git Branching Strategy**

## **Branch Structure**

### **Main Branch (`main`)**
- **Purpose**: Production-ready, stable code
- **Deployment**: Vercel Production (main.vercel.app)
- **Content**: Working email functionality, basic features
- **Status**: ✅ **Currently Working** - Email notifications functional

### **Development Branch (`dev`)**
- **Purpose**: Security implementation and new features
- **Deployment**: Vercel Preview (dev.vercel.app)
- **Content**: JWT auth, password hashing, input validation
- **Status**: 🔒 **Security Features Complete** - Ready for testing

## **Environment Setup**

### **Vercel Configuration**
```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "dev": true
    }
  }
}
```

### **Environment Variables**
- **Main Branch**: Basic Supabase + Resend config
- **Dev Branch**: Full security config + JWT secrets

## **Workflow**

### **1. Development (Dev Branch)**
```bash
git checkout dev
# Make changes, test security features
git push origin dev
# Vercel auto-deploys to dev.vercel.app
```

### **2. Production (Main Branch)**
```bash
# Only when dev is thoroughly tested
git checkout main
git merge dev
git push origin main
# Vercel auto-deploys to main.vercel.app
```

## **Current Status**

| Branch | Status | Features | Deployment |
|--------|--------|----------|------------|
| `main` | ✅ Working | Email, Basic Auth | Production |
| `dev` | 🔒 Complete | Full Security | Preview |

## **Next Steps**

1. **Test Dev Branch**: Verify all security features work
2. **Vercel Setup**: Configure preview deployments for dev branch
3. **Production Merge**: Only merge when dev is thoroughly tested
4. **Environment Variables**: Set up separate configs for each branch

## **Security Features in Dev Branch**

- ✅ JWT Authentication
- ✅ Password Hashing (bcryptjs)
- ✅ Input Validation (Zod)
- ✅ Protected API Routes
- ✅ Role-based Access Control
- ✅ Secure Token Storage
- ✅ Environment Variable Validation

## **Benefits of This Strategy**

1. **Risk Mitigation**: Main branch always works
2. **Parallel Development**: Security work doesn't break production
3. **Testing**: Dev branch can be thoroughly tested
4. **Rollback**: Easy to revert if issues arise
5. **Vercel Integration**: Both branches can have separate deployments
