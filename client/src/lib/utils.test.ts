import { cn } from './utils'

// Mock clsx and tailwind-merge
jest.mock('clsx', () => ({
  __esModule: true,
  clsx: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

jest.mock('tailwind-merge', () => ({
  twMerge: (str: string) => str,
}))

describe('utils', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'hidden')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('hidden')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBeDefined()
    })

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid')
      expect(result).toContain('base')
      expect(result).toContain('valid')
    })
  })
})
