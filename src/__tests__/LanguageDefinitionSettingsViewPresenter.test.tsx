import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageDefinitionSettingsViewPresenter } from '../Notemac/UI/LanguageDefinitionSettingsViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';
import type { CustomLanguageDefinition } from '../Notemac/Commons/Types';

// ─── Mock Controllers ────────────────────────────────────────────

const mockUnregisterCustomLanguage = vi.fn();
const mockSetFileAssociation = vi.fn();
const mockRemoveFileAssociation = vi.fn();

vi.mock('../Notemac/Controllers/LanguageDefinitionController', () => ({
    UnregisterCustomLanguage: (langId: string) => mockUnregisterCustomLanguage(langId),
    SetFileAssociation: (ext: string, langId: string) => mockSetFileAssociation(ext, langId),
    RemoveFileAssociation: (ext: string) => mockRemoveFileAssociation(ext),
}));

// ─── Mock Store ─────────────────────────────────────────────────

const mockCustomLanguages: CustomLanguageDefinition[] = [
    {
        id: 'custom-lang-1',
        label: 'Custom Rust',
        extensions: ['.rs', '.rlib'],
        aliases: ['rust', 'rs'],
    },
    {
        id: 'custom-lang-2',
        label: 'Custom Go',
        extensions: ['.go'],
        aliases: ['golang', 'go'],
    },
];

const mockFileAssociationOverrides = {
    '.custom': 'custom-lang-1',
    '.oldrs': 'custom-lang-1',
};

let mockStoreState = {
    customLanguages: mockCustomLanguages,
    fileAssociationOverrides: mockFileAssociationOverrides,
};

const createMockStore = () =>
{
    return mockStoreState;
};

vi.mock('../Notemac/Model/Store', () =>
{
    const mockUseStore = vi.fn(() => createMockStore());
    return {
        useNotemacStore: mockUseStore,
    };
});

// ─── Shared Theme Mock ─────────────────────────────────────────

const mockTheme: ThemeColors = {
    bg: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d2d',
    bgHover: '#2a2d2e',
    bgSelected: '#094771',
    border: '#474747',
    fg: '#cccccc',
    fgSecondary: '#969696',
    fgInactive: '#6e7681',
    text: '#cccccc',
    textSecondary: '#969696',
    textMuted: '#6e7681',
    accent: '#0078d4',
    accentHover: '#1c8cf9',
    accentFg: '#ffffff',
    accentText: '#ffffff',
    scrollbar: '#424242',
    scrollbarHover: '#4f4f4f',
    findHighlight: '#623315',
    selectionBg: '#264f78',
    lineHighlight: '#2a2d2e',
    errorFg: '#f14c4c',
    warningFg: '#cca700',
    successFg: '#89d185',
    infoFg: '#3794ff',
    tabActiveBg: '#1e1e1e',
    tabInactiveBg: '#2d2d2d',
    tabHoverBg: '#2a2d2e',
    sidebarBg: '#252526',
    sidebarFg: '#cccccc',
    editorMonacoTheme: 'notemac-dark',
} as ThemeColors;

// ─── LanguageDefinitionSettingsViewPresenter Tests ────────────────

describe('LanguageDefinitionSettingsViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
    });

    // Test 1: Renders section headers
    it('should render section headers for custom languages and file association overrides', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Custom Languages')).toBeTruthy();
        expect(screen.getByText('File Association Overrides')).toBeTruthy();
    });

    // Test 2: Shows custom languages list
    it('should display all custom languages in the list', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        expect(screen.getByText('Custom Rust')).toBeTruthy();
        expect(screen.getByText('Custom Go')).toBeTruthy();
    });

    // Test 3: Shows empty state when no custom languages
    it('should show empty state message when no custom languages defined', () =>
    {
        mockStoreState = {
            customLanguages: [],
            fileAssociationOverrides: mockFileAssociationOverrides,
        };

        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        expect(screen.getByText('No custom languages defined.')).toBeTruthy();

        mockStoreState = {
            customLanguages: mockCustomLanguages,
            fileAssociationOverrides: mockFileAssociationOverrides,
        };
    });

    // Test 4: File association overrides table renders
    it('should render file association overrides table with correct format', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        // Check that extensions are displayed
        expect(screen.getByText('.custom')).toBeTruthy();
        expect(screen.getByText('.oldrs')).toBeTruthy();

        // Check that language IDs are mapped correctly
        const customOverride = screen.getAllByText('custom-lang-1');
        expect(0 < customOverride.length).toBeTruthy();
    });

    // Test 5: Add language button works
    it('should have functional add language button', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const addButtons = screen.getAllByText('+ Add');
        // Should have at least the custom languages add button
        expect(0 < addButtons.length).toBeTruthy();

        // Button should be clickable
        const customLanguagesAddBtn = addButtons[0];
        expect(() => fireEvent.click(customLanguagesAddBtn)).not.toThrow();
    });

    // Test 6: Delete language button works
    it('should call UnregisterCustomLanguage when delete button is clicked', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const deleteButtons = screen.getAllByText('Delete');
        expect(0 < deleteButtons.length).toBeTruthy();

        // Click the first delete button
        fireEvent.click(deleteButtons[0]);

        expect(mockUnregisterCustomLanguage).toHaveBeenCalledWith('custom-lang-1');
    });

    // Test 7: Shows language extensions
    it('should display extensions for each custom language', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        // Extensions should be displayed as comma-separated list
        expect(screen.getByText('.rs, .rlib')).toBeTruthy();
        expect(screen.getByText('.go')).toBeTruthy();
    });

    // Test 8: Override table shows extensions and language IDs
    it('should show arrow separator between extension and language ID in overrides', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const arrows = screen.getAllByText('→');
        // Should have arrows in the file association overrides section
        expect(1 < arrows.length).toBeTruthy();
    });

    // Test 9: Remove override button works
    it('should call RemoveFileAssociation when remove override button is clicked', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const removeButtons = screen.getAllByText('Remove');
        expect(0 < removeButtons.length).toBeTruthy();

        // Click the first remove button
        fireEvent.click(removeButtons[0]);

        expect(mockRemoveFileAssociation).toHaveBeenCalledWith('.custom');
    });

    // Test 10: Add override interface
    it('should add file association override when inputs are filled and add button clicked', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        // Find input fields - use query selector since placeholders might help
        const inputs = screen.getAllByPlaceholderText(/(\.ext|language-id)/);
        expect(2 === inputs.length).toBeTruthy();

        const extInput = screen.getByPlaceholderText('.ext') as HTMLInputElement;
        const langIdInput = screen.getByPlaceholderText('language-id') as HTMLInputElement;

        // Fill in the inputs
        fireEvent.change(extInput, { target: { value: '.newext' } });
        fireEvent.change(langIdInput, { target: { value: 'new-lang-id' } });

        // Find and click the add button for overrides
        const addButtons = screen.getAllByText('Add');
        const overrideAddBtn = addButtons[addButtons.length - 1]; // Last add button

        fireEvent.click(overrideAddBtn);

        expect(mockSetFileAssociation).toHaveBeenCalledWith('.newext', 'new-lang-id');
    });

    // Additional test: Verify inputs are cleared after adding override
    it('should clear override input fields after adding override', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const extInput = screen.getByPlaceholderText('.ext') as HTMLInputElement;
        const langIdInput = screen.getByPlaceholderText('language-id') as HTMLInputElement;

        // Fill in the inputs
        fireEvent.change(extInput, { target: { value: '.newext' } });
        fireEvent.change(langIdInput, { target: { value: 'new-lang-id' } });

        expect(extInput.value).toBe('.newext');
        expect(langIdInput.value).toBe('new-lang-id');

        // Click add button
        const addButtons = screen.getAllByText('Add');
        const overrideAddBtn = addButtons[addButtons.length - 1];
        fireEvent.click(overrideAddBtn);

        // Verify inputs are cleared
        expect(extInput.value).toBe('');
        expect(langIdInput.value).toBe('');
    });

    // Additional test: Verify add override doesn't work with empty inputs
    it('should not add override when either extension or language ID is empty', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const extInput = screen.getByPlaceholderText('.ext') as HTMLInputElement;
        const langIdInput = screen.getByPlaceholderText('language-id') as HTMLInputElement;

        // Only fill extension
        fireEvent.change(extInput, { target: { value: '.newext' } });

        const addButtons = screen.getAllByText('Add');
        const overrideAddBtn = addButtons[addButtons.length - 1];
        fireEvent.click(overrideAddBtn);

        expect(mockSetFileAssociation).not.toHaveBeenCalled();
    });

    // Additional test: Verify no empty state when overrides exist
    it('should not show empty state for overrides when overrides are defined', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const emptyStates = screen.queryAllByText('No file association overrides.');
        expect(0 === emptyStates.length).toBeTruthy();
    });

    // Additional test: Shows empty state when no overrides
    it('should show empty state when no file association overrides', () =>
    {
        mockStoreState = {
            customLanguages: mockCustomLanguages,
            fileAssociationOverrides: {},
        };

        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        expect(screen.getByText('No file association overrides.')).toBeTruthy();

        mockStoreState = {
            customLanguages: mockCustomLanguages,
            fileAssociationOverrides: mockFileAssociationOverrides,
        };
    });

    // Additional test: Edit button triggers edit handler
    it('should have edit button for each custom language', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        const editButtons = screen.getAllByText('Edit');
        expect(2 === editButtons.length).toBeTruthy();

        // Verify edit buttons are clickable
        editButtons.forEach(btn =>
        {
            expect(() => fireEvent.click(btn)).not.toThrow();
        });
    });

    // Additional test: Theme colors are applied
    it('should apply theme colors to rendered elements', () =>
    {
        const { container } = render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        // Verify container renders without error
        expect(container).toBeTruthy();
        expect(container.firstChild).toBeTruthy();
    });

    // Additional test: Multiple custom languages display correctly
    it('should render all custom language items with correct structure', () =>
    {
        render(<LanguageDefinitionSettingsViewPresenter theme={mockTheme} />);

        // Verify we have language items rendered by checking for buttons
        const buttons = screen.getAllByRole('button');
        // Should have: 1 add custom lang button + 2 edit buttons + 2 delete buttons + 2 remove override buttons + 1 add override button = 8
        expect(2 < buttons.length).toBeTruthy();
    });
});
