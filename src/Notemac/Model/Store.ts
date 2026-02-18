import { create } from 'zustand';
import { createTabSlice, NotemacTabSlice } from "./TabModel";
import { createSearchSlice, NotemacSearchSlice } from "./SearchModel";
import { createMacroSlice, NotemacMacroSlice } from "./MacroModel";
import { createUISlice, NotemacUISlice } from "./UIModel";
import { createFileTreeSlice, NotemacFileTreeSlice } from "./FileTreeModel";
import { createSnippetSlice, NotemacSnippetSlice } from "./SnippetModel";
import { createGitSlice, NotemacGitSlice } from "./GitModel";
import { createAISlice, NotemacAISlice } from "./AIModel";

export type NotemacState = NotemacTabSlice & NotemacSearchSlice & NotemacMacroSlice & NotemacUISlice & NotemacFileTreeSlice & NotemacSnippetSlice & NotemacGitSlice & NotemacAISlice;

export const useNotemacStore = create<NotemacState>()((...a) => ({
    ...createTabSlice(...a),
    ...createSearchSlice(...a),
    ...createMacroSlice(...a),
    ...(createUISlice as any)(...a),
    ...createFileTreeSlice(...a),
    ...createSnippetSlice(...a),
    ...createGitSlice(...a),
    ...createAISlice(...a),
}));
