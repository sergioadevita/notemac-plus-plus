import type { editor } from 'monaco-editor';
import type { FileTab } from "../../Commons/Types";
import {
  ExplainCode,
  RefactorCode,
  GenerateTests,
  GenerateDocumentation,
  FixError,
  SimplifyCode,
} from "../../Controllers/AIActionController";

/**
 * RegisterAIContextMenuActions - Register AI-related context menu actions
 *
 * Registers the following AI context menu actions:
 * - Explain Code
 * - Refactor Code
 * - Generate Tests
 * - Generate Documentation
 * - Fix Error
 * - Simplify Code
 */
export function RegisterAIContextMenuActions(
  editor: editor.IStandaloneCodeEditor,
  monaco: typeof import('monaco-editor'),
  _tab: FileTab,
): void {
  editor.addAction({
    id: 'ai-explain',
    label: 'AI: Explain Code',
    contextMenuGroupId: '9_ai',
    contextMenuOrder: 1,
    run: (ed: editor.IStandaloneCodeEditor) => {
      const sel = ed.getSelection();
      const model = ed.getModel();
      if (sel && !sel.isEmpty() && model) {
        const code = model.getValueInRange(sel);
        ExplainCode(code, model.getLanguageId() || 'plaintext');
      }
    },
  });

  editor.addAction({
    id: 'ai-refactor',
    label: 'AI: Refactor Code',
    contextMenuGroupId: '9_ai',
    contextMenuOrder: 2,
    run: (ed: editor.IStandaloneCodeEditor) => {
      const sel = ed.getSelection();
      const model = ed.getModel();
      if (sel && !sel.isEmpty() && model) {
        const code = model.getValueInRange(sel);
        RefactorCode(code, model.getLanguageId() || 'plaintext', (refactored) => {
          ed.executeEdits('ai-refactor', [{ range: sel, text: refactored }]);
        });
      }
    },
  });

  editor.addAction({
    id: 'ai-generate-tests',
    label: 'AI: Generate Tests',
    contextMenuGroupId: '9_ai',
    contextMenuOrder: 3,
    run: (ed: editor.IStandaloneCodeEditor) => {
      const sel = ed.getSelection();
      const model = ed.getModel();
      if (sel && !sel.isEmpty() && model) {
        const code = model.getValueInRange(sel);
        GenerateTests(code, model.getLanguageId() || 'plaintext', (tests) => {
          // Insert tests at end of document
          const lastLine = model.getLineCount();
          const lastCol = model.getLineMaxColumn(lastLine);
          ed.executeEdits('ai-tests', [{
            range: new monaco.Range(lastLine, lastCol, lastLine, lastCol),
            text: '\n\n' + tests,
          }]);
        });
      }
    },
  });

  editor.addAction({
    id: 'ai-generate-docs',
    label: 'AI: Generate Documentation',
    contextMenuGroupId: '9_ai',
    contextMenuOrder: 4,
    run: (ed: editor.IStandaloneCodeEditor) => {
      const sel = ed.getSelection();
      const model = ed.getModel();
      if (sel && !sel.isEmpty() && model) {
        const code = model.getValueInRange(sel);
        GenerateDocumentation(code, model.getLanguageId() || 'plaintext', (documented) => {
          ed.executeEdits('ai-docs', [{ range: sel, text: documented }]);
        });
      }
    },
  });

  editor.addAction({
    id: 'ai-fix-error',
    label: 'AI: Fix Error',
    contextMenuGroupId: '9_ai',
    contextMenuOrder: 5,
    run: (ed: editor.IStandaloneCodeEditor) => {
      const sel = ed.getSelection();
      const model = ed.getModel();
      if (sel && !sel.isEmpty() && model) {
        const code = model.getValueInRange(sel);
        const errorMsg = prompt('Describe the error (or paste error message):') || 'Fix any issues';
        FixError(code, model.getLanguageId() || 'plaintext', errorMsg, (fixed) => {
          ed.executeEdits('ai-fix', [{ range: sel, text: fixed }]);
        });
      }
    },
  });

  editor.addAction({
    id: 'ai-simplify',
    label: 'AI: Simplify Code',
    contextMenuGroupId: '9_ai',
    contextMenuOrder: 6,
    run: (ed: editor.IStandaloneCodeEditor) => {
      const sel = ed.getSelection();
      const model = ed.getModel();
      if (sel && !sel.isEmpty() && model) {
        const code = model.getValueInRange(sel);
        SimplifyCode(code, model.getLanguageId() || 'plaintext', (simplified) => {
          ed.executeEdits('ai-simplify', [{ range: sel, text: simplified }]);
        });
      }
    },
  });
}
