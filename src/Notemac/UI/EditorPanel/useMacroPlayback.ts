import { useCallback } from 'react';
import type { editor } from 'monaco-editor';
import { useNotemacStore } from "../../Model/Store";

/**
 * useMacroPlayback - Custom hook for macro recording and playback logic
 *
 * Handles:
 * - Macro playback (single execution)
 * - Macro run multiple (repeat N times)
 * - Macro save (persist to store)
 */
export function useMacroPlayback(
  editor: editor.IStandaloneCodeEditor | null,
): (action: string, _value?: boolean | string | number) => void {
  return useCallback(
    (action: string, _value?: boolean | string | number) => {
      if (!editor) return;

      switch (action) {
        case 'macro-playback': {
          const macroStore = useNotemacStore.getState();
          const actions = macroStore.currentMacroActions;
          if (0 === actions.length) break;
          for (const macroAction of actions) {
            if ('type' === macroAction.type) {
              editor.trigger('keyboard', 'type', { text: macroAction.data });
            } else if ('command' === macroAction.type) {
              editor.trigger('keyboard', macroAction.data, null);
            }
          }
          break;
        }

        case 'macro-run-multiple': {
          const timesStr = prompt('Run macro how many times?', '10');
          if (!timesStr) break;
          const times = parseInt(timesStr, 10);
          if (isNaN(times) || times < 1) break;
          const macroStore2 = useNotemacStore.getState();
          const actions2 = macroStore2.currentMacroActions;
          if (0 === actions2.length) break;
          for (let run = 0; run < times; run++) {
            for (const macroAction of actions2) {
              if ('type' === macroAction.type) {
                editor.trigger('keyboard', 'type', { text: macroAction.data });
              } else if ('command' === macroAction.type) {
                editor.trigger('keyboard', macroAction.data, null);
              }
            }
          }
          break;
        }

        case 'macro-save': {
          const macroStore3 = useNotemacStore.getState();
          if (0 === macroStore3.currentMacroActions.length) break;
          const macroName = prompt('Save macro as:', 'My Macro');
          if (macroName) {
            macroStore3.saveMacro(macroName);
          }
          break;
        }
      }
    },
    [editor]
  );
}
