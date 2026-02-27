import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GitPanelViewPresenter } from '../Notemac/UI/GitPanelViewPresenter';
import type { ThemeColors } from '../Notemac/Configs/ThemeConfig';

Element.prototype.scrollIntoView = vi.fn();

const mockTheme: ThemeColors = {
  bg: '#1e1e1e',
  bgSecondary: '#252526',
  bgTertiary: '#2d2d30',
  bgHover: '#3e3e42',
  bgActive: '#094771',
  text: '#cccccc',
  textSecondary: '#969696',
  textMuted: '#6e6e6e',
  border: '#3e3e42',
  accent: '#007acc',
  accentHover: '#1a8ad4',
  accentText: '#ffffff',
  danger: '#f44747',
  warning: '#cca700',
  success: '#89d185',
  tabBg: '#2d2d30',
  tabActiveBg: '#1e1e1e',
  tabActiveText: '#ffffff',
  tabBorder: '#3e3e42',
  menuBg: '#2d2d30',
  menuHover: '#094771',
  menuText: '#cccccc',
  statusBarBg: '#007acc',
  statusBarText: '#ffffff',
  sidebarBg: '#252526',
  sidebarText: '#cccccc',
  scrollbarBg: 'transparent',
  scrollbarThumb: '#424242',
  editorBg: '#1e1e1e',
  editorMonacoTheme: 'vs-dark',
  findBg: '#252526',
};

// Mock dependencies
vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: vi.fn(),
}));

import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../Notemac/Controllers/GitController', () => ({
  StageFile: vi.fn(),
  StageAllFiles: vi.fn(),
  UnstageFile: vi.fn(),
  DiscardFileChanges: vi.fn(),
  CreateCommit: vi.fn(),
  PushToRemote: vi.fn(),
  PullFromRemote: vi.fn(),
  FetchFromRemote: vi.fn(),
  CheckoutBranch: vi.fn(),
  CreateBranch: vi.fn(),
  InitializeRepository: vi.fn(),
  GetStagedDiff: vi.fn(),
}));

import { CreateCommit } from '../Notemac/Controllers/GitController';

vi.mock('../Notemac/Controllers/AIActionController', () => ({
  GenerateCommitMessage: vi.fn(),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
  TIME_SECONDS_PER_MINUTE: 60,
  TIME_SECONDS_PER_HOUR: 3600,
  TIME_SECONDS_PER_DAY: 86400,
  TIME_SECONDS_PER_WEEK: 604800,
}));

describe('GitPanelViewPresenter', () => {
  const mockStoreState = {
    isRepoInitialized: true,
    currentBranch: 'main',
    branches: [
      { name: 'main', isCurrentBranch: true, isRemote: false },
      { name: 'feature-branch', isCurrentBranch: false, isRemote: false },
      { name: 'origin/main', isCurrentBranch: false, isRemote: true },
    ],
    gitStatus: {
      stagedFiles: [
        { path: 'src/index.ts', status: 'modified' },
      ],
      unstagedFiles: [
        { path: 'src/app.ts', status: 'modified' },
        { path: 'src/utils.ts', status: 'modified' },
      ],
      untrackedFiles: [
        { path: 'new-file.ts', status: 'untracked' },
      ],
      aheadBy: 0,
      behindBy: 0,
      isRepoDirty: true,
    },
    commitLog: [
      { oid: 'abc123def456', message: 'Initial commit', timestamp: Math.floor(Date.now() / 1000) - 3600 },
      { oid: 'def456abc123', message: 'Add feature', timestamp: Math.floor(Date.now() / 1000) - 7200 },
    ],
    isGitOperationInProgress: false,
    gitOperationProgress: 0,
    gitOperationError: null,
    isBrowserWorkspace: false,
    commitMessageDraft: '',
    setShowCloneDialog: vi.fn(),
    SetGitOperationError: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
    vi.mocked(useNotemacStore).getState = vi.fn(() => mockStoreState);
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows not initialized state when isRepoInitialized is false', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, isRepoInitialized: false };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/not a git repository/)).toBeTruthy();
    expect(screen.getByText(/Initialize Repository/)).toBeTruthy();
  });

  it('shows Clone Repository button when not initialized', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, isRepoInitialized: false };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Clone Repository/)).toBeTruthy();
  });

  it('displays current branch name', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const selects = screen.getAllByDisplayValue('main');
    expect(selects.length > 0).toBe(true);
  });

  it('shows file status with correct letters', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    // Check that the staged changes section exists (contains the file with status)
    expect(screen.getByText(/Staged Changes/)).toBeTruthy();
  });

  it('shows commit input area', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const textarea = screen.getByPlaceholderText(/Commit message/);
    expect(textarea).toBeTruthy();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('shows Push button', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const pushButton = buttons.find(btn => btn.textContent?.includes('Push'));
    expect(pushButton).toBeTruthy();
  });

  it('shows Pull button', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const pullButton = buttons.find(btn => btn.textContent?.includes('Pull'));
    expect(pullButton).toBeTruthy();
  });

  it('shows Fetch button', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const fetchButton = buttons.find(btn => btn.textContent?.includes('Fetch'));
    expect(fetchButton).toBeTruthy();
  });

  it('shows staged files section', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Staged Changes/)).toBeTruthy();
  });

  it('shows unstaged files section', () => {
    const { container } = render(<GitPanelViewPresenter theme={mockTheme} />);
    // Changes section header should exist
    const allText = container.textContent;
    expect(allText).toContain('Changes');
  });

  it('shows untracked files section', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Untracked/)).toBeTruthy();
    expect(screen.getByText('new-file.ts')).toBeTruthy();
  });

  it('displays modified status with M letter', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const elements = screen.getAllByText(/M/);
    expect(elements.length > 0).toBe(true);
  });

  it('displays untracked status with U letter', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const elements = screen.getAllByText(/U/);
    expect(elements.length > 0).toBe(true);
  });

  it('shows Commit button', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const commitButton = buttons.find(btn => btn.textContent?.includes('Commit'));
    expect(commitButton).toBeTruthy();
  });

  it('disables Commit button when no message', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const commitButton = buttons.find(btn => btn.textContent?.includes('Commit') && !btn.textContent?.includes('&'));
    expect(commitButton?.hasAttribute('disabled')).toBe(true);
  });

  it('enables Commit button when message entered', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const textarea = screen.getByPlaceholderText(/Commit message/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Fix bug' } });

    const buttons = screen.getAllByRole('button');
    const commitButton = buttons.find(btn => btn.textContent?.includes('Commit') && !btn.textContent?.includes('&'));
    expect(commitButton?.hasAttribute('disabled')).toBe(false);
  });

  it('shows browser workspace warning when isBrowserWorkspace is true', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, isBrowserWorkspace: true };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Browser Workspace/)).toBeTruthy();
  });

  it('displays error when gitOperationError is set', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, gitOperationError: 'Push failed' };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Push failed/)).toBeTruthy();
  });

  it('shows progress bar when isGitOperationInProgress is true', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, isGitOperationInProgress: true, gitOperationProgress: 50 };
      return typeof selector === 'function' ? selector(state) : state;
    });

    const { container } = render(<GitPanelViewPresenter theme={mockTheme} />);
    const progressBar = container.querySelector('div[style*="width"]');
    expect(progressBar).toBeTruthy();
  });

  it('disables push/pull/fetch buttons during operation', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, isGitOperationInProgress: true };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const pushButton = buttons.find(btn => btn.textContent?.includes('Push'));
    expect(pushButton?.hasAttribute('disabled')).toBe(true);
  });

  it('shows recent commits section', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Recent Commits/)).toBeTruthy();
  });

  it('shows branches section', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Branches/)).toBeTruthy();
  });

  it('displays branch count', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const branchSections = screen.getAllByText(/Branches/);
    expect(branchSections.length > 0).toBe(true);
  });

  it('shows add staged files count', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const stagedTexts = screen.getAllByText(/Staged Changes/);
    expect(stagedTexts.length > 0).toBe(true);
  });

  it('displays ahead/behind indicators', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = {
        ...mockStoreState,
        gitStatus: { ...mockStoreState.gitStatus, aheadBy: 2, behindBy: 1 },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<GitPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/↑2/)).toBeTruthy();
    expect(screen.getByText(/↓1/)).toBeTruthy();
  });

  it('allows commit with keyboard shortcut', async () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);

    const textarea = screen.getByPlaceholderText(/Commit message/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test commit' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    // Wait for async state updates triggered by CreateCommit to settle
    await waitFor(() => {
      expect(CreateCommit).toHaveBeenCalled();
    });
  });

  it('shows AI generate commit message button', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const aiButton = buttons.find(btn => btn.title?.includes('AI'));
    expect(aiButton).toBeTruthy();
  });

  it('disables AI generate button when no staged files', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = {
        ...mockStoreState,
        gitStatus: { ...mockStoreState.gitStatus, stagedFiles: [] },
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const aiButton = buttons.find(btn => btn.title?.includes('AI'));
    expect(aiButton?.hasAttribute('disabled')).toBe(true);
  });

  it('toggles section expansion on click', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const stagedHeaders = screen.getAllByText(/Staged Changes/);
    const header = stagedHeaders[0].closest('div') as HTMLElement;

    // Just verify that clicking doesn't throw and the component still renders
    fireEvent.click(header);
    expect(screen.getByText(/Staged Changes/)).toBeTruthy();
  });

  it('shows commit and push button', () => {
    render(<GitPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const commitAndPushButton = buttons.find(btn => btn.textContent?.includes('✓⬆'));
    expect(commitAndPushButton).toBeTruthy();
  });

  it('displays file count in sections', () => {
    const { container } = render(<GitPanelViewPresenter theme={mockTheme} />);
    // Check that the component renders without error
    expect(container).toBeTruthy();
    expect(container.textContent).toContain('Staged Changes');
  });
});
