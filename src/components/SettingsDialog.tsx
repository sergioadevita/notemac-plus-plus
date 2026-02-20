import { useState, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { ThemeColors } from '../utils/themes';
import { getTheme, themeColorGroups } from '../utils/themes';

interface SettingsDialogProps {
  theme: ThemeColors;
}

export function SettingsDialog({ theme }: SettingsDialogProps) {
  const { settings, updateSettings, setShowSettings } = useEditorStore();
  const [activeSection, setActiveSection] = useState('general');

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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <label style={{ color: theme.text, fontSize: 13 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          backgroundColor: theme.bg,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: 13,
          minWidth: 160,
        }}
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <label style={{ color: theme.text, fontSize: 13 }}>{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step || 1}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          backgroundColor: theme.bg,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: 13,
          width: 80,
          textAlign: 'center',
        }}
      />
    </div>
  );

  const CheckboxField = ({ label, checked, onChange, description }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
  }) => (
    <div style={{ padding: '8px 0' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ accentColor: theme.accent, width: 16, height: 16 }}
        />
        <div>
          <div style={{ color: theme.text, fontSize: 13 }}>{label}</div>
          {description && (
            <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{description}</div>
          )}
        </div>
      </label>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.textSecondary,
      padding: '16px 0 8px',
      borderBottom: `1px solid ${theme.border}`,
      marginBottom: 8,
    }}>
      {title}
    </div>
  );

  return (
    <div className="dialog-overlay" onClick={() => setShowSettings(false)}>
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          width: 650,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h2 style={{ color: theme.text, fontSize: 18, fontWeight: 600 }}>Preferences</h2>
          <span
            onClick={() => setShowSettings(false)}
            style={{ cursor: 'pointer', color: theme.textMuted, fontSize: 20 }}
          >
            {'\u00d7'}
          </span>
        </div>

        <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden' }}>
          {/* Section tabs */}
          <div style={{
            width: 140,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            {sections.map(section => (
              <div
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: 6,
                  fontSize: 13,
                  backgroundColor: activeSection === section.id ? theme.bgHover : 'transparent',
                  color: activeSection === section.id ? theme.text : theme.textSecondary,
                  fontWeight: activeSection === section.id ? 600 : 400,
                }}
              >
                {section.label}
              </div>
            ))}
          </div>

          {/* Settings content */}
          <div style={{ flex: 1, overflow: 'auto', paddingRight: 8 }}>
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
              <AppearanceSection
                theme={theme}
                settings={settings}
                updateSettings={updateSettings}
                SectionHeader={SectionHeader}
                SelectField={SelectField}
                NumberField={NumberField}
              />
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
                <div style={{ color: theme.textSecondary, fontSize: 13 }}>
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
                  ].map((binding, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 0',
                      borderBottom: `1px solid ${theme.border}`,
                    }}>
                      <span>{binding.desc}</span>
                      <kbd style={{
                        backgroundColor: theme.bgTertiary,
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: '-apple-system, system-ui, sans-serif',
                        border: `1px solid ${theme.border}`,
                      }}>
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

/* ===================================================================
 * AppearanceSection — Theme selector + color picker grid
 * =================================================================== */

interface AppearanceSectionProps {
  theme: ThemeColors;
  settings: import('../types').AppSettings;
  updateSettings: (s: Partial<import('../types').AppSettings>) => void;
  SectionHeader: React.FC<{ title: string }>;
  SelectField: <T extends string>(props: {
    label: string; value: T;
    options: { value: T; label: string }[];
    onChange: (v: T) => void;
  }) => React.JSX.Element;
  NumberField: (props: {
    label: string; value: number; min: number; max: number;
    step?: number; onChange: (v: number) => void;
  }) => React.JSX.Element;
}

function AppearanceSection({ theme, settings, updateSettings, SectionHeader, SelectField, NumberField }: AppearanceSectionProps) {
  const isCustom = settings.theme === 'custom';

  // Resolve the "effective" base theme (for showing current colors)
  const baseTheme = getTheme(isCustom ? settings.customThemeBase : settings.theme);

  // Merge custom overrides on top of base to show effective colors
  const effectiveColors: ThemeColors = isCustom
    ? { ...baseTheme, ...settings.customThemeColors as Partial<ThemeColors> }
    : baseTheme;

  const handleThemeChange = useCallback((v: string) => {
    if (v === 'custom') {
      // Switching to custom: clone current theme as the base
      const currentBase = settings.theme === 'custom' ? settings.customThemeBase : settings.theme;
      updateSettings({
        theme: 'custom' as any,
        customThemeBase: currentBase as any,
        customThemeColors: {},
      });
    } else {
      updateSettings({
        theme: v as any,
        customThemeColors: {},
      });
    }
  }, [settings.theme, settings.customThemeBase, updateSettings]);

  const handleColorChange = useCallback((key: string, value: string) => {
    // If not already custom, switch to custom mode
    if (!isCustom) {
      updateSettings({
        theme: 'custom' as any,
        customThemeBase: settings.theme as any,
        customThemeColors: { [key]: value },
      });
    } else {
      const updated = { ...settings.customThemeColors, [key]: value };
      updateSettings({ customThemeColors: updated });
    }
  }, [isCustom, settings.theme, settings.customThemeColors, updateSettings]);

  const handleResetColor = useCallback((key: string) => {
    if (isCustom) {
      const updated = { ...settings.customThemeColors };
      delete (updated as any)[key];
      // If no more overrides, revert to base theme
      if (Object.keys(updated).length === 0) {
        updateSettings({
          theme: settings.customThemeBase as any,
          customThemeColors: {},
        });
      } else {
        updateSettings({ customThemeColors: updated });
      }
    }
  }, [isCustom, settings.customThemeBase, settings.customThemeColors, updateSettings]);

  const handleResetAll = useCallback(() => {
    if (isCustom) {
      updateSettings({
        theme: settings.customThemeBase as any,
        customThemeColors: {},
      });
    }
  }, [isCustom, settings.customThemeBase, updateSettings]);

  return (
    <>
      <SectionHeader title="Theme" />
      <SelectField
        label="Color Theme"
        value={settings.theme}
        options={[
          { value: 'mac-glass', label: 'Mac Glass (Default)' },
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'monokai', label: 'Monokai' },
          { value: 'dracula', label: 'Dracula' },
          { value: 'solarized-dark', label: 'Solarized Dark' },
          { value: 'solarized-light', label: 'Solarized Light' },
          { value: 'custom', label: 'Custom' },
        ]}
        onChange={handleThemeChange}
      />

      {isCustom && (
        <SelectField
          label="Base Theme"
          value={settings.customThemeBase}
          options={[
            { value: 'mac-glass', label: 'Mac Glass' },
            { value: 'dark', label: 'Dark' },
            { value: 'light', label: 'Light' },
            { value: 'monokai', label: 'Monokai' },
            { value: 'dracula', label: 'Dracula' },
            { value: 'solarized-dark', label: 'Solarized Dark' },
            { value: 'solarized-light', label: 'Solarized Light' },
          ]}
          onChange={(v) => updateSettings({ customThemeBase: v as any })}
        />
      )}

      <SectionHeader title="Font" />
      <NumberField
        label="Font Size"
        value={settings.fontSize}
        min={8}
        max={32}
        onChange={(v) => updateSettings({ fontSize: v })}
      />
      <SelectField
        label="Font Family"
        value={settings.fontFamily}
        options={[
          { value: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace", label: 'SF Mono' },
          { value: "'Menlo', 'Monaco', 'Courier New', monospace", label: 'Menlo' },
          { value: "'Fira Code', 'SF Mono', monospace", label: 'Fira Code' },
          { value: "'JetBrains Mono', 'SF Mono', monospace", label: 'JetBrains Mono' },
          { value: "'Source Code Pro', 'SF Mono', monospace", label: 'Source Code Pro' },
          { value: "'Courier New', monospace", label: 'Courier New' },
        ]}
        onChange={(v) => updateSettings({ fontFamily: v })}
      />

      <SectionHeader title="Theme Colors" />

      {isCustom && Object.keys(settings.customThemeColors).length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 12px' }}>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>
            {Object.keys(settings.customThemeColors).length} color{Object.keys(settings.customThemeColors).length !== 1 ? 's' : ''} customized
          </span>
          <button
            onClick={handleResetAll}
            style={{
              background: 'none',
              border: `1px solid ${theme.border}`,
              color: theme.danger,
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Reset All
          </button>
        </div>
      )}

      {themeColorGroups.map(group => (
        <div key={group.label} style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: theme.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 6,
            marginTop: 4,
          }}>
            {group.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            {group.keys.map(({ key, label }) => {
              const colorKey = key as keyof ThemeColors;
              if (colorKey === 'editorMonacoTheme') return null;
              const currentVal = (effectiveColors as any)[colorKey] || '#000000';
              const isOverridden = isCustom && (settings.customThemeColors as any)?.[colorKey] !== undefined;

              return (
                <div
                  key={key}
                  data-testid={`color-picker-${key}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 6px',
                    borderRadius: 4,
                    backgroundColor: isOverridden ? `${theme.accent}12` : 'transparent',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
                    <input
                      type="color"
                      value={currentVal === 'transparent' ? '#000000' : currentVal}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      data-testid={`color-input-${key}`}
                      style={{
                        width: 24,
                        height: 24,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        padding: 0,
                        backgroundColor: 'transparent',
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: 12,
                    color: isOverridden ? theme.accent : theme.textSecondary,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                  {isOverridden && (
                    <span
                      onClick={() => handleResetColor(key)}
                      data-testid={`color-reset-${key}`}
                      style={{
                        cursor: 'pointer',
                        fontSize: 14,
                        color: theme.textMuted,
                        lineHeight: 1,
                        padding: '0 2px',
                      }}
                      title="Reset to base theme"
                    >
                      {'\u00d7'}
                    </span>
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
