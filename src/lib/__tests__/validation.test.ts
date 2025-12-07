import { describe, it, expect } from 'vitest';
import { 
  customerSignupSchema, 
  vendorSignupSchema, 
  emailSchema, 
  phoneSchema, 
  passwordSchema,
  countryCodeSchema
} from '../validation';

describe('Field validation schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@domain.co.in',
        'user+tag@example.com',
      ];

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it('should convert email to lowercase', () => {
      const result = emailSchema.safeParse('USER@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('user@example.com');
      }
    });
  });

  describe('passwordSchema', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Test@1234',
        'MyP@ssw0rd',
        'Secure#Pass123',
        'C0mplex!Password',
      ];

      strongPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Test@1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });

    it('should reject passwords without uppercase letters', () => {
      const result = passwordSchema.safeParse('test@1234');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('uppercase letter');
      }
    });

    it('should reject passwords without lowercase letters', () => {
      const result = passwordSchema.safeParse('TEST@1234');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('lowercase letter');
      }
    });

    it('should reject passwords without numbers', () => {
      const result = passwordSchema.safeParse('Test@Password');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('number');
      }
    });

    it('should reject passwords without special characters', () => {
      const result = passwordSchema.safeParse('Test1234');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('special character');
      }
    });
  });

  describe('phoneSchema', () => {
    it('should accept valid 10-digit Indian mobile numbers', () => {
      const validPhones = [
        '9876543210',
        '8765432109',
        '7654321098',
        '6543210987',
      ];

      validPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '',
        '123',
        'notaphone',
        '12345',
        '5876543210', // starts with 5
        '4876543210', // starts with 4
        '+919876543210', // with country code
        '+91 9876543210', // with country code and space
        '98765432', // less than 10 digits
        '98765432109', // more than 10 digits
      ];

      invalidPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });

    it('should require numbers starting with 6-9', () => {
      const result = phoneSchema.safeParse('5876543210');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('valid 10-digit mobile number');
      }
    });
  });

  describe('countryCodeSchema', () => {
    it('should accept valid country codes', () => {
      const validCodes = ['+91', '+1', '+44', '+971', '+65'];
      
      validCodes.forEach(code => {
        const result = countryCodeSchema.safeParse(code);
        expect(result.success).toBe(true);
      });
    });

    it('should have default value of +91', () => {
      const result = countryCodeSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('+91');
      }
    });
  });

  describe('password confirmation', () => {
    it('should accept matching passwords', () => {
      const data = {
        email: 'test@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        name: 'Test User',
        country_code: '+91',
        phone: '9876543210',
        state_id: 'state1',
        city_id: 'city1',
        area_id: 'area1',
        society_id: 'society1',
        flat_plot_house_number: '101',
      };

      const result = customerSignupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const data = {
        email: 'test@example.com',
        password: 'Test@1234',
        confirmPassword: 'Different@1234',
        name: 'Test User',
        country_code: '+91',
        phone: '9876543210',
        state_id: 'state1',
        city_id: 'city1',
        area_id: 'area1',
        society_id: 'society1',
        flat_plot_house_number: '101',
      };

      const result = customerSignupSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('do not match');
      }
    });
  });
});

describe('vendorSignupSchema', () => {
  describe('business email validation', () => {
    it('should accept empty business email', () => {
      const data = {
        email: 'vendor@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        businessName: 'Test Business',
        category: 'Milk & Dairy',
        contactPerson: 'John Doe',
        country_code: '+91',
        phone: '9876543210',
        businessEmail: '',
        address: '123 Business Street, City',
      };

      const result = vendorSignupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept valid business email different from login email', () => {
      const data = {
        email: 'vendor@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        businessName: 'Test Business',
        category: 'Milk & Dairy',
        contactPerson: 'John Doe',
        country_code: '+91',
        phone: '9876543210',
        businessEmail: 'info@business.com',
        address: '123 Business Street, City',
      };

      const result = vendorSignupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject business email same as login email', () => {
      const data = {
        email: 'vendor@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        businessName: 'Test Business',
        category: 'Milk & Dairy',
        contactPerson: 'John Doe',
        country_code: '+91',
        phone: '9876543210',
        businessEmail: 'vendor@example.com',
        address: '123 Business Street, City',
      };

      const result = vendorSignupSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('must be different');
      }
    });
  });

  describe('address validation in full schema', () => {
    it('should accept valid vendor with proper address', () => {
      const data = {
        email: 'vendor@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        businessName: 'Test Business',
        category: 'Milk & Dairy',
        contactPerson: 'John Doe',
        country_code: '+91',
        phone: '9876543210',
        businessEmail: 'info@business.com',
        address: '123 Street, City, State',
      };

      const result = vendorSignupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject vendor with short address', () => {
      const data = {
        email: 'vendor@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        businessName: 'Test Business',
        category: 'Milk & Dairy',
        contactPerson: 'John Doe',
        country_code: '+91',
        phone: '9876543210',
        businessEmail: '',
        address: 'Short',
      };

      const result = vendorSignupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject vendor with very long address', () => {
      const longAddress = 'A'.repeat(501);
      const data = {
        email: 'vendor@example.com',
        password: 'Test@1234',
        confirmPassword: 'Test@1234',
        businessName: 'Test Business',
        category: 'Milk & Dairy',
        contactPerson: 'John Doe',
        country_code: '+91',
        phone: '9876543210',
        businessEmail: '',
        address: longAddress,
      };

      const result = vendorSignupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
