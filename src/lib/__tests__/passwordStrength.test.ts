import { describe, it, expect } from 'vitest';
import { 
  analyzePasswordStrength, 
  isPasswordStrengthAcceptable,
  PasswordStrength 
} from '../passwordStrength';

describe('analyzePasswordStrength', () => {
  it('should return VeryWeak for empty password', () => {
    const result = analyzePasswordStrength('');
    expect(result.score).toBe(PasswordStrength.VeryWeak);
    expect(result.label).toBe('Very Weak');
    expect(result.feedback.warning).toBe('Password is required');
  });

  it('should return VeryWeak for very weak passwords', () => {
    const weakPasswords = ['123456', 'password', 'abc123'];
    
    weakPasswords.forEach(password => {
      const result = analyzePasswordStrength(password);
      expect(result.score).toBeLessThanOrEqual(PasswordStrength.Weak);
    });
  });

  it('should return higher scores for stronger passwords', () => {
    const result = analyzePasswordStrength('MyVeryStr0ng!P@ssw0rd#2024');
    expect(result.score).toBeGreaterThanOrEqual(PasswordStrength.Strong);
  });

  it('should provide feedback for weak passwords', () => {
    const result = analyzePasswordStrength('password');
    expect(result.feedback.warning || result.feedback.suggestions.length).toBeTruthy();
  });

  it('should detect passwords containing user input', () => {
    const userEmail = 'john@example.com';
    const userName = 'John Doe';
    
    // Password contains parts of user input
    const result = analyzePasswordStrength('john2024!', [userEmail, userName]);
    
    // Should have some warning or suggestion about using personal info
    expect(
      result.feedback.warning.length > 0 || result.feedback.suggestions.length > 0
    ).toBe(true);
  });

  it('should return crack time display', () => {
    const result = analyzePasswordStrength('Test@1234');
    expect(result.crackTimeDisplay).toBeDefined();
    expect(typeof result.crackTimeDisplay).toBe('string');
  });

  it('should return appropriate colors for each strength level', () => {
    const passwords = [
      { password: '123', expectedMinScore: PasswordStrength.VeryWeak },
      { password: 'password1', expectedMinScore: PasswordStrength.VeryWeak },
      { password: 'MyP@ssw0rd', expectedMinScore: PasswordStrength.Weak },
      { password: 'Str0ng!P@ssw0rd#123', expectedMinScore: PasswordStrength.Fair },
    ];

    passwords.forEach(({ password }) => {
      const result = analyzePasswordStrength(password);
      expect(result.colors.bg).toBeDefined();
      expect(result.colors.text).toBeDefined();
      expect(result.colors.border).toBeDefined();
    });
  });
});

describe('isPasswordStrengthAcceptable', () => {
  it('should return false for very weak passwords (default minimum: Fair)', () => {
    const result = isPasswordStrengthAcceptable('password');
    expect(result).toBe(false);
  });

  it('should return true for strong passwords', () => {
    const result = isPasswordStrengthAcceptable('MyVeryStr0ng!P@ssw0rd');
    expect(result).toBe(true);
  });

  it('should respect custom minimum strength requirement', () => {
    // Require Strong (3) minimum
    const result = isPasswordStrengthAcceptable(
      'Test@1234', 
      PasswordStrength.Strong
    );
    
    // 'Test@1234' is typically Weak or Fair, so should fail Strong requirement
    expect(result).toBe(false);
  });

  it('should allow VeryWeak passwords when minimum is VeryWeak', () => {
    const result = isPasswordStrengthAcceptable(
      '123', 
      PasswordStrength.VeryWeak
    );
    expect(result).toBe(true);
  });

  it('should detect passwords with user input and penalize them', () => {
    const userEmail = 'test@example.com';
    const result = isPasswordStrengthAcceptable(
      'test1234', 
      PasswordStrength.Fair,
      [userEmail]
    );
    
    // Password contains user email prefix, should likely fail
    expect(result).toBe(false);
  });
});

describe('Password strength scoring consistency', () => {
  it('should give consistent scores for the same password', () => {
    const password = 'ConsistentP@ssw0rd!';
    
    const result1 = analyzePasswordStrength(password);
    const result2 = analyzePasswordStrength(password);
    const result3 = analyzePasswordStrength(password);
    
    expect(result1.score).toBe(result2.score);
    expect(result2.score).toBe(result3.score);
  });

  it('should give different scores for different passwords', () => {
    const weakPassword = '123456';
    const strongPassword = 'MyVeryStr0ng!P@ssw0rd#2024';
    
    const weakResult = analyzePasswordStrength(weakPassword);
    const strongResult = analyzePasswordStrength(strongPassword);
    
    expect(weakResult.score).toBeLessThan(strongResult.score);
  });
});
