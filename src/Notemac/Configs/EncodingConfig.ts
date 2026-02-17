interface EncodingItem
{
    value: string;
    label: string;
}

interface EncodingGroup
{
    group: string;
    items: readonly EncodingItem[];
}

const ENCODINGS: readonly EncodingGroup[] = [
    { group: 'Unicode', items: [
        { value: 'utf-8', label: 'UTF-8' },
        { value: 'utf-8-bom', label: 'UTF-8 BOM' },
        { value: 'utf-16le', label: 'UTF-16 LE' },
        { value: 'utf-16be', label: 'UTF-16 BE' },
    ]},
    { group: 'Western European', items: [
        { value: 'windows-1252', label: 'Windows-1252 (ANSI)' },
        { value: 'iso-8859-1', label: 'ISO 8859-1 (Latin I)' },
        { value: 'iso-8859-15', label: 'ISO 8859-15 (Latin 9)' },
        { value: 'cp850', label: 'OEM 850 (DOS Latin)' },
    ]},
    { group: 'Central European', items: [
        { value: 'windows-1250', label: 'Windows-1250' },
        { value: 'iso-8859-2', label: 'ISO 8859-2 (Latin II)' },
    ]},
    { group: 'Cyrillic', items: [
        { value: 'windows-1251', label: 'Windows-1251' },
        { value: 'iso-8859-5', label: 'ISO 8859-5' },
        { value: 'koi8-r', label: 'KOI8-R' },
        { value: 'koi8-u', label: 'KOI8-U' },
        { value: 'cp866', label: 'OEM 866 (DOS Cyrillic)' },
    ]},
    { group: 'Greek', items: [
        { value: 'windows-1253', label: 'Windows-1253' },
        { value: 'iso-8859-7', label: 'ISO 8859-7' },
    ]},
    { group: 'Turkish', items: [
        { value: 'windows-1254', label: 'Windows-1254' },
        { value: 'iso-8859-9', label: 'ISO 8859-9' },
    ]},
    { group: 'Hebrew', items: [
        { value: 'windows-1255', label: 'Windows-1255' },
        { value: 'iso-8859-8', label: 'ISO 8859-8' },
    ]},
    { group: 'Arabic', items: [
        { value: 'windows-1256', label: 'Windows-1256' },
        { value: 'iso-8859-6', label: 'ISO 8859-6' },
    ]},
    { group: 'Baltic', items: [
        { value: 'windows-1257', label: 'Windows-1257' },
        { value: 'iso-8859-13', label: 'ISO 8859-13' },
    ]},
    { group: 'Vietnamese', items: [
        { value: 'windows-1258', label: 'Windows-1258' },
    ]},
    { group: 'East Asian', items: [
        { value: 'big5', label: 'Big5 (Traditional Chinese)' },
        { value: 'gb2312', label: 'GB2312 (Simplified Chinese)' },
        { value: 'shift_jis', label: 'Shift JIS (Japanese)' },
        { value: 'euc-kr', label: 'EUC-KR (Korean)' },
        { value: 'iso-2022-jp', label: 'ISO-2022-JP' },
    ]},
    { group: 'Thai', items: [
        { value: 'tis-620', label: 'TIS-620 (Thai)' },
    ]},
    { group: 'DOS', items: [
        { value: 'cp437', label: 'OEM 437 (US)' },
        { value: 'cp737', label: 'OEM 737 (Greek)' },
        { value: 'cp775', label: 'OEM 775 (Baltic)' },
        { value: 'cp852', label: 'OEM 852 (Latin II)' },
        { value: 'cp855', label: 'OEM 855 (Cyrillic)' },
        { value: 'cp857', label: 'OEM 857 (Turkish)' },
        { value: 'cp858', label: 'OEM 858 (Latin I + Euro)' },
        { value: 'cp860', label: 'OEM 860 (Portuguese)' },
        { value: 'cp861', label: 'OEM 861 (Icelandic)' },
        { value: 'cp862', label: 'OEM 862 (Hebrew)' },
        { value: 'cp863', label: 'OEM 863 (French Canadian)' },
        { value: 'cp865', label: 'OEM 865 (Nordic)' },
        { value: 'cp869', label: 'OEM 869 (Greek)' },
    ]},
] as const;

export function GetEncodings(): readonly EncodingGroup[]
{
    return ENCODINGS;
}

export function GetEncodingGroups(): string[]
{
    return ENCODINGS.map(g => g.group);
}

export function GetEncodingByValue(value: string): EncodingItem | undefined
{
    for (const group of ENCODINGS)
    {
        const found = group.items.find(item => item.value === value);
        if (found)
            return found as EncodingItem;
    }
    return undefined;
}
