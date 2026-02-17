import type { FileTab, AppSettings } from "../../Commons/Types";

export interface EditorPanelViewPresenterParams
{
    tab: FileTab;
    theme: any;
    settings: AppSettings;
    zoomLevel: number;
}

export function GetDefaultEditorPanelParams(): Partial<EditorPanelViewPresenterParams>
{
    return {
        zoomLevel: 0,
    };
}
