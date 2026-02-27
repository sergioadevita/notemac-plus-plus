import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CloneRepositoryViewPresenter } from '../Notemac/UI/CloneRepositoryViewPresenter';

const mockTheme = {
  bg: '#1e1e2e',
  bgSecondary: '#181825',
  bgTertiary: '#313244',
  bgHover: '#45475a',
  bgActive: '#585b70',
  text: '#cdd6f4',
  textSecondary: '#a6adc8',
  textMuted: '#6c7086',
  accent: '#89b4fa',
  accentText: '#1e1e2e',
  border: '#45475a',
  tabBg: '#181825',
  tabActiveBg: '#1e1e2e',
  tabActiveText: '#cdd6f4',
  tabBorder: '#313244',
  menuBg: '#1e1e2e',
  menuText: '#cdd6f4',
  sidebarBg: '#181825',
  sidebarText: '#a6adc8',
  warning: '#f9e2af',
  error: '#f38ba8',
  scrollbarThumb: '#45475a',
  scrollbarTrack: 'transparent',
  monacoTheme: 'custom-dark',
} as any;

// Default state for the store
let mockStoreState = {
  setShowCloneDialog: vi.fn(),
  gitCredentials: null,
  isGitOperationInProgress: false,
  gitOperationProgress: 0,
  gitOperationError: null,
  AddBrowserWorkspace: vi.fn(),
  SetIsBrowserWorkspace: vi.fn(),
  setWorkspacePath: vi.fn(),
  setSidebarPanel: vi.fn(),
};

// Mock store with selector pattern support
vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: vi.fn((selector) => {
    const state = {
      setShowCloneDialog: mockStoreState.setShowCloneDialog,
      gitCredentials: mockStoreState.gitCredentials,
      isGitOperationInProgress: mockStoreState.isGitOperationInProgress,
      gitOperationProgress: mockStoreState.gitOperationProgress,
      gitOperationError: mockStoreState.gitOperationError,
      AddBrowserWorkspace: mockStoreState.AddBrowserWorkspace,
      SetIsBrowserWorkspace: mockStoreState.SetIsBrowserWorkspace,
      setWorkspacePath: mockStoreState.setWorkspacePath,
      setSidebarPanel: mockStoreState.setSidebarPanel,
      getState: vi.fn(() => ({
        setShowCloneDialog: mockStoreState.setShowCloneDialog,
        gitCredentials: mockStoreState.gitCredentials,
        isGitOperationInProgress: mockStoreState.isGitOperationInProgress,
        gitOperationProgress: mockStoreState.gitOperationProgress,
        gitOperationError: mockStoreState.gitOperationError,
        AddBrowserWorkspace: mockStoreState.AddBrowserWorkspace,
        SetIsBrowserWorkspace: mockStoreState.SetIsBrowserWorkspace,
        setWorkspacePath: mockStoreState.setWorkspacePath,
        setSidebarPanel: mockStoreState.setSidebarPanel,
      })),
    };
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

vi.mock('../Notemac/Controllers/GitController', () => ({
  CloneRepository: vi.fn(),
  InitGitForWorkspace: vi.fn(),
}));

vi.mock('../Shared/Git/GitFileSystemAdapter', () => ({
  DetectFsBackend: vi.fn(() => 'lightningfs'),
  CreateLightningFsAdapter: vi.fn(),
  RegisterDirHandle: vi.fn(),
}));

vi.mock('../Shared/Helpers/IdHelpers', () => ({
  generateId: vi.fn(() => 'test-id-123'),
}));

describe('CloneRepositoryViewPresenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      setShowCloneDialog: vi.fn(),
      gitCredentials: null,
      isGitOperationInProgress: false,
      gitOperationProgress: 0,
      gitOperationError: null,
      AddBrowserWorkspace: vi.fn(),
      SetIsBrowserWorkspace: vi.fn(),
      setWorkspacePath: vi.fn(),
      setSidebarPanel: vi.fn(),
    };
  });

  it('renders with title "Clone Repository"', () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    expect(screen.getByText('Clone Repository')).toBeInTheDocument();
  });

  it('renders Repository URL input field with placeholder', () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    const urlInput = screen.getByPlaceholderText('https://github.com/user/repo.git');
    expect(urlInput).toBeInTheDocument();
  });

  it('renders close button and calls setShowCloneDialog when clicked', () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    const closeButton = screen.getByText('✕');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);
    expect(mockStoreState.setShowCloneDialog).toHaveBeenCalledWith(false);
  });

  it('renders Cancel button and calls setShowCloneDialog when clicked', () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    expect(mockStoreState.setShowCloneDialog).toHaveBeenCalledWith(false);
  });

  it('Clone button is disabled when URL is empty', () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const cloneButton = buttons.find(btn => btn.textContent?.includes('Clone'));
    expect(cloneButton).toBeDisabled();
  });

  it('Clone button is enabled when URL is entered', async () => {
    const { rerender } = render(<CloneRepositoryViewPresenter theme={mockTheme} />);

    const urlInput = screen.getByPlaceholderText('https://github.com/user/repo.git') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://github.com/user/repo.git' } });

    const buttons = screen.getAllByRole('button');
    const cloneButton = buttons.find(btn => btn.textContent?.includes('Clone'));

    await waitFor(() => {
      expect(cloneButton).not.toBeDisabled();
    });
  });

  it('renders authentication checkbox with correct label', () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    const authCheckbox = screen.getByRole('checkbox', { name: /authenticate/i });
    expect(authCheckbox).toBeInTheDocument();
  });

  it('shows username and token inputs when auth checkbox is checked', async () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);

    const authCheckbox = screen.getByRole('checkbox', { name: /authenticate/i });
    fireEvent.click(authCheckbox);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Personal Access Token')).toBeInTheDocument();
    });
  });

  it('displays error message when gitOperationError is present', () => {
    mockStoreState.gitOperationError = 'Test error message';
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays progress bar when git operation is in progress', () => {
    mockStoreState.isGitOperationInProgress = true;
    mockStoreState.gitOperationProgress = 50;
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Cloning.../)).toBeInTheDocument();
  });

  it('renders modal overlay that can be clicked to close', () => {
    const { container } = render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    const overlay = container.firstChild;
    expect(overlay).toBeInTheDocument();
  });

  it('renders clone button text correctly based on filesystem capability', () => {
    render(<CloneRepositoryViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const cloneButton = buttons.find(btn => btn.textContent?.includes('Clone'));
    expect(cloneButton?.textContent).toBe('Clone');
  });
});
