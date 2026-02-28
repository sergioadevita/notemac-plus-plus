import { EMMET_SUPPORTED_LANGUAGES } from '../Commons/Constants';

/**
 * EmmetService — Wraps the emmet library for HTML/CSS abbreviation expansion.
 */

let emmetModule: any = null;

async function LoadEmmet(): Promise<void>
{
    if (null !== emmetModule)
        return;

    try
    {
        // @ts-expect-error emmet types not resolved via package.json exports
        emmetModule = await import('emmet');
    }
    catch
    {
        emmetModule = null;
    }
}

export async function ExpandAbbreviation(abbreviation: string, language: string): Promise<string>
{
    await LoadEmmet();

    if (null === emmetModule)
        return abbreviation;

    try
    {
        const type = IsStylesheetLanguage(language) ? 'stylesheet' : 'markup';
        const result = emmetModule.default
            ? emmetModule.default(abbreviation, { type })
            : emmetModule(abbreviation, { type });
        return result;
    }
    catch
    {
        return abbreviation;
    }
}

export function IsEmmetContext(language: string): boolean
{
    return EMMET_SUPPORTED_LANGUAGES.includes(language);
}

export function IsStylesheetLanguage(language: string): boolean
{
    return 'css' === language || 'scss' === language || 'less' === language;
}

export function GetSupportedLanguages(): string[]
{
    return [...EMMET_SUPPORTED_LANGUAGES];
}

export function ResetEmmetCache(): void
{
    emmetModule = null;
}
