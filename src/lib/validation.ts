import { z } from "zod";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

/**
 * Password validation schema with strength requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );

/**
 * Email validation schema with proper format checking
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

/**
 * Phone number validation schema for 10-digit mobile number
 * Country code is handled separately in a dedicated field
 */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number");

/**
 * Country code validation schema
 */
export const countryCodeSchema = z
  .string()
  .min(1, "Country code is required")
  .default("+91");

/**
 * Customer signup form validation schema
 * Includes all required fields for customer registration
 */
export const customerSignupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .trim(),
    country_code: countryCodeSchema,
    phone: phoneSchema,
    state_id: z.string().min(1, "Please select a state"),
    city_id: z.string().min(1, "Please select a city"),
    area_id: z.string().min(1, "Please select an area"),
    society_id: z.string().min(1, "Please select a society"),
    wing_number: z.string().optional(),
    flat_plot_house_number: z
      .string()
      .min(1, "Flat/House number is required")
      .trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Vendor signup form validation schema
 * Includes all required fields for vendor registration
 */
export const vendorSignupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    businessName: z
      .string()
      .min(2, "Business name must be at least 2 characters")
      .max(200, "Business name must not exceed 200 characters")
      .trim(),
    category: z.string().min(1, "Please select a category"),
    contactPerson: z
      .string()
      .min(2, "Contact person name must be at least 2 characters")
      .max(100, "Contact person name must not exceed 100 characters")
      .trim(),
    country_code: countryCodeSchema,
    phone: phoneSchema,
    businessEmail: z
      .string()
      .email("Please enter a valid business email")
      .toLowerCase()
      .trim()
      .optional()
      .or(z.literal("")),
    address: z
      .string()
      .min(10, "Address must be at least 10 characters")
      .max(500, "Address must not exceed 500 characters")
      .trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // Business email must be different from login email if provided
      if (data.businessEmail && data.businessEmail.length > 0) {
        return data.businessEmail !== data.email;
      }
      return true;
    },
    {
      message: "Business email must be different from login email",
      path: ["businessEmail"],
    }
  );

/**
 * Type exports for TypeScript type safety
 */
export type CustomerSignupFormData = z.infer<typeof customerSignupSchema>;
export type VendorSignupFormData = z.infer<typeof vendorSignupSchema>;
