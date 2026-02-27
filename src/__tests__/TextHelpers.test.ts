import { describe, it, expect } from 'vitest';
import { countWords, countLines, formatFileSize, getLanguageDisplayName } from '../Shared/Helpers/TextHelpers';

describe('TextHelpers', () => {
  describe('countWords', () => {
    it('should return 0 for empty string', () => {
      expect(countWords('')).toBe(0);
    });

    it('should return 1 for single word', () => {
      expect(countWords('hello')).toBe(1);
    });

    it('should return word count for multiple words', () => {
      expect(countWords('hello world test')).toBe(3);
    });

    it('should handle extra whitespace', () => {
      expect(countWords('  hello   world  test  ')).toBe(3);
    });

    it('should return 0 for only whitespace', () => {
      expect(countWords('   ')).toBe(0);
    });

    it('should treat tabs as delimiters', () => {
      expect(countWords('hello\tworld\ttest')).toBe(3);
    });

    it('should treat newlines as delimiters', () => {
      expect(countWords('hello\nworld\ntest')).toBe(3);
    });

    it('should handle mixed whitespace', () => {
      expect(countWords('hello \t world\n test')).toBe(3);
    });
  });

  describe('countLines', () => {
    it('should return 0 for empty string', () => {
      expect(countLines('')).toBe(0);
    });

    it('should return 1 for single line', () => {
      expect(countLines('hello')).toBe(1);
    });

    it('should count multiple lines with \\n', () => {
      expect(countLines('line1\nline2\nline3')).toBe(3);
    });

    it('should count multiple lines with \\r\\n (Windows)', () => {
      expect(countLines('line1\r\nline2\r\nline3')).toBe(3);
    });

    it('should count multiple lines with \\r (old Mac)', () => {
      expect(countLines('line1\rline2\rline3')).toBe(3);
    });

    it('should handle mixed line endings', () => {
      expect(countLines('line1\nline2\r\nline3\rline4')).toBe(4);
    });

    it('should count trailing newline as separate line', () => {
      expect(countLines('line1\nline2\n')).toBe(3);
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format 500 bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('should format 1023 bytes', () => {
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format 1024 bytes as 1.0 KB', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
    });

    it('should format 1536 bytes as 1.5 KB', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format 1048576 bytes as 1.0 MB', () => {
      expect(formatFileSize(1048576)).toBe('1.0 MB');
    });

    it('should format larger MB values', () => {
      expect(formatFileSize(5242880)).toBe('5.0 MB');
      expect(formatFileSize(10485760)).toBe('10.0 MB');
    });

    it('should format 512 KB', () => {
      expect(formatFileSize(524288)).toBe('512.0 KB');
    });

    it('should format 2.5 MB', () => {
      expect(formatFileSize(2621440)).toBe('2.5 MB');
    });
  });

  describe('getLanguageDisplayName', () => {
    it('should map javascript to JavaScript', () => {
      expect(getLanguageDisplayName('javascript')).toBe('JavaScript');
    });

    it('should map typescript to TypeScript', () => {
      expect(getLanguageDisplayName('typescript')).toBe('TypeScript');
    });

    it('should map cpp to C++', () => {
      expect(getLanguageDisplayName('cpp')).toBe('C++');
    });

    it('should map csharp to C#', () => {
      expect(getLanguageDisplayName('csharp')).toBe('C#');
    });

    it('should map plaintext to Plain Text', () => {
      expect(getLanguageDisplayName('plaintext')).toBe('Plain Text');
    });

    it('should map python to Python', () => {
      expect(getLanguageDisplayName('python')).toBe('Python');
    });

    it('should map java to Java', () => {
      expect(getLanguageDisplayName('java')).toBe('Java');
    });

    it('should return unknown language as-is', () => {
      expect(getLanguageDisplayName('unknown-lang')).toBe('unknown-lang');
    });

    it('should handle empty string', () => {
      expect(getLanguageDisplayName('')).toBe('');
    });
  });
});
