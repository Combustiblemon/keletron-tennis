# Role-Based Access Control (RBAC) Guide

## Overview

This guide explains how the role-based access control system works in the Keletron Tennis application, including how to check roles, show/hide UI elements, and manage permissions.

---

## Role Hierarchy

The application has three user roles with increasing permission levels:

```
USER (Level 0) < ADMIN (Level 1) < DEVELOPER (Level 2)
```

### Role Definitions

| Role | Level | Description | Access |
|------|-------|-------------|--------|
| `USER` | 0 | Regular user | Basic features (reservations, settings) |
| `ADMIN` | 1 | Administrator | All USER features + admin panel |
| `DEVELOPER` | 2 | Developer/Super Admin | All ADMIN features + dev tools |

**Note**: `ADMIN` and `DEVELOPER` roles are collectively referred to as "admins" in the codebase.

---

## How Roles Are Stored

### Clerk (Authentication Provider)
Roles are stored in Clerk's `publicMetadata`:

```typescript
// In Clerk Dashboard or via API
user.publicMetadata = {
  role: 'ADMIN' // or 'USER' or 'DEVELOPER'
}
```

### Backend Database
Roles are also stored in your backend user model:

```typescript
interface User {
  _id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'USER' | 'ADMIN' | 'DEVELOPER';
  // ... other fields
}
```

### Priority
The `UserProvider` prioritizes Clerk metadata for roles, falling back to backend data:

```typescript
// Clerk metadata takes precedence
if (clerkUser?.publicMetadata?.role) {
  role = clerkUser.publicMetadata.role;
} else {
  role = backendUser.role; // Fallback
}
```

---

## Checking Roles in Components

### Method 1: Using `useRoles` Hook (Recommended)

**Location**: `hooks/useRoles.ts`

```tsx
import { useRoles } from '@/hooks/useRoles';

const MyComponent = () => {
  const { isAdmin, isDeveloper, isUser, role } = useRoles();

  if (isAdmin) {
    return <AdminFeature />;
  }

  return <RegularFeature />;
};
```

**Available Properties**:

```typescript
{
  // Boolean checks
  isAdmin: boolean;        // true if ADMIN or DEVELOPER
  isDeveloper: boolean;    // true only if DEVELOPER
  isUser: boolean;         // true only if USER

  // Raw role value
  role: 'USER' | 'ADMIN' | 'DEVELOPER';

  // Helper functions
  hasRole: (role) => boolean;
  hasRoleOrHigher: (minRole) => boolean;
}
```

**Examples**:

```tsx
// Check specific role
if (roles.hasRole('DEVELOPER')) {
  console.log('Developer tools enabled');
}

// Check minimum role level
if (roles.hasRoleOrHigher('ADMIN')) {
  // Accessible by ADMIN and DEVELOPER
  return <AdminOrDevFeature />;
}
```

### Method 2: Using `useUser` Hook

**Location**: `components/UserProvider/UserProvider.tsx`

```tsx
import { useUser } from '@/components/UserProvider/UserProvider';

const MyComponent = () => {
  const { user, userRoles } = useUser();

  if (userRoles.isAdmin) {
    return <AdminView />;
  }

  return <UserView />;
};
```

**Available Properties**:

```typescript
{
  user: {
    role: 'USER' | 'ADMIN' | 'DEVELOPER';
    // ... other user data
  };
  userRoles: {
    isAdmin: boolean;      // true if ADMIN or DEVELOPER
    isDeveloper: boolean;  // true only if DEVELOPER
  };
  isAuthenticated: boolean;
  isUserLoading: boolean;
}
```

### Method 3: Using `RoleGuard` Component (Recommended for UI)

**Location**: `components/RoleGuard/RoleGuard.tsx`

```tsx
import RoleGuard from '@/components/RoleGuard/RoleGuard';

const MyComponent = () => (
  <Stack>
    {/* Show only to admins */}
    <RoleGuard requireAdmin>
      <AdminButton />
    </RoleGuard>

    {/* Show only to developers */}
    <RoleGuard requireDeveloper>
      <DevTools />
    </RoleGuard>

    {/* Show only to regular users */}
    <RoleGuard role="USER">
      <UpgradePrompt />
    </RoleGuard>
  </Stack>
);
```

---

## RoleGuard Component Reference

### Props

```typescript
interface RoleGuardProps {
  children: ReactNode;

  // Check specific role
  role?: 'USER' | 'ADMIN' | 'DEVELOPER';

  // Check minimum role level
  minRole?: 'USER' | 'ADMIN' | 'DEVELOPER';

  // Quick checks
  requireAdmin?: boolean;      // ADMIN or DEVELOPER
  requireDeveloper?: boolean;  // Only DEVELOPER

  // Invert logic
  invert?: boolean;            // Show if user does NOT have role

  // Custom fallback
  fallback?: ReactNode;
}
```

### Usage Examples

#### 1. Admin-Only Content

```tsx
<RoleGuard requireAdmin>
  <Button onClick={deleteAllData}>Delete All Data</Button>
</RoleGuard>
```

#### 2. Developer-Only Content

```tsx
<RoleGuard requireDeveloper>
  <DebugPanel />
</RoleGuard>
```

#### 3. Specific Role

```tsx
<RoleGuard role="USER">
  <UpgradeToPremiumBanner />
</RoleGuard>
```

#### 4. Minimum Role Level

```tsx
// Shows to ADMIN and DEVELOPER
<RoleGuard minRole="ADMIN">
  <AdvancedFeature />
</RoleGuard>
```

#### 5. Inverted Logic

```tsx
// Show to non-admins (only USER)
<RoleGuard requireAdmin invert>
  <LimitedAccessMessage />
</RoleGuard>
```

#### 6. With Custom Fallback

```tsx
<RoleGuard
  requireAdmin
  fallback={<Text>Upgrade to access this feature</Text>}
>
  <PremiumFeature />
</RoleGuard>
```

#### 7. Multiple Conditions

```tsx
<Stack>
  {/* Admin sees this */}
  <RoleGuard requireAdmin>
    <AdminDashboard />
  </RoleGuard>

  {/* Regular user sees this */}
  <RoleGuard requireAdmin invert>
    <UserDashboard />
  </RoleGuard>
</Stack>
```

---

## useRoles Hook Reference

### API

```typescript
const roles = useRoles();

// Boolean checks
roles.isAdmin;        // true if ADMIN or DEVELOPER
roles.isDeveloper;    // true only if DEVELOPER
roles.isUser;         // true only if USER

// Raw role
roles.role;          // 'USER' | 'ADMIN' | 'DEVELOPER'

// Functions
roles.hasRole(role);              // Check exact role
roles.hasRoleOrHigher(minRole);   // Check minimum role level
```

### Examples

```tsx
import { useRoles } from '@/hooks/useRoles';

const Dashboard = () => {
  const roles = useRoles();

  // Simple check
  if (roles.isAdmin) {
    return <AdminDashboard />;
  }

  // Exact role
  if (roles.hasRole('DEVELOPER')) {
    console.log('Developer mode enabled');
  }

  // Minimum role level
  if (roles.hasRoleOrHigher('ADMIN')) {
    // ADMIN and DEVELOPER can access
    return <AdvancedSettings />;
  }

  return <UserDashboard />;
};
```

---

## Common Patterns

### Pattern 1: Conditional Rendering

```tsx
const Navbar = () => {
  const { isAdmin } = useRoles();

  return (
    <nav>
      <NavLink href="/">Home</NavLink>
      <NavLink href="/reservations">Reservations</NavLink>
      {isAdmin && <NavLink href="/admin">Admin</NavLink>}
    </nav>
  );
};
```

### Pattern 2: Component-Level Guards

```tsx
// AdminButton.tsx
import RoleGuard from '@/components/RoleGuard/RoleGuard';

const AdminButton = ({ onClick, children }) => (
  <RoleGuard requireAdmin fallback={null}>
    <Button onClick={onClick}>{children}</Button>
  </RoleGuard>
);

// Usage
<AdminButton onClick={deleteUser}>Delete User</AdminButton>
```

### Pattern 3: Page-Level Protection

```tsx
// pages/admin.tsx
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

const AdminPage = () => (
  <ProtectedRoute requireAdmin>
    <AdminContent />
  </ProtectedRoute>
);

export default AdminPage;
```

### Pattern 4: Feature Flags

```tsx
const Settings = () => {
  const { hasRoleOrHigher } = useRoles();

  const features = {
    deleteAccount: hasRoleOrHigher('ADMIN'),
    exportData: hasRoleOrHigher('ADMIN'),
    debugMode: hasRoleOrHigher('DEVELOPER'),
  };

  return (
    <Stack>
      {features.deleteAccount && <DeleteAccountButton />}
      {features.exportData && <ExportDataButton />}
      {features.debugMode && <DebugPanel />}
    </Stack>
  );
};
```

### Pattern 5: Role-Based Styling

```tsx
const UserBadge = () => {
  const { role } = useRoles();

  const colors = {
    USER: 'blue',
    ADMIN: 'red',
    DEVELOPER: 'purple',
  };

  return <Badge color={colors[role]}>{role}</Badge>;
};
```

---

## Managing Roles

### Setting Roles in Clerk Dashboard

1. **Navigate to Users**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Select your application
   - Click "Users" in sidebar

2. **Edit User**:
   - Click on a user
   - Scroll to "Public metadata"
   - Add or edit:
     ```json
     {
       "role": "ADMIN"
     }
     ```
   - Save changes

3. **Available Roles**:
   - `"USER"` - Default role
   - `"ADMIN"` - Administrator
   - `"DEVELOPER"` - Developer/Super Admin

### Setting Roles via Backend API

When a user signs up or updates, your backend should sync the role to Clerk:

```typescript
// Backend API endpoint
app.put('/api/user/role', async (req, res) => {
  const { userId, role } = req.body;

  // Update role in Clerk
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { role },
  });

  // Update role in your database
  await db.users.update({ _id: userId }, { role });

  res.json({ success: true });
});
```

### Setting Default Role

New users default to `USER`. To change this:

**Option 1: Backend on User Creation**
```typescript
// After creating user in your DB
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { role: 'USER' },
});
```

**Option 2: Clerk Webhooks**
```typescript
// Listen to user.created webhook
app.post('/api/webhooks/clerk', async (req, res) => {
  const event = req.body;

  if (event.type === 'user.created') {
    await clerkClient.users.updateUserMetadata(event.data.id, {
      publicMetadata: { role: 'USER' },
    });
  }
});
```

---

## Route Protection by Role

### Server-Side (Middleware)

**File**: `middleware.ts`

Middleware checks authentication but **not** specific roles. Role checks happen client-side:

```typescript
export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up'],
  // All authenticated users pass middleware
});
```

### Client-Side (ProtectedRoute)

**File**: `components/ProtectedRoute/ProtectedRoute.tsx`

Use `ProtectedRoute` with `requireAdmin` for role-based page protection:

```tsx
// pages/admin.tsx
import ProtectedRoute from '@/components/ProtectedRoute/ProtectedRoute';

const AdminPage = () => (
  <ProtectedRoute requireAdmin>
    <AdminPanel />
  </ProtectedRoute>
);
```

**What Happens**:
1. Middleware ensures user is authenticated
2. `ProtectedRoute` checks if user has admin role
3. If not admin → Shows "Access Denied"
4. If admin → Renders content

---

## Role Matrix

### Current Role Assignments

| Feature/Page | USER | ADMIN | DEVELOPER | Notes |
|-------------|------|-------|-----------|-------|
| Sign In | ✅ | ✅ | ✅ | Public |
| Sign Up | ✅ | ✅ | ✅ | Public |
| Homepage | ✅ | ✅ | ✅ | Different content by role |
| Reservations | ✅ | ✅ | ✅ | Authenticated only |
| Settings | ✅ | ✅ | ✅ | Authenticated only |
| Admin Panel | ❌ | ✅ | ✅ | Admin only |
| Admin Link (Homepage) | ❌ | ✅ | ✅ | Shown via RoleGuard |
| Admin Link (Navbar) | ❌ | ✅ | ✅ | Conditional rendering |
| Delete Users | ❌ | ❌ | ✅ | Developer only (example) |
| Debug Tools | ❌ | ❌ | ✅ | Developer only (example) |

---

## Testing Roles

### Manual Testing Checklist

**As USER (Regular User)**:
- [ ] Can access reservations
- [ ] Can access settings
- [ ] Cannot see "Admin" link in navbar
- [ ] Cannot see "Admin Panel" button on homepage
- [ ] Redirected from `/admin` with "Access Denied"

**As ADMIN**:
- [ ] Can access reservations
- [ ] Can access settings
- [ ] Can see "Admin" link in navbar
- [ ] Can see "Admin Panel" button on homepage
- [ ] Can access `/admin` page
- [ ] Can manage courts and reservations

**As DEVELOPER**:
- [ ] Has all ADMIN permissions
- [ ] (Add developer-specific features to test)

### Testing Role Changes

```tsx
// Test component for switching roles
const RoleTest = () => {
  const { role } = useRoles();
  const { user } = useUser();

  return (
    <Stack>
      <Text>Current Role: {role}</Text>
      <RoleGuard requireAdmin>
        <Text>✅ Admin content visible</Text>
      </RoleGuard>
      <RoleGuard requireDeveloper>
        <Text>✅ Developer content visible</Text>
      </RoleGuard>
      <RoleGuard role="USER">
        <Text>✅ User-only content visible</Text>
      </RoleGuard>
    </Stack>
  );
};
```

---

## Best Practices

### ✅ DO

1. **Use `RoleGuard` for UI elements**:
   ```tsx
   <RoleGuard requireAdmin>
     <DeleteButton />
   </RoleGuard>
   ```

2. **Use `ProtectedRoute` for pages**:
   ```tsx
   <ProtectedRoute requireAdmin>
     <AdminPage />
   </ProtectedRoute>
   ```

3. **Check roles on the backend too**:
   ```typescript
   // Backend API
   if (user.role !== 'ADMIN') {
     return res.status(403).json({ error: 'Forbidden' });
   }
   ```

4. **Provide clear feedback**:
   ```tsx
   <RoleGuard
     requireAdmin
     fallback={<Text>Contact admin for access</Text>}
   >
     <Feature />
   </RoleGuard>
   ```

5. **Use semantic names**:
   ```tsx
   const { isAdmin } = useRoles(); // ✅ Clear
   ```

### ❌ DON'T

1. **Don't rely only on client-side checks**:
   ```tsx
   // ❌ Bad - can be bypassed
   if (isAdmin) {
     deleteUser(); // API should also check!
   }
   ```

2. **Don't hardcode role strings**:
   ```tsx
   // ❌ Bad
   if (user.role === 'ADMIN') { }

   // ✅ Good
   const { isAdmin } = useRoles();
   if (isAdmin) { }
   ```

3. **Don't show confusing UI**:
   ```tsx
   // ❌ Bad - button visible but disabled
   <Button disabled={!isAdmin}>Delete</Button>

   // ✅ Good - button hidden for non-admins
   <RoleGuard requireAdmin>
     <Button>Delete</Button>
   </RoleGuard>
   ```

4. **Don't check roles before authentication**:
   ```tsx
   const { isAuthenticated, isUserLoading } = useUser();
   const { isAdmin } = useRoles();

   if (isUserLoading) return <Loader />;
   if (!isAuthenticated) return <SignIn />;
   if (!isAdmin) return <AccessDenied />; // ✅ Check auth first
   ```

---

## Troubleshooting

### Issue: Role not updating after change in Clerk

**Symptoms**: Changed role in Clerk Dashboard but UI still shows old role

**Solutions**:
1. Sign out and sign back in
2. Clear browser cache
3. Check Clerk Dashboard shows correct role
4. Verify `publicMetadata.role` is set correctly
5. Check console for user object: `console.log(clerkUser.publicMetadata)`

### Issue: `isAdmin` is `false` for admin users

**Symptoms**: Admin users not seeing admin features

**Solutions**:
1. Check role in Clerk: `publicMetadata.role === 'ADMIN'`
2. Verify backend returns correct role
3. Check `UserProvider` is prioritizing Clerk metadata
4. Ensure `ADMIN` is uppercase
5. Check `userRoles.isAdmin` in console

### Issue: RoleGuard not hiding content

**Symptoms**: Content visible to all users regardless of role

**Solutions**:
1. Check `RoleGuard` is imported correctly
2. Verify `useRoles` hook is working: `console.log(useRoles())`
3. Check `UserProvider` wraps component
4. Ensure user is authenticated before checking roles

### Issue: "Access Denied" for admin users

**Symptoms**: Admin users seeing "Access Denied" on admin pages

**Solutions**:
1. Verify `publicMetadata.role` is `'ADMIN'` or `'DEVELOPER'`
2. Check `userRoles.isAdmin` returns `true`
3. Ensure middleware allows authenticated users
4. Check `ProtectedRoute` props: `requireAdmin` should be boolean

---

## API Reference

### useRoles Hook

```typescript
function useRoles(): {
  isAdmin: boolean;
  isDeveloper: boolean;
  isUser: boolean;
  role: 'USER' | 'ADMIN' | 'DEVELOPER';
  hasRole: (role: 'USER' | 'ADMIN' | 'DEVELOPER') => boolean;
  hasRoleOrHigher: (minRole: 'USER' | 'ADMIN' | 'DEVELOPER') => boolean;
}
```

### RoleGuard Component

```typescript
function RoleGuard(props: {
  children: ReactNode;
  role?: 'USER' | 'ADMIN' | 'DEVELOPER';
  minRole?: 'USER' | 'ADMIN' | 'DEVELOPER';
  requireAdmin?: boolean;
  requireDeveloper?: boolean;
  fallback?: ReactNode;
  invert?: boolean;
}): JSX.Element
```

### UserProvider Context

```typescript
interface UserContextDataType {
  isUserLoading: boolean;
  isUserFetching: boolean;
  isAuthenticated: boolean;
  user: User;
  userRoles: {
    isAdmin: boolean;
    isDeveloper: boolean;
  };
  invalidateUser: () => Promise<void>;
}
```

---

## Summary

✅ **Three Roles**: USER, ADMIN, DEVELOPER (hierarchical)
✅ **Stored in Clerk**: `publicMetadata.role`
✅ **Multiple Check Methods**: `useRoles`, `useUser`, `RoleGuard`
✅ **Page Protection**: Use `ProtectedRoute` with `requireAdmin`
✅ **UI Protection**: Use `RoleGuard` component
✅ **Backend Validation**: Always verify roles server-side too
✅ **Easy to Use**: Simple props and hooks

**Key Files**:
- `hooks/useRoles.ts` - Role checking hook
- `components/RoleGuard/RoleGuard.tsx` - UI guard component
- `components/UserProvider/UserProvider.tsx` - Role context
- `components/ProtectedRoute/ProtectedRoute.tsx` - Page protection

**Next Steps**:
1. Set roles in Clerk Dashboard for test users
2. Test role-based UI visibility
3. Add role checks to sensitive backend endpoints
4. Customize role-based features for your app
