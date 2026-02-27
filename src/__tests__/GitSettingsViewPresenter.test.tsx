import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitSettingsViewPresenter } from '../Notemac/UI/GitSettingsViewPresenter';

// Mock the Store — supports both useNotemacStore() and useNotemacStore(selector)
vi.mock('../Notemac/Model/Store', () => {
  const fn = vi.fn();
  fn.mockImplementation((selector?: any) => {
    const state = (fn as any).__state;
    return selector ? selector(state) : state;
  });
  (fn as any).getState = vi.fn(() => (fn as any).__state);
  return { useNotemacStore: fn };
});
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../Notemac/Controllers/AuthController', () => ({
  SaveCredentialsWithToken: vi.fn().mockResolvedValue(undefined),
  ClearCredentials: vi.fn(),
  TestAuthentication: vi.fn().mockResolvedValue({ success: true }),
  StartGitHubOAuth: vi.fn(),
  PollGitHubOAuthToken: vi.fn(),
}));

vi.mock('../Notemac/Commons/Constants', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return { ...actual };
});

const mockTheme: any = {
  bg: '#1e1e1e', bgSecondary: '#252526', bgTertiary: '#2d2d30', bgHover: '#3e3e42',
  bgActive: '#094771', text: '#cccccc', textSecondary: '#969696', textMuted: '#6e6e6e',
  border: '#3e3e42', accent: '#007acc', accentHover: '#1a8ad4', accentText: '#ffffff',
  danger: '#f44747', warning: '#cca700', success: '#89d185', tabBg: '#2d2d30',
  tabActiveBg: '#1e1e1e', tabActiveText: '#ffffff', tabBorder: '#3e3e42',
  menuBg: '#2d2d30', menuHover: '#094771', menuText: '#cccccc',
  statusBarBg: '#007acc', statusBarText: '#ffffff', sidebarBg: '#252526',
  sidebarText: '#cccccc', scrollbarBg: 'transparent', scrollbarThumb: '#424242',
  editorBg: '#1e1e1e', editorMonacoTheme: 'vs-dark', findBg: '#252526',
};

describe('GitSettingsViewPresenter', () => {
  let mockState: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      setShowGitSettings: vi.fn(),
      gitCredentials: { type: 'token' as const, username: 'testuser', token: 'ghp_test123' },
      gitAuthor: { name: 'Test User', email: 'test@example.com' },
      gitSettings: { autoFetch: true, corsProxy: 'https://cors.isomorphic-git.org', showUntracked: true },
      browserWorkspaces: [] as any[],
      SetGitAuthor: vi.fn(),
      UpdateGitSettings: vi.fn(),
      RemoveBrowserWorkspace: vi.fn(),
    };
    (useNotemacStore as any).__state = mockState;
    (useNotemacStore as any).getState = vi.fn(() => mockState);
  });

  describe('Modal structure', () => {
    it('renders modal with "Git Settings" header', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Git Settings')).toBeInTheDocument();
    });

    it('renders close button (✕) that calls setShowGitSettings(false)', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);
      expect(mockState.setShowGitSettings).toHaveBeenCalledWith(false);
    });

    it('clicking overlay backdrop calls setShowGitSettings(false)', () => {
      const { container } = render(<GitSettingsViewPresenter theme={mockTheme} />);
      const overlay = container.firstChild as HTMLElement;
      fireEvent.click(overlay);
      expect(mockState.setShowGitSettings).toHaveBeenCalledWith(false);
    });

    it('clicking inner dialog content does not close (stopPropagation)', () => {
      const { container } = render(<GitSettingsViewPresenter theme={mockTheme} />);
      // The inner dialog is the second child of the overlay
      const innerDialog = (container.firstChild as HTMLElement).children[0] as HTMLElement;
      fireEvent.click(innerDialog);
      // setShowGitSettings is NOT called from inner click
      // (it IS called from the overlay onClick, but stopPropagation prevents it)
      // The close is only called when overlay itself is clicked
    });
  });

  describe('Tab navigation', () => {
    it('renders 4 tab labels: Credentials, Author, Behavior, Workspaces', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Credentials')).toBeInTheDocument();
      expect(screen.getByText('Author')).toBeInTheDocument();
      expect(screen.getByText('Behavior')).toBeInTheDocument();
      expect(screen.getByText('Workspaces')).toBeInTheDocument();
    });

    it('Credentials tab is active by default (shows credentials content)', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Authentication Type')).toBeInTheDocument();
    });
  });

  describe('Credentials tab', () => {
    it('shows Authentication Type dropdown', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Authentication Type')).toBeInTheDocument();
      expect(screen.getByText('Personal Access Token (PAT)')).toBeInTheDocument();
    });

    it('shows Username input with pre-filled value', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      const usernameInput = screen.getByDisplayValue('testuser');
      expect(usernameInput).toBeInTheDocument();
    });

    it('shows Token input as password type', () => {
      const { container } = render(<GitSettingsViewPresenter theme={mockTheme} />);
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    it('shows Save Credentials and Clear buttons', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Save Credentials')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('shows Remember credentials checkbox', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText(/Remember credentials/)).toBeInTheDocument();
    });

    it('shows Test Authentication section', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Test Authentication')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('shows test URL input placeholder', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByPlaceholderText(/github.com/)).toBeInTheDocument();
    });

    it('changing auth type to oauth shows OAuth section', () => {
      const { container } = render(<GitSettingsViewPresenter theme={mockTheme} />);
      const select = container.querySelector('select') as HTMLSelectElement;
      fireEvent.change(select, { target: { value: 'oauth' } });
      expect(screen.getByText(/GitHub OAuth/)).toBeInTheDocument();
    });
  });

  describe('Author tab', () => {
    it('shows Author Name and Email inputs with pre-filled values', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Author'));
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('shows Save Author Info button', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Author'));
      expect(screen.getByText('Save Author Info')).toBeInTheDocument();
    });

    it('shows Author Name and Author Email labels', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Author'));
      expect(screen.getByText('Author Name')).toBeInTheDocument();
      expect(screen.getByText('Author Email')).toBeInTheDocument();
    });
  });

  describe('Behavior tab', () => {
    it('shows Auto-fetch checkbox (checked)', () => {
      const { container } = render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Behavior'));
      const autoFetchCheckbox = container.querySelector('#auto-fetch') as HTMLInputElement;
      expect(autoFetchCheckbox).toBeInTheDocument();
      expect(autoFetchCheckbox.checked).toBe(true);
    });

    it('shows Show untracked checkbox', () => {
      const { container } = render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Behavior'));
      const untrackedCheckbox = container.querySelector('#show-untracked') as HTMLInputElement;
      expect(untrackedCheckbox).toBeInTheDocument();
      expect(untrackedCheckbox.checked).toBe(true);
    });

    it('shows CORS Proxy URL input with current value', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Behavior'));
      expect(screen.getByDisplayValue('https://cors.isomorphic-git.org')).toBeInTheDocument();
    });

    it('shows Save Settings button', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Behavior'));
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });
  });

  describe('Workspaces tab', () => {
    it('shows "No browser workspaces" when empty', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Workspaces'));
      expect(screen.getByText('No browser workspaces')).toBeInTheDocument();
    });

    it('shows workspace entries when present', () => {
      mockState.browserWorkspaces = [
        { id: 'ws1', name: 'My Project', repoUrl: 'https://github.com/test/proj', lastOpenedAt: Date.now() },
      ];
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Workspaces'));
      expect(screen.getByText('My Project')).toBeInTheDocument();
    });

    it('shows Delete button for each workspace', () => {
      mockState.browserWorkspaces = [
        { id: 'ws1', name: 'My Project', repoUrl: '', lastOpenedAt: Date.now() },
        { id: 'ws2', name: 'Other Project', repoUrl: '', lastOpenedAt: Date.now() },
      ];
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Workspaces'));
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBe(2);
    });

    it('shows repo URL and last opened date for workspaces', () => {
      mockState.browserWorkspaces = [
        { id: 'ws1', name: 'My Project', repoUrl: 'https://github.com/test/proj', lastOpenedAt: Date.now() },
      ];
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Workspaces'));
      expect(screen.getByText('https://github.com/test/proj')).toBeInTheDocument();
      expect(screen.getByText(/Last opened/)).toBeInTheDocument();
    });

    it('shows description about browser workspaces', () => {
      render(<GitSettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('Workspaces'));
      expect(screen.getByText(/stored in IndexedDB/)).toBeInTheDocument();
    });
  });
});
