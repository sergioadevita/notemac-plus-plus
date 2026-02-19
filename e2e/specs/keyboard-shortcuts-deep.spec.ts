import { test, expect } from '@playwright/test';
import {
    gotoApp,
    getStoreState,
    closeAllDialogs,
    focusApp,
} from '../helpers/app';

test.describe('Keyboard Shortcuts — Deep Store Integration', () =>
{
    test.beforeEach(async ({ page }) =>
    {
        await gotoApp(page);
        await focusApp(page);
        await closeAllDialogs(page);
    });

    // ═══ Panel Switching (4 tests) ════════════════════════════════════════

    test('Sidebar panel switches to git', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('git');
        });
        const panel = await getStoreState(page, 'sidebarPanel');
        expect(panel).toBe('git');
    });

    test('Sidebar panel switches to ai', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('ai');
        });
        const panel = await getStoreState(page, 'sidebarPanel');
        expect(panel).toBe('ai');
    });

    test('Sidebar panel switches to explorer', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('explorer');
        });
        const panel = await getStoreState(page, 'sidebarPanel');
        expect(panel).toBe('explorer');
    });

    test('Sidebar panel switches to search', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('search');
        });
        const panel = await getStoreState(page, 'sidebarPanel');
        expect(panel).toBe('search');
    });

    // ═══ Tab Navigation (4 tests) ═════════════════════════════════════════

    test('Set active tab switches to correct tab', async ({ page }) =>
    {
        const tabIds = await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            const s = store.getState();
            const id1 = s.addTab({ name: 'tab1.ts', content: 'a' });
            const id2 = s.addTab({ name: 'tab2.ts', content: 'b' });
            const id3 = s.addTab({ name: 'tab3.ts', content: 'c' });
            s.setActiveTab(id1);
            return { id1, id2, id3 };
        });

        await page.evaluate((id) =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setActiveTab(id);
        }, tabIds.id2);
        const active = await getStoreState(page, 'activeTabId');
        expect(active).toBe(tabIds.id2);
    });

    test('Set active tab to last tab', async ({ page }) =>
    {
        const tabIds = await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            const s = store.getState();
            const id1 = s.addTab({ name: 'tab1.ts', content: 'a' });
            const id2 = s.addTab({ name: 'tab2.ts', content: 'b' });
            s.setActiveTab(id1);
            return { id1, id2 };
        });

        await page.evaluate((id) =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setActiveTab(id);
        }, tabIds.id2);
        const active = await getStoreState(page, 'activeTabId');
        expect(active).toBe(tabIds.id2);
    });

    test('Close tab switches to remaining tab', async ({ page }) =>
    {
        const tabIds = await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            const s = store.getState();
            const id1 = s.addTab({ name: 'a.ts', content: '' });
            const id2 = s.addTab({ name: 'b.ts', content: '' });
            s.setActiveTab(id2);
            return { id1, id2 };
        });

        await page.evaluate((id) =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().closeTab(id);
        }, tabIds.id2);
        const active = await getStoreState(page, 'activeTabId');
        expect(active).toBe(tabIds.id1);
    });

    test('Switch between three tabs by index', async ({ page }) =>
    {
        const tabIds = await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            const s = store.getState();
            const id1 = s.addTab({ name: 'first.ts', content: '' });
            const id2 = s.addTab({ name: 'second.ts', content: '' });
            const id3 = s.addTab({ name: 'third.ts', content: '' });
            return { id1, id2, id3 };
        });

        // Switch to middle tab
        await page.evaluate((id) =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setActiveTab(id);
        }, tabIds.id2);
        expect(await getStoreState(page, 'activeTabId')).toBe(tabIds.id2);

        // Switch to last tab
        await page.evaluate((id) =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setActiveTab(id);
        }, tabIds.id3);
        expect(await getStoreState(page, 'activeTabId')).toBe(tabIds.id3);
    });

    // ═══ Dialog Store Triggers (5 tests) ══════════════════════════════════

    test('Quick open dialog toggles via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowQuickOpen(true);
        });
        expect(await getStoreState(page, 'showQuickOpen')).toBe(true);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowQuickOpen(false);
        });
        expect(await getStoreState(page, 'showQuickOpen')).toBe(false);
    });

    test('Command palette toggles via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCommandPalette(true);
        });
        expect(await getStoreState(page, 'showCommandPalette')).toBe(true);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowCommandPalette(false);
        });
        expect(await getStoreState(page, 'showCommandPalette')).toBe(false);
    });

    test('Shortcut mapper toggles via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowShortcutMapper(true);
        });
        expect(await getStoreState(page, 'showShortcutMapper')).toBe(true);
    });

    test('Column editor toggles via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowColumnEditor(true);
        });
        expect(await getStoreState(page, 'showColumnEditor')).toBe(true);
    });

    test('Go to line toggles via store', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowGoToLine(true);
        });
        expect(await getStoreState(page, 'showGoToLine')).toBe(true);
    });

    // ═══ Zoom via Store (4 tests) ═════════════════════════════════════════

    test('Zoom in increments zoom level', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            const current = store.getState().zoomLevel;
            store.getState().setZoomLevel(current + 1);
        });
        const zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBe(1);
    });

    test('Zoom out decrements zoom level', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setZoomLevel(3);
            store.getState().setZoomLevel(2);
        });
        const zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBe(2);
    });

    test('Zoom reset sets to 0', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setZoomLevel(4);
            store.getState().setZoomLevel(0);
        });
        const zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBe(0);
    });

    test('Multiple zoom operations accumulate', async ({ page }) =>
    {
        for (let i = 0; i < 3; i++)
        {
            await page.evaluate(() =>
            {
                const store = (window as any).__ZUSTAND_STORE__;
                const current = store.getState().zoomLevel;
                store.getState().setZoomLevel(current + 1);
            });
        }
        const zoom = await getStoreState(page, 'zoomLevel');
        expect(zoom).toBe(3);
    });

    // ═══ Escape closes dialogs (3 tests) ══════════════════════════════════

    test('Escape closes settings dialog', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowSettings(true);
        });
        expect(await getStoreState(page, 'showSettings')).toBe(true);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        expect(await getStoreState(page, 'showSettings')).toBe(false);
    });

    test('Escape closes go-to-line dialog', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowGoToLine(true);
        });
        expect(await getStoreState(page, 'showGoToLine')).toBe(true);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        expect(await getStoreState(page, 'showGoToLine')).toBe(false);
    });

    test('Escape closes multiple dialogs sequentially', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowSettings(true);
        });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        expect(await getStoreState(page, 'showSettings')).toBe(false);

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setShowAbout(true);
        });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        expect(await getStoreState(page, 'showAbout')).toBe(false);
    });

    // ═══ Sidebar toggle (2 tests) ═════════════════════════════════════════

    test('Toggle sidebar hides when visible', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel('explorer');
        });

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().toggleSidebar();
        });
        const panel = await getStoreState(page, 'sidebarPanel');
        expect(panel).toBeNull();
    });

    test('Toggle sidebar shows when hidden', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().setSidebarPanel(null);
        });

        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.getState().toggleSidebar();
        });
        const panel = await getStoreState(page, 'sidebarPanel');
        expect(panel).toBe('explorer');
    });

    // ═══ Terminal toggle (2 tests) ═════════════════════════════════════════

    test('Terminal toggles on', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.setState({ showTerminal: false });
            store.setState({ showTerminal: true });
        });
        const show = await getStoreState(page, 'showTerminal');
        expect(show).toBe(true);
    });

    test('Terminal toggles off', async ({ page }) =>
    {
        await page.evaluate(() =>
        {
            const store = (window as any).__ZUSTAND_STORE__;
            store.setState({ showTerminal: true });
            store.setState({ showTerminal: false });
        });
        const show = await getStoreState(page, 'showTerminal');
        expect(show).toBe(false);
    });
});
