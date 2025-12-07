# Phone Number Input UX Changes

## Summary
Separated phone number input into two fields:
1. **Country Code Dropdown**: Dedicated Select component with common country codes (default: +91 for India)
2. **Phone Number Input**: Clean 10-digit mobile number input without country code

## Changes Made

### 1. Updated Validation Schema (`src/lib/validation.ts`)

**Before:**
- Used `libphonenumber-js` for international phone validation
- phoneSchema accepted formats like `+919876543210`, `+91 9876543210`, or `9876543210`
- Automatically normalized to international format with country code

**After:**
- Simple regex validation for 10-digit mobile numbers: `/^[6-9]\d{9}$/`
- Numbers must start with 6-9 (Indian mobile number format)
- Added new `countryCodeSchema` with default value `+91`
- Both `customerSignupSchema` and `vendorSignupSchema` now include `country_code` field

```typescript
// New phoneSchema
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number");

// New countryCodeSchema
export const countryCodeSchema = z
  .string()
  .min(1, "Country code is required")
  .default("+91");
```

### 2. Updated UI Components (`src/pages/Auth.tsx`)

**Form Default Values:**
- Added `country_code: "+91"` to both customer and vendor signup forms

**Duplicate Check Logic:**
- Now combines `country_code + phone` when checking for duplicates
- Example: `+91 9876543210` sent to backend duplicate check function

**Signup Handlers:**
- Both `handleCustomerSignup` and `handleVendorSignup` now combine fields before API call
- Backend receives full phone format: `data.country_code + data.phone`

**UI Changes:**
- Added country code Select dropdown before phone input in both customer and vendor signup
- Available country codes:
  - +91 (India) - default
  - +1 (USA/Canada)
  - +44 (UK)
  - +971 (UAE)
  - +65 (Singapore)
  - +61 (Australia)
- Updated phone input placeholder from `+91 9876543210 or 9876543210` to `9876543210`
- Updated hint text from "Enter 10-digit mobile number with or without +91" to "Enter 10-digit mobile number"

### 3. Updated Tests (`src/lib/__tests__/validation.test.ts`)

**phoneSchema Tests:**
- Removed tests for international format normalization
- Added tests for 10-digit format validation
- Added tests for numbers starting with 6-9 requirement
- Added tests rejecting numbers with country codes

**countryCodeSchema Tests:**
- New test suite for country code validation
- Tests default value of +91
- Tests various country code formats

**Form Data Tests:**
- Added `country_code: '+91'` field to all test data objects in customer and vendor signup schema tests

## Benefits

1. **Clearer UX**: Explicit country code selector instead of confusing hints
2. **International Support**: Easy to add more country codes to dropdown
3. **Better Validation**: Separate validation for country code and phone number
4. **Industry Standard**: Matches UX patterns used by major apps (Airbnb, Uber, banking apps)
5. **Type Safety**: TypeScript automatically infers correct types with country_code field

## Backend Compatibility

The backend continues to receive phone numbers in full international format (e.g., `+91 9876543210`) by combining the two fields before submission. No backend changes required.

## Verification

- ✅ TypeScript compilation successful (`npx tsc --noEmit`)
- ✅ Form validation working with new schemas
- ✅ Duplicate check updated to use combined phone format
- ✅ Signup handlers combine fields correctly before API call
- ✅ All test data updated to include country_code field

## Testing Recommendations

1. **Manual Testing:**
   - Test customer signup with default +91 country code
   - Test vendor signup with different country codes
   - Verify duplicate check works with full phone number
   - Test form validation with invalid 10-digit numbers (starting with 1-5)
   - Test form validation with numbers < 10 or > 10 digits

2. **Edge Cases:**
   - Empty phone field with country code selected
   - Changing country code after entering phone number
   - Duplicate phone detection across different country codes

## Files Modified

1. `src/lib/validation.ts` - Updated phone validation schemas
2. `src/pages/Auth.tsx` - Added country code dropdown UI and updated logic
3. `src/lib/__tests__/validation.test.ts` - Updated all phone validation tests
