import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomLanguageEditorDialogViewPresenter } from '../Notemac/UI/CustomLanguageEditorDialogViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';
import type { CustomLanguageDefinition } from '../Notemac/Commons/Types';
import * as LanguageDefinitionController from '../Notemac/Controllers/LanguageDefinitionController';
import * as LanguageDefinitionService from '../Notemac/Services/LanguageDefinitionService';

// ─── Mocks ──────────────────────────────────────────────────────

vi.mock('../Notemac/Controllers/LanguageDefinitionController', () => ({
    RegisterCustomLanguage: vi.fn(),
    UpdateCustomLanguage: vi.fn(),
}));

vi.mock('../Notemac/Services/LanguageDefinitionService', () => ({
    ValidateLanguageDefinition: vi.fn(),
}));

// ─── Get mock functions ─────────────────────────────────────────
const mockRegisterCustomLanguage = vi.mocked(LanguageDefinitionController.RegisterCustomLanguage);
const mockUpdateCustomLanguage = vi.mocked(LanguageDefinitionController.UpdateCustomLanguage);
const mockValidateLanguageDefinition = vi.mocked(LanguageDefinitionService.ValidateLanguageDefinition);

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
    editorBg: '#1e1e1e',
} as ThemeColors;

const mockExistingLanguage: CustomLanguageDefinition = {
    id: 'my-lang',
    label: 'My Language',
    extensions: ['.ml', '.myl'],
    aliases: ['MyLang', 'ml'],
    monarchTokens: {
        keywords: ['if', 'else', 'while', 'for'],
        operators: ['+', '-', '*', '/'],
        tokenizer: {
            root: [
                ['[a-zA-Z_]\\w*', 'identifier'],
            ],
            string: [
                ['[^\\\\"]+', 'string'],
                ['\\\\.', 'string.escape'],
                ['"', 'string', '@pop'],
            ],
        },
    },
    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
    },
    brackets: [['[', ']'], ['{', '}'], ['(', ')']],
};

// ─── CustomLanguageEditorDialogViewPresenter ─────────────────────

describe('CustomLanguageEditorDialogViewPresenter', () =>
{
    beforeEach(() =>
    {
        vi.clearAllMocks();
        mockValidateLanguageDefinition.mockReturnValue({ valid: true, errors: [] });
        mockRegisterCustomLanguage.mockReturnValue({ success: true, errors: [] });
        mockUpdateCustomLanguage.mockReturnValue({ success: true, errors: [] });
    });

    // ─── Test 1: Renders dialog with title ───────────────────────────

    it('renders dialog with correct title for new language', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        expect(screen.getByText('New Custom Language')).toBeTruthy();
    });

    it('renders dialog with correct title for editing language', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        expect(screen.getByText('Edit Language')).toBeTruthy();
    });

    // ─── Test 2: Shows form fields ───────────────────────────────────

    it('shows language ID field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Language ID');
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('my-language');
    });

    it('shows display label field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Display Label');
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('My Language');
    });

    it('shows file extensions field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('File Extensions (comma-separated)');
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('.ml, .myl');
    });

    it('shows aliases field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Aliases (comma-separated)');
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('MyLang, ml');
    });

    // ─── Test 3: Shows keywords textarea ────────────────────────────

    it('shows keywords field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Keywords (comma-separated)');
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('if, else, while, for, return, function');
    });

    it('allows typing in keywords field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Keywords (comma-separated)');
        const input = label.nextElementSibling as HTMLInputElement;

        fireEvent.change(input, { target: { value: 'if, else, return' } });

        expect(input.value).toBe('if, else, return');
    });

    // ─── Test 4: Shows operators textarea ────────────────────────────

    it('shows operators field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Operators (comma-separated)');
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('+, -, *, /, =, ==, !=');
    });

    it('allows typing in operators field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Operators (comma-separated)');
        const input = label.nextElementSibling as HTMLInputElement;

        fireEvent.change(input, { target: { value: '+, -, *' } });

        expect(input.value).toBe('+, -, *');
    });

    // ─── Test 5: Shows comment config fields ────────────────────────

    it('shows line comment prefix field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText('Line Comment Prefix');
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('//');
    });

    it('shows block comment start and end fields', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const startLabel = screen.getByText('Block Comment Start');
        const endLabel = screen.getByText('Block Comment End');

        expect(startLabel).toBeTruthy();
        expect(endLabel).toBeTruthy();

        const startInput = startLabel.nextElementSibling as HTMLInputElement;
        const endInput = endLabel.nextElementSibling as HTMLInputElement;

        expect(startInput.placeholder).toBe('/*');
        expect(endInput.placeholder).toBe('*/');
    });

    it('shows bracket pairs field', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const label = screen.getByText(/Bracket Pairs/);
        expect(label).toBeTruthy();

        const input = label.nextElementSibling as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('[], {}, ()');
    });

    // ─── Test 6: Save button validates and calls controller ─────────

    it('calls RegisterCustomLanguage on save for new language', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        // Fill in required fields
        const idLabel = screen.getByText('Language ID');
        const idInput = idLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(idInput, { target: { value: 'test-lang' } });

        const labelLabel = screen.getByText('Display Label');
        const labelInput = labelLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(labelInput, { target: { value: 'Test Language' } });

        const extLabel = screen.getByText('File Extensions (comma-separated)');
        const extInput = extLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(extInput, { target: { value: '.tl' } });

        // Click save
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);

        expect(mockRegisterCustomLanguage).toHaveBeenCalled();
    });

    it('calls UpdateCustomLanguage on save for existing language', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        // Change a field
        const labelLabel = screen.getByText('Display Label');
        const labelInput = labelLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(labelInput, { target: { value: 'Updated Label' } });

        // Click update
        const updateButton = screen.getByText('Update');
        fireEvent.click(updateButton);

        expect(mockUpdateCustomLanguage).toHaveBeenCalled();
    });

    it('shows validation errors from service', () =>
    {
        const onClose = vi.fn();
        mockValidateLanguageDefinition.mockReturnValue({
            valid: false,
            errors: ['Language id is required', 'Language extensions is required'],
        });

        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        // Click save without filling fields
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);

        expect(screen.getByText('Language id is required')).toBeTruthy();
        expect(screen.getByText('Language extensions is required')).toBeTruthy();
    });

    it('shows controller errors when registration fails', () =>
    {
        const onClose = vi.fn();
        mockValidateLanguageDefinition.mockReturnValue({ valid: true, errors: [] });
        mockRegisterCustomLanguage.mockReturnValue({
            success: false,
            errors: ['Language "test-lang" already exists'],
        });

        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        // Fill in required fields
        const idLabel = screen.getByText('Language ID');
        const idInput = idLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(idInput, { target: { value: 'test-lang' } });

        const labelLabel = screen.getByText('Display Label');
        const labelInput = labelLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(labelInput, { target: { value: 'Test Language' } });

        const extLabel = screen.getByText('File Extensions (comma-separated)');
        const extInput = extLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(extInput, { target: { value: '.tl' } });

        // Click save
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);

        expect(screen.getByText('Language "test-lang" already exists')).toBeTruthy();
    });

    it('closes dialog after successful save', () =>
    {
        const onClose = vi.fn();
        mockValidateLanguageDefinition.mockReturnValue({ valid: true, errors: [] });
        mockRegisterCustomLanguage.mockReturnValue({ success: true, errors: [] });

        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        // Fill in required fields
        const idLabel = screen.getByText('Language ID');
        const idInput = idLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(idInput, { target: { value: 'test-lang' } });

        const labelLabel = screen.getByText('Display Label');
        const labelInput = labelLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(labelInput, { target: { value: 'Test Language' } });

        const extLabel = screen.getByText('File Extensions (comma-separated)');
        const extInput = extLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(extInput, { target: { value: '.tl' } });

        // Click save
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);

        expect(onClose).toHaveBeenCalled();
    });

    // ─── Test 7: Cancel button closes dialog ─────────────────────────

    it('cancel button calls onClose', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('close button (×) calls onClose', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const closeButton = screen.getByText('×');
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalled();
    });

    // ─── Test 8: Pre-fills form when editing existing language ──────

    it('pre-fills id field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const idLabel = screen.getByText('Language ID');
        const idInput = idLabel.nextElementSibling as HTMLInputElement;

        expect(idInput.value).toBe('my-lang');
    });

    it('disables id field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const idLabel = screen.getByText('Language ID');
        const idInput = idLabel.nextElementSibling as HTMLInputElement;

        expect(idInput.disabled).toBe(true);
    });

    it('pre-fills label field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const labelLabel = screen.getByText('Display Label');
        const labelInput = labelLabel.nextElementSibling as HTMLInputElement;

        expect(labelInput.value).toBe('My Language');
    });

    it('pre-fills extensions field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const extLabel = screen.getByText('File Extensions (comma-separated)');
        const extInput = extLabel.nextElementSibling as HTMLInputElement;

        expect(extInput.value).toBe('.ml, .myl');
    });

    it('pre-fills aliases field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const aliasLabel = screen.getByText('Aliases (comma-separated)');
        const aliasInput = aliasLabel.nextElementSibling as HTMLInputElement;

        expect(aliasInput.value).toBe('MyLang, ml');
    });

    it('pre-fills keywords field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const keywordLabel = screen.getByText('Keywords (comma-separated)');
        const keywordInput = keywordLabel.nextElementSibling as HTMLInputElement;

        expect(keywordInput.value).toBe('if, else, while, for');
    });

    it('pre-fills operators field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const opLabel = screen.getByText('Operators (comma-separated)');
        const opInput = opLabel.nextElementSibling as HTMLInputElement;

        expect(opInput.value).toBe('+, -, *, /');
    });

    it('pre-fills line comment field when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const lineCommentLabel = screen.getByText('Line Comment Prefix');
        const lineCommentInput = lineCommentLabel.nextElementSibling as HTMLInputElement;

        expect(lineCommentInput.value).toBe('//');
    });

    it('pre-fills block comment fields when editing', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                existingLanguage={mockExistingLanguage}
                onClose={onClose}
            />
        );

        const startLabel = screen.getByText('Block Comment Start');
        const endLabel = screen.getByText('Block Comment End');

        const startInput = startLabel.nextElementSibling as HTMLInputElement;
        const endInput = endLabel.nextElementSibling as HTMLInputElement;

        expect(startInput.value).toBe('/*');
        expect(endInput.value).toBe('*/');
    });

    // ─── Test 9: Shows validation errors ────────────────────────────

    it('displays multiple validation errors', () =>
    {
        const onClose = vi.fn();
        mockValidateLanguageDefinition.mockReturnValue({
            valid: false,
            errors: [
                'Language id is required and must be a non-empty string',
                'Language label is required and must be a non-empty string',
                'Language extensions is required and must be a non-empty array',
            ],
        });

        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);

        expect(
            screen.getByText('Language id is required and must be a non-empty string')
        ).toBeTruthy();
        expect(
            screen.getByText('Language label is required and must be a non-empty string')
        ).toBeTruthy();
        expect(
            screen.getByText('Language extensions is required and must be a non-empty array')
        ).toBeTruthy();
    });

    it('clears errors when user corrects form', () =>
    {
        const onClose = vi.fn();
        mockValidateLanguageDefinition.mockReturnValueOnce({
            valid: false,
            errors: ['Language id is required'],
        });
        mockValidateLanguageDefinition.mockReturnValueOnce({
            valid: true,
            errors: [],
        });
        mockRegisterCustomLanguage.mockReturnValue({ success: true, errors: [] });

        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        // First attempt: no id filled
        const createButton = screen.getByText('Create');
        fireEvent.click(createButton);

        expect(screen.getByText('Language id is required')).toBeTruthy();

        // Fill in id
        const idLabel = screen.getByText('Language ID');
        const idInput = idLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(idInput, { target: { value: 'test-lang' } });

        const labelLabel = screen.getByText('Display Label');
        const labelInput = labelLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(labelInput, { target: { value: 'Test Language' } });

        const extLabel = screen.getByText('File Extensions (comma-separated)');
        const extInput = extLabel.nextElementSibling as HTMLInputElement;
        fireEvent.change(extInput, { target: { value: '.tl' } });

        // Second attempt: should succeed
        fireEvent.click(createButton);

        expect(onClose).toHaveBeenCalled();
    });

    // ─── Test 10: Close on overlay click ────────────────────────────

    it('closes dialog when clicking overlay (outside modal)', () =>
    {
        const onClose = vi.fn();
        const { container } = render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        // Get the overlay (first div with fixed position)
        const overlay = container.querySelector('div[style*="position: fixed"]') as HTMLDivElement;
        expect(overlay).toBeTruthy();

        fireEvent.click(overlay);

        expect(onClose).toHaveBeenCalled();
    });

    it('does not close dialog when clicking inside modal', () =>
    {
        const onClose = vi.fn();
        render(
            <CustomLanguageEditorDialogViewPresenter
                theme={mockTheme}
                onClose={onClose}
            />
        );

        // Click on the title (inside the modal)
        const title = screen.getByText('New Custom Language');
        fireEvent.click(title);

        expect(onClose).not.toHaveBeenCalled();
    });
});
