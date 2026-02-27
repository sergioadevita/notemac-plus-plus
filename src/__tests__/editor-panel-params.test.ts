import { describe, it, expect } from 'vitest';
import { GetDefaultEditorPanelParams } from '../Notemac/UI/Params/EditorPanelViewPresenterParams';

describe('EditorPanelViewPresenterParams', () => {
  it('GetDefaultEditorPanelParams returns object with zoomLevel 0', () => {
    const params = GetDefaultEditorPanelParams();
    expect(params.zoomLevel).toBe(0);
  });

  it('returned object has only zoomLevel key', () => {
    const params = GetDefaultEditorPanelParams();
    expect(Object.keys(params)).toEqual(['zoomLevel']);
  });

  it('returned object does not have tab, theme, or settings keys', () => {
    const params = GetDefaultEditorPanelParams();
    expect(params).not.toHaveProperty('tab');
    expect(params).not.toHaveProperty('theme');
    expect(params).not.toHaveProperty('settings');
  });

  it('returns a new object each call (not same reference)', () => {
    const params1 = GetDefaultEditorPanelParams();
    const params2 = GetDefaultEditorPanelParams();
    expect(params1).not.toBe(params2);
  });

  it('each returned object has zoomLevel 0', () => {
    const params1 = GetDefaultEditorPanelParams();
    const params2 = GetDefaultEditorPanelParams();
    expect(params1.zoomLevel).toBe(0);
    expect(params2.zoomLevel).toBe(0);
  });
});
