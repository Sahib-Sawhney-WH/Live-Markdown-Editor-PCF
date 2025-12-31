import { useCallback } from 'react';
import { Editor, editorViewCtx } from '@milkdown/core';
import { callCommand } from '@milkdown/kit/utils';
import {
    toggleStrongCommand,
    toggleEmphasisCommand,
    wrapInHeadingCommand,
    wrapInBulletListCommand,
    wrapInOrderedListCommand,
    insertImageCommand,
    wrapInBlockquoteCommand,
    insertHrCommand
} from '@milkdown/preset-commonmark';
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/preset-gfm';
import { redoCommand, undoCommand } from '@milkdown/plugin-history';

export interface UseEditorCommandsProps {
    getEditor: () => Editor | undefined;
}

export interface EditorCommands {
    executeCommand: (command: Parameters<typeof callCommand>[0], payload?: unknown) => void;
    insertHeading: (level: number) => void;
    clearHeading: () => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleStrikethrough: () => void;
    handleUndo: () => void;
    handleRedo: () => void;
    insertBlockquote: () => void;
    insertHorizontalRule: () => void;
    insertBulletList: () => void;
    insertOrderedList: () => void;
    insertLink: () => void;
    insertImage: () => void;
    insertCode: () => void;
    insertTable: (rows: number, cols: number) => void;
}

export function useEditorCommands({ getEditor }: UseEditorCommandsProps): EditorCommands {
    const executeCommand = useCallback((command: Parameters<typeof callCommand>[0], payload?: unknown) => {
        try {
            getEditor()?.action(callCommand(command, payload));
        } catch {
            // Silently handle command errors
        }
    }, [getEditor]);

    const insertHeading = useCallback((level: number) => {
        executeCommand(wrapInHeadingCommand.key, level);
    }, [executeCommand]);

    const clearHeading = useCallback(() => {
        executeCommand(wrapInHeadingCommand.key, 0);
    }, [executeCommand]);

    const toggleBold = useCallback(() => {
        executeCommand(toggleStrongCommand.key);
    }, [executeCommand]);

    const toggleItalic = useCallback(() => {
        executeCommand(toggleEmphasisCommand.key);
    }, [executeCommand]);

    const toggleStrikethrough = useCallback(() => {
        executeCommand(toggleStrikethroughCommand.key);
    }, [executeCommand]);

    const handleUndo = useCallback(() => {
        executeCommand(undoCommand.key);
    }, [executeCommand]);

    const handleRedo = useCallback(() => {
        executeCommand(redoCommand.key);
    }, [executeCommand]);

    const insertBlockquote = useCallback(() => {
        executeCommand(wrapInBlockquoteCommand.key);
    }, [executeCommand]);

    const insertHorizontalRule = useCallback(() => {
        executeCommand(insertHrCommand.key);
    }, [executeCommand]);

    const insertBulletList = useCallback(() => {
        executeCommand(wrapInBulletListCommand.key);
    }, [executeCommand]);

    const insertOrderedList = useCallback(() => {
        executeCommand(wrapInOrderedListCommand.key);
    }, [executeCommand]);

    const insertLink = useCallback(() => {
        const editor = getEditor();
        if (!editor) return;

        try {
            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const selectedText = state.doc.textBetween(selection.from, selection.to);

            const url = window.prompt('Enter URL:', 'https://');
            if (!url) return;

            const defaultText = selectedText || url;
            const linkText = window.prompt('Enter link text (or leave empty to show URL):', defaultText);
            if (linkText === null) return;

            const displayText = linkText.trim() || url;
            const linkMark = state.schema.marks.link;

            if (linkMark) {
                const mark = linkMark.create({ href: url, title: '' });
                const textNode = state.schema.text(displayText, [mark]);
                const tr = state.tr.replaceSelectionWith(textNode, false);
                dispatch(tr);
                view.focus();
            }
        } catch {
            // Silently handle errors
        }
    }, [getEditor]);

    const insertImage = useCallback(() => {
        const url = window.prompt('Enter image URL:', 'https://');
        if (!url) return;
        const alt = window.prompt('Enter alt text:', 'image') || 'image';
        executeCommand(insertImageCommand.key, { src: url, alt });
    }, [executeCommand]);

    const insertCode = useCallback(() => {
        const editor = getEditor();
        if (!editor) return;

        try {
            const view = editor.ctx.get(editorViewCtx);
            if (view) {
                const { state, dispatch } = view;
                const codeBlockType = state.schema.nodes.code_block;
                if (codeBlockType) {
                    const codeBlock = codeBlockType.create(
                        { language: '' },
                        state.schema.text('// code here')
                    );
                    const tr = state.tr.replaceSelectionWith(codeBlock);
                    dispatch(tr);
                }
            }
        } catch {
            // Silently handle errors
        }
    }, [getEditor]);

    const insertTable = useCallback((rows: number, cols: number) => {
        const actualRows = Math.max(2, rows);
        if (actualRows > 0 && cols > 0) {
            executeCommand(insertTableCommand.key, { row: actualRows, col: cols });
        }
    }, [executeCommand]);

    return {
        executeCommand,
        insertHeading,
        clearHeading,
        toggleBold,
        toggleItalic,
        toggleStrikethrough,
        handleUndo,
        handleRedo,
        insertBlockquote,
        insertHorizontalRule,
        insertBulletList,
        insertOrderedList,
        insertLink,
        insertImage,
        insertCode,
        insertTable
    };
}
