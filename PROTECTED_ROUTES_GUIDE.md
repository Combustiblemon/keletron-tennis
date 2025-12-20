# Protected Routes Guide

## Overview

This guide explains how route protection works in the Keletron Tennis application using Clerk authentication.

---

## Two Layers of Protection

### 1. Server-Side Protection (Middleware)

**File**: `middleware.ts`

Clerk's middleware runs **before** pages load, protecting routes at the server level.

**Protected Routes** (require authentication):
- `/admin` - Admin panel
- `/reservations` - User reservations
- `/settings` - User settings
- Any other route not listed as public

**Public Routes** (no authentication required):
- `/` - Homepage
- `/sign-in` - Sign-in page
- `/sign-up` - Sign-up page
- `/auth` - Legacy auth page (redirects to sign-in)

**How it works**:
```typescript
export default authMiddleware({
  publicRoutes: ['/', '/sign-in(.*)', '/sign-up(.*)', '/auth'],
  ignoredRoutes: ['/api/webhooks(.*)', '/_next(.*)', '/public(.*)'],
});
```

**Benefits**:
- Blocks unauthorized access before page loads
- SEO-friendly (returns proper 401 status)
- Works even if JavaScript is disabled
- Automatic redirect to `/sign-in`

### 2. Client-Side Protection (Components)

**Files**:
- `components/ProtectedRoute/ProtectedRoute.tsx`
- `components/AuthLoading/AuthLoading.tsx`

Client-side components provide better UX with loading states and access control.

**How it works**:
```tsx
<ProtectedRoute requireAdmin>
  <AdminContent />
</ProtectedRoute>
```

**Benefits**:
- Shows loading state while checking auth
- Provides custom error messages
- Supports role-based access (admin/user)
- Better user experience

---

## Usage Patterns

### Pattern 1: Basic Protected Page

**Use Case**: Page requires authentication but any authenticated user can access.

**Example**: `/reservations`, `/settings`

```tsx
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

const ReservationsPage = () => {
  return (
    <ProtectedRoute>
      <YourContent />
    </ProtectedRoute>
  );
};

export default ReservationsPage;
```

**What happens**:
1. Middleware checks auth at server level
2. If not authenticated → redirect to `/sign-in`
3. If authenticated → page loads
4. `ProtectedRoute` shows loading state while verifying
5. Once verified → content displays

### Pattern 2: Admin-Only Page

**Use Case**: Page requires admin or developer role.

**Example**: `/admin`

```tsx
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

const AdminPage = () => {
  return (
    <ProtectedRoute requireAdmin>
      <AdminContent />
    </ProtectedRoute>
  );
};

export default AdminPage;
```

**What happens**:
1. Middleware checks auth at server level
2. If not authenticated → redirect to `/sign-in`
3. If authenticated but not admin → shows "Access Denied" message
4. If admin → content displays

### Pattern 3: Public Page with Auth-Aware Content

**Use Case**: Page is public but shows different content based on auth status.

**Example**: `/` (homepage)

```tsx
import { useUser } from '@/components/UserProvider/UserProvider';

const Homepage = () => {
  const { isAuthenticated } = useUser();

  return isAuthenticated ? <LoggedInHomepage /> : <LoggedOutHomepage />;
};

export default Homepage;
```

**No ProtectedRoute needed** - page is public but content varies.

### Pattern 4: Loading State Only

**Use Case**: Need loading state but not full protection logic.

**Example**: Complex component needing auth check

```tsx
import AuthLoading from '@/components/AuthLoading/AuthLoading';

const MyComponent = () => {
  return (
    <AuthLoading>
      <YourContent />
    </AuthLoading>
  );
};
```

---

## Components Reference

### ProtectedRoute

**Location**: `components/ProtectedRoute/ProtectedRoute.tsx`

**Props**:
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;  // If true, requires admin/developer role
  fallback?: React.ReactNode;  // Custom fallback for access denied
}
```

**Features**:
- ✅ Shows loading state while checking auth
- ✅ Redirects to `/sign-in` if not authenticated
- ✅ Shows "Access Denied" if admin required but user isn't admin
- ✅ Supports custom fallback UI
- ✅ Works with Clerk's UserProvider

**Example with custom fallback**:
```tsx
<ProtectedRoute
  requireAdmin
  fallback={<CustomAccessDenied />}
>
  <AdminContent />
</ProtectedRoute>
```

### AuthLoading

**Location**: `components/AuthLoading/AuthLoading.tsx`

**Props**:
```typescript
interface AuthLoadingProps {
  children: React.ReactNode;
}
```

**Features**:
- ✅ Shows loading spinner while auth is being checked
- ✅ Displays "Loading..." text
- ✅ Centered full-screen layout
- ✅ Automatically hides when auth check complete

**When to use**:
- Need loading state but not full protection
- Component needs to wait for auth before rendering
- Want consistent loading UX across app

---

## Middleware Configuration

### Current Configuration

```typescript
export default authMiddleware({
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/auth',
    '/api/public(.*)',
  ],
  ignoredRoutes: [
    '/api/webhooks(.*)',
    '/_next(.*)',
    '/favicon.ico',
    '/public(.*)',
  ],
  debug: false,
});
```

### Adding New Public Routes

```typescript
publicRoutes: [
  '/',
  '/about',  // ← Add new public route
  '/sign-in(.*)',
  // ...
],
```

### Adding New Protected Routes

**No action needed!** All routes are protected by default unless explicitly listed in `publicRoutes`.

### Debugging

Enable debug mode to see auth checks in console:

```typescript
export default authMiddleware({
  // ...
  debug: true,  // ← Enable for development
});
```

---

## Route Protection Matrix

| Route | Server Protected (Middleware) | Client Protected (Component) | Requires Admin | Notes |
|-------|------------------------------|------------------------------|----------------|-------|
| `/` | ❌ Public | ❌ No | ❌ No | Shows different content based on auth |
| `/sign-in` | ❌ Public | ❌ No | ❌ No | Clerk's sign-in page |
| `/sign-up` | ❌ Public | ❌ No | ❌ No | Clerk's sign-up page |
| `/auth` | ❌ Public | ❌ No | ❌ No | Redirects to `/sign-in` |
| `/reservations` | ✅ Protected | ✅ Yes | ❌ No | Any authenticated user |
| `/settings` | ✅ Protected | ✅ Yes | ❌ No | Any authenticated user |
| `/admin` | ✅ Protected | ✅ Yes | ✅ Yes | Admin or Developer only |

---

## Best Practices

### 1. Always Use Both Layers

**❌ Bad** (only client-side):
```tsx
const AdminPage = () => {
  const { isAdmin } = useUser();
  if (!isAdmin) return <AccessDenied />;
  return <AdminContent />;
};
```

**✅ Good** (both layers):
```tsx
const AdminPage = () => {
  return (
    <ProtectedRoute requireAdmin>
      <AdminContent />
    </ProtectedRoute>
  );
};
```

**Why**: Client-side checks can be bypassed. Middleware provides server-side security.

### 2. Don't Over-Protect

**❌ Bad** (unnecessary protection):
```tsx
// Homepage is public, no need for ProtectedRoute
<ProtectedRoute>
  <Homepage />
</ProtectedRoute>
```

**✅ Good** (conditional content):
```tsx
const Homepage = () => {
  const { isAuthenticated } = useUser();
  return isAuthenticated ? <LoggedIn /> : <LoggedOut />;
};
```

### 3. Consistent Loading States

**✅ Good** (consistent loading UX):
```tsx
<ProtectedRoute>
  <PageContent />  {/* Loading handled by ProtectedRoute */}
</ProtectedRoute>
```

### 4. Avoid Loading Flashes

**❌ Bad** (shows content then redirects):
```tsx
const ProtectedPage = () => {
  const { isAuthenticated } = useUser();

  // Content flashes before redirect
  if (!isAuthenticated) {
    router.push('/sign-in');
    return null;
  }

  return <Content />;
};
```

**✅ Good** (loading state, then content):
```tsx
<ProtectedRoute>
  <Content />  {/* Only shows after auth verified */}
</ProtectedRoute>
```

---

## Testing Routes

### Manual Testing Checklist

**Unauthenticated User**:
- [ ] Try accessing `/admin` → Should redirect to `/sign-in`
- [ ] Try accessing `/reservations` → Should redirect to `/sign-in`
- [ ] Try accessing `/settings` → Should redirect to `/sign-in`
- [ ] Access `/` → Should show logged-out homepage
- [ ] Access `/sign-in` → Should show sign-in form

**Authenticated User (Non-Admin)**:
- [ ] Try accessing `/admin` → Should show "Access Denied"
- [ ] Access `/reservations` → Should show reservations page
- [ ] Access `/settings` → Should show settings page
- [ ] Access `/` → Should show logged-in homepage

**Authenticated Admin User**:
- [ ] Access `/admin` → Should show admin panel
- [ ] Access `/reservations` → Should show reservations page
- [ ] Access `/settings` → Should show settings page

### Automated Testing

```typescript
// Example test
describe('Protected Routes', () => {
  it('redirects to sign-in when not authenticated', () => {
    // Visit protected route
    cy.visit('/admin');

    // Should redirect to sign-in
    cy.url().should('include', '/sign-in');
  });

  it('allows access when authenticated', () => {
    // Sign in first
    cy.signIn('user@example.com', 'password');

    // Visit protected route
    cy.visit('/reservations');

    // Should stay on page
    cy.url().should('include', '/reservations');
  });
});
```

---

## Troubleshooting

### Issue: Middleware not protecting routes

**Symptoms**: Can access protected routes without authentication

**Solutions**:
1. Check `middleware.ts` exists at project root
2. Verify route not in `publicRoutes` array
3. Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
4. Restart dev server

### Issue: Infinite redirect loop

**Symptoms**: Page keeps redirecting between route and sign-in

**Solutions**:
1. Check ProfileCheck doesn't redirect from `/sign-in`
2. Verify `/sign-in` is in `publicRoutes`
3. Clear browser cookies and try again

### Issue: Loading state never ends

**Symptoms**: Shows loading spinner indefinitely

**Solutions**:
1. Check `isUserLoading` is updating correctly
2. Verify Clerk keys are set in `.env.local`
3. Check network tab for API errors
4. Verify UserProvider is wrapping component

### Issue: Access denied for admin users

**Symptoms**: Admin users see "Access Denied"

**Solutions**:
1. Check user role in Clerk metadata: `user.publicMetadata.role`
2. Verify backend syncs role to Clerk
3. Check `userRoles.isAdmin` in UserProvider
4. Try signing out and back in

---

## Migration Guide

### From Old System

**Old** (manual auth checks):
```tsx
const ProtectedPage = () => {
  const { isAuthenticated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return <Content />;
};
```

**New** (ProtectedRoute component):
```tsx
const ProtectedPage = () => {
  return (
    <ProtectedRoute>
      <Content />
    </ProtectedRoute>
  );
};
```

**Benefits**:
- Less boilerplate
- Consistent behavior
- Better loading states
- Server-side protection

---

## Summary

✅ **Two-layer protection**: Middleware (server) + Components (client)
✅ **Easy to use**: Wrap with `<ProtectedRoute>`
✅ **Role-based**: Support for admin-only routes
✅ **Loading states**: Smooth UX during auth checks
✅ **Secure**: Server-side verification
✅ **Flexible**: Custom fallbacks and loading states

**Next Steps**:
1. Review your routes
2. Add `<ProtectedRoute>` where needed
3. Test protection with different user roles
4. Enable debug mode if issues arise
