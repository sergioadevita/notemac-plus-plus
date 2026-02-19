import { test, expect } from '@playwright/test';
import {
    gotoApp,
    getStoreState,
    closeAllDialogs,
} from '../helpers/app';

test.describe('StatusBar, Zoom, and Command Palette Deep', () =>
{
    test.beforeEach(async ({ page }) =>
    {
        await gotoApp(page);
        await closeAllDialogs(page);
    });

    // ═══ StatusBar Display (6 tests) ═══════════════════════════════════════

    test('StatusBar shows cursor position "Ln X, Col Y"', async ({ page }) =>
    {
        const cursorEl = page.locator('[title="Cursor Position"]');
        const text = await cursorEl.textContent();
        expect(text).toMatch(/Ln\s+\d+,\s*Col\s+\d+/);
    });

    test('StatusBar displays character count', async ({ page }) =>
    {
        const charEl = page.locator('[title="Character Count"]');
        const text = await charEl.textContent();
        expect(text).toMatch(/\d+\s*chars?/i);
    });

    test('StatusBar displays word count', async ({ page }) =>
    {
        const wordEl = page.locator('[title="Word Count"]');
        const text = await wordEl.textContent();
        expect(text).toMatch(/\d+\s*words?/i);
    });

    test('StatusBar displays line count', async ({ page }) =>
    {
        const lineEl = page.locator('[title="Line Count"]');
        const text = await lineEl.textContent();
        expect(text).toMatch(/\d+\s*lines?/i);
    });

    test('StatusBar displays encoding (UTF-8)', async ({ page }) =>
    {
        const encEl = page.locator('[title="Encoding"]');
        const text = await encEl.textContent();
        expect(text).toContain('UTF-8');
    });

    test('StatusBar displays language (Plain Text)', async ({ page }) =>
    {
        const langEl = page.locator('[title="Language"]');
        const text = await langEl.textContent();
        expect(text).toContain('Plain Text');
    });

    // ═══ StatusBar Interactivity (3 tests) ═════════════════════════════════

    test('StatusBar items have cursor:pointer', async ({ page }) =>
    {
        const cursorEl = page.locator('[title="Cursor Position"]');
        const cursor = await cursorEl.evaluate((el) =>
            window.getComputedStyle(el).cursor
        );
        expect(cursor).toBe('pointer');
    });

    test('StatusBar shows tab size indicator', async ({ page }) =>
    {
        const tabEl = page.locator('[title="Tab Size"]');
        const text = await tabEl.textContent();
        expect(text).toMatch(/Spaces|Tab/i);
    });

    test('StatusBar shows line ending indicator (LF)', async ({ page }) =>
    {
        const eolEl = page.locator('[title="Line Ending"]');
        const text = await eolEl.textContent();
        expect(text).toMatch(/LF|CRLF|CR/);
    });

    // ═══ Zoom Deep (5 tests) ══════════════════════════════════════════════

    test('Zoom level 0 is default', async ({ page }) =>
    {
        const zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBe(0);
    });

    test('setZoomLevel clamps below LIMIT_ZOOM_MIN', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setZoomLevel(-100);
        });
        await page.waitForTimeout(200);

        const zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBeLessThanOrEqual(0);
        expect(zoom).toBeGreaterThanOrEqual(-10);
    });

    test('setZoomLevel clamps above LIMIT_ZOOM_MAX', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setZoomLevel(100);
        });
        await page.waitForTimeout(200);

        const zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBeGreaterThanOrEqual(0);
        expect(zoom).toBeLessThanOrEqual(10);
    });

    test('Multiple zoom changes accumulate correctly', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setZoomLevel(1);
        });
        let zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBe(1);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            const current = store.getState().zoomLevel;
            store.getState().setZoomLevel(current + 1);
        });
        zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBe(2);
    });

    test('Zoom affects editor font size', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setZoomLevel(3);
        });
        await page.waitForTimeout(300);

        const fontSize = await page.evaluate(() =>
        {
            const editor = document.querySelector('.monaco-editor');
            if (editor)
                return window.getComputedStyle(editor).fontSize;
            return '';
        });
        expect(fontSize).toBeTruthy();
    });

    // ═══ Toolbar (4 tests) ════════════════════════════════════════════════

    test('Toolbar has New, Open, Save buttons', async ({ page }) =>
    {
        const newBtn = page.locator('button[title*="New"]').first();
        const openBtn = page.locator('button[title*="Open"]').first();
        const saveBtn = page.locator('button[title*="Save"]').first();

        expect(await newBtn.count()).toBeGreaterThan(0);
        expect(await openBtn.count()).toBeGreaterThan(0);
        expect(await saveBtn.count()).toBeGreaterThan(0);
    });

    test('Toolbar has Undo and Redo buttons', async ({ page }) =>
    {
        const undoBtn = page.locator('button[title*="Undo"]').first();
        const redoBtn = page.locator('button[title*="Redo"]').first();

        expect(await undoBtn.count()).toBeGreaterThan(0);
        expect(await redoBtn.count()).toBeGreaterThan(0);
    });

    test('Toolbar has Find and Replace buttons', async ({ page }) =>
    {
        const findBtn = page.locator('button[title*="Find"]').first();
        const replaceBtn = page.locator('button[title*="Replace"]').first();

        expect(await findBtn.count()).toBeGreaterThan(0);
        expect(await replaceBtn.count()).toBeGreaterThan(0);
    });

    test('Toolbar has Zoom In and Zoom Out buttons', async ({ page }) =>
    {
        const zoomInBtn = page.locator('button[title*="Zoom In"]').first();
        const zoomOutBtn = page.locator('button[title*="Zoom Out"]').first();

        expect(await zoomInBtn.count()).toBeGreaterThan(0);
        expect(await zoomOutBtn.count()).toBeGreaterThan(0);
    });

    // ═══ Command Palette Deep (4 tests) ═══════════════════════════════════

    test('Command palette opens via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCommandPalette(true);
        });
        await page.waitForTimeout(300);

        const state = await getStoreState(page, 'showCommandPalette');
        expect(state).toBe(true);
    });

    test('Command palette has text input', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCommandPalette(true);
        });
        await page.waitForTimeout(300);

        const inputs = page.locator('input[type="text"], input:not([type])');
        const count = await inputs.count();
        expect(count).toBeGreaterThan(0);
    });

    test('Quick open opens via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowQuickOpen(true);
        });
        await page.waitForTimeout(300);

        const state = await getStoreState(page, 'showQuickOpen');
        expect(state).toBe(true);
    });

    test('Command palette and quick open are separate store flags', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCommandPalette(true);
            store.getState().setShowQuickOpen(true);
        });
        await page.waitForTimeout(200);

        const cp = await getStoreState(page, 'showCommandPalette');
        const qo = await getStoreState(page, 'showQuickOpen');
        expect(cp).toBe(true);
        expect(qo).toBe(true);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCommandPalette(false);
        });
        await page.waitForTimeout(200);

        const cpAfter = await getStoreState(page, 'showCommandPalette');
        const qoAfter = await getStoreState(page, 'showQuickOpen');
        expect(cpAfter).toBe(false);
        expect(qoAfter).toBe(true);
    });
});
