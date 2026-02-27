import { describe, it, expect, beforeEach } from 'vitest';
import {
    GetValue,
    SetValue,
    RemoveValue,
    HasValue,
} from '../Shared/Persistence/PersistenceService';

// ============================================================
// PersistenceService — SetValue, GetValue, RemoveValue, HasValue
// ============================================================
describe('PersistenceService', () =>
{
    beforeEach(() =>
    {
        // Clear localStorage before each test
        localStorage.clear();
    });

    // ============================================================
    // SetValue and GetValue
    // ============================================================
    describe('SetValue and GetValue', () =>
    {
        it('stores and retrieves a string value', () =>
        {
            const key = 'testString';
            const value = 'hello world';
            SetValue(key, value);
            const retrieved = GetValue<string>(key);
            expect(retrieved).toBe(value);
        });

        it('stores and retrieves an object value', () =>
        {
            const key = 'testObject';
            const value = { name: 'John', age: 30 };
            SetValue(key, value);
            const retrieved = GetValue<typeof value>(key);
            expect(retrieved).toEqual(value);
            expect(retrieved?.name).toBe('John');
            expect(retrieved?.age).toBe(30);
        });

        it('stores and retrieves an array value', () =>
        {
            const key = 'testArray';
            const value = [1, 2, 3, 4, 5];
            SetValue(key, value);
            const retrieved = GetValue<number[]>(key);
            expect(retrieved).toEqual(value);
        });

        it('stores and retrieves a number value', () =>
        {
            const key = 'testNumber';
            const value = 42;
            SetValue(key, value);
            const retrieved = GetValue<number>(key);
            expect(retrieved).toBe(value);
        });

        it('stores and retrieves a boolean value', () =>
        {
            const key = 'testBoolean';
            const value = true;
            SetValue(key, value);
            const retrieved = GetValue<boolean>(key);
            expect(retrieved).toBe(value);
        });

        it('stores and retrieves null value', () =>
        {
            const key = 'testNull';
            const value = null;
            SetValue(key, value);
            const retrieved = GetValue(key);
            expect(retrieved).toBe(null);
        });
    });

    // ============================================================
    // GetValue with missing keys
    // ============================================================
    describe('GetValue with missing keys', () =>
    {
        it('returns null for missing key when no default provided', () =>
        {
            const result = GetValue('nonexistent');
            expect(result).toBeNull();
        });

        it('returns defaultValue for missing key when default provided', () =>
        {
            const defaultValue = 'default';
            const result = GetValue<string>('nonexistent', defaultValue);
            expect(result).toBe(defaultValue);
        });

        it('returns defaultValue as object when provided', () =>
        {
            const defaultValue = { id: 0, name: 'default' };
            const result = GetValue<typeof defaultValue>('nonexistent', defaultValue);
            expect(result).toEqual(defaultValue);
        });

        it('returns defaultValue as array when provided', () =>
        {
            const defaultValue: number[] = [];
            const result = GetValue<number[]>('nonexistent', defaultValue);
            expect(result).toEqual(defaultValue);
        });
    });

    // ============================================================
    // GetValue with invalid JSON
    // ============================================================
    describe('GetValue with invalid JSON', () =>
    {
        it('returns defaultValue when JSON is invalid', () =>
        {
            const key = 'invalidJson';
            localStorage.setItem(key, 'not valid json {]');
            const defaultValue = 'recovered';
            const result = GetValue<string>(key, defaultValue);
            expect(result).toBe(defaultValue);
        });

        it('returns null when JSON is invalid and no default provided', () =>
        {
            const key = 'invalidJson';
            localStorage.setItem(key, '{ invalid }');
            const result = GetValue(key);
            expect(result).toBeNull();
        });
    });

    // ============================================================
    // RemoveValue
    // ============================================================
    describe('RemoveValue', () =>
    {
        it('removes value from storage', () =>
        {
            const key = 'toRemove';
            SetValue(key, 'value');
            expect(HasValue(key)).toBe(true);
            RemoveValue(key);
            expect(HasValue(key)).toBe(false);
        });

        it('GetValue returns null after RemoveValue', () =>
        {
            const key = 'toRemove';
            SetValue(key, 'value');
            RemoveValue(key);
            const result = GetValue(key);
            expect(result).toBeNull();
        });

        it('removing nonexistent key does not error', () =>
        {
            expect(() =>
            {
                RemoveValue('nonexistent');
            }).not.toThrow();
        });
    });

    // ============================================================
    // HasValue
    // ============================================================
    describe('HasValue', () =>
    {
        it('returns true when key exists', () =>
        {
            const key = 'exists';
            SetValue(key, 'value');
            expect(HasValue(key)).toBe(true);
        });

        it('returns false when key does not exist', () =>
        {
            expect(HasValue('nonexistent')).toBe(false);
        });

        it('returns false after RemoveValue is called', () =>
        {
            const key = 'temp';
            SetValue(key, 'value');
            RemoveValue(key);
            expect(HasValue(key)).toBe(false);
        });

        it('returns true for null values', () =>
        {
            const key = 'nullValue';
            SetValue(key, null);
            expect(HasValue(key)).toBe(true);
        });

        it('returns true for falsy values', () =>
        {
            SetValue('zero', 0);
            expect(HasValue('zero')).toBe(true);

            SetValue('false', false);
            expect(HasValue('false')).toBe(true);

            SetValue('empty', '');
            expect(HasValue('empty')).toBe(true);
        });
    });

    // ============================================================
    // Integration tests
    // ============================================================
    describe('Integration tests', () =>
    {
        it('multiple values do not interfere with each other', () =>
        {
            SetValue('key1', 'value1');
            SetValue('key2', 'value2');
            SetValue('key3', { nested: 'object' });

            expect(GetValue<string>('key1')).toBe('value1');
            expect(GetValue<string>('key2')).toBe('value2');

            const key3Value = GetValue<{ nested: string }>('key3');
            expect(key3Value).toEqual({ nested: 'object' });
        });

        it('overwriting existing key replaces value', () =>
        {
            const key = 'overwrite';
            SetValue(key, 'original');
            expect(GetValue<string>(key)).toBe('original');

            SetValue(key, 'updated');
            expect(GetValue<string>(key)).toBe('updated');
        });

        it('complex data structures survive round-trip', () =>
        {
            const key = 'complex';
            const original = {
                users: [
                    { id: 1, name: 'Alice', tags: ['admin', 'user'] },
                    { id: 2, name: 'Bob', tags: ['user'] },
                ],
                metadata: {
                    version: 1,
                    timestamp: 1234567890,
                },
            };

            SetValue(key, original);
            const retrieved = GetValue<typeof original>(key);
            expect(retrieved).toEqual(original);
        });
    });
});
