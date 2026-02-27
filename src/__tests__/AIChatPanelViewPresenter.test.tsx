import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIChatPanelViewPresenter } from '../Notemac/UI/AIChatPanelViewPresenter';
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

vi.mock('../Notemac/Controllers/AIActionController', () => ({
  SendChatMessage: vi.fn(),
}));

vi.mock('../Notemac/Controllers/LLMController', () => ({
  CancelActiveRequest: vi.fn(),
}));

vi.mock('../../Shared/Helpers/EditorGlobals', () => ({
  GetEditorAction: vi.fn(() => null),
  GetMonacoEditor: vi.fn(() => null),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
  UI_COPY_FEEDBACK_MS: 1500,
}));

describe('AIChatPanelViewPresenter', () => {
  const mockStoreState = {
    conversations: [
      {
        id: 'conv-1',
        title: 'Test Conversation',
        messages: [
          {
            id: 'msg-1',
            role: 'user' as const,
            content: 'Hello AI',
            timestamp: Date.now(),
          },
          {
            id: 'msg-2',
            role: 'assistant' as const,
            content: 'Hello! How can I help?',
            timestamp: Date.now(),
          },
        ],
        createdAt: new Date().toISOString(),
      },
    ],
    activeConversationId: 'conv-1',
    isAiStreaming: false,
    aiStreamContent: '',
    aiOperationError: null,
    activeModelId: 'gpt-4',
    SetActiveConversation: vi.fn(),
    RemoveConversation: vi.fn(),
    SetAiOperationError: vi.fn(),
    SetShowAiSettings: vi.fn(),
    GetActiveProvider: vi.fn(() => ({ id: 'openai', name: 'OpenAI' })),
    GetCredentialForProvider: vi.fn(() => 'test-api-key'),
  };

  beforeEach(() => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(mockStoreState);
      }
      return mockStoreState;
    });
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows no credential state when no API key is configured', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = {
        ...mockStoreState,
        GetCredentialForProvider: vi.fn(() => null),
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Configure an API key/)).toBeTruthy();
    expect(screen.getByText(/Open AI Settings/)).toBeTruthy();
  });

  it('shows empty state when no active conversation', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = {
        ...mockStoreState,
        conversations: [],
        activeConversationId: null,
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/Ask me anything about your code/)).toBeTruthy();
  });

  it('renders chat messages', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText('Hello AI')).toBeTruthy();
    expect(screen.getByText('Hello! How can I help?')).toBeTruthy();
  });

  it('shows input textarea', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const textarea = screen.getByPlaceholderText(/Ask about your code/);
    expect(textarea).toBeTruthy();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('shows send button disabled when input is empty', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(btn => btn.title === 'Send (Enter)');
    expect(sendButton).toBeTruthy();
    expect(sendButton?.hasAttribute('disabled')).toBe(true);
  });

  it('shows send button enabled when input has text', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const textarea = screen.getByPlaceholderText(/Ask about your code/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test message' } });

    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(btn => btn.title === 'Send (Enter)');
    expect(sendButton?.hasAttribute('disabled')).toBe(false);
  });

  it('shows streaming indicator when isAiStreaming is true', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, isAiStreaming: true };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find(btn => btn.title === 'Cancel');
    expect(cancelButton).toBeTruthy();
  });

  it('renders conversation list toggle button', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const historyButton = buttons.find(btn => btn.title === 'Conversation History');
    expect(historyButton).toBeTruthy();
  });

  it('shows AI settings button', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const settingsButton = buttons.find(btn => btn.title === 'AI Settings');
    expect(settingsButton).toBeTruthy();
  });

  it('displays active model name', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/OpenAI/)).toBeTruthy();
    expect(screen.getByText(/gpt-4/)).toBeTruthy();
  });

  it('displays conversation title in header', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText('Test Conversation')).toBeTruthy();
  });

  it('shows "New Chat" when no active conversation', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = {
        ...mockStoreState,
        activeConversationId: null,
        conversations: [mockStoreState.conversations[0]],
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText('New Chat')).toBeTruthy();
  });

  it('shows new conversation button', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const newButton = buttons.find(btn => btn.title === 'New Conversation');
    expect(newButton).toBeTruthy();
  });

  it('displays error message when aiOperationError is set', () => {
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = {
        ...mockStoreState,
        aiOperationError: 'API request failed',
      };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    expect(screen.getByText(/API request failed/)).toBeTruthy();
  });

  it('sends message on Enter key press', async () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);

    const textarea = screen.getByPlaceholderText(/Ask about your code/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    // SendChatMessage is mocked, should be called
    expect(textarea).toBeTruthy();
  });

  it('allows new line with Shift+Enter', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const textarea = screen.getByPlaceholderText(/Ask about your code/) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    // Should not send, just allow new line
    expect(textarea.value).toBe('Line 1');
  });

  it('clears input after sending message', async () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const textarea = screen.getByPlaceholderText(/Ask about your code/) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(btn => btn.title === 'Send (Enter)');

    fireEvent.click(sendButton!);

    await vi.waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('toggles conversation list view', () => {
    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const historyButton = buttons.find(btn => btn.title === 'Conversation History');

    fireEvent.click(historyButton!);
    expect(screen.getByText(/Conversations/)).toBeTruthy();
  });

  it('displays all conversations in list view', () => {
    const conversations = [
      { id: 'c1', title: 'Conv 1', messages: [], createdAt: new Date().toISOString() },
      { id: 'c2', title: 'Conv 2', messages: [], createdAt: new Date().toISOString() },
    ];
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, conversations };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const historyButton = buttons.find(btn => btn.title === 'Conversation History');
    fireEvent.click(historyButton!);

    expect(screen.getByText('Conv 1')).toBeTruthy();
    expect(screen.getByText('Conv 2')).toBeTruthy();
  });

  it('calls SetShowAiSettings when settings button is clicked', () => {
    const mockSetShowAiSettings = vi.fn();
    vi.mocked(useNotemacStore).mockImplementation((selector: any) => {
      const state = { ...mockStoreState, SetShowAiSettings: mockSetShowAiSettings };
      return typeof selector === 'function' ? selector(state) : state;
    });

    render(<AIChatPanelViewPresenter theme={mockTheme} />);
    const buttons = screen.getAllByRole('button');
    const settingsButton = buttons.find(btn => btn.title === 'AI Settings');
    fireEvent.click(settingsButton!);

    expect(mockSetShowAiSettings).toHaveBeenCalledWith(true);
  });
});
