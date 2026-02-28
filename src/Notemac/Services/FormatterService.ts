import { FORMATTER_DEFAULT_PRINT_WIDTH } from '../Commons/Constants';

/**
 * FormatterService — Wraps Prettier for browser-based code formatting.
 */

interface FormatOptions
{
    printWidth?: number;
    tabWidth?: number;
    useTabs?: boolean;
    semi?: boolean;
    singleQuote?: boolean;
}

const LANGUAGE_PARSER_MAP: Record<string, string> =
{
    javascript: 'babel',
    typescript: 'typescript',
    jsx: 'babel',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    markdown: 'markdown',
    yaml: 'yaml',
    xml: 'html',
    graphql: 'graphql',
};

let prettierModule: any = null;
let prettierPlugins: Record<string, any> = {};

async function LoadPrettier(): Promise<void>
{
    if (null !== prettierModule)
        return;

    try
    {
        prettierModule = await import('prettier/standalone');
        const [babel, typescript, html, css, markdown, yaml, graphql] = await Promise.all([
            import('prettier/plugins/babel'),
            import('prettier/plugins/typescript'),
            import('prettier/plugins/html'),
            import('prettier/plugins/postcss'),
            import('prettier/plugins/markdown'),
            import('prettier/plugins/yaml'),
            import('prettier/plugins/graphql'),
        ]);
        prettierPlugins = { babel, typescript, html, css, markdown, yaml, graphql };
    }
    catch
    {
        prettierModule = null;
        prettierPlugins = {};
    }
}

export async function FormatDocument(content: string, language: string, options?: FormatOptions): Promise<string>
{
    await LoadPrettier();

    if (null === prettierModule)
        return content;

    const parser = LANGUAGE_PARSER_MAP[language];
    if (undefined === parser)
        return content;

    try
    {
        const plugins = Object.values(prettierPlugins);
        const result = await prettierModule.format(content, {
            parser,
            plugins,
            printWidth: options?.printWidth ?? FORMATTER_DEFAULT_PRINT_WIDTH,
            tabWidth: options?.tabWidth ?? 4,
            useTabs: options?.useTabs ?? false,
            semi: options?.semi ?? true,
            singleQuote: options?.singleQuote ?? true,
        });
        return result;
    }
    catch
    {
        return content;
    }
}

export async function FormatSelection(
    content: string,
    rangeStart: number,
    rangeEnd: number,
    language: string,
    options?: FormatOptions,
): Promise<string>
{
    await LoadPrettier();

    if (null === prettierModule)
        return content;

    const parser = LANGUAGE_PARSER_MAP[language];
    if (undefined === parser)
        return content;

    try
    {
        const plugins = Object.values(prettierPlugins);
        const result = await prettierModule.format(content, {
            parser,
            plugins,
            rangeStart,
            rangeEnd,
            printWidth: options?.printWidth ?? FORMATTER_DEFAULT_PRINT_WIDTH,
            tabWidth: options?.tabWidth ?? 4,
            useTabs: options?.useTabs ?? false,
            semi: options?.semi ?? true,
            singleQuote: options?.singleQuote ?? true,
        });
        return result;
    }
    catch
    {
        return content;
    }
}

export function GetSupportedLanguages(): string[]
{
    return Object.keys(LANGUAGE_PARSER_MAP);
}

export function IsLanguageSupported(language: string): boolean
{
    return undefined !== LANGUAGE_PARSER_MAP[language];
}

export function ResetFormatterCache(): void
{
    prettierModule = null;
    prettierPlugins = {};
}
