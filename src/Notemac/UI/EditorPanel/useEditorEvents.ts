import { useEffect, useCallback } from 'react';
import type { editor, IRange } from 'monaco-editor';
import type { FileTab } from "../../Commons/Types";

/**
 * useEditorEvents - Custom hook for custom event listeners
 *
 * Handles:
 * - Find operations
 * - Replace operations
 * - Mark operations
 * - Go-to-line operations
 * - Column edit operations
 */
export function useEditorEvents(
  editor: editor.IStandaloneCodeEditor | null,
  monaco: typeof import('monaco-editor') | null,
  tab: FileTab,
  updateTab: (tabId: string, updates: Partial<FileTab>) => void,
): void {
  const handleFind = useCallback((e: Event) => {
    if (!editor || !monaco) return;

    const { query, direction, isCaseSensitive, isWholeWord, isRegex } = (e as CustomEvent).detail;
    if (!query) return;

    const model = editor.getModel();
    if (!model) return;

    const fullText = model.getValue();
    const curPos = editor.getPosition();
    const curOffset = curPos ? model.getOffsetAt(curPos) : 0;

    let flags = 'g';
    if (!isCaseSensitive) flags += 'i';

    let pattern: string;
    if (isRegex) {
      pattern = query;
    } else {
      pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    if (isWholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch {
      return;
    }

    const matches: { start: number; end: number }[] = [];
    let m: RegExpExecArray | null;
    while (null !== (m = regex.exec(fullText))) {
      matches.push({ start: m.index, end: m.index + m[0].length });
      if (0 === m[0].length) regex.lastIndex++;
    }

    if (0 === matches.length) return;

    let targetMatch: { start: number; end: number };
    if ('next' === direction) {
      targetMatch = matches.find(mt => mt.start >= curOffset) || matches[0];
    } else {
      targetMatch = [...matches].reverse().find(mt => mt.end <= curOffset) || matches[matches.length - 1];
    }

    const startPos = model.getPositionAt(targetMatch.start);
    const endPos = model.getPositionAt(targetMatch.end);
    editor.setSelection(new monaco.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column));
    editor.revealLineInCenter(startPos.lineNumber);
  }, [editor, monaco]);

  const handleReplace = useCallback((e: Event) => {
    if (!editor || !monaco) return;

    const { find: query, replace: replaceText, all, isCaseSensitive, isWholeWord, isRegex } = (e as CustomEvent).detail;
    if (!query) return;

    const model = editor.getModel();
    if (!model) return;

    let flags = 'g';
    if (!isCaseSensitive) flags += 'i';

    let pattern: string;
    if (isRegex) pattern = query;
    else pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) pattern = `\\b${pattern}\\b`;

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch {
      return;
    }

    if (all) {
      const fullRange = model.getFullModelRange();
      const newText = model.getValue().replace(regex, replaceText);
      editor.executeEdits('replace-all', [{ range: fullRange, text: newText }]);
    } else {
      const sel = editor.getSelection();
      if (sel && !sel.isEmpty()) {
        const selText = model.getValueInRange(sel);
        const singleRegex = new RegExp(pattern, isCaseSensitive ? '' : 'i');
        if (singleRegex.test(selText)) {
          editor.executeEdits('replace', [{ range: sel, text: selText.replace(singleRegex, replaceText) }]);
        }
      }
      // Find next occurrence
      handleFind(new CustomEvent('notemac-find', { detail: { query, direction: 'next', isCaseSensitive, isWholeWord, isRegex } }));
    }
  }, [editor, monaco, handleFind]);

  const handleMark = useCallback((e: Event) => {
    if (!editor || !monaco) return;

    const { query, isCaseSensitive, isWholeWord, isRegex, style } = (e as CustomEvent).detail;
    if (!query) return;

    const model = editor.getModel();
    if (!model) return;

    let flags = 'g';
    if (!isCaseSensitive) flags += 'i';
    let pattern = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (isWholeWord) pattern = `\\b${pattern}\\b`;

    let regex: RegExp;
    try {
      regex = new RegExp(pattern, flags);
    } catch {
      return;
    }

    const fullText = model.getValue();
    const newMarks: Array<{ line: number; column: number; length: number; style: 1 | 2 | 3 | 4 | 5 }> = [];
    let mt: RegExpExecArray | null;
    while (null !== (mt = regex.exec(fullText))) {
      const pos = model.getPositionAt(mt.index);
      newMarks.push({
        line: pos.lineNumber,
        column: pos.column,
        length: mt[0].length,
        style: style || 1,
      });
      if (0 === mt[0].length) regex.lastIndex++;
    }

    const existingMarks = tab.marks || [];
    updateTab(tab.id, { marks: [...existingMarks, ...newMarks] });
  }, [editor, monaco, tab.id, tab.marks, updateTab]);

  const handleClearMarks = useCallback(() => {
    updateTab(tab.id, { marks: [] });
  }, [tab.id, updateTab]);

  const handleGoToLine = useCallback((e: Event) => {
    if (!editor) return;

    const { line } = (e as CustomEvent).detail;
    if (line) {
      editor.setPosition({ lineNumber: line, column: 1 });
      editor.revealLineInCenter(line);
      editor.focus();
    }
  }, [editor]);

  const handleColumnEdit = useCallback((e: Event) => {
    if (!editor || !monaco) return;

    const { text, startLine, endLine, column } = (e as CustomEvent).detail;
    const model = editor.getModel();
    if (!model) return;

    const edits: Array<{ range: IRange; text: string }> = [];
    const maxLine = Math.min(endLine || model.getLineCount(), model.getLineCount());
    for (let i = startLine || 1; i <= maxLine; i++) {
      const col = Math.min(column || 1, model.getLineMaxColumn(i));
      edits.push({
        range: new monaco.Range(i, col, i, col),
        text: text || '',
      });
    }
    if (0 < edits.length) {
      editor.executeEdits('column-edit', edits);
    }
  }, [editor, monaco]);

  useEffect(() => {
    document.addEventListener('notemac-find', handleFind);
    document.addEventListener('notemac-replace', handleReplace);
    document.addEventListener('notemac-mark', handleMark);
    document.addEventListener('notemac-clear-marks', handleClearMarks);
    document.addEventListener('notemac-goto-line', handleGoToLine);
    document.addEventListener('notemac-column-edit', handleColumnEdit);

    return () => {
      document.removeEventListener('notemac-find', handleFind);
      document.removeEventListener('notemac-replace', handleReplace);
      document.removeEventListener('notemac-mark', handleMark);
      document.removeEventListener('notemac-clear-marks', handleClearMarks);
      document.removeEventListener('notemac-goto-line', handleGoToLine);
      document.removeEventListener('notemac-column-edit', handleColumnEdit);
    };
  }, [handleFind, handleReplace, handleMark, handleClearMarks, handleGoToLine, handleColumnEdit]);
}
