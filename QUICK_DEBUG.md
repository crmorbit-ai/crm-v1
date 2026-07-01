# Quick Debug - abhi shek User

## Network Tab Check (Important!)

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh page
4. Find request: `GET /auth/me`
5. Click on it
6. Go to **Response** tab
7. Check if response has:
   ```json
   {
     "success": true,
     "data": {
       "_id": "...",
       "firstName": "abhi",
       "lastName": "shek",
       "roles": [...],
       "groups": [...],  // Should have Lead Management Group
       "customPermissions": [  // Should have permissions
         {
           "feature": "lead_management",
           "actions": ["create", "read", "update", "delete", "import"]
         },
         ...
       ]
     }
   }
   ```

## If response looks good but sidebar not showing:

The issue is that "LEAD MANAGEMENT" section is visible but not expanding.

Check localStorage for sidebar state:
```javascript
console.log(JSON.parse(localStorage.getItem('sidebarOpenSections')));
```

If it shows `{"leadManagement": false}`, manually open it:
```javascript
localStorage.setItem('sidebarOpenSections', JSON.stringify({"leadManagement": true}));
```

Then refresh!
