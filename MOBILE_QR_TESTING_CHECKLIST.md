# Mobile QR Code Testing - Quick Checklist

## Pre-Testing Setup ✅

All setup steps have been completed:

- [x] Created `src/lib/urlUtils.ts` utility module
- [x] Modified `src/components/vendor/InviteCodeManager.tsx` to use network URL
- [x] Updated `.env` with `VITE_NETWORK_URL="http://192.168.0.158:8080"`
- [x] TypeScript compilation passes (no errors)
- [x] Dev server running on port 8080
- [x] Network URL: http://192.168.0.158:8080/

## Testing Steps

### Step 1: Verify Environment
```bash
# Dev server should show:
➜  Local:   http://localhost:8080/
➜  Network: http://192.168.0.158:8080/
```

**Status**: ✅ Dev server running

### Step 2: Hard Refresh Browser
1. Open browser at http://192.168.0.158:8080/ or http://localhost:8080/
2. Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux)
3. This ensures the new environment variable is loaded

**Expected**: Page loads with no console errors

### Step 3: Login as Vendor
1. Navigate to login page
2. Use vendor credentials
3. Confirm you're redirected to vendor dashboard

**Expected**: Vendor dashboard visible

### Step 4: Generate Invite Code
1. Scroll to bottom of vendor dashboard
2. Find "Invite Codes" section
3. Click "Create New Code" button
4. Fill in optional label (e.g., "Mobile Test")
5. Click "Create"

**Expected**: New code appears (e.g., VEN-ABC12345)

### Step 5: View QR Code
1. Click "QR Code" button on the newly created code
2. QR code dialog opens
3. Look at the URL displayed below the QR code

**Expected URL Format**: 
```
http://192.168.0.158:8080/connect?code=VEN-XXXXXXXX
```

**NOT**:
```
http://localhost:8080/connect?code=VEN-XXXXXXXX
```

### Step 6: Scan QR on Mobile Device
**Requirements**:
- Mobile device connected to **same WiFi network**
- Camera access enabled for browser/QR scanner app

1. Use iPhone/iPad Camera app or Android QR scanner
2. Point camera at QR code on desktop screen
3. Tap the notification/link that appears

**Expected**: Safari/Chrome on mobile opens the connect page

### Step 7: Verify Mobile Page Load
On the mobile device browser:

**Expected**:
- Page loads successfully (no "can't connect to server" error)
- URL bar shows: `http://192.168.0.158:8080/connect?code=VEN-XXXXXXXX`
- If logged in: ConnectWithVendorDialog opens with code pre-filled
- If not logged in: Redirected to login page

### Step 8: Complete Connection (If Logged In)
1. Review vendor details in the dialog
2. Click "Connect with Vendor" button

**Expected**:
- Success message appears
- Dialog closes
- Redirected to customer dashboard
- Vendor appears in your vendors list

### Step 9: Verify on Vendor Dashboard
Back on the desktop:

1. Refresh vendor dashboard
2. Check the invite code you just used
3. Verify usage count increased

**Expected**:
- `used_count` should be 1 (or higher if testing multiple times)
- Updated timestamp reflects recent use

## Troubleshooting

### Issue: QR still shows localhost
**Fix**: 
1. Verify `.env` has `VITE_NETWORK_URL="http://192.168.0.158:8080"`
2. Hard refresh browser (Cmd+Shift+R)
3. Regenerate QR code (delete old code, create new one)

### Issue: Mobile can't connect to server
**Check**:
- [ ] Mobile device on same WiFi as development machine
- [ ] Firewall allows port 8080 on development machine
- [ ] Dev server still running (`npm run dev` output visible)
- [ ] IP address matches network IP from Vite output

**Test manually**:
- Open Safari on mobile
- Type: `http://192.168.0.158:8080`
- Should load the app homepage

### Issue: Page loads but code not pre-filled
**Verify**:
- [ ] URL contains `?code=VEN-XXXXXXXX` parameter
- [ ] Customer is logged in
- [ ] ConnectWithVendor component loaded

### Issue: "Already connected to this vendor"
**Expected**: This means it worked! The customer is already connected.
- Use a different customer account to test
- Or test with a different vendor

## Success Criteria

All of these should be true:

- [x] Dev server running with network URL visible
- [ ] Browser hard-refreshed after env change
- [ ] QR code shows network URL (not localhost)
- [ ] Mobile device can access http://192.168.0.158:8080 manually
- [ ] QR scan opens correct URL on mobile
- [ ] Customer can complete connection flow
- [ ] Vendor dashboard shows updated usage count
- [ ] No console errors in browser (desktop or mobile)

## Additional Testing (Optional)

### Test Different Browsers
- [ ] iOS Safari
- [ ] iOS Chrome
- [ ] Android Chrome
- [ ] Android Firefox

### Test Different Code States
- [ ] Active code with no expiry
- [ ] Active code with expiry (future date)
- [ ] Inactive code (should fail)
- [ ] Expired code (should fail)
- [ ] Code with max_uses reached (should fail)

### Test Duplicate Connection
1. Use same code with same customer
2. Should see error: "You are already connected to this vendor"

### Test Invalid Code
1. Manually modify URL: `/connect?code=VEN-INVALID`
2. Should see error: "Invalid or expired invite code"

## Documentation

- **Setup Guide**: `MOBILE_QR_SETUP.md`
- **Implementation Details**: `MOBILE_QR_FIX.md`
- **Full Testing Guide**: `TESTING_GUIDE_INVITE_CODES.md`

## Next Steps After Testing

Once all tests pass:

1. **Production Deployment**:
   - Remove or leave `VITE_NETWORK_URL` empty in production `.env`
   - System will use production domain automatically

2. **User Documentation**:
   - Vendors can create codes from dashboard
   - Share via QR code or copy link
   - Track usage and manage codes

3. **Monitoring**:
   - Watch for any RLS policy errors
   - Monitor code usage patterns
   - Track connection method distribution

## Quick Command Reference

```bash
# Restart dev server
npm run dev

# Check TypeScript errors
npx tsc --noEmit

# View current environment
cat .env

# Find network IP (from Vite output)
# Look for: ➜  Network: http://192.168.0.158:8080/
```

---

**Current Status**: Ready for testing ✅
**Next Action**: Follow steps 2-9 above to complete mobile QR testing
