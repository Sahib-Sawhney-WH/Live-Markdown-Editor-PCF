import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/core';
import { callCommand } from '@milkdown/utils';
import {
    toggleStrongCommand,
    toggleEmphasisCommand,
    wrapInHeadingCommand,
    wrapInBulletListCommand,
    wrapInOrderedListCommand,
    insertImageCommand,
    wrapInBlockquoteCommand
} from '@milkdown/preset-commonmark';
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/preset-gfm';
import '@milkdown/theme-nord/style.css';
import { SimpleMarkdownEditor } from './SimpleMarkdownEditor';

export interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
    showToolbar?: boolean;
    enableSpellCheck?: boolean;
    maxLength?: number;
    height?: number; // Height in pixels for the editor container
}

// Temporary: Use simple editor to test React - set to false to use Milkdown
const USE_SIMPLE_EDITOR = false;

const EditorComponent: React.FC<Omit<MarkdownEditorProps, 'value' | 'onChange'> & {
    onUpdate: (markdown: string) => void;
    initialValue: string;
}> = ({
    initialValue,
    onUpdate,
    readOnly = false,
    theme = 'light',
    showToolbar = true,
    maxLength = 100000,
    height
}) => {
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [editorError, setEditorError] = useState<string | null>(null);
    const editorRef = useRef<Editor | null>(null);

    // Determine effective theme
    const effectiveTheme = theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    // Log mount only once
    useEffect(() => {
        console.log('MarkdownEditor EditorComponent mounted');
        console.log('Initial value:', initialValue);
        console.log('Props:', { readOnly, theme, showToolbar, maxLength, height });
    }, []);

    // Calculate statistics
    const updateStats = useCallback((text: string) => {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        setWordCount(words);
        setCharCount(chars);
    }, []);

    // Initialize Milkdown editor using React hooks following v7 pattern
    const { loading, get } = useEditor((root) => {
        console.log('Milkdown useEditor factory called with root:', root);
        console.log('Initial markdown content length:', initialValue.length);
        console.log('First 200 chars:', initialValue.substring(0, 200));

        try {
            const editor = Editor
                .make()
                .config(nord)
                .config((ctx) => {
                    console.log('Milkdown config - setting root and initial value');
                    console.log('Setting defaultValueCtx to:', initialValue.substring(0, 100) + '...');
                    ctx.set(rootCtx, root);
                    ctx.set(defaultValueCtx, initialValue);
                })
                .config((ctx) => {
                    console.log('Milkdown config - setting up listener');
                    const listenerPlugin = ctx.get(listenerCtx);
                    listenerPlugin.markdownUpdated((_ctx, markdown) => {
                        console.log('Markdown content updated');
                        onUpdate(markdown);
                        updateStats(markdown);
                    });
                })
                .use(commonmark)  // Base CommonMark preset - required for GFM
                .use(gfm)  // GFM preset adds tables, strikethrough, task lists
                .use(listener);

            editorRef.current = editor;
            return editor;
        } catch (error) {
            console.error('Error initializing Milkdown:', error);
            setEditorError(error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }, []);

    // Monitor loading state changes
    useEffect(() => {
        console.log('Editor loading state changed:', loading);
        if (!loading) {
            console.log('Editor initialized successfully!');
        }
    }, [loading]);

    // Update stats when value changes
    useEffect(() => {
        updateStats(initialValue);
    }, [initialValue, updateStats]);

    // Toolbar actions
    const insertHeading = (level: number) => {
        if (!get) return;
        try {
            get()?.action(callCommand(wrapInHeadingCommand.key, level));
        } catch (error) {
            console.error('Error inserting heading:', error);
        }
    };

    const clearHeading = () => {
        if (!get) return;
        try {
            // Convert heading to normal paragraph by setting level to 0
            get()?.action(callCommand(wrapInHeadingCommand.key, 0));
        } catch (error) {
            console.error('Error clearing heading:', error);
        }
    };

    const toggleBold = () => {
        if (!get) return;
        try {
            get()?.action(callCommand(toggleStrongCommand.key));
        } catch (error) {
            console.error('Error toggling bold:', error);
        }
    };

    const toggleItalic = () => {
        if (!get) return;
        try {
            get()?.action(callCommand(toggleEmphasisCommand.key));
        } catch (error) {
            console.error('Error toggling italic:', error);
        }
    };

    const insertLink = () => {
        if (!get) return;
        try {
            const url = window.prompt('Enter URL:', 'https://');
            if (url) {
                // Insert link markdown syntax
                const view = get()?.ctx.get(editorViewCtx);
                if (view) {
                    const { state, dispatch } = view;
                    const { selection } = state;
                    const text = state.doc.textBetween(selection.from, selection.to);
                    const linkText = text || 'link text';
                    const tr = state.tr.replaceSelectionWith(
                        state.schema.text(`[${linkText}](${url})`)
                    );
                    dispatch(tr);
                }
            }
        } catch (error) {
            console.error('Error inserting link:', error);
        }
    };

    const insertImage = () => {
        if (!get) return;
        try {
            const url = window.prompt('Enter image URL:', 'https://');
            if (url) {
                const alt = window.prompt('Enter alt text:', 'image') || 'image';
                get()?.action(callCommand(insertImageCommand.key, { src: url, alt }));
            }
        } catch (error) {
            console.error('Error inserting image:', error);
        }
    };

    const insertCode = () => {
        if (!get) return;
        try {
            // Insert code block markdown syntax
            const view = get()?.ctx.get(editorViewCtx);
            if (view) {
                const { state, dispatch } = view;
                const tr = state.tr.replaceSelectionWith(
                    state.schema.text('```\ncode here\n```')
                );
                dispatch(tr);
            }
        } catch (error) {
            console.error('Error inserting code block:', error);
        }
    };

    const insertList = (ordered: boolean) => {
        if (!get) return;
        try {
            if (ordered) {
                get()?.action(callCommand(wrapInOrderedListCommand.key));
            } else {
                get()?.action(callCommand(wrapInBulletListCommand.key));
            }
        } catch (error) {
            console.error('Error inserting list:', error);
        }
    };

    const insertTable = () => {
        if (!get) return;
        try {
            const rowsStr = window.prompt('How many rows?', '3');
            const colsStr = window.prompt('How many columns?', '3');

            if (rowsStr && colsStr) {
                const rows = parseInt(rowsStr, 10);
                const cols = parseInt(colsStr, 10);

                if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0) {
                    get()?.action(callCommand(insertTableCommand.key, { row: rows, col: cols }));
                } else {
                    console.warn('Invalid row or column count');
                }
            }
        } catch (error) {
            console.error('Error inserting table:', error);
        }
    };

    return (
        <div
            className={`markdown-editor-container ${effectiveTheme} ${readOnly ? 'read-only' : ''}`}
            style={height ? { height: `${height}px` } : undefined}
        >
            {showToolbar && !readOnly && (
                <div className={`markdown-toolbar ${effectiveTheme}`}>
                    <button
                        className="toolbar-button"
                        onClick={() => insertHeading(1)}
                        title="Heading 1"
                        aria-label="Insert Heading 1"
                    >
                        H1
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={() => insertHeading(2)}
                        title="Heading 2"
                        aria-label="Insert Heading 2"
                    >
                        H2
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={() => insertHeading(3)}
                        title="Heading 3"
                        aria-label="Insert Heading 3"
                    >
                        H3
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={clearHeading}
                        title="Clear Heading"
                        aria-label="Clear Heading Formatting"
                    >
                        P
                    </button>

                    <div className="toolbar-divider" />

                    <button
                        className="toolbar-button"
                        onClick={toggleBold}
                        title="Bold (Ctrl+B)"
                        aria-label="Toggle Bold"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={toggleItalic}
                        title="Italic (Ctrl+I)"
                        aria-label="Toggle Italic"
                    >
                        <em>I</em>
                    </button>

                    <div className="toolbar-divider" />

                    <button
                        className="toolbar-button"
                        onClick={insertLink}
                        title="Insert Link (Ctrl+K)"
                        aria-label="Insert Link"
                    >
                        🔗
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={insertImage}
                        title="Insert Image"
                        aria-label="Insert Image"
                    >
                        🖼️
                    </button>

                    <div className="toolbar-divider" />

                    <button
                        className="toolbar-button"
                        onClick={() => insertList(false)}
                        title="Bullet List"
                        aria-label="Insert Bullet List"
                    >
                        • List
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={() => insertList(true)}
                        title="Numbered List"
                        aria-label="Insert Numbered List"
                    >
                        1. List
                    </button>

                    <div className="toolbar-divider" />

                    <button
                        className="toolbar-button"
                        onClick={insertCode}
                        title="Code Block"
                        aria-label="Insert Code Block"
                    >
                        {'</>'}
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={insertTable}
                        title="Insert Table"
                        aria-label="Insert Table"
                    >
                        ⊞ Table
                    </button>
                </div>
            )}

            <div className="markdown-editor-wrapper">
                {editorError ? (
                    <div className="markdown-editor-error">
                        <h3>Editor Error</h3>
                        <p>{editorError}</p>
                        <p>Check the browser console for more details.</p>
                    </div>
                ) : (
                    <>
                        {loading && (
                            <div className="markdown-editor-loading" style={{ position: 'absolute', zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '4px' }}>
                                <p>Loading Milkdown editor...</p>
                                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                                    Initializing... Check console if this persists.
                                </p>
                            </div>
                        )}
                        <Milkdown />
                    </>
                )}
            </div>

            <div className={`markdown-status-bar ${effectiveTheme}`}>
                <div className="status-item">
                    <span>Words: {wordCount}</span>
                    <span>Characters: {charCount} / {maxLength}</span>
                </div>
                {readOnly && (
                    <div className="status-item">
                        <span>Read Only</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const MarkdownEditor: React.FC<MarkdownEditorProps> = (props) => {
    console.log('=== MarkdownEditor component called ===');
    console.log('Props:', props);
    console.log('USE_SIMPLE_EDITOR:', USE_SIMPLE_EDITOR);

    // Temporary: Use simple editor for testing
    if (USE_SIMPLE_EDITOR) {
        console.log('Using SimpleMarkdownEditor for testing');
        return (
            <SimpleMarkdownEditor
                value={props.value}
                onChange={props.onChange}
                readOnly={props.readOnly}
                theme={props.theme}
                height={props.height}
            />
        );
    }

    // Original Milkdown implementation
    console.log('Using Milkdown editor');
    return (
        <MilkdownProvider>
            <EditorComponent
                initialValue={props.value}
                onUpdate={props.onChange}
                readOnly={props.readOnly}
                theme={props.theme}
                showToolbar={props.showToolbar}
                enableSpellCheck={props.enableSpellCheck}
                maxLength={props.maxLength}
                height={props.height}
            />
        </MilkdownProvider>
    );
};
