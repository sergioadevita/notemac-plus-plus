import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SetMonacoEditor,
  GetMonacoEditor,
  ClearMonacoEditor,
  SetEditorAction,
  GetEditorAction,
  ClearEditorAction,
} from '../Shared/Helpers/EditorGlobals';

describe('EditorGlobals', () => {
  beforeEach(() => {
    ClearMonacoEditor();
    ClearEditorAction();
  });

  describe('Monaco Editor State Management', () => {
    it('should return null initially for GetMonacoEditor', () => {
      expect(GetMonacoEditor()).toBeNull();
    });

    it('should store and retrieve editor instance', () => {
      const mockEditor = {} as any;
      SetMonacoEditor(mockEditor);
      expect(GetMonacoEditor()).toBe(mockEditor);
    });

    it('should clear editor instance', () => {
      const mockEditor = {} as any;
      SetMonacoEditor(mockEditor);
      expect(GetMonacoEditor()).not.toBeNull();
      ClearMonacoEditor();
      expect(GetMonacoEditor()).toBeNull();
    });

    it('should overwrite editor when set twice', () => {
      const mockEditor1 = { id: 1 } as any;
      const mockEditor2 = { id: 2 } as any;
      SetMonacoEditor(mockEditor1);
      expect(GetMonacoEditor()).toBe(mockEditor1);
      SetMonacoEditor(mockEditor2);
      expect(GetMonacoEditor()).toBe(mockEditor2);
      expect(GetMonacoEditor()).not.toBe(mockEditor1);
    });
  });

  describe('Editor Action State Management', () => {
    it('should return null initially for GetEditorAction', () => {
      expect(GetEditorAction()).toBeNull();
    });

    it('should store and retrieve editor action', () => {
      const mockAction = vi.fn();
      SetEditorAction(mockAction);
      expect(GetEditorAction()).toBe(mockAction);
    });

    it('should clear editor action', () => {
      const mockAction = vi.fn();
      SetEditorAction(mockAction);
      expect(GetEditorAction()).not.toBeNull();
      ClearEditorAction();
      expect(GetEditorAction()).toBeNull();
    });

    it('should overwrite action when set twice', () => {
      const mockAction1 = vi.fn();
      const mockAction2 = vi.fn();
      SetEditorAction(mockAction1);
      expect(GetEditorAction()).toBe(mockAction1);
      SetEditorAction(mockAction2);
      expect(GetEditorAction()).toBe(mockAction2);
      expect(GetEditorAction()).not.toBe(mockAction1);
    });
  });

  describe('Independent State Management', () => {
    it('should manage editor and action independently', () => {
      const mockEditor = {} as any;
      const mockAction = vi.fn();

      SetMonacoEditor(mockEditor);
      SetEditorAction(mockAction);

      expect(GetMonacoEditor()).toBe(mockEditor);
      expect(GetEditorAction()).toBe(mockAction);
    });

    it('should clear editor without affecting action', () => {
      const mockEditor = {} as any;
      const mockAction = vi.fn();

      SetMonacoEditor(mockEditor);
      SetEditorAction(mockAction);
      ClearMonacoEditor();

      expect(GetMonacoEditor()).toBeNull();
      expect(GetEditorAction()).toBe(mockAction);
    });

    it('should clear action without affecting editor', () => {
      const mockEditor = {} as any;
      const mockAction = vi.fn();

      SetMonacoEditor(mockEditor);
      SetEditorAction(mockAction);
      ClearEditorAction();

      expect(GetMonacoEditor()).toBe(mockEditor);
      expect(GetEditorAction()).toBeNull();
    });
  });

  describe('State Isolation Between Tests', () => {
    it('should start with clean state after beforeEach', () => {
      expect(GetMonacoEditor()).toBeNull();
      expect(GetEditorAction()).toBeNull();
    });

    it('should maintain clean state in subsequent test', () => {
      expect(GetMonacoEditor()).toBeNull();
      expect(GetEditorAction()).toBeNull();
    });
  });
});
