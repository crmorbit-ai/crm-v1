# Toast Notification Migration Guide

## Problem
Success/Error notifications were staying on screen permanently without auto-dismissing.

## Solution
Created `toast.js` utility with auto-dismiss functionality.

## Usage

### Import
```javascript
import { showSuccessToast, showErrorToast } from '../utils/toast';
```

### Replace Old Pattern
```javascript
// ❌ OLD - No auto-dismiss
setSuccess('Account created successfully!');
setTimeout(() => setSuccess(''), 3000);

// ✅ NEW - Auto-dismiss built-in
showSuccessToast(setSuccess, 'Account created successfully!');
```

### API

**showSuccessToast(setter, message, duration)**
- `setter`: State setter function (e.g., setSuccess)
- `message`: Success message string
- `duration`: Optional, default 3000ms (3 seconds)

**showErrorToast(setter, message, duration)**
- `setter`: State setter function (e.g., setError)
- `message`: Error message string  
- `duration`: Optional, default 5000ms (5 seconds)

### Examples

```javascript
// Success - 3 second auto-dismiss
showSuccessToast(setSuccess, '✅ Contact created successfully!');

// Success - custom 5 second
showSuccessToast(setSuccess, '✅ Bulk upload completed!', 5000);

// Error - 5 second auto-dismiss
showErrorToast(setError, '❌ Failed to create account');

// Error - custom 7 second
showErrorToast(setError, '❌ Network timeout - please try again', 7000);
```

## Migration Status

### ✅ Migrated Files
- `/pages/Contacts.js` - Bulk upload success
- `/pages/Accounts.js` - Create account success

### 🔄 To Migrate (149 instances total)
Run this to find remaining instances:
```bash
grep -r "setSuccess\|setError" frontend/src/pages/*.js
```

## Benefits
- ✅ Consistent auto-dismiss behavior
- ✅ No more stuck notifications
- ✅ Cleaner code
- ✅ Easy to customize duration
- ✅ Better UX

## Notes
- Success messages: 3 seconds (quick confirmation)
- Error messages: 5 seconds (more time to read)
- Can override duration per use case
