# Vendor-Customer Invite Code System - Testing Guide

## Overview
This guide explains how to test the newly implemented secure vendor-customer connection system using invite codes, QR codes, and shareable links.

---

## 🎯 What Was Implemented

### **Core Features:**
1. **Vendor Invite Code Generation** - Vendors can create unique codes (VEN-XXXXXXXX)
2. **QR Code Display** - Visual QR codes for easy scanning/sharing
3. **Shareable Links** - One-click connection via URL
4. **Customer Code Redemption** - Manual code entry with validation
5. **Privacy Protection** - Customer data hidden until connection established

### **Technical Components:**
- 2 Database migrations (invite codes table + RLS policies)
- 1 React hook (useVendorInviteCodes)
- 2 UI components for vendors (InviteCodeManager)
- 2 UI components for customers (ConnectWithVendorDialog, ConnectWithVendor page)
- 1 New route (/connect?code=XXX)
- Updated RLS policies for customer privacy

---

## 📋 Pre-Testing Checklist

### **Step 1: Apply Database Migrations**

⚠️ **IMPORTANT**: Migrations must be applied to Supabase before testing!

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project → SQL Editor
3. Run Migration 1 (Invite Codes System):

```bash
# Copy contents from:
supabase/migrations/20251212000001_add_vendor_invite_codes.sql
```

This creates:
- `vendor_invite_codes` table
- `connection_method_enum` type
- `generate_invite_code()` function
- `validate_and_use_invite_code()` function
- RLS policies for security

4. Run Migration 2 (Customer Privacy):

```bash
# Copy contents from:
supabase/migrations/20251212000002_update_customer_privacy_rls.sql
```

This updates:
- Customer table RLS policies
- Ensures vendors only see connected customers
- Creates performance indexes

### **Step 2: Start Development Server**

```bash
npm run dev
```

Server should start on http://localhost:8080/

---

## 🧪 Testing Process

### **PART 1: Vendor Side - Creating Invite Codes**

#### **Test 1.1: Login as Vendor**
1. Navigate to http://localhost:8080/auth
2. Login with vendor credentials
3. Should redirect to vendor dashboard

#### **Test 1.2: View Invite Code Manager**
1. Scroll down to the **"Invite Codes"** section (at bottom of dashboard)
2. You should see:
   - Header: "Invite Codes"
   - Description: "Share codes with customers to connect and receive orders"
   - **"Create Code"** button

**Expected Result:** Empty state message if no codes exist:
- Icon: QR code icon
- Message: "No Invite Codes Yet"
- Button: "Create Your First Code"

#### **Test 1.3: Create a Basic Invite Code**
1. Click **"Create Code"** button
2. Dialog opens: "Create New Invite Code"
3. Leave all fields empty (testing unlimited code)
4. Click **"Create Code"**

**Expected Results:**
- Toast notification: "Invite code created" with code shown (e.g., VEN-ABC12345)
- Dialog closes
- New code card appears with:
  - Code: VEN-XXXXXXXX (8 random characters)
  - Status badge: "Active" (green)
  - Used: 0
  - No expiry shown
  - Action buttons: Copy, QR, Link

#### **Test 1.4: Create a Labeled Code with Limits**
1. Click **"Create Code"** again
2. Fill in:
   - Label: "Test Society XYZ"
   - Expires In: 30 (days)
   - Max Uses: 5
3. Click **"Create Code"**

**Expected Results:**
- New code created with label "Test Society XYZ"
- Shows expiry date (30 days from now)
- Shows "Used: 0 / 5"

#### **Test 1.5: Test QR Code Display**
1. Find any code card
2. Click **"QR"** button

**Expected Results:**
- Dialog opens: "QR Code for VEN-XXXXXXXX"
- Large QR code displayed (256x256)
- Code shown below QR: VEN-XXXXXXXX
- Full link shown: http://localhost:8080/connect?code=VEN-XXXXXXXX
- Copy buttons next to both
- Instructions: "Share this with customers:"

#### **Test 1.6: Test Copy Functions**
1. Click **"Copy"** button on a code card

**Expected Results:**
- Toast: "Copied! Code copied to clipboard"
- Code should be in clipboard (test with Ctrl+V)

2. Click **"Link"** button

**Expected Results:**
- Toast: "Copied! Link copied to clipboard"
- Full URL in clipboard: http://localhost:8080/connect?code=VEN-XXXXXXXX

3. In QR dialog, click copy button next to code

**Expected Results:**
- Same as Copy button test

#### **Test 1.7: Test Code Management**
1. Click **"Deactivate"** on any active code

**Expected Results:**
- Toast: "Invite code updated"
- Status badge changes to "Inactive" (gray)
- Button text changes to "Activate"

2. Click **"Activate"** to reactivate

**Expected Results:**
- Status badge back to "Active" (green)

3. Click **"Delete"** on a code

**Expected Results:**
- Confirmation dialog: "Are you sure you want to delete..."
- Click OK
- Toast: "Invite code deleted"
- Code card removed from list

---

### **PART 2: Customer Side - Using Invite Codes**

#### **Test 2.1: Manual Code Entry (Logged In Customer)**

1. **Logout** from vendor account
2. Login with **customer credentials**
3. Navigate to **Vendor Directory** or any customer view
4. You should see vendors listed

**Note**: Since we're testing, you may need to create a test "Connect" button. For now, we'll test via direct URL.

#### **Test 2.2: Test Via Shareable Link (NOT Logged In)**

1. **Logout completely**
2. Copy one of the invite codes from vendor (e.g., VEN-ABC12345)
3. Navigate to: `http://localhost:8080/connect?code=VEN-ABC12345`

**Expected Results:**
- Redirects to `/auth?redirect=/connect?code=VEN-ABC12345`
- Login/signup page shown
- After successful login:
  - Redirects back to /connect page
  - Dialog opens: "Connect with Vendor"
  - Code field pre-filled: VEN-ABC12345

#### **Test 2.3: Test Code Validation (Logged In)**

1. Ensure you're logged in as a customer
2. Navigate to: `http://localhost:8080/connect?code=VEN-ABC12345`

**Expected Results:**
- Dialog opens immediately: "Connect with Vendor"
- Code field shows: VEN-ABC12345
- Description: "Enter the invite code you received..."

3. Click **"Connect"** button

**Expected Results:**
- Button shows: "Validating..." with spinner
- After ~1 second:
  - Success screen appears
  - Green checkmark icon
  - "Connected!" heading
  - Vendor details shown:
    - Name
    - Category
    - Phone
  - Message: "You can now browse their products and place orders"
- After 1.5 seconds:
  - Dialog closes
  - Redirects to /dashboard

#### **Test 2.4: Test Invalid Code**

1. Navigate to: `http://localhost:8080/connect?code=INVALID-123`
2. Click **"Connect"**

**Expected Results:**
- Toast notification: "Invalid code"
- Description: "Invalid or expired invite code"
- Dialog stays open
- No connection created

#### **Test 2.5: Test Duplicate Connection**

1. Use the SAME code you already used successfully
2. Try to connect again

**Expected Results:**
- Toast notification: "Invalid code"
- Description: "You are already connected to this vendor"
- No duplicate connection created

#### **Test 2.6: Test Auto-Format Code Entry**

1. Navigate to `/connect` (without code parameter)
2. In the code input field, type: `abc12345` (lowercase, no prefix)

**Expected Results:**
- As you type, it auto-formats to: `VEN-ABC12345`
- Uppercase conversion
- Auto-adds VEN- prefix

3. Try typing: `VEN-def45678`

**Expected Results:**
- Converts to: `VEN-DEF45678`

#### **Test 2.7: Test Expired Code**

1. As vendor, create a code with **Expires In: 0 days** (or use SQL to set past date)
2. As customer, try to use that code

**Expected Results:**
- Toast: "Invalid code"
- Description: "Invalid or expired invite code"

#### **Test 2.8: Test Max Uses Reached**

1. As vendor, create code with **Max Uses: 1**
2. As customer 1, use the code successfully
3. As customer 2, try to use the same code

**Expected Results:**
- Toast: "Invalid code"
- Description: "Invalid or expired invite code"
- Vendor's code card shows: "Used: 1 / 1"
- Status badge: "Max Uses Reached" (red)

---

### **PART 3: Privacy & Security Testing**

#### **Test 3.1: Vendor Cannot See Customer Before Connection**

1. Login as **Vendor A**
2. Check customer list/orders
3. Login as **Customer B** (who has NOT connected with Vendor A)
4. Place NO orders with Vendor A
5. Back to Vendor A account
6. Try to view Customer B's details

**Expected Results:**
- Customer B should NOT appear in vendor's customer list
- Customer B's orders should NOT be visible
- Only customers who connected via invite code appear

#### **Test 3.2: Vendor Can See Customer After Connection**

1. Customer B uses Vendor A's invite code
2. Connection established
3. Back to Vendor A account
4. Check customer list

**Expected Results:**
- Customer B now appears in customer list
- Name, phone, address visible
- Can see orders from Customer B

#### **Test 3.3: Customer Can Browse Vendors Without Connection**

1. Login as customer
2. Navigate to Vendor Directory

**Expected Results:**
- ALL active vendors visible
- Can see vendor name, category, address, products
- Can see product prices
- CANNOT place orders without connection
- Shows "Enter Invite Code" button instead of "Order Now"

---

### **PART 4: Usage Analytics Testing**

#### **Test 4.1: Usage Count Increments**

1. As vendor, note the "Used" count on a code (e.g., Used: 2)
2. Share that code with a new customer
3. Customer uses the code successfully
4. Back to vendor dashboard

**Expected Results:**
- Code's "Used" count incremented: Used: 3
- Code still active (if under max_uses limit)

#### **Test 4.2: Connection Method Tracking**

1. In Supabase Dashboard → SQL Editor
2. Run query:

```sql
SELECT 
  c.name as customer_name,
  v.name as vendor_name,
  vcc.connection_method,
  vic.code,
  vcc.created_at
FROM vendor_customer_connections vcc
LEFT JOIN customers c ON c.id = vcc.customer_id
LEFT JOIN vendors v ON v.id = vcc.vendor_id
LEFT JOIN vendor_invite_codes vic ON vic.id = vcc.invite_code_id
ORDER BY vcc.created_at DESC
LIMIT 10;
```

**Expected Results:**
- See list of recent connections
- `connection_method` column shows: 'invite_code', 'qr_scan', 'shared_link', or 'first_order'
- `code` column shows which invite code was used

---

## ✅ Expected Behavior Summary

### **Vendor Experience:**
1. ✅ Can create unlimited invite codes
2. ✅ Can set optional expiry dates
3. ✅ Can set optional usage limits
4. ✅ Can label codes for organization
5. ✅ Can view QR code for each invite
6. ✅ Can copy code or shareable link easily
7. ✅ Can activate/deactivate codes
8. ✅ Can delete codes (doesn't affect existing connections)
9. ✅ Can track usage statistics per code

### **Customer Experience:**
1. ✅ Can browse all vendors without connecting
2. ✅ Can see vendor products and prices publicly
3. ✅ Must enter valid invite code to connect
4. ✅ Can use code manually or via shareable link
5. ✅ Auto-redirected to login if not authenticated
6. ✅ Code auto-formats as they type
7. ✅ See vendor preview before confirming connection
8. ✅ Clear error messages for invalid/expired codes
9. ✅ Can only connect once per vendor

### **Privacy & Security:**
1. ✅ Vendors cannot see customer data without connection
2. ✅ Customers cannot place orders without connection
3. ✅ Invite codes are validated server-side
4. ✅ Expired codes automatically rejected
5. ✅ Max uses enforced
6. ✅ RLS policies prevent unauthorized data access

---

## 🐛 Common Issues & Troubleshooting

### **Issue 1: "Function not found: generate_invite_code"**
**Cause:** Migration not applied
**Solution:** Run migration 20251212000001 in Supabase SQL Editor

### **Issue 2: "RLS policy violation" when creating code**
**Cause:** User not properly linked to vendor
**Solution:** Check vendor table has correct user_id for logged-in user

### **Issue 3: QR Code doesn't scan**
**Cause:** URL not accessible or wrong format
**Solution:** Ensure URL in QR matches: `http://localhost:8080/connect?code=VEN-XXXXXXXX`

### **Issue 4: Code validation always fails**
**Cause:** Customer ID not found
**Solution:** Ensure customer record exists with correct user_id

### **Issue 5: "Type 'connection_method_enum' does not exist"**
**Cause:** Migration partially applied
**Solution:** Re-run migration or manually create enum type

---

## 📊 Success Criteria

✅ **All tests pass if:**
1. Vendor can create codes with different settings
2. QR codes display correctly
3. Copy functions work
4. Customers can use codes successfully
5. Invalid codes are rejected
6. Duplicate connections prevented
7. Privacy policies enforced
8. Usage counts increment
9. No TypeScript errors
10. No console errors

---

## 🎓 Next Steps After Testing

### **If All Tests Pass:**
1. Commit changes with provided git message
2. Push to repository
3. Deploy migrations to production Supabase
4. Test in production environment
5. Document for team

### **If Tests Fail:**
1. Check console for errors
2. Verify migrations applied correctly
3. Check Supabase logs
4. Verify RLS policies active
5. Test with different user roles

---

## 💡 Tips for Testing

1. **Use Multiple Browser Windows**: One for vendor, one for customer
2. **Use Incognito Mode**: For testing unauthenticated flow
3. **Check Network Tab**: See API calls and responses
4. **Check Supabase Logs**: See database operations
5. **Test Edge Cases**: Expired codes, max uses, invalid formats
6. **Test on Mobile**: QR code scanning, responsive layout

---

## 📝 Test Checklist

Print this checklist and check off as you test:

- [ ] Vendor can create basic invite code
- [ ] Vendor can create code with label
- [ ] Vendor can create code with expiry
- [ ] Vendor can create code with max uses
- [ ] QR code displays correctly
- [ ] Copy code button works
- [ ] Copy link button works
- [ ] Deactivate/activate works
- [ ] Delete code works
- [ ] Customer can use code via link (logged out)
- [ ] Customer redirected to login correctly
- [ ] Customer can use code (logged in)
- [ ] Code auto-formats correctly
- [ ] Invalid code rejected
- [ ] Duplicate connection prevented
- [ ] Expired code rejected
- [ ] Max uses enforced
- [ ] Vendor cannot see unconnected customers
- [ ] Vendor can see connected customers
- [ ] Usage count increments
- [ ] No TypeScript errors
- [ ] No console errors

---

## 🔗 Quick Links

- **Vendor Dashboard**: http://localhost:8080/dashboard
- **Connect Page**: http://localhost:8080/connect?code=TEST-12345678
- **Auth Page**: http://localhost:8080/auth
- **Supabase Dashboard**: https://supabase.com/dashboard

---

**Last Updated**: December 12, 2025
**Version**: 1.0.0
**Status**: Ready for Testing
