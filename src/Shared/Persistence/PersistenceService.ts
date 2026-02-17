export function GetValue<T>(key: string, defaultValue?: T): T | null
{
    try
    {
        const stored = localStorage.getItem(key);
        if (null === stored)
            return defaultValue ?? null;
        return JSON.parse(stored) as T;
    }
    catch
    {
        return defaultValue ?? null;
    }
}

export function SetValue<T>(key: string, value: T): void
{
    try
    {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch
    {
        // Storage quota exceeded or unavailable — silently fail
    }
}

export function RemoveValue(key: string): void
{
    try
    {
        localStorage.removeItem(key);
    }
    catch
    {
        // Silently fail
    }
}

export function HasValue(key: string): boolean
{
    return null !== localStorage.getItem(key);
}
