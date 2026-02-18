export interface FuzzyMatchResult
{
    match: boolean;
    score: number;
    indices: number[];
}

/**
 * Performs fuzzy matching of a query against a text string.
 * Scores higher for consecutive matches, word-boundary matches, and prefix matches.
 */
export function FuzzyMatch(query: string, text: string): FuzzyMatchResult
{
    if (0 === query.length)
        return { match: true, score: 0, indices: [] };

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const queryLen = queryLower.length;
    const textLen = textLower.length;

    if (queryLen > textLen)
        return { match: false, score: 0, indices: [] };

    const indices: number[] = [];
    let score = 0;
    let queryIndex = 0;
    let prevMatchIndex = -2;

    for (let i = 0; i < textLen && queryIndex < queryLen; i++)
    {
        if (textLower[i] === queryLower[queryIndex])
        {
            indices.push(i);

            // Bonus for consecutive matches
            if (i === prevMatchIndex + 1)
                score += 5;

            // Bonus for word boundary match (after space, underscore, hyphen, dot, slash, or uppercase)
            if (0 === i || ' _-./\\'.includes(text[i - 1]) || (text[i] === text[i].toUpperCase() && text[i] !== text[i].toLowerCase()))
                score += 3;

            // Bonus for prefix match
            if (0 === i)
                score += 10;

            // Exact case match bonus
            if (text[i] === query[queryIndex])
                score += 1;

            prevMatchIndex = i;
            queryIndex++;
        }
    }

    if (queryIndex < queryLen)
        return { match: false, score: 0, indices: [] };

    // Bonus for shorter text (more specific match)
    score += Math.max(0, 20 - (textLen - queryLen));

    return { match: true, score, indices };
}

/**
 * Filters and sorts a list of items by fuzzy match score.
 * Returns only matching items, sorted by best match first.
 */
export function FuzzyFilter<T>(query: string, items: T[], getText: (item: T) => string): T[]
{
    if (0 === query.length)
        return items;

    const results: { item: T; score: number }[] = [];
    const maxCount = items.length;

    for (let i = 0; i < maxCount; i++)
    {
        const text = getText(items[i]);
        const result = FuzzyMatch(query, text);

        if (result.match)
            results.push({ item: items[i], score: result.score });
    }

    results.sort((a, b) => b.score - a.score);

    return results.map(r => r.item);
}
