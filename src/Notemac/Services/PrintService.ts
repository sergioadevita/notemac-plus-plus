import { UI_PRINT_DEFAULT_FONT_SIZE, UI_PRINT_DEFAULT_LINE_NUMBERS } from '../Commons/Constants';

/**
 * PrintService — Generates print-ready HTML from editor content with syntax highlighting.
 */

interface PrintOptions
{
    showLineNumbers?: boolean;
    fontSize?: number;
    fontFamily?: string;
    wordWrap?: boolean;
    headerText?: string;
    footerText?: string;
}

export function GeneratePrintHTML(content: string, _language: string, options?: PrintOptions): string
{
    const fontSize = options?.fontSize ?? UI_PRINT_DEFAULT_FONT_SIZE;
    const showLineNumbers = options?.showLineNumbers ?? UI_PRINT_DEFAULT_LINE_NUMBERS;
    const fontFamily = options?.fontFamily ?? "'Courier New', 'Menlo', monospace";
    const wordWrap = options?.wordWrap ?? true;
    const headerText = options?.headerText ?? '';
    const footerText = options?.footerText ?? '';

    const lines = content.split('\n');
    const lineNumberWidth = String(lines.length).length;

    let bodyHTML = '';
    for (let i = 0, maxCount = lines.length; i < maxCount; i++)
    {
        const lineNum = i + 1;
        const lineNumStr = showLineNumbers
            ? `<span style="color:#999;user-select:none;display:inline-block;width:${lineNumberWidth + 1}ch;text-align:right;margin-right:1ch;">${lineNum}</span>`
            : '';
        const escapedLine = EscapeHTML(lines[i]) || '&nbsp;';
        bodyHTML += `<div style="min-height:1.4em;">${lineNumStr}${escapedLine}</div>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Print - ${EscapeHTML(headerText || 'Notemac++')}</title>
<style>
@media print {
    body { margin: 0; padding: 20px; }
    .no-print { display: none; }
}
body {
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    line-height: 1.4;
    color: #333;
    background: #fff;
    ${wordWrap ? 'word-wrap: break-word; white-space: pre-wrap;' : 'white-space: pre; overflow-x: auto;'}
}
.header {
    text-align: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #ccc;
    margin-bottom: 10px;
    font-size: ${fontSize + 2}px;
    font-weight: bold;
}
.footer {
    text-align: center;
    padding-top: 10px;
    border-top: 1px solid #ccc;
    margin-top: 10px;
    font-size: ${fontSize - 2}px;
    color: #666;
}
.content {
    tab-size: 4;
}
</style>
</head>
<body>
${'' !== headerText ? `<div class="header">${EscapeHTML(headerText)}</div>` : ''}
<div class="content">${bodyHTML}</div>
${'' !== footerText ? `<div class="footer">${EscapeHTML(footerText)}</div>` : ''}
</body>
</html>`;
}

export function Print(content: string, language: string, options?: PrintOptions): void
{
    const html = GeneratePrintHTML(content, language, options);
    const printWindow = window.open('', '_blank');

    if (null === printWindow)
        return;

    printWindow.document.write(html);
    printWindow.document.close();

    // Delay to ensure content is rendered
    setTimeout(() =>
    {
        printWindow.print();
        printWindow.close();
    }, 250);
}

function EscapeHTML(text: string): string
{
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\t/g, '    ')
        .replace(/ {2}/g, '&nbsp; ');
}
