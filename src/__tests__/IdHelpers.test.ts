import { describe, it, expect } from 'vitest';
import { generateId } from '../Shared/Helpers/IdHelpers';

// ============================================================
// IdHelpers — generateId
// ============================================================
describe('generateId', () =>
{
    it('returns a non-empty string', () =>
    {
        const id = generateId();
        expect(id).toBeTruthy();
        expect(typeof id).toBe('string');
        expect(0 < id.length).toBe(true);
    });

    it('returns unique IDs', () =>
    {
        const ids = new Set<string>();
        for (let i = 0, maxCount = 100; i < maxCount; i++)
        {
            ids.add(generateId());
        }
        expect(ids.size).toBe(100);
    });
});
