# Clerk Setup Instructions

## Phase 1: Setup & Configuration ✅

### 1.1 Clerk SDK Installation ✅
- **Status**: Completed
- **Package**: `@clerk/nextjs` version `^6.36.0` is installed
- **Location**: `package.json` line 18

### 1.2 Environment Variables Setup ✅
- **Status**: Completed
- **Files Created**:
  - `.env.local` - Your local environment variables (add to `.gitignore`)
  - `.env.example` - Template for other developers

**Required Environment Variables**:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # From Clerk Dashboard
CLERK_SECRET_KEY=sk_test_...                    # From Clerk Dashboard
NEXT_PUBLIC_API_URL=http://localhost:2000      # Your backend URL
```

**Action Required**:
1. Open `.env.local` file
2. Replace placeholder values with your actual Clerk keys
3. Ensure `.env.local` is in `.gitignore` (keep secrets secure)

---

## 1.3 Clerk Dashboard Configuration

### Step-by-Step Setup

#### 1. Create or Access Clerk Account
- Go to: https://dashboard.clerk.com
- Sign up or log in
- Create a new application (or use existing one)

#### 2. Get Your API Keys
1. In Clerk Dashboard, select your application
2. Navigate to: **API Keys** (left sidebar)
3. Copy the following keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Paste them into your `.env.local` file

#### 3. Configure Allowed Origins (CORS)
1. In Clerk Dashboard, go to: **Settings** → **Authentication**
2. Scroll to **Allowed Origins**
3. Add your frontend URLs:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
4. Click **Save**

#### 4. Configure Redirect URLs
1. In Clerk Dashboard, go to: **Settings** → **Paths**
2. Configure the following paths:

**Sign-in page**:
- Path: `/sign-in`

**Sign-up page**:
- Path: `/sign-up`

**After sign-in URL**:
- Path: `/` (homepage)

**After sign-up URL**:
- Path: `/settings` (to complete profile)

3. Click **Save**

#### 5. Enable Email/Password Authentication
1. In Clerk Dashboard, go to: **User & Authentication** → **Email, Phone, Username**
2. Ensure **Email address** is enabled
3. Enable **Password** authentication
4. Configure:
   - ✅ Require email verification (recommended)
   - ✅ Password requirements (set to medium or strong)
5. Click **Save**

#### 6. Configure Public Metadata Schema (Important!)
1. In Clerk Dashboard, go to: **Settings** → **Metadata**
2. Add custom fields for `publicMetadata`:
   - Field: `role` (Type: `string`, Options: `USER`, `ADMIN`, `DEVELOPER`)
   - Field: `FCMTokens` (Type: `array` of `string`)

**Why?**: Your backend will sync user roles and FCM tokens to Clerk metadata.

#### 7. Configure Session Settings (Optional)
1. In Clerk Dashboard, go to: **Settings** → **Sessions**
2. Recommended settings:
   - **Session lifetime**: 7 days
   - **Inactivity timeout**: 1 day
   - **Multi-session handling**: Allow multiple sessions
3. Click **Save**

#### 8. Localization (Greek Support)
1. In Clerk Dashboard, go to: **Settings** → **Localization**
2. Add languages:
   - ✅ English (default)
   - ✅ Greek (Ελληνικά)
3. Clerk will automatically show UI in user's browser language
4. Click **Save**

---

## Verification Checklist

Before proceeding to Phase 2, verify:

- [ ] Clerk application created in dashboard
- [ ] API keys copied to `.env.local`
- [ ] Allowed origins configured (localhost:3000)
- [ ] Sign-in/Sign-up paths configured
- [ ] Email/Password authentication enabled
- [ ] Public metadata fields configured (role, FCMTokens)
- [ ] Session settings configured
- [ ] Greek localization enabled

---

## Backend Coordination

### Backend Must Support:

1. **Clerk JWT Token Verification**
   - Backend must verify JWT tokens from `Authorization: Bearer <token>` header
   - Use Clerk's backend SDK or JWT verification library
   - Validate token signature using Clerk's public keys

2. **User Creation on First Login**
   - When user signs in with Clerk for the first time
   - Backend receives JWT token with Clerk user ID
   - Backend creates corresponding user record in MongoDB
   - Backend syncs user data (role, FCMTokens) to Clerk metadata

3. **Metadata Synchronization**
   - When user role changes in backend → update Clerk `publicMetadata.role`
   - When FCM token updated → update Clerk `publicMetadata.FCMTokens`
   - Use Clerk Admin API to update metadata

### Backend Endpoints to Update:

All endpoints must accept Clerk JWT tokens instead of cookies:
- `/user` - Get current user (verify JWT, create if first login)
- `/reservations` - All reservation endpoints
- `/courts` - Court management (admin)
- `/announcements` - Announcement endpoints
- `/notifications` - FCM token management
- `/admin/*` - Admin endpoints

### Example Backend JWT Verification:

```javascript
// Node.js example using @clerk/clerk-sdk-node
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

app.use(ClerkExpressWithAuth());

app.get('/user', async (req, res) => {
  const userId = req.auth.userId; // Clerk user ID from JWT

  // Find or create user in MongoDB
  let user = await User.findOne({ clerkId: userId });

  if (!user) {
    // First time login - create user
    user = await User.create({
      clerkId: userId,
      email: req.auth.sessionClaims.email,
      role: 'USER', // default role
      // ... other fields
    });
  }

  res.json(user);
});
```

---

## CORS Configuration

### Backend CORS Settings:

Ensure backend allows requests from your frontend:

```javascript
// Express.js example
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Environment Variable**: Add frontend URL to backend's `ALLOW_ORIGIN` variable

---

## Next Steps

Once Phase 1 is complete:

✅ **Phase 1**: Setup & Dependencies (DONE)
→ **Phase 2**: Core Provider Integration
  - Wrap app with ClerkProvider
  - Update UserProvider to use Clerk

---

## Troubleshooting

### Issue: "Invalid Publishable Key"
- **Solution**: Double-check you copied the correct key from Clerk Dashboard
- **Note**: Use `pk_test_` for development, `pk_live_` for production

### Issue: CORS errors
- **Solution**: Add your frontend URL to Clerk's Allowed Origins
- **Solution**: Ensure backend CORS allows `Authorization` header

### Issue: "Redirect URL not allowed"
- **Solution**: Add redirect URLs in Clerk Dashboard → Settings → Paths

### Issue: Greek language not showing
- **Solution**: Enable Greek in Clerk Dashboard → Settings → Localization
- **Solution**: Clerk auto-detects browser language

---

## Security Notes

1. **Never commit `.env.local`** to git - keep secrets secure
2. **Use test keys** (`pk_test_`, `sk_test_`) for development
3. **Use production keys** (`pk_live_`, `sk_live_`) only in production
4. **Rotate keys** if accidentally exposed
5. **Backend must verify** JWT tokens - never trust client-side auth alone

---

## Resources

- Clerk Documentation: https://clerk.com/docs
- Clerk Dashboard: https://dashboard.clerk.com
- Next.js Integration Guide: https://clerk.com/docs/quickstarts/nextjs
- Backend SDK: https://clerk.com/docs/references/backend/overview

---

**Status**: Phase 1 Complete ✅
**Next**: Phase 2 - Core Provider Integration
