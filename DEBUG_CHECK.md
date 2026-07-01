# Debug Steps

## 1. Check Backend Response

Open browser console (F12) after login and run:

```javascript
// Check current user object
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Or in Network tab:
// Find /auth/me request
// Check Response - should have:
// - customPermissions array
// - groups array with groupPermissions
```

## 2. Check if permissions are being checked

In Sidebar.js, the hasPermission function is being called.
Check console for any permission logs.

## 3. Backend logs

Check backend terminal - should show user being fetched with populated data.
