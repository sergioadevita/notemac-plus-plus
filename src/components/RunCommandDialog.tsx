import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { ThemeColors } from '../utils/themes';

interface RunCommandDialogProps {
  theme: ThemeColors;
}

export function RunCommandDialog({ theme }: RunCommandDialogProps) {
  const { setShowRunCommand } = useEditorStore();
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleRun = async () => {
    if (!command.trim()) return;
    setIsRunning(true);
    setOutput('');

    // In Electron, we could use child_process
    if (window.electronAPI) {
      try {
        const result = await (window.electronAPI as any).runCommand?.(command);
        setOutput(result || 'Command executed.');
      } catch (err: any) {
        setOutput(`Error: ${err.message || err}`);
      }
    } else {
      setOutput('Run command is only available in the desktop version.\nIn the web version, you can open a terminal separately.');
    }
    setIsRunning(false);
  };

  return (
    <div className="dialog-overlay" onClick={() => setShowRunCommand(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          padding: 20,
          width: 500,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3 style={{ color: theme.text, fontSize: 16, marginBottom: 12, fontWeight: 600 }}>
          Run Command
        </h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRun();
              if (e.key === 'Escape') setShowRunCommand(false);
            }}
            placeholder="Enter command to run..."
            style={{
              flex: 1,
              height: 32,
              backgroundColor: theme.bg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: '0 12px',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              backgroundColor: theme.accent,
              color: theme.accentText,
              border: 'none',
              borderRadius: 6,
              padding: '0 20px',
              cursor: isRunning ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {isRunning ? 'Running...' : 'Run'}
          </button>
        </div>
        {output && (
          <pre style={{
            backgroundColor: theme.bg,
            color: theme.text,
            padding: 12,
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            fontSize: 12,
            fontFamily: 'monospace',
            maxHeight: 200,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            margin: 0,
          }}>
            {output}
          </pre>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={() => setShowRunCommand(false)}
            style={{
              backgroundColor: 'transparent',
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
