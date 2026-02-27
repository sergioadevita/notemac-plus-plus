import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AISettingsViewPresenter } from '../Notemac/UI/AISettingsViewPresenter';

vi.mock('../Notemac/Model/Store', () => ({
  useNotemacStore: vi.fn(),
}));
import { useNotemacStore } from '../Notemac/Model/Store';

vi.mock('../Notemac/Controllers/LLMController', () => ({
  TestProviderConnection: vi.fn(),
}));

vi.mock('../Shared/Helpers/IdHelpers', () => ({
  generateId: vi.fn(() => 'test-id-123'),
}));

vi.mock('../Notemac/Configs/AIConfig', () => ({
  CreateCustomProvider: vi.fn((_id: string, name: string, url: string, models: any[]) => ({
    id: _id, name, baseUrl: url, models, isBuiltIn: false,
  })),
  CreateCustomModel: vi.fn((_id: string, name: string, providerId: string) => ({
    id: _id, name, providerId,
  })),
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

describe('AISettingsViewPresenter', () => {
  let mockStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = {
      providers: [
        { id: 'openai', name: 'OpenAI', isBuiltIn: true, models: [{ id: 'gpt-4', name: 'GPT-4' }], baseUrl: 'https://api.openai.com' },
        { id: 'anthropic', name: 'Anthropic', isBuiltIn: true, models: [{ id: 'claude-3', name: 'Claude 3' }], baseUrl: 'https://api.anthropic.com' },
      ],
      credentials: [{ providerId: 'openai', apiKey: 'sk-test', rememberKey: false }],
      activeProviderId: 'openai',
      activeModelId: 'gpt-4',
      aiSettings: {
        inlineCompletionEnabled: true,
        inlineDebounceMs: 500,
        inlineMaxTokens: 256,
        codeTemperature: 0.3,
        chatTemperature: 0.7,
        maxContextTokens: 8000,
        systemPrompt: '',
        showAiStatusIndicator: true,
      },
      isRefreshingModels: false,
      SetActiveProvider: vi.fn(),
      SetActiveModel: vi.fn(),
      SetCredentialForProvider: vi.fn(),
      RemoveCredentialForProvider: vi.fn(),
      UpdateAISettings: vi.fn(),
      AddProvider: vi.fn(),
      RemoveProvider: vi.fn(),
      SetShowAiSettings: vi.fn(),
      SetAiEnabled: vi.fn(),
      RefreshProviderModels: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(useNotemacStore).mockReturnValue(mockStore as any);
  });

  describe('Modal rendering', () => {
    it('renders modal with "AI Settings" header', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('AI Settings')).toBeInTheDocument();
    });

    it('renders close button that calls SetShowAiSettings(false)', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      // The close button renders ✕ character
      const closeButton = screen.getByText('\u2715');
      fireEvent.click(closeButton);
      expect(mockStore.SetShowAiSettings).toHaveBeenCalledWith(false);
    });

    it('clicking overlay backdrop calls SetShowAiSettings(false)', () => {
      const { container } = render(<AISettingsViewPresenter theme={mockTheme} />);
      // The overlay is the outermost fixed div; clicking it (not child) triggers close
      const overlay = container.firstChild as HTMLElement;
      // Simulate click where target === currentTarget (the overlay itself)
      fireEvent.click(overlay);
      expect(mockStore.SetShowAiSettings).toHaveBeenCalledWith(false);
    });
  });

  describe('Tab navigation', () => {
    it('renders 4 tab buttons (providers, completion, chat, custom)', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('providers')).toBeInTheDocument();
      expect(screen.getByText('completion')).toBeInTheDocument();
      expect(screen.getByText('chat')).toBeInTheDocument();
      expect(screen.getByText('custom')).toBeInTheDocument();
    });

    it('providers tab is active by default and shows provider content', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Active Provider')).toBeInTheDocument();
    });
  });

  describe('Providers tab', () => {
    it('shows Active Provider dropdown with provider options', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Active Provider')).toBeInTheDocument();
      // Provider names appear in both the dropdown and the API keys section
      expect(screen.getAllByText('OpenAI').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Anthropic').length).toBeGreaterThan(0);
    });

    it('shows Active Model dropdown with GPT-4', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Active Model')).toBeInTheDocument();
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
    });

    it('shows Refresh button', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText(/Refresh/)).toBeInTheDocument();
    });

    it('shows API Keys section', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('API Keys')).toBeInTheDocument();
    });

    it('shows password inputs for API keys', () => {
      const { container } = render(<AISettingsViewPresenter theme={mockTheme} />);
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    it('shows Save and Test buttons per provider', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      const saveButtons = screen.getAllByText('Save');
      const testButtons = screen.getAllByText('Test');
      expect(saveButtons.length).toBeGreaterThan(0);
      expect(testButtons.length).toBeGreaterThan(0);
    });

    it('shows custom model ID input', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByPlaceholderText(/gpt-5/)).toBeInTheDocument();
    });

    it('shows "Remember key (encrypted)" checkbox labels', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      const labels = screen.getAllByText(/Remember key/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('shows Use button for custom model ID', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      expect(screen.getByText('Use')).toBeInTheDocument();
    });
  });

  describe('Completion tab', () => {
    it('shows inline completion checkbox', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('completion'));
      expect(screen.getByText(/inline code completions/i)).toBeInTheDocument();
    });

    it('shows debounce and max tokens inputs', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('completion'));
      expect(screen.getByText(/Debounce delay/)).toBeInTheDocument();
      expect(screen.getByText(/Max inline tokens/)).toBeInTheDocument();
    });

    it('shows code temperature slider', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('completion'));
      expect(screen.getByText(/Code temperature/)).toBeInTheDocument();
    });
  });

  describe('Chat tab', () => {
    it('shows system prompt textarea', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('chat'));
      expect(screen.getByPlaceholderText(/Leave empty/)).toBeInTheDocument();
    });

    it('shows AI status indicator checkbox', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('chat'));
      expect(screen.getByText(/AI status indicator/)).toBeInTheDocument();
    });

    it('shows chat temperature slider', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('chat'));
      expect(screen.getByText(/Chat temperature/)).toBeInTheDocument();
    });

    it('shows max context tokens input', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('chat'));
      expect(screen.getByText(/Max context tokens/)).toBeInTheDocument();
    });
  });

  describe('Custom tab', () => {
    it('shows Provider Name and Base URL inputs', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('custom'));
      expect(screen.getByPlaceholderText(/Ollama Local/)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/localhost:11434/)).toBeInTheDocument();
    });

    it('Add Provider button is disabled when inputs are empty', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('custom'));
      const addButton = screen.getByText('Add Provider');
      expect(addButton).toBeDisabled();
    });

    it('shows description about custom providers', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('custom'));
      expect(screen.getByText(/OpenAI-compatible/)).toBeInTheDocument();
    });

    it('shows custom providers list when present', () => {
      mockStore.providers.push({
        id: 'custom-1', name: 'My Custom', isBuiltIn: false,
        models: [], baseUrl: 'https://custom.com',
      });
      render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('custom'));
      expect(screen.getByText('Custom Providers')).toBeInTheDocument();
      expect(screen.getByText('My Custom')).toBeInTheDocument();
    });
  });

  describe('Store interactions', () => {
    it('changing active provider calls SetActiveProvider', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      const selects = screen.getAllByRole('combobox');
      // First select is Active Provider
      fireEvent.change(selects[0], { target: { value: 'anthropic' } });
      expect(mockStore.SetActiveProvider).toHaveBeenCalledWith('anthropic');
    });

    it('changing active model calls SetActiveModel', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      const selects = screen.getAllByRole('combobox');
      // Second select is Active Model
      fireEvent.change(selects[1], { target: { value: 'gpt-4' } });
      expect(mockStore.SetActiveModel).toHaveBeenCalledWith('gpt-4');
    });

    it('clicking Save on a provider calls SetCredentialForProvider', () => {
      render(<AISettingsViewPresenter theme={mockTheme} />);
      const saveButtons = screen.getAllByText('Save');
      // First Save button is for OpenAI (which has a key 'sk-test')
      fireEvent.click(saveButtons[0]);
      expect(mockStore.SetCredentialForProvider).toHaveBeenCalled();
    });

    it('toggling inline completion calls UpdateAISettings', () => {
      const { container } = render(<AISettingsViewPresenter theme={mockTheme} />);
      fireEvent.click(screen.getByText('completion'));
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);
      expect(mockStore.UpdateAISettings).toHaveBeenCalled();
    });
  });
});
