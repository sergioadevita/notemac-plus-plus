import { useState, useRef, useMemo, useCallback } from 'react';
import { useNotemacStore } from "../Model/Store";
import type { ThemeColors } from "../Configs/ThemeConfig";
import { GetTheme, themeColorGroups } from "../Configs/ThemeConfig";
import { useFocusTrap } from './hooks/useFocusTrap';

interface SettingsDialogProps {
  theme: ThemeColors;
}

function useStyles(theme: ThemeColors) {
  return useMemo(() => ({
    fieldContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
    } as React.CSSProperties,
    fieldLabel: {
      color: theme.text,
      fontSize: 13,
    } as React.CSSProperties,
    selectInput: {
      backgroundColor: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 4,
      padding: '4px 8px',
      fontSize: 13,
      minWidth: 160,
    } as React.CSSProperties,
    numberInput: {
      backgroundColor: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: 4,
      padding: '4px 8px',
      fontSize: 13,
      width: 80,
      textAlign: 'center',
    } as React.CSSProperties,
    checkboxContainer: {
      padding: '8px 0',
    } as React.CSSProperties,
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
    } as React.CSSProperties,
    checkboxInput: {
      accentColor: theme.accent,
      width: 16,
      height: 16,
    } as React.CSSProperties,
    checkboxLabelText: {
      color: theme.text,
      fontSize: 13,
    } as React.CSSProperties,
    checkboxDescription: {
      color: theme.textMuted,
      fontSize: 12,
      marginTop: 2,
    } as React.CSSProperties,
    sectionHeader: {
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.textSecondary,
      padding: '16px 0 8px',
      borderBottom: `1px solid ${theme.border}`,
      marginBottom: 8,
    } as React.CSSProperties,
    dialogOverlay: {
      className: 'dialog-overlay',
    },
    dialogMain: {
      backgroundColor: theme.bgSecondary,
      border: `1px solid ${theme.border}`,
      width: 650,
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
    } as React.CSSProperties,
    dialogHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    } as React.CSSProperties,
    dialogTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 600,
    } as React.CSSProperties,
    closeButton: {
      cursor: 'pointer',
      color: theme.textMuted,
      fontSize: 20,
    } as React.CSSProperties,
    contentWrapper: {
      display: 'flex',
      flex: 1,
      gap: 16,
      overflow: 'hidden',
    } as React.CSSProperties,
    sidebarNav: {
      width: 140,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    } as React.CSSProperties,
    sidebarItem: (isActive: boolean) => ({
      padding: '8px 12px',
      cursor: 'pointer',
      borderRadius: 6,
      fontSize: 13,
      backgroundColor: isActive ? theme.bgHover : 'transparent',
      color: isActive ? theme.text : theme.textSecondary,
      fontWeight: isActive ? 600 : 400,
    } as React.CSSProperties),
    settingsContent: {
      flex: 1,
      overflow: 'auto',
      paddingRight: 8,
    } as React.CSSProperties,
    keybindingsContainer: {
      color: theme.textSecondary,
      fontSize: 13,
    } as React.CSSProperties,
    keybindingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: `1px solid ${theme.border}`,
    } as React.CSSProperties,
    keybindingKbd: {
      backgroundColor: theme.bgTertiary,
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 12,
      fontFamily: '-apple-system, system-ui, sans-serif',
      border: `1px solid ${theme.border}`,
    } as React.CSSProperties,
  }), [theme]);
}

function AppearanceSection({ theme }: { theme: ThemeColors }) {
  const { settings, updateSettings } = useNotemacStore();
  const isCustom = settings.theme === 'custom';
  const baseName = isCustom ? settings.customThemeBase : settings.theme;
  const baseTheme = GetTheme(baseName);
  const overrideCount = Object.keys(settings.customThemeColors).filter(
    k => (settings.customThemeColors as Record<string, string | undefined>)[k] !== undefined
  ).length;

  const handleThemeChange = useCallback((value: string) => {
    if (value === 'custom') {
      updateSettings({
        theme: 'custom' as any,
        customThemeBase: settings.theme as any,
        customThemeColors: {},
      });
    } else {
      updateSettings({
        theme: value as any,
        customThemeColors: {},
      });
    }
  }, [settings.theme, updateSettings]);

  const handleColorChange = useCallback((key: string, color: string) => {
    const newColors = { ...settings.customThemeColors, [key]: color };
    if (!isCustom) {
      updateSettings({
        theme: 'custom' as any,
        customThemeBase: settings.theme as any,
        customThemeColors: newColors,
      });
    } else {
      updateSettings({ customThemeColors: newColors });
    }
  }, [isCustom, settings.theme, settings.customThemeColors, updateSettings]);

  const handleResetColor = useCallback((key: string) => {
    const newColors = { ...settings.customThemeColors };
    delete (newColors as Record<string, string | undefined>)[key];
    const remaining = Object.keys(newColors).filter(
      k => (newColors as Record<string, string | undefined>)[k] !== undefined
    ).length;
    if (remaining === 0) {
      updateSettings({
        theme: settings.customThemeBase as any,
        customThemeColors: {},
      });
    } else {
      updateSettings({ customThemeColors: newColors });
    }
  }, [settings.customThemeBase, settings.customThemeColors, updateSettings]);

  const handleResetAll = useCallback(() => {
    updateSettings({
      theme: settings.customThemeBase as any,
      customThemeColors: {},
    });
  }, [settings.customThemeBase, updateSettings]);

  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: theme.textSecondary, padding: '16px 0 8px', borderBottom: `1px solid ${theme.border}`, marginBottom: 8 }}>
        Theme
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
        <label style={{ color: theme.text, fontSize: 13 }}>Color Theme</label>
        <select
          value={settings.theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, minWidth: 160 }}
        >
          <option value="mac-glass">Mac Glass (Default)</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="monokai">Monokai</option>
          <option value="dracula">Dracula</option>
          <option value="solarized-dark">Solarized Dark</option>
          <option value="solarized-light">Solarized Light</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {isCustom && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <label style={{ color: theme.text, fontSize: 13 }}>Base Theme</label>
          <select
            value={settings.customThemeBase}
            onChange={(e) => updateSettings({ customThemeBase: e.target.value as any })}
            style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, minWidth: 160 }}
          >
            <option value="mac-glass">Mac Glass</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="monokai">Monokai</option>
            <option value="dracula">Dracula</option>
            <option value="solarized-dark">Solarized Dark</option>
            <option value="solarized-light">Solarized Light</option>
          </select>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: theme.textSecondary, padding: '16px 0 8px', borderBottom: `1px solid ${theme.border}`, marginBottom: 8 }}>
        Font
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
        <label style={{ color: theme.text, fontSize: 13 }}>Font Size</label>
        <input type="number" value={settings.fontSize} min={8} max={32} onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
          style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, width: 80, textAlign: 'center' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
        <label style={{ color: theme.text, fontSize: 13 }}>Font Family</label>
        <select value={settings.fontFamily} onChange={(e) => updateSettings({ fontFamily: e.target.value })}
          style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, minWidth: 160 }}>
          <option value="'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace">SF Mono</option>
          <option value="'Menlo', 'Monaco', 'Courier New', monospace">Menlo</option>
          <option value="'Fira Code', 'SF Mono', monospace">Fira Code</option>
          <option value="'JetBrains Mono', 'SF Mono', monospace">JetBrains Mono</option>
          <option value="'Source Code Pro', 'SF Mono', monospace">Source Code Pro</option>
          <option value="'Courier New', monospace">Courier New</option>
        </select>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: theme.textSecondary, padding: '16px 0 8px', borderBottom: `1px solid ${theme.border}`, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Theme Colors</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {overrideCount > 0 && (
            <>
              <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: theme.accent }}>{overrideCount} color{overrideCount !== 1 ? 's' : ''} customized</span>
              <button onClick={handleResetAll} style={{ fontSize: 11, background: 'none', border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.textSecondary, cursor: 'pointer', padding: '2px 8px', textTransform: 'none', letterSpacing: 0 }}>Reset All</button>
            </>
          )}
        </span>
      </div>

      {themeColorGroups.map((group) => (
        <div key={group.label} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, marginBottom: 6, paddingTop: 4 }}>{group.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            {group.keys.map(({ key, label }) => {
              const colorKey = key as string;
              const overrideValue = (settings.customThemeColors as Record<string, string | undefined>)[colorKey];
              const displayValue = overrideValue || (baseTheme as unknown as Record<string, string>)[colorKey] || '#000000';
              const isOverridden = overrideValue !== undefined;

              return (
                <div key={colorKey} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }} data-testid={`color-picker-${colorKey}`}>
                  <input
                    type="color"
                    value={displayValue}
                    onChange={(e) => handleColorChange(colorKey, e.target.value)}
                    style={{ width: 24, height: 24, border: `1px solid ${theme.border}`, borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none' }}
                    data-testid={`color-input-${colorKey}`}
                  />
                  <span style={{ fontSize: 11, color: isOverridden ? theme.text : theme.textSecondary, flex: 1 }}>{label}</span>
                  {isOverridden && (
                    <button
                      onClick={() => handleResetColor(colorKey)}
                      data-testid={`color-reset-${colorKey}`}
                      style={{ fontSize: 12, background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
                      title="Reset to base theme"
                    >
                      {'\u00d7'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function SettingsDialog({ theme }: SettingsDialogProps) {
  const { settings, updateSettings, setShowSettings } = useNotemacStore();
  const [activeSection, setActiveSection] = useState('general');
  const dialogRef = useRef<HTMLDivElement>(null);
  const styles = useStyles(theme);

  useFocusTrap(dialogRef, true, () => setShowSettings(false));

  const sections = [
    { id: 'general', label: 'General' },
    { id: 'editor', label: 'Editor' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'advanced', label: 'Advanced' },
    { id: 'keybindings', label: 'Keybindings' },
  ];

  const SelectField = <T extends string>({ label, value, options, onChange }: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
  }) => (
    <div style={styles.fieldContainer}>
      <label style={styles.fieldLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={styles.selectInput}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const NumberField = ({ label, value, min, max, step, onChange }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
  }) => (
    <div style={styles.fieldContainer}>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step || 1}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={styles.numberInput}
      />
    </div>
  );

  const CheckboxField = ({ label, checked, onChange, description }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
  }) => (
    <div style={styles.checkboxContainer}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={styles.checkboxInput}
        />
        <div>
          <div style={styles.checkboxLabelText}>{label}</div>
          {description && (
            <div style={styles.checkboxDescription}>{description}</div>
          )}
        </div>
      </label>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={styles.sectionHeader}>
      {title}
    </div>
  );

  return (
    <div className="dialog-overlay" onClick={() => setShowSettings(false)}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        style={styles.dialogMain}
      >
        {/* Header */}
        <div style={styles.dialogHeader}>
          <h2 id="settings-title" style={styles.dialogTitle}>Preferences</h2>
          <span
            onClick={() => setShowSettings(false)}
            style={styles.closeButton}
          >
            {'\u00d7'}
          </span>
        </div>

        <div style={styles.contentWrapper}>
          {/* Section tabs */}
          <div style={styles.sidebarNav}>
            {sections.map(section => (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={styles.sidebarItem(activeSection === section.id)}
              >
                {section.label}
              </div>
            ))}
          </div>

          {/* Settings content */}
          <div style={styles.settingsContent}>
            {activeSection === 'general' && (
              <>
                <SectionHeader title="General Settings" />
                <CheckboxField
                  label="Auto Save"
                  checked={settings.autoSave}
                  onChange={(v) => updateSettings({ autoSave: v })}
                  description="Automatically save files after changes"
                />
                {settings.autoSave && (
                  <NumberField
                    label="Auto Save Delay (ms)"
                    value={settings.autoSaveDelay}
                    min={1000}
                    max={60000}
                    step={1000}
                    onChange={(v) => updateSettings({ autoSaveDelay: v })}
                  />
                )}
                <NumberField
                  label="Tab Size"
                  value={settings.tabSize}
                  min={1}
                  max={8}
                  onChange={(v) => updateSettings({ tabSize: v })}
                />
                <CheckboxField
                  label="Insert Spaces for Tabs"
                  checked={settings.insertSpaces}
                  onChange={(v) => updateSettings({ insertSpaces: v })}
                />
                <CheckboxField
                  label="Auto Indent"
                  checked={settings.autoIndent}
                  onChange={(v) => updateSettings({ autoIndent: v })}
                  description="Automatically indent new lines"
                />
                <CheckboxField
                  label="Remember Last Session"
                  checked={settings.rememberLastSession}
                  onChange={(v) => updateSettings({ rememberLastSession: v })}
                  description="Restore open files when relaunching"
                />
                <SelectField
                  label="Date/Time Format"
                  value={settings.dateTimeFormat}
                  options={[
                    { value: 'locale', label: 'Locale Default' },
                    { value: 'iso', label: 'ISO 8601' },
                    { value: 'us', label: 'US (MM/DD/YYYY)' },
                    { value: 'eu', label: 'EU (DD/MM/YYYY)' },
                  ]}
                  onChange={(v) => updateSettings({ dateTimeFormat: v })}
                />
              </>
            )}

            {activeSection === 'editor' && (
              <>
                <SectionHeader title="Editor Behavior" />
                <CheckboxField
                  label="Word Wrap"
                  checked={settings.wordWrap}
                  onChange={(v) => updateSettings({ wordWrap: v })}
                />
                <CheckboxField
                  label="Match Brackets"
                  checked={settings.matchBrackets}
                  onChange={(v) => updateSettings({ matchBrackets: v })}
                />
                <CheckboxField
                  label="Auto Close Brackets"
                  checked={settings.autoCloseBrackets}
                  onChange={(v) => updateSettings({ autoCloseBrackets: v })}
                />
                <CheckboxField
                  label="Auto Close Quotes"
                  checked={settings.autoCloseQuotes}
                  onChange={(v) => updateSettings({ autoCloseQuotes: v })}
                />
                <CheckboxField
                  label="Highlight Current Line"
                  checked={settings.highlightCurrentLine}
                  onChange={(v) => updateSettings({ highlightCurrentLine: v })}
                />
                <CheckboxField
                  label="Smooth Scrolling"
                  checked={settings.smoothScrolling}
                  onChange={(v) => updateSettings({ smoothScrolling: v })}
                />

                <SectionHeader title="Display" />
                <CheckboxField
                  label="Show Line Numbers"
                  checked={settings.showLineNumbers}
                  onChange={(v) => updateSettings({ showLineNumbers: v })}
                />
                <CheckboxField
                  label="Show Minimap"
                  checked={settings.showMinimap}
                  onChange={(v) => updateSettings({ showMinimap: v })}
                />
                <CheckboxField
                  label="Show Indent Guides"
                  checked={settings.showIndentGuides}
                  onChange={(v) => updateSettings({ showIndentGuides: v })}
                />
                <CheckboxField
                  label="Show End of Line Characters"
                  checked={settings.showEOL}
                  onChange={(v) => updateSettings({ showEOL: v })}
                />
                <SelectField
                  label="Render Whitespace"
                  value={settings.renderWhitespace}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'boundary', label: 'Boundary' },
                    { value: 'selection', label: 'Selection' },
                    { value: 'trailing', label: 'Trailing' },
                    { value: 'all', label: 'All' },
                  ]}
                  onChange={(v) => updateSettings({ renderWhitespace: v })}
                />
                <SelectField
                  label="Cursor Style"
                  value={settings.cursorStyle}
                  options={[
                    { value: 'line', label: 'Line' },
                    { value: 'block', label: 'Block' },
                    { value: 'underline', label: 'Underline' },
                  ]}
                  onChange={(v) => updateSettings({ cursorStyle: v })}
                />
                <SelectField
                  label="Cursor Blinking"
                  value={settings.cursorBlinking}
                  options={[
                    { value: 'blink', label: 'Blink' },
                    { value: 'smooth', label: 'Smooth' },
                    { value: 'phase', label: 'Phase' },
                    { value: 'expand', label: 'Expand' },
                    { value: 'solid', label: 'Solid' },
                  ]}
                  onChange={(v) => updateSettings({ cursorBlinking: v })}
                />
              </>
            )}

            {activeSection === 'appearance' && (
              <AppearanceSection theme={theme} />
            )}

            {activeSection === 'advanced' && (
              <>
                <SectionHeader title="Advanced Settings" />
                <CheckboxField
                  label="Virtual Space"
                  checked={settings.virtualSpace}
                  onChange={(v) => updateSettings({ virtualSpace: v })}
                  description="Allow cursor to move beyond end of line"
                />
                <CheckboxField
                  label="Always on Top"
                  checked={settings.alwaysOnTop}
                  onChange={(v) => {
                    updateSettings({ alwaysOnTop: v });
                    if (window.electronAPI) window.electronAPI.setAlwaysOnTop?.(v);
                  }}
                  description="Keep window above all other windows"
                />
                <CheckboxField
                  label="Distraction-Free Mode"
                  checked={settings.distractionFreeMode}
                  onChange={(v) => updateSettings({ distractionFreeMode: v })}
                  description="Hide all chrome for focused editing"
                />
                <CheckboxField
                  label="Sync Scroll (Vertical)"
                  checked={settings.syncScrollVertical}
                  onChange={(v) => updateSettings({ syncScrollVertical: v })}
                  description="Sync vertical scroll in split view"
                />
                <CheckboxField
                  label="Sync Scroll (Horizontal)"
                  checked={settings.syncScrollHorizontal}
                  onChange={(v) => updateSettings({ syncScrollHorizontal: v })}
                  description="Sync horizontal scroll in split view"
                />
                <CheckboxField
                  label="Show Non-Printable Characters"
                  checked={settings.showNonPrintable}
                  onChange={(v) => updateSettings({ showNonPrintable: v })}
                />
                <CheckboxField
                  label="Show Wrap Symbol"
                  checked={settings.showWrapSymbol}
                  onChange={(v) => updateSettings({ showWrapSymbol: v })}
                  description="Show a visual indicator where lines wrap"
                />
                <SelectField
                  label="Search Engine"
                  value={settings.searchEngine}
                  options={[
                    { value: 'google', label: 'Google' },
                    { value: 'bing', label: 'Bing' },
                    { value: 'duckduckgo', label: 'DuckDuckGo' },
                    { value: 'yahoo', label: 'Yahoo' },
                  ]}
                  onChange={(v) => updateSettings({ searchEngine: v })}
                />
              </>
            )}

            {activeSection === 'keybindings' && (
              <>
                <SectionHeader title="Keyboard Shortcuts" />
                <div style={styles.keybindingsContainer}>
                  {[
                    { key: '\u2318N', desc: 'New File' },
                    { key: '\u2318O', desc: 'Open File' },
                    { key: '\u2318S', desc: 'Save' },
                    { key: '\u2318\u21e7S', desc: 'Save As' },
                    { key: '\u2318W', desc: 'Close Tab' },
                    { key: '\u2318F', desc: 'Find' },
                    { key: '\u2318H', desc: 'Replace' },
                    { key: '\u2318\u21e7F', desc: 'Find in Files' },
                    { key: '\u2318G', desc: 'Go to Line' },
                    { key: '\u2318D', desc: 'Duplicate Line' },
                    { key: '\u2318/', desc: 'Toggle Comment' },
                    { key: '\u2318B', desc: 'Toggle Sidebar' },
                    { key: '\u2318,', desc: 'Preferences' },
                    { key: '\u2318+', desc: 'Zoom In' },
                    { key: '\u2318-', desc: 'Zoom Out' },
                    { key: '\u23180', desc: 'Reset Zoom' },
                    { key: '\u2318\u21e7R', desc: 'Start/Stop Macro Recording' },
                    { key: '\u2318\u21e7P', desc: 'Playback Macro' },
                    { key: '\u2318F2', desc: 'Toggle Bookmark' },
                    { key: 'F2', desc: 'Next Bookmark' },
                    { key: '\u21e7F2', desc: 'Previous Bookmark' },
                    { key: '\u2325\u2191', desc: 'Move Line Up' },
                    { key: '\u2325\u2193', desc: 'Move Line Down' },
                  ].map((binding) => (
                    <div key={`binding-${binding.key}`} style={styles.keybindingRow}>
                      <span>{binding.desc}</span>
                      <kbd style={styles.keybindingKbd}>
                        {binding.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
