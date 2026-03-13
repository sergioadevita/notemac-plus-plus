/**
 * Converts a character code to a 2-digit hex string.
 */
export function ByteToHex(charCode: number): string
{
    return charCode.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Converts a character code to its ASCII printable representation.
 * Returns '.' for non-printable characters (< 0x20 or > 0x7E).
 */
export function ByteToAscii(charCode: number): string
{
    if (charCode < 0x20 || charCode > 0x7E)
    {
        return '.';
    }
    return String.fromCharCode(charCode);
}

/**
 * Formats an offset number as an 8-digit hex string.
 * e.g., 0 -> "00000000", 256 -> "00000100"
 */
export function FormatOffset(offset: number): string
{
    return offset.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Hex line object for displaying hex content.
 */
export interface HexLine
{
    offset: number;
    bytes: number[];
    ascii: string;
}

/**
 * Converts a string to an array of hex line objects for display.
 * Each line has: offset (number), bytes (number[] of char codes), ascii (string).
 * bytesPerRow defaults to 16.
 */
export function StringToHexLines(content: string, bytesPerRow?: number): HexLine[]
{
    const rowSize: number = bytesPerRow ?? 16;
    const lines: HexLine[] = [];

    for (let i = 0; i < content.length; i += rowSize)
    {
        const chunkEnd: number = Math.min(i + rowSize, content.length);
        const chunk: string = content.substring(i, chunkEnd);
        const bytes: number[] = [];
        let ascii: string = '';

        for (let j = 0; j < chunk.length; j++)
        {
            const charCode: number = chunk.charCodeAt(j);
            bytes.push(charCode);
            ascii += ByteToAscii(charCode);
        }

        lines.push({
            offset: i,
            bytes: bytes,
            ascii: ascii
        });
    }

    return lines;
}

/**
 * Converts hex lines back to a string.
 * Reconstructs the original string from the byte arrays.
 */
export function HexLinesToString(lines: HexLine[]): string
{
    let result: string = '';

    for (let i = 0; i < lines.length; i++)
    {
        const line: HexLine = lines[i];
        for (let j = 0; j < line.bytes.length; j++)
        {
            result += String.fromCharCode(line.bytes[j]);
        }
    }

    return result;
}

/**
 * Detects if content is likely binary (contains null bytes or high ratio of non-printable chars).
 * Check for null characters (charCode 0) or if >30% of first 8192 chars are non-printable
 */
export function IsBinaryContent(content: string): boolean
{
    const checkLength: number = Math.min(content.length, 8192);

    // Check for null bytes
    for (let i = 0; i < checkLength; i++)
    {
        if (0 === content.charCodeAt(i))
        {
            return true;
        }
    }

    // Count non-printable characters
    let nonPrintableCount: number = 0;
    for (let i = 0; i < checkLength; i++)
    {
        const charCode: number = content.charCodeAt(i);
        if ((charCode < 0x20 && '\t' !== String.fromCharCode(charCode) && '\n' !== String.fromCharCode(charCode) && '\r' !== String.fromCharCode(charCode)) || charCode > 0x7E)
        {
            nonPrintableCount++;
        }
    }

    const nonPrintableRatio: number = nonPrintableCount / checkLength;
    return nonPrintableRatio > 0.3;
}

/**
 * Checks if a file extension suggests binary content.
 */
export function IsBinaryExtension(filename: string): boolean
{
    const binaryExtensions: string[] = [
        // Executables
        'exe', 'dll', 'bin', 'obj', 'o', 'so', 'dylib', 'class',
        // Images
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'svg',
        // Audio/Video
        'mp3', 'mp4', 'avi', 'mkv', 'wav', 'flac', 'ogg',
        // Archives
        'zip', 'tar', 'gz', '7z', 'rar', 'bz2', 'xz',
        // Documents
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        // Other
        'wasm', 'pyc', 'pyd'
    ];

    const lastDotIndex: number = filename.lastIndexOf('.');
    if (-1 === lastDotIndex)
    {
        return false;
    }

    const ext: string = filename.substring(lastDotIndex + 1).toLowerCase();

    for (let i = 0; i < binaryExtensions.length; i++)
    {
        if (ext === binaryExtensions[i])
        {
            return true;
        }
    }

    return false;
}

/**
 * Edits a single byte in a content string at the given character offset.
 * Returns the new string with the byte replaced.
 */
export function EditByteInString(content: string, offset: number, newCharCode: number): string
{
    if (offset < 0 || offset >= content.length)
    {
        throw new Error('Offset out of range');
    }

    const before: string = content.substring(0, offset);
    const after: string = content.substring(offset + 1);
    return before + String.fromCharCode(newCharCode) + after;
}

/**
 * Parses a hex string (e.g., "4A", "ff") to a number.
 * Returns null if invalid.
 */
export function ParseHexByte(hexStr: string): number | null
{
    if ('' === hexStr || hexStr.length > 2)
    {
        return null;
    }

    const trimmed: string = hexStr.trim();
    if ('' === trimmed)
    {
        return null;
    }

    const num: number = parseInt(trimmed, 16);
    if (isNaN(num) || num < 0 || num > 255)
    {
        return null;
    }

    return num;
}

/**
 * Searches for a hex pattern in content.
 * Pattern is space-separated hex bytes, e.g. "48 65 6C 6C 6F"
 * Returns array of offsets where the pattern starts.
 */
export function SearchHexPattern(content: string, hexPattern: string): number[]
{
    if ('' === hexPattern)
    {
        return [];
    }

    const hexParts: string[] = hexPattern.split(' ');
    const patternBytes: number[] = [];

    for (let i = 0; i < hexParts.length; i++)
    {
        const byte: number | null = ParseHexByte(hexParts[i]);
        if (null === byte)
        {
            return [];
        }
        patternBytes.push(byte);
    }

    if (0 === patternBytes.length)
    {
        return [];
    }

    const results: number[] = [];

    for (let i = 0; i <= content.length - patternBytes.length; i++)
    {
        let matches: boolean = true;
        for (let j = 0; j < patternBytes.length; j++)
        {
            if (content.charCodeAt(i + j) !== patternBytes[j])
            {
                matches = false;
                break;
            }
        }

        if (matches)
        {
            results.push(i);
        }
    }

    return results;
}
