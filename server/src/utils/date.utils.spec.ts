// Date utility functions
export class DateUtils {
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  }

  static daysBetween(startDate: Date, endDate: Date): number {
    const timeDifference = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
  }
}

// Tests
describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(DateUtils.formatDate(date)).toBe('2024-01-15');
    });

    it('should handle different dates', () => {
      const date = new Date('2023-12-25T00:00:00Z');
      expect(DateUtils.formatDate(date)).toBe('2023-12-25');
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15');
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should handle negative days', () => {
      const date = new Date('2024-01-15');
      const result = DateUtils.addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('isWeekend', () => {
    it('should identify weekend days', () => {
      const saturday = new Date('2024-01-13'); // Saturday
      const sunday = new Date('2024-01-14'); // Sunday
      const monday = new Date('2024-01-15'); // Monday

      expect(DateUtils.isWeekend(saturday)).toBe(true);
      expect(DateUtils.isWeekend(sunday)).toBe(true);
      expect(DateUtils.isWeekend(monday)).toBe(false);
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      expect(DateUtils.daysBetween(startDate, endDate)).toBe(9);
    });

    it('should handle same date', () => {
      const date = new Date('2024-01-01');
      expect(DateUtils.daysBetween(date, date)).toBe(0);
    });
  });
});
