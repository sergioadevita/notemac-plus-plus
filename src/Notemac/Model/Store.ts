import { create } from 'zustand';
import { createTabSlice, NotemacTabSlice } from "./TabModel";
import { createSearchSlice, NotemacSearchSlice } from "./SearchModel";
import { createMacroSlice, NotemacMacroSlice } from "./MacroModel";
import { createUISlice, NotemacUISlice } from "./UIModel";
import { createFileTreeSlice, NotemacFileTreeSlice } from "./FileTreeModel";

export type NotemacState = NotemacTabSlice & NotemacSearchSlice & NotemacMacroSlice & NotemacUISlice & NotemacFileTreeSlice;

export const useNotemacStore = create<NotemacState>()((...a) => ({
    ...createTabSlice(...a),
    ...createSearchSlice(...a),
    ...createMacroSlice(...a),
    ...(createUISlice as any)(...a),
    ...createFileTreeSlice(...a),
}));
