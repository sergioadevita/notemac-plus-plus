import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FeedbackPopup } from '../Notemac/UI/FeedbackPopupViewPresenter';
import { useFocusTrap } from '../Notemac/UI/hooks/useFocusTrap';

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

vi.mock('../Notemac/UI/hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../Notemac/Commons/Constants', () => ({
  UI_ZINDEX_MODAL: 9999,
  APP_VERSION: '1.0.0-test',
}));

describe('FeedbackPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should render nothing initially', () => {
    render(<FeedbackPopup theme={mockTheme} />);

    expect(screen.queryByText("Hey, you're still here!")).not.toBeInTheDocument();
  });

  it('should not show popup when localStorage has current version', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('1.0.0-test');

    render(<FeedbackPopup theme={mockTheme} />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(screen.queryByText("Hey, you're still here!")).not.toBeInTheDocument();
  });

  it('should show popup after 20 minutes timer when version is not in localStorage', () => {
    render(<FeedbackPopup theme={mockTheme} />);

    expect(screen.queryByText("Hey, you're still here!")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(screen.getByText("Hey, you're still here!")).toBeInTheDocument();
  });

  it('should display popup with octopus emoji and title', () => {
    render(<FeedbackPopup theme={mockTheme} />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(screen.getByText("Hey, you're still here!")).toBeInTheDocument();
    expect(screen.getByText(/dedication or a really nasty bug/)).toBeInTheDocument();
  });

  it('should render all 4 action links with correct labels', () => {
    render(<FeedbackPopup theme={mockTheme} />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(screen.getByText('Open an issue')).toBeInTheDocument();
    expect(screen.getByText('Share on X')).toBeInTheDocument();
    expect(screen.getByText('Share via email')).toBeInTheDocument();
    expect(screen.getByText('Buy me a coffee')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    links.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('should close popup when close button is clicked', () => {
    render(<FeedbackPopup theme={mockTheme} />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    const closeButton = screen.getByText("Maybe later — I'm in the zone");
    expect(closeButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(closeButton);
    });

    expect(screen.queryByText("Hey, you're still here!")).not.toBeInTheDocument();
  });

  it('should close popup when overlay is clicked', () => {
    const { container } = render(<FeedbackPopup theme={mockTheme} />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(screen.getByText("Hey, you're still here!")).toBeInTheDocument();

    const overlay = container.querySelector('.dialog-overlay');
    expect(overlay).toBeInTheDocument();

    act(() => {
      fireEvent.click(overlay!);
    });

    expect(screen.queryByText("Hey, you're still here!")).not.toBeInTheDocument();
  });

  it('should set localStorage when popup is shown', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<FeedbackPopup theme={mockTheme} />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      'notemac_feedback_shown_version',
      '1.0.0-test'
    );
  });

  it('should call useFocusTrap with correct arguments when visible', () => {
    render(<FeedbackPopup theme={mockTheme} />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(useFocusTrap).toHaveBeenCalled();
  });
});
