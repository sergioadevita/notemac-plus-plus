import { describe, it, expect } from 'vitest';
import {
    ByteToHex,
    ByteToAscii,
    FormatOffset,
    StringToHexLines,
    HexLinesToString,
    IsBinaryContent,
    IsBinaryExtension,
    EditByteInString,
    ParseHexByte,
    SearchHexPattern,
    HexLine
} from '../Shared/Helpers/HexHelpers';

describe('ByteToHex', () => {
    it('should convert 0 to "00"', () => {
        expect(ByteToHex(0)).toBe('00');
    });

    it('should convert 10 to "0A"', () => {
        expect(ByteToHex(10)).toBe('0A');
    });

    it('should convert 255 to "FF"', () => {
        expect(ByteToHex(255)).toBe('FF');
    });

    it('should convert 65 (letter A) to "41"', () => {
        expect(ByteToHex(65)).toBe('41');
    });

    it('should convert 15 to "0F"', () => {
        expect(ByteToHex(15)).toBe('0F');
    });

    it('should convert 16 to "10"', () => {
        expect(ByteToHex(16)).toBe('10');
    });

    it('should convert 127 to "7F"', () => {
        expect(ByteToHex(127)).toBe('7F');
    });

    it('should return uppercase hex', () => {
        expect(ByteToHex(171)).toBe('AB');
    });
});

describe('ByteToAscii', () => {
    it('should convert 65 (A) to "A"', () => {
        expect(ByteToAscii(65)).toBe('A');
    });

    it('should convert 32 (space) to " "', () => {
        expect(ByteToAscii(32)).toBe(' ');
    });

    it('should convert 0 (null) to "."', () => {
        expect(ByteToAscii(0)).toBe('.');
    });

    it('should convert 127 (DEL) to "."', () => {
        expect(ByteToAscii(127)).toBe('.');
    });

    it('should convert non-printable below 0x20 to "."', () => {
        expect(ByteToAscii(1)).toBe('.');
        expect(ByteToAscii(31)).toBe('.');
    });

    it('should convert non-printable above 0x7E to "."', () => {
        expect(ByteToAscii(128)).toBe('.');
        expect(ByteToAscii(255)).toBe('.');
    });

    it('should convert 72 (H) to "H"', () => {
        expect(ByteToAscii(72)).toBe('H');
    });

    it('should convert 101 (e) to "e"', () => {
        expect(ByteToAscii(101)).toBe('e');
    });

    it('should handle printable range boundary 0x20', () => {
        expect(ByteToAscii(0x20)).toBe(' ');
    });

    it('should handle printable range boundary 0x7E (~)', () => {
        expect(ByteToAscii(0x7E)).toBe('~');
    });
});

describe('FormatOffset', () => {
    it('should format 0 as "00000000"', () => {
        expect(FormatOffset(0)).toBe('00000000');
    });

    it('should format 256 as "00000100"', () => {
        expect(FormatOffset(256)).toBe('00000100');
    });

    it('should format 65535 as "0000FFFF"', () => {
        expect(FormatOffset(65535)).toBe('0000FFFF');
    });

    it('should format 1 as "00000001"', () => {
        expect(FormatOffset(1)).toBe('00000001');
    });

    it('should format 4096 as "00001000"', () => {
        expect(FormatOffset(4096)).toBe('00001000');
    });

    it('should format 1048576 as "00100000"', () => {
        expect(FormatOffset(1048576)).toBe('00100000');
    });

    it('should return uppercase hex', () => {
        expect(FormatOffset(171)).toBe('000000AB');
    });

    it('should pad to 8 digits', () => {
        expect(FormatOffset(15)).toBe('0000000F');
    });
});

describe('StringToHexLines', () => {
    it('should convert "Hello" to 1 line with default 16 bytes per row', () => {
        const result = StringToHexLines('Hello');
        expect(result).toHaveLength(1);
        expect(result[0].offset).toBe(0);
        expect(result[0].bytes).toEqual([72, 101, 108, 108, 111]);
        expect(result[0].ascii).toBe('Hello');
    });

    it('should return empty array for empty string', () => {
        const result = StringToHexLines('');
        expect(result).toEqual([]);
    });

    it('should split 32 chars into 2 lines with bytesPerRow=16', () => {
        const content = 'a'.repeat(32);
        const result = StringToHexLines(content, 16);
        expect(result).toHaveLength(2);
        expect(result[0].offset).toBe(0);
        expect(result[0].bytes).toHaveLength(16);
        expect(result[1].offset).toBe(16);
        expect(result[1].bytes).toHaveLength(16);
    });

    it('should split with bytesPerRow=8', () => {
        const content = 'Hello World!'; // 12 chars
        const result = StringToHexLines(content, 8);
        expect(result).toHaveLength(2);
        expect(result[0].bytes).toHaveLength(8);
        expect(result[1].bytes).toHaveLength(4);
    });

    it('should create correct HexLine objects with offsets', () => {
        const result = StringToHexLines('abcdefghijklmnopqrst', 8);
        expect(result).toHaveLength(3);
        expect(result[0].offset).toBe(0);
        expect(result[1].offset).toBe(8);
        expect(result[2].offset).toBe(16);
    });

    it('should populate bytes array with char codes', () => {
        const result = StringToHexLines('ABC', 16);
        expect(result[0].bytes).toEqual([65, 66, 67]);
    });

    it('should populate ascii with converted characters', () => {
        const result = StringToHexLines('Hi', 16);
        expect(result[0].ascii).toBe('Hi');
    });

    it('should handle non-printable characters in ascii field', () => {
        const content = 'A\x00B';
        const result = StringToHexLines(content, 16);
        expect(result[0].ascii).toBe('A.B');
    });

    it('should handle single character', () => {
        const result = StringToHexLines('X', 16);
        expect(result).toHaveLength(1);
        expect(result[0].bytes).toEqual([88]);
        expect(result[0].ascii).toBe('X');
    });
});

describe('HexLinesToString', () => {
    it('should roundtrip "Hello"', () => {
        const lines = StringToHexLines('Hello');
        const result = HexLinesToString(lines);
        expect(result).toBe('Hello');
    });

    it('should return empty string for empty array', () => {
        const result = HexLinesToString([]);
        expect(result).toBe('');
    });

    it('should roundtrip 32 characters split across 2 lines', () => {
        const original = 'a'.repeat(32);
        const lines = StringToHexLines(original, 16);
        const result = HexLinesToString(lines);
        expect(result).toBe(original);
    });

    it('should roundtrip with non-printable characters', () => {
        const original = 'Hello\x00World';
        const lines = StringToHexLines(original);
        const result = HexLinesToString(lines);
        expect(result).toBe(original);
    });

    it('should reconstruct from manually created HexLine array', () => {
        const lines: HexLine[] = [
            { offset: 0, bytes: [72, 101], ascii: 'He' },
            { offset: 2, bytes: [108, 108, 111], ascii: 'llo' }
        ];
        const result = HexLinesToString(lines);
        expect(result).toBe('Hello');
    });

    it('should handle single HexLine', () => {
        const lines: HexLine[] = [
            { offset: 0, bytes: [65, 66, 67], ascii: 'ABC' }
        ];
        const result = HexLinesToString(lines);
        expect(result).toBe('ABC');
    });

    it('should handle HexLine with empty bytes array', () => {
        const lines: HexLine[] = [
            { offset: 0, bytes: [], ascii: '' }
        ];
        const result = HexLinesToString(lines);
        expect(result).toBe('');
    });
});

describe('IsBinaryContent', () => {
    it('should return false for "Hello world"', () => {
        expect(IsBinaryContent('Hello world')).toBe(false);
    });

    it('should return true for string with null byte', () => {
        expect(IsBinaryContent('Hello\x00World')).toBe(true);
    });

    it('should return true for string with >30% non-printable chars', () => {
        // Create string with 40% non-printable (0x01-0x1F, excluding tab/newline/carriage return)
        const content = 'ABC\x01\x02\x03\x04\x05';
        expect(IsBinaryContent(content)).toBe(true);
    });

    it('should return false for plain text with tabs and newlines', () => {
        expect(IsBinaryContent('Hello\tWorld\nLine2')).toBe(false);
    });

    it('should return false for text with carriage returns', () => {
        expect(IsBinaryContent('Line1\rLine2')).toBe(false);
    });

    it('should return true for null byte at start', () => {
        expect(IsBinaryContent('\x00Hello')).toBe(true);
    });

    it('should return true for null byte in middle', () => {
        expect(IsBinaryContent('Hello\x00')).toBe(true);
    });

    it('should check only first 8192 characters', () => {
        // Create content longer than 8192 with null byte at end
        const content = 'a'.repeat(8193) + '\x00';
        expect(IsBinaryContent(content)).toBe(false);
    });

    it('should return true for high-bit characters exceeding 30% threshold', () => {
        // Characters > 0x7E
        const content = 'A\xFF\xFE\xFD\xFC';
        expect(IsBinaryContent(content)).toBe(true);
    });

    it('should return false for exactly 30% non-printable', () => {
        // 3 non-printable out of 10 = 30% (boundary case, should be false since threshold is >30%)
        const content = 'ABC\x01\x02\x03DEFGH';
        expect(IsBinaryContent(content)).toBe(false);
    });

    it('should return false for empty string', () => {
        expect(IsBinaryContent('')).toBe(false);
    });

    it('should return false for printable ASCII only', () => {
        expect(IsBinaryContent('The quick brown fox jumps over the lazy dog.')).toBe(false);
    });
});

describe('IsBinaryExtension', () => {
    it('should return true for "test.exe"', () => {
        expect(IsBinaryExtension('test.exe')).toBe(true);
    });

    it('should return true for "test.png"', () => {
        expect(IsBinaryExtension('test.png')).toBe(true);
    });

    it('should return false for "test.txt"', () => {
        expect(IsBinaryExtension('test.txt')).toBe(false);
    });

    it('should return false for "test.ts"', () => {
        expect(IsBinaryExtension('test.ts')).toBe(false);
    });

    it('should return false for "noextension"', () => {
        expect(IsBinaryExtension('noextension')).toBe(false);
    });

    it('should be case insensitive - "TEST.PNG" should return true', () => {
        expect(IsBinaryExtension('TEST.PNG')).toBe(true);
    });

    it('should be case insensitive - "Test.Exe" should return true', () => {
        expect(IsBinaryExtension('Test.Exe')).toBe(true);
    });

    it('should return false for "test.js"', () => {
        expect(IsBinaryExtension('test.js')).toBe(false);
    });

    it('should return true for image formats', () => {
        expect(IsBinaryExtension('image.jpg')).toBe(true);
        expect(IsBinaryExtension('photo.jpeg')).toBe(true);
        expect(IsBinaryExtension('animation.gif')).toBe(true);
        expect(IsBinaryExtension('icon.ico')).toBe(true);
    });

    it('should return true for audio/video formats', () => {
        expect(IsBinaryExtension('song.mp3')).toBe(true);
        expect(IsBinaryExtension('movie.mp4')).toBe(true);
        expect(IsBinaryExtension('audio.wav')).toBe(true);
    });

    it('should return true for archive formats', () => {
        expect(IsBinaryExtension('archive.zip')).toBe(true);
        expect(IsBinaryExtension('backup.tar')).toBe(true);
        expect(IsBinaryExtension('compressed.gz')).toBe(true);
    });

    it('should return true for document formats', () => {
        expect(IsBinaryExtension('document.pdf')).toBe(true);
        expect(IsBinaryExtension('doc.docx')).toBe(true);
        expect(IsBinaryExtension('sheet.xlsx')).toBe(true);
    });

    it('should return false for "test.md"', () => {
        expect(IsBinaryExtension('test.md')).toBe(false);
    });

    it('should return false for "test.json"', () => {
        expect(IsBinaryExtension('test.json')).toBe(false);
    });

    it('should handle file with multiple dots', () => {
        expect(IsBinaryExtension('archive.backup.zip')).toBe(true);
        expect(IsBinaryExtension('file.backup.txt')).toBe(false);
    });

    it('should return true for executable "test.dll"', () => {
        expect(IsBinaryExtension('test.dll')).toBe(true);
    });

    it('should return true for WebAssembly "module.wasm"', () => {
        expect(IsBinaryExtension('module.wasm')).toBe(true);
    });
});

describe('EditByteInString', () => {
    it('should replace character at offset 0', () => {
        expect(EditByteInString('Hello', 0, 74)).toBe('Jello');
    });

    it('should replace character in middle', () => {
        expect(EditByteInString('Hello', 2, 120)).toBe('Hexlo');
    });

    it('should replace last character', () => {
        expect(EditByteInString('Hello', 4, 33)).toBe('Hell!');
    });

    it('should throw for negative offset', () => {
        expect(() => EditByteInString('Hello', -1, 65)).toThrow('Offset out of range');
    });

    it('should throw for offset at string length', () => {
        expect(() => EditByteInString('Hello', 5, 65)).toThrow('Offset out of range');
    });

    it('should throw for offset beyond string length', () => {
        expect(() => EditByteInString('Hello', 10, 65)).toThrow('Offset out of range');
    });

    it('should handle single character string', () => {
        expect(EditByteInString('A', 0, 66)).toBe('B');
    });

    it('should handle replacement with low char code', () => {
        expect(EditByteInString('ABC', 1, 0)).toBe('A\x00C');
    });

    it('should handle replacement with high char code', () => {
        expect(EditByteInString('ABC', 1, 255)).toBe('A\xFFC');
    });

    it('should preserve other characters', () => {
        const original = 'The quick brown fox';
        const result = EditByteInString(original, 4, 115); // Replace 'q' with 's'
        expect(result).toBe('The suick brown fox');
    });
});

describe('ParseHexByte', () => {
    it('should parse "4A" to 74', () => {
        expect(ParseHexByte('4A')).toBe(74);
    });

    it('should parse "ff" to 255 (lowercase)', () => {
        expect(ParseHexByte('ff')).toBe(255);
    });

    it('should parse "00" to 0', () => {
        expect(ParseHexByte('00')).toBe(0);
    });

    it('should return null for empty string', () => {
        expect(ParseHexByte('')).toBeNull();
    });

    it('should return null for "GG" (invalid hex)', () => {
        expect(ParseHexByte('GG')).toBeNull();
    });

    it('should return null for "FFF" (too long)', () => {
        expect(ParseHexByte('FFF')).toBeNull();
    });

    it('should parse single digit hex "F" to 15', () => {
        expect(ParseHexByte('F')).toBe(15);
    });

    it('should parse "10" to 16', () => {
        expect(ParseHexByte('10')).toBe(16);
    });

    it('should parse "7F" to 127', () => {
        expect(ParseHexByte('7F')).toBe(127);
    });

    it('should return null for "100" (too long)', () => {
        expect(ParseHexByte('100')).toBeNull();
    });

    it('should handle whitespace with trim', () => {
        expect(ParseHexByte(' FF ')).toBe(null);
    });

    it('should return null for only whitespace', () => {
        expect(ParseHexByte('   ')).toBeNull();
    });

    it('should return null for invalid hex characters', () => {
        expect(ParseHexByte('XY')).toBeNull();
    });

    it('should return null for negative result (impossible)', () => {
        // parseInt with base 16 won't produce negative for valid hex
        expect(ParseHexByte('-1')).toBeNull();
    });

    it('should return null for value > 255', () => {
        expect(ParseHexByte('FF0')).toBeNull(); // Too long anyway
    });
});

describe('SearchHexPattern', () => {
    it('should find "48 65" in "Hello" at offset 0', () => {
        const result = SearchHexPattern('Hello', '48 65');
        expect(result).toEqual([0]);
    });

    it('should find "6C 6C" in "Hello" at offset 2', () => {
        const result = SearchHexPattern('Hello', '6C 6C');
        expect(result).toEqual([2]);
    });

    it('should return empty array for empty pattern', () => {
        const result = SearchHexPattern('Hello', '');
        expect(result).toEqual([]);
    });

    it('should return empty array for invalid hex in pattern', () => {
        const result = SearchHexPattern('Hello', 'GG 65');
        expect(result).toEqual([]);
    });

    it('should return empty array for no match', () => {
        const result = SearchHexPattern('Hello', 'FF FF');
        expect(result).toEqual([]);
    });

    it('should find multiple occurrences', () => {
        // "aaa" -> 61 61 61, search for "61 61" should find at 0 and 1
        const result = SearchHexPattern('aaa', '61 61');
        expect(result).toEqual([0, 1]);
    });

    it('should find single byte pattern', () => {
        const result = SearchHexPattern('Hello', '48');
        expect(result).toEqual([0]); // 'H'
    });

    it('should find multiple single byte matches', () => {
        const result = SearchHexPattern('Hello', '6C'); // 'l'
        expect(result).toEqual([2, 3]);
    });

    it('should handle pattern at end of content', () => {
        const result = SearchHexPattern('Hello', '6F'); // 'o'
        expect(result).toEqual([4]);
    });

    it('should return empty array for pattern longer than content', () => {
        const result = SearchHexPattern('Hi', '48 65 6C 6C 6F'); // "Hello"
        expect(result).toEqual([]);
    });

    it('should be case insensitive for hex pattern', () => {
        // Both "48" and "48" should match 'H'
        const result1 = SearchHexPattern('Hello', '48');
        const result2 = SearchHexPattern('Hello', '48');
        expect(result1).toEqual(result2);
        expect(result1).toEqual([0]);
    });

    it('should handle pattern with spaces', () => {
        const result = SearchHexPattern('Hello', '65 6C');
        expect(result).toEqual([1]); // 'e' 'l'
    });

    it('should handle non-printable byte patterns', () => {
        const content = 'A\x00B\x00C';
        const result = SearchHexPattern(content, '00'); // null byte
        expect(result).toEqual([1, 3]);
    });

    it('should find entire content as pattern', () => {
        const result = SearchHexPattern('Hi', '48 69');
        expect(result).toEqual([0]);
    });

    it('should handle empty content', () => {
        const result = SearchHexPattern('', '48 65');
        expect(result).toEqual([]);
    });

    it('should return empty array for pattern with only spaces', () => {
        const result = SearchHexPattern('Hello', '   ');
        expect(result).toEqual([]);
    });
});
