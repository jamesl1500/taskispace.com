# GitHub Actions Deployment Guide

This repository uses GitHub Actions for automated CI/CD. Below is a comprehensive guide to set up and use the deployment workflows.

## 📋 Required GitHub Secrets

Before using the workflows, configure these secrets in your repository settings (`Settings > Secrets and variables > Actions`):

### Supabase Secrets
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token
- `SUPABASE_DB_PASSWORD` - Database password for migrations

### Vercel Secrets
- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

### Application Secrets
- `NEXT_PUBLIC_APP_URL` - Your production app URL (e.g., https://taskispace.com)
- `OPENAI_API_KEY` - OpenAI API key for Jarvis AI
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### Optional Secrets
- `SNYK_TOKEN` - Snyk security scanning token (optional)
- `CODECOV_TOKEN` - Codecov token for coverage reports (optional)

## 🚀 Workflows Overview

### 1. `deploy.yml` - Main Deployment Pipeline

**Triggers:**
- Push to `master` branch
- Pull requests to `master`
- Manual trigger via `workflow_dispatch`

**Jobs:**
1. **Lint** - Runs ESLint checks
2. **Test** - Executes all tests with coverage
3. **Build** - Builds the Next.js application
4. **Deploy to Vercel (Production)** - Deploys to production on master branch
5. **Deploy Preview** - Creates preview deployments for PRs
6. **Database Migrations** - Runs Supabase migrations
7. **Health Check** - Verifies deployment health
8. **Notifications** - Sends deployment status updates

**Usage:**
```bash
# Automatic deployment on push to master
git push origin master

# Manual trigger
# Go to Actions tab > Deploy to Production > Run workflow
```

### 2. `ci.yml` - Continuous Integration

**Triggers:**
- Push to any branch except `master`
- Pull requests

**Jobs:**
1. **Lint** - ESLint validation
2. **Type Check** - TypeScript validation
3. **Tests** - Unit and integration tests
4. **Build Check** - Ensures application builds successfully

**Purpose:** Validates code quality before merging to master.

### 3. `security.yml` - Security Auditing

**Triggers:**
- Push to `master`
- Pull requests
- Daily at 2 AM UTC
- Manual trigger

**Jobs:**
- npm audit
- Snyk security scanning
- OWASP dependency check
- Creates GitHub issues for vulnerabilities

**Purpose:** Identifies security vulnerabilities in dependencies.

### 4. `dependency-update.yml` - Automated Dependency Updates

**Triggers:**
- Weekly on Mondays at 9 AM UTC
- Manual trigger

**Jobs:**
- Updates all dependencies
- Creates PR with changes
- Runs tests automatically

**Purpose:** Keeps dependencies up-to-date with minimal manual work.

### 5. `performance.yml` - Performance Testing

**Triggers:**
- Push to `master`
- Weekly on Sundays at 3 AM UTC
- Manual trigger

**Jobs:**
- Lighthouse performance audit
- Bundle size analysis

**Purpose:** Monitors application performance over time.

## 🔧 Setup Instructions

### 1. Get Vercel Credentials

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Get your credentials
vercel project ls
# Copy the Project ID

# Get org ID from Vercel dashboard
# Settings > General > Organization ID
```

### 2. Get Supabase Credentials

```bash
# Install Supabase CLI
brew install supabase/tap/supabase  # macOS
# or
npm i -g supabase  # npm

# Login
supabase login

# Get access token
supabase --version
# Token is stored in ~/.supabase/access-token

# Get project ref from Supabase dashboard
# Project Settings > General > Reference ID
```

### 3. Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to `Settings > Secrets and variables > Actions`
3. Click `New repository secret`
4. Add each secret from the list above

### 4. Configure Environments (Optional but Recommended)

1. Go to `Settings > Environments`
2. Create two environments:
   - `production` - Require reviewers for production deploys
   - `preview` - No restrictions for preview deploys

## 📝 Deployment Workflow

### Standard Deployment Process

1. **Feature Development:**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Create Pull Request:**
   - CI workflow runs automatically
   - Preview deployment created
   - Review code and preview

3. **Merge to Master:**
   ```bash
   git checkout master
   git merge feature/new-feature
   git push origin master
   ```

4. **Automatic Deployment:**
   - Deploy workflow triggers
   - Lints, tests, and builds
   - Deploys to Vercel
   - Runs database migrations
   - Performs health checks

### Rollback Procedure

If a deployment fails or causes issues:

1. **Via Vercel Dashboard:**
   - Go to Vercel dashboard
   - Select your project
   - Navigate to Deployments
   - Click on previous working deployment
   - Click "Promote to Production"

2. **Via Git Revert:**
   ```bash
   # Find the commit to revert
   git log --oneline

   # Revert the problematic commit
   git revert <commit-hash>
   git push origin master
   ```

## 🔍 Monitoring and Debugging

### View Workflow Runs

1. Go to `Actions` tab in your repository
2. Click on a workflow run to see details
3. Click on individual jobs to see logs

### Common Issues

**Issue: Deployment fails with "Missing secret"**
- **Solution:** Ensure all required secrets are configured in GitHub

**Issue: Build fails with environment variable errors**
- **Solution:** Check that all `NEXT_PUBLIC_*` variables are set in secrets

**Issue: Database migration fails**
- **Solution:** 
  - Check Supabase credentials
  - Verify migrations are valid SQL
  - Check database permissions

**Issue: Health check fails**
- **Solution:**
  - Verify `NEXT_PUBLIC_APP_URL` is correct
  - Check that application actually deployed
  - Look at Vercel deployment logs

### Debug Mode

To enable verbose logging in workflows, add this to any job:

```yaml
- name: Debug
  run: |
    echo "Debug information"
    env
```

## 🎯 Best Practices

1. **Always test locally before pushing:**
   ```bash
   pnpm run lint
   pnpm test
   pnpm run build
   ```

2. **Use feature branches:**
   - Never push directly to `master`
   - Always create PRs for review

3. **Review preview deployments:**
   - Test functionality on preview URL
   - Check for console errors

4. **Monitor security alerts:**
   - Review security workflow results
   - Address vulnerabilities promptly

5. **Keep dependencies updated:**
   - Review dependency update PRs weekly
   - Test updates before merging

## 📊 Performance Budgets

The performance workflow will warn if:
- First Contentful Paint > 2s
- Largest Contentful Paint > 3s
- Time to Interactive > 5s
- Total bundle size > 500KB

## 🔐 Security Checklist

- [ ] All secrets are configured in GitHub
- [ ] Vercel environment variables match GitHub secrets
- [ ] Supabase RLS policies are enabled
- [ ] API routes have authentication
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are set

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

## 🆘 Support

If you encounter issues:
1. Check workflow logs in GitHub Actions tab
2. Review this documentation
3. Check Vercel deployment logs
4. Review Supabase dashboard for database issues
5. Create an issue in the repository

---

**Last Updated:** November 20, 2025
