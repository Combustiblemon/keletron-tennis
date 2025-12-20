# Environment Variables Setup

## ⚠️ Action Required

You need to create a `.env.local` file in the root of your project with the following variables:

### Create `.env.local` File

```bash
# Copy this template and replace with your actual values

# ==========================================
# CLERK AUTHENTICATION (Required for Phase 1)
# ==========================================
# Get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# ==========================================
# API CONFIGURATION (Already exists)
# ==========================================
NEXT_PUBLIC_API_URL=http://localhost:2000

# ==========================================
# FIREBASE CLOUD MESSAGING (Already exists)
# ==========================================
NEXT_PUBLIC_VAPID_KEY=your_vapid_key_here
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"your_api_key","authDomain":"your_domain","projectId":"your_project_id","storageBucket":"your_bucket","messagingSenderId":"your_sender_id","appId":"your_app_id"}

# ==========================================
# WEBSITE URL (Already exists)
# ==========================================
WEBSITE_URL=http://localhost:3000
```

## How to Get Clerk Keys

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Create or select your application**
3. **Navigate to**: API Keys (in left sidebar)
4. **Copy**:
   - Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Secret Key (starts with `sk_test_` or `sk_live_`)
5. **Paste** them into your `.env.local` file

## Verification

After creating `.env.local`, verify:
- [ ] File exists in project root
- [ ] All Clerk keys are filled in
- [ ] File is NOT committed to git (should be in `.gitignore`)

## Security Notes

⚠️ **NEVER commit `.env.local` to git**
- This file contains sensitive API keys
- It should already be in `.gitignore`
- Share keys securely with team members (use password manager, not email)

## Next Steps

Once `.env.local` is configured with Clerk keys:
1. Review `CLERK_SETUP.md` for Clerk Dashboard configuration
2. Proceed to Phase 2 (ClerkProvider integration)
