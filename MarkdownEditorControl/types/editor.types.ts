import { Editor } from '@milkdown/core';

export interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
    showToolbar?: boolean;
    enableSpellCheck?: boolean;
    maxLength?: number;
    height?: number;
    width?: number;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export type EffectiveTheme = 'light' | 'dark' | 'high-contrast';

export interface FindReplaceState {
    isOpen: boolean;
    findText: string;
    replaceText: string;
    results: FindResults;
}

export interface FindResults {
    count: number;
    current: number;
}

export interface FindData {
    positions: number[];
    searchLength: number;
}

export interface TablePickerState {
    isOpen: boolean;
    hoveredCell: { row: number; col: number };
}

export interface EditorRefs {
    editor: React.MutableRefObject<Editor | null>;
    currentMarkdown: React.MutableRefObject<string>;
    container: React.RefObject<HTMLDivElement>;
    getEditor: React.MutableRefObject<(() => Editor | undefined) | undefined>;
}

export type EditorCommandExecutor = (
    command: Parameters<typeof import('@milkdown/kit/utils').callCommand>[0],
    payload?: unknown
) => void;
