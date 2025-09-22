// String utility functions
export class StringUtils {
  static capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  static isEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Tests
describe('StringUtils', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter of a string', () => {
      expect(StringUtils.capitalize('hello')).toBe('Hello');
      expect(StringUtils.capitalize('world')).toBe('World');
    });

    it('should handle empty strings', () => {
      expect(StringUtils.capitalize('')).toBe('');
    });

    it('should handle single characters', () => {
      expect(StringUtils.capitalize('a')).toBe('A');
    });
  });

  describe('slugify', () => {
    it('should convert strings to slugs', () => {
      expect(StringUtils.slugify('Hello World')).toBe('hello-world');
      expect(StringUtils.slugify('Test String 123')).toBe('test-string-123');
    });

    it('should remove special characters', () => {
      expect(StringUtils.slugify('Hello@World!')).toBe('helloworld');
    });

    it('should handle multiple spaces', () => {
      expect(StringUtils.slugify('Hello    World')).toBe('hello-world');
    });
  });

  describe('isEmail', () => {
    it('should validate correct emails', () => {
      expect(StringUtils.isEmail('test@example.com')).toBe(true);
      expect(StringUtils.isEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(StringUtils.isEmail('invalid')).toBe(false);
      expect(StringUtils.isEmail('test@')).toBe(false);
      expect(StringUtils.isEmail('@example.com')).toBe(false);
    });
  });
});
