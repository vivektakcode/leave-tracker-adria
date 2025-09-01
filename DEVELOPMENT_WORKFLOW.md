# Development Workflow

## Branch Strategy

### 🌟 Main Branch
- **Purpose**: Production-ready code
- **Deployment**: Automatically deploys to production Vercel app
- **Protection**: Only merge from staging via pull requests or deployment script

### 🚧 Staging Branch  
- **Purpose**: Development and testing
- **Deployment**: Can be connected to a staging Vercel environment
- **Workflow**: All new features and fixes start here

## Development Process

### 1. Start New Development
```bash
# Switch to staging branch
git checkout staging

# Pull latest changes
git pull origin staging

# Start working on your feature
```

### 2. During Development
```bash
# Make your changes
# Commit regularly
git add .
git commit -m "feat: add new functionality"

# Push to staging branch
git push origin staging
```

### 3. Deploy to Production
When your staging changes are ready for production:

**Option A: Using the deployment script**
```bash
# From staging branch, run the deployment script
./scripts/deploy-to-main.sh
```

**Option B: Manual deployment**
```bash
# From staging branch
git checkout main
git pull origin main
git merge staging --no-ff -m "Deploy: Merge staging to main"
git push origin main
git checkout staging
```

## Vercel Setup

### Production Environment (Main Branch)
- **URL**: `https://leave-tracker-adria.vercel.app`
- **Branch**: `main`
- **Environment**: Production Supabase database

### Staging Environment (Optional)
- **URL**: `https://leave-tracker-adria-staging.vercel.app`
- **Branch**: `staging`  
- **Environment**: Can use same database or separate staging database

## Best Practices

### ✅ Do
- Always work on staging branch for new features
- Test thoroughly on staging before deploying to main
- Use meaningful commit messages
- Keep staging branch up to date with main

### ❌ Don't
- Don't commit directly to main branch
- Don't deploy untested code to production
- Don't force push to main branch

## Quick Commands

```bash
# Switch to staging for development
git checkout staging

# Deploy staging to main
./scripts/deploy-to-main.sh

# Check current branch
git branch --show-current

# View recent commits
git log --oneline -10
```

## Troubleshooting

### If deployment script fails:
1. Check you're on staging branch
2. Ensure all changes are committed
3. Make sure staging is pushed to remote
4. Run script again

### If merge conflicts occur:
1. Resolve conflicts manually
2. Complete the merge
3. Test thoroughly before pushing to main

## Environment Variables

Both staging and main should have the same environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `RESEND_API_KEY`
- `NEXT_PUBLIC_WEBSITE_URL`
