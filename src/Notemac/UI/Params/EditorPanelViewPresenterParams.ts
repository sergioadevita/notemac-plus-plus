import type { FileTab, AppSettings } from "../../Commons/Types";
import type { ThemeColors } from "../../Configs/ThemeConfig";

export interface EditorPanelViewPresenterParams
{
    tab: FileTab;
    theme: ThemeColors;
    settings: AppSettings;
    zoomLevel: number;
}

export function GetDefaultEditorPanelParams(): Partial<EditorPanelViewPresenterParams>
{
    return {
        zoomLevel: 0,
    };
}
