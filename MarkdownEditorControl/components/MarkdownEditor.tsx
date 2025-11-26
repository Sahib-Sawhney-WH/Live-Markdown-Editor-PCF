import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, parserCtx } from '@milkdown/core';
import { callCommand } from '@milkdown/utils';
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
import { history } from '@milkdown/plugin-history';
import '@milkdown/theme-nord/style.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TextSelection } from '@milkdown/prose/state';

export interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
    showToolbar?: boolean;
    enableSpellCheck?: boolean;
    maxLength?: number;
    height?: number; // Height in pixels for the editor container
    width?: number; // Width in pixels for responsive behavior
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

// Markdown templates
const MARKDOWN_TEMPLATES: { name: string; content: string }[] = [
    {
        name: 'Meeting Notes',
        content: `# Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Attendees:**

## Agenda
1.
2.
3.

## Discussion Points


## Action Items
- [ ]
- [ ]
- [ ]

## Next Steps

`
    },
    {
        name: 'Bug Report',
        content: `# Bug Report

## Summary
Brief description of the bug.

## Environment
- **Browser:**
- **OS:**
- **Version:**

## Steps to Reproduce
1.
2.
3.

## Expected Behavior


## Actual Behavior


## Screenshots
(if applicable)

## Additional Context

`
    },
    {
        name: 'Project README',
        content: `# Project Name

Brief description of the project.

## Features
- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`javascript
// Example code
\`\`\`

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| option1 | Description | value |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT
`
    },
    {
        name: 'Documentation',
        content: `# Documentation Title

## Overview
Provide an overview of the topic.

## Getting Started

### Prerequisites
- Requirement 1
- Requirement 2

### Installation
Step-by-step installation instructions.

## API Reference

### Method Name
\`\`\`
methodName(param1, param2)
\`\`\`

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| param1 | string | Description |
| param2 | number | Description |

**Returns:** Description of return value

## Examples

### Basic Example
\`\`\`javascript
// Code example
\`\`\`

## FAQ

**Q: Question?**
A: Answer.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Problem | Fix |

`
    },
    {
        name: 'Changelog',
        content: `# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
-

### Changed
-

### Fixed
-

## [1.0.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release
- Feature 1
- Feature 2

`
    }
];

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
    height,
    width
}) => {
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [editorError, setEditorError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [findResults, setFindResults] = useState<{ count: number; current: number; positions: number[] }>({ count: 0, current: 0, positions: [] });
    const [showTemplates, setShowTemplates] = useState(false);
    const editorRef = useRef<Editor | null>(null);
    const currentMarkdownRef = useRef<string>(initialValue);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const findInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const findPositionsRef = useRef<number[]>([]);

    // Determine effective theme
    const effectiveTheme = theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (statsTimeoutRef.current) {
                clearTimeout(statsTimeoutRef.current);
            }
        };
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
        try {
            const editor = Editor
                .make()
                .config(nord)
                .config((ctx) => {
                    ctx.set(rootCtx, root);
                    ctx.set(defaultValueCtx, initialValue);
                })
                .config((ctx) => {
                    const listenerPlugin = ctx.get(listenerCtx);
                    listenerPlugin.markdownUpdated((_ctx, markdown) => {
                        // Always update ref immediately (no delay)
                        currentMarkdownRef.current = markdown;

                        // Debounce the parent update (PCF binding) - 150ms delay
                        if (updateTimeoutRef.current) {
                            clearTimeout(updateTimeoutRef.current);
                        }
                        updateTimeoutRef.current = setTimeout(() => {
                            onUpdate(markdown);
                        }, 150);

                        // Debounce stats update separately - 250ms delay
                        if (statsTimeoutRef.current) {
                            clearTimeout(statsTimeoutRef.current);
                        }
                        statsTimeoutRef.current = setTimeout(() => {
                            updateStats(markdown);
                        }, 250);

                        // Debounce save status indicator
                        setSaveStatus('unsaved');
                        if (saveTimeoutRef.current) {
                            clearTimeout(saveTimeoutRef.current);
                        }
                        saveTimeoutRef.current = setTimeout(() => {
                            setSaveStatus('saving');
                            setTimeout(() => setSaveStatus('saved'), 300);
                        }, 500);
                    });
                })
                .use(commonmark)
                .use(gfm)
                .use(history)
                .use(listener);

            editorRef.current = editor;
            return editor;
        } catch (error) {
            setEditorError(error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }, []);

    // Update stats when value changes
    useEffect(() => {
        updateStats(initialValue);
    }, [initialValue, updateStats]);

    // Toolbar actions - simplified with error handling
    const executeCommand = useCallback((command: Parameters<typeof callCommand>[0], payload?: unknown) => {
        if (!get) return;
        try {
            get()?.action(callCommand(command, payload));
        } catch {
            // Silently handle command errors
        }
    }, [get]);

    const insertHeading = (level: number) => executeCommand(wrapInHeadingCommand.key, level);
    const clearHeading = () => executeCommand(wrapInHeadingCommand.key, 0);
    const toggleBold = () => executeCommand(toggleStrongCommand.key);
    const toggleItalic = () => executeCommand(toggleEmphasisCommand.key);
    const handleUndo = () => executeCommand(undoCommand.key);
    const handleRedo = () => executeCommand(redoCommand.key);
    const insertBlockquote = () => executeCommand(wrapInBlockquoteCommand.key);
    const insertHorizontalRule = () => executeCommand(insertHrCommand.key);
    const toggleStrikethrough = () => executeCommand(toggleStrikethroughCommand.key);
    const insertBulletList = () => executeCommand(wrapInBulletListCommand.key);
    const insertOrderedList = () => executeCommand(wrapInOrderedListCommand.key);

    const insertLink = () => {
        if (!get) return;

        try {
            const view = get()?.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const selectedText = state.doc.textBetween(selection.from, selection.to);

            // Ask for URL
            const url = window.prompt('Enter URL:', 'https://');
            if (!url) return;

            // Ask for link text (pre-fill with selected text or URL)
            const defaultText = selectedText || url;
            const linkText = window.prompt('Enter link text (or leave empty to show URL):', defaultText);
            if (linkText === null) return; // User cancelled

            const displayText = linkText.trim() || url;

            // Use ProseMirror's link mark for proper rendering
            const linkMark = state.schema.marks.link;
            if (linkMark) {
                const mark = linkMark.create({ href: url, title: '' });
                const textNode = state.schema.text(displayText, [mark]);

                let tr;
                if (selectedText) {
                    // Replace selected text with linked version
                    tr = state.tr.replaceSelectionWith(textNode, false);
                } else {
                    // Insert new link at cursor
                    tr = state.tr.replaceSelectionWith(textNode, false);
                }
                dispatch(tr);

                // Focus back on editor
                view.focus();
            }
        } catch {
            // Silently handle errors
        }
    };

    const insertImage = () => {
        if (!get) return;
        const url = window.prompt('Enter image URL:', 'https://');
        if (!url) return;
        const alt = window.prompt('Enter alt text:', 'image') || 'image';
        executeCommand(insertImageCommand.key, { src: url, alt });
    };

    const insertCode = () => {
        if (!get) return;
        try {
            const view = get()?.ctx.get(editorViewCtx);
            if (view) {
                const { state, dispatch } = view;
                const codeBlockType = state.schema.nodes.code_block;
                if (codeBlockType) {
                    // Create a proper code block node with placeholder text
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
    };

    const insertTable = () => {
        if (!get) return;
        const rowsStr = window.prompt('How many rows?', '3');
        const colsStr = window.prompt('How many columns?', '3');
        if (!rowsStr || !colsStr) return;

        const rows = parseInt(rowsStr, 10);
        const cols = parseInt(colsStr, 10);
        if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0) {
            executeCommand(insertTableCommand.key, { row: rows, col: cols });
        }
    };

    const deleteTable = () => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const pos = selection.$from;

            // Walk up from current position to find a table node
            for (let depth = pos.depth; depth >= 0; depth--) {
                const node = pos.node(depth);
                if (node.type.name === 'table') {
                    // Found a table - delete it
                    const start = pos.before(depth);
                    const end = pos.after(depth);
                    const tr = state.tr.delete(start, end);
                    dispatch(tr);
                    return;
                }
            }
            // No table found at cursor position
            alert('Place your cursor inside a table to delete it.');
        } catch {
            // Silently handle errors
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(currentMarkdownRef.current);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch {
            // Silently handle clipboard errors
        }
    };

    // Find & Replace functions
    const toggleFindReplace = () => {
        setShowFindReplace(!showFindReplace);
        if (!showFindReplace) {
            setTimeout(() => findInputRef.current?.focus(), 100);
        }
    };

    const handleFind = useCallback((autoSelect = false) => {
        if (!findText) {
            setFindResults({ count: 0, current: 0, positions: [] });
            return;
        }

        if (!get) return;

        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state } = view;
            const searchText = findText.toLowerCase();
            const positions: number[] = [];

            // Search through the document
            state.doc.descendants((node, pos) => {
                if (node.isText && node.text) {
                    const text = node.text.toLowerCase();
                    let index = 0;
                    while ((index = text.indexOf(searchText, index)) !== -1) {
                        positions.push(pos + index);
                        index += 1;
                    }
                }
            });

            // Update both state and ref
            findPositionsRef.current = positions;
            setFindResults({
                count: positions.length,
                current: positions.length > 0 ? 1 : 0,
                positions
            });

            // Only select match if explicitly requested (e.g., pressing Enter)
            if (autoSelect && positions.length > 0) {
                selectMatchAtIndex(0);
            }
        } catch {
            // Fallback to simple text search
            const content = currentMarkdownRef.current;
            const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = content.match(regex);
            setFindResults({ count: matches?.length || 0, current: matches?.length ? 1 : 0, positions: [] });
        }
    }, [findText, get]);

    // Select and highlight a match in the editor
    const selectMatchAtIndex = useCallback((index: number) => {
        const positions = findPositionsRef.current;
        if (!get || positions.length === 0 || index < 0 || index >= positions.length) return;

        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const from = positions[index];
            const to = from + findText.length;

            // Create a selection at the match position (without scrollIntoView which scrolls the whole page)
            const selection = TextSelection.create(state.doc, from, to);
            const tr = state.tr.setSelection(selection);
            dispatch(tr);

            // Manually scroll only within the editor container
            setTimeout(() => {
                const selectionCoords = view.coordsAtPos(from);
                const editorWrapper = containerRef.current?.querySelector('.markdown-editor-wrapper');
                if (editorWrapper && selectionCoords) {
                    const wrapperRect = editorWrapper.getBoundingClientRect();
                    const relativeTop = selectionCoords.top - wrapperRect.top;

                    // Only scroll if the selection is outside the visible area
                    if (relativeTop < 0 || relativeTop > wrapperRect.height - 50) {
                        editorWrapper.scrollTop += relativeTop - wrapperRect.height / 2;
                    }
                }
            }, 10);

            // Focus the editor to show the selection
            view.focus();

            // Return focus to find input so user can keep navigating
            setTimeout(() => findInputRef.current?.focus(), 50);
        } catch {
            // Silently handle errors
        }
    }, [findText, get]);

    // Navigate to next match
    const findNext = useCallback(() => {
        const positions = findPositionsRef.current;
        if (positions.length === 0) return;

        // Use functional update to get the most current state
        setFindResults(prev => {
            const count = prev.count;
            if (count === 0) return prev;

            // Calculate next index (1-based for display)
            const nextIndex = prev.current >= count ? 1 : prev.current + 1;

            // Select the match at the 0-based index
            setTimeout(() => selectMatchAtIndex(nextIndex - 1), 0);

            return { ...prev, current: nextIndex };
        });
    }, [selectMatchAtIndex]);

    // Navigate to previous match
    const findPrevious = useCallback(() => {
        const positions = findPositionsRef.current;
        if (positions.length === 0) return;

        // Use functional update to get the most current state
        setFindResults(prev => {
            const count = prev.count;
            if (count === 0) return prev;

            // Calculate previous index (1-based for display)
            const prevIndex = prev.current <= 1 ? count : prev.current - 1;

            // Select the match at the 0-based index
            setTimeout(() => selectMatchAtIndex(prevIndex - 1), 0);

            return { ...prev, current: prevIndex };
        });
    }, [selectMatchAtIndex]);

    const handleReplace = () => {
        if (!findText || !get) return;
        const content = currentMarkdownRef.current;
        const newContent = content.replace(findText, replaceText);
        if (newContent !== content) {
            // Update via editor
            const view = get()?.ctx.get(editorViewCtx);
            if (view) {
                const { state, dispatch } = view;
                const tr = state.tr.replaceWith(0, state.doc.content.size, state.schema.text(newContent));
                dispatch(tr);
            }
            handleFind();
        }
    };

    const handleReplaceAll = () => {
        if (!findText || !get) return;
        const content = currentMarkdownRef.current;
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const newContent = content.replace(regex, replaceText);
        if (newContent !== content) {
            const view = get()?.ctx.get(editorViewCtx);
            if (view) {
                const { state, dispatch } = view;
                const tr = state.tr.replaceWith(0, state.doc.content.size, state.schema.text(newContent));
                dispatch(tr);
            }
            setFindResults({ count: 0, current: 0, positions: [] });
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                toggleFindReplace();
            }
            if (e.key === 'Escape' && showFindReplace) {
                setShowFindReplace(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showFindReplace]);

    // Update find results when search text changes (don't auto-select to keep focus in input)
    useEffect(() => {
        handleFind(false);
    }, [findText, handleFind]);

    // Export to HTML
    const exportToHtml = () => {
        // Ask for filename
        const filename = window.prompt('Enter filename for HTML:', 'document');
        if (filename === null) return; // User cancelled

        const safeFilename = (filename.trim() || 'document').replace(/[<>:"/\\|?*]/g, '_');

        const markdown = currentMarkdownRef.current;

        // Process tables first (multi-line)
        const processTable = (tableText: string): string => {
            const lines = tableText.trim().split('\n');
            if (lines.length < 2) return tableText;

            let html = '<table>\n<thead>\n';
            let isHeader = true;
            let inBody = false;

            for (const line of lines) {
                // Skip separator lines but mark transition to body
                if (line.match(/^\|[\s\-:|]+\|$/)) {
                    if (isHeader) {
                        html += '</thead>\n<tbody>\n';
                        isHeader = false;
                        inBody = true;
                    }
                    continue;
                }

                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                    const cells = line.split('|').slice(1, -1).map(c => c.trim());
                    const tag = isHeader ? 'th' : 'td';
                    html += '  <tr>\n';
                    for (const cell of cells) {
                        // Process inline markdown in cells
                        const cellHtml = cell
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/`([^`]+)`/g, '<code>$1</code>');
                        html += `    <${tag}>${cellHtml}</${tag}>\n`;
                    }
                    html += '  </tr>\n';
                }
            }

            if (inBody) {
                html += '</tbody>\n';
            }
            html += '</table>';
            return html;
        };

        // Find and replace tables first
        let html = markdown;
        const tableRegex = /(\|[^\n]+\|\n)+/g;
        html = html.replace(tableRegex, (match) => processTable(match));

        // Process code blocks before other replacements (to protect content)
        const codeBlocks: string[] = [];
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
            const index = codeBlocks.length;
            codeBlocks.push(`<pre><code class="language-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
            return `%%CODEBLOCK_${index}%%`;
        });

        // Process inline code (protect from other replacements)
        const inlineCodes: string[] = [];
        html = html.replace(/`([^`]+)`/g, (_match, code) => {
            const index = inlineCodes.length;
            inlineCodes.push(`<code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`);
            return `%%INLINECODE_${index}%%`;
        });

        // Process the rest of the markdown
        html = html
            // Headers (order matters - longest first)
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold and italic (order matters)
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // Links and images
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            // Task lists (before regular lists)
            .replace(/^- \[x\] (.*$)/gim, '<li class="task-done"><input type="checkbox" checked disabled /> $1</li>')
            .replace(/^- \[ \] (.*$)/gim, '<li class="task"><input type="checkbox" disabled /> $1</li>')
            // Unordered lists
            .replace(/^[-*+] (.*$)/gim, '<li>$1</li>')
            // Ordered lists
            .replace(/^\d+\. (.*$)/gim, '<li class="ordered">$1</li>')
            // Blockquotes (handle multi-line)
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            // Horizontal rule
            .replace(/^---$/gim, '<hr />')
            .replace(/^\*\*\*$/gim, '<hr />')
            .replace(/^___$/gim, '<hr />');

        // Wrap consecutive unordered <li> items in <ul> tags
        html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>\n$1</ul>\n');
        // Wrap consecutive ordered <li> items in <ol> tags
        html = html.replace(/((?:<li class="ordered">.*?<\/li>\n?)+)/g, (match) => {
            return '<ol>\n' + match.replace(/<li class="ordered">/g, '<li>') + '</ol>\n';
        });
        // Wrap task list items properly
        html = html.replace(/((?:<li class="task(?:-done)?">.*?<\/li>\n?)+)/g, '<ul class="task-list">\n$1</ul>\n');

        // Clean up consecutive blockquotes
        html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

        // Restore code blocks and inline code
        for (let i = 0; i < codeBlocks.length; i++) {
            html = html.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i]);
        }
        for (let i = 0; i < inlineCodes.length; i++) {
            html = html.replace(`%%INLINECODE_${i}%%`, inlineCodes[i]);
        }

        // Convert content to paragraphs, but not block elements
        const lines = html.split('\n');
        const processedLines: string[] = [];
        let inParagraph = false;
        let inBlockElement = false;

        // Block element tags that should not be wrapped in paragraphs
        const isBlockStart = (s: string) => {
            return s.startsWith('<table') || s.startsWith('<thead') || s.startsWith('<tbody') ||
                   s.startsWith('<tr') || s.startsWith('<pre') || s.startsWith('<ul') ||
                   s.startsWith('<ol') || s.startsWith('<blockquote') || s.startsWith('<h1') ||
                   s.startsWith('<h2') || s.startsWith('<h3') || s.startsWith('<h4') ||
                   s.startsWith('<hr');
        };

        const isBlockEnd = (s: string) => {
            return s.startsWith('</table') || s.startsWith('</thead') || s.startsWith('</tbody') ||
                   s.startsWith('</tr') || s.startsWith('</pre') || s.startsWith('</ul') ||
                   s.startsWith('</ol') || s.startsWith('</blockquote') || s.startsWith('</h1') ||
                   s.startsWith('</h2') || s.startsWith('</h3') || s.startsWith('</h4');
        };

        const isInsideBlock = (s: string) => {
            return s.startsWith('<th') || s.startsWith('</th') ||
                   s.startsWith('<td') || s.startsWith('</td') ||
                   s.startsWith('<code') || s.startsWith('</code') ||
                   s.startsWith('<li') || s.startsWith('</li');
        };

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines but close any open paragraph
            if (!trimmed) {
                if (inParagraph) {
                    processedLines.push('</p>');
                    inParagraph = false;
                }
                continue;
            }

            // Track block element nesting
            if (isBlockStart(trimmed)) {
                if (inParagraph) {
                    processedLines.push('</p>');
                    inParagraph = false;
                }
                inBlockElement = true;
                processedLines.push(line);
            } else if (isBlockEnd(trimmed)) {
                processedLines.push(line);
                // Only exit block mode on table/list end, not sub-elements
                if (trimmed.startsWith('</table') || trimmed.startsWith('</ul') ||
                    trimmed.startsWith('</ol') || trimmed.startsWith('</pre')) {
                    inBlockElement = false;
                }
            } else if (inBlockElement || isInsideBlock(trimmed)) {
                // Inside a block element, don't wrap in paragraphs
                processedLines.push(line);
            } else {
                // Regular text - wrap in paragraphs
                if (!inParagraph) {
                    processedLines.push('<p>' + trimmed);
                    inParagraph = true;
                } else {
                    processedLines.push('<br />' + trimmed);
                }
            }
        }
        if (inParagraph) {
            processedLines.push('</p>');
        }

        html = processedLines.join('\n');

        // Wrap in HTML structure with improved styles
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeFilename}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.7;
            color: #333;
            background: #fff;
        }
        h1 { font-size: 2em; margin: 1em 0 0.5em 0; color: #222; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; margin: 1em 0 0.5em 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
        h3 { font-size: 1.25em; margin: 1em 0 0.5em 0; color: #444; }
        h4 { font-size: 1em; margin: 1em 0 0.5em 0; color: #555; font-weight: 600; }
        p { margin: 0.8em 0; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
        }
        pre {
            background: #f8f8f8;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            border: 1px solid #e1e4e8;
            margin: 1em 0;
        }
        pre code {
            background: none;
            padding: 0;
            font-size: 0.85em;
            line-height: 1.5;
        }
        blockquote {
            border-left: 4px solid #0078d4;
            padding: 0.5em 1em;
            margin: 1em 0;
            color: #555;
            background: #f9f9f9;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 0.5em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px 14px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
            font-weight: 600;
        }
        tr:nth-child(even) td {
            background: #fafafa;
        }
        ul, ol {
            margin: 0.8em 0;
            padding-left: 2em;
        }
        li {
            margin: 0.3em 0;
        }
        ul.task-list {
            list-style: none;
            padding-left: 0;
        }
        ul.task-list li {
            padding-left: 1.5em;
            position: relative;
        }
        ul.task-list input[type="checkbox"] {
            position: absolute;
            left: 0;
            top: 0.3em;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }
        a {
            color: #0078d4;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        hr {
            border: none;
            border-top: 1px solid #e1e4e8;
            margin: 2em 0;
        }
        del {
            color: #888;
        }
    </style>
</head>
<body>
${html}
</body>
</html>`;

        // Download the file
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeFilename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Export to PDF - with option for editable (text) or image-based
    const exportToPdf = async () => {
        // Ask for filename
        const filename = window.prompt('Enter filename for PDF:', 'document');
        if (filename === null) return; // User cancelled

        const safeFilename = (filename.trim() || 'document').replace(/[<>:"/\\|?*]/g, '_');

        // Ask user which type of PDF they want
        const choice = window.confirm(
            'PDF Export Options:\n\n' +
            'Click OK for EDITABLE PDF (selectable/searchable text, smaller file)\n\n' +
            'Click Cancel for IMAGE PDF (exact visual appearance, includes images)'
        );

        if (choice) {
            await exportToPdfText(safeFilename);
        } else {
            await exportToPdfImage(safeFilename);
        }
    };

    // Helper to strip markdown formatting from text
    const stripMarkdown = (text: string): string => {
        return text
            // Images: ![alt](url) -> [Image: alt]
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]')
            // Links: [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Bold: **text** or __text__
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            // Italic: *text* or _text_
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            // Strikethrough: ~~text~~
            .replace(/~~([^~]+)~~/g, '$1')
            // Inline code: `code`
            .replace(/`([^`]+)`/g, '$1')
            // HTML tags
            .replace(/<[^>]+>/g, '');
    };

    // Export to PDF with actual text (editable/selectable)
    const exportToPdfText = async (filename: string) => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = 210;
            const pageHeight = 297;
            const marginX = 15;
            const marginY = 15;
            const contentWidth = pageWidth - (marginX * 2);
            const lineHeight = 5;
            let currentY = marginY;

            // Helper to add a new page if needed
            const checkPageBreak = (neededHeight: number) => {
                if (currentY + neededHeight > pageHeight - marginY) {
                    pdf.addPage();
                    currentY = marginY;
                    return true;
                }
                return false;
            };

            // Helper to wrap text to fit width (word-based)
            const wrapText = (text: string, fontSize: number, maxWidth: number): string[] => {
                pdf.setFontSize(fontSize);
                const words = text.split(' ');
                const lines: string[] = [];
                let currentLine = '';

                for (const word of words) {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    const testWidth = pdf.getTextWidth(testLine);
                    if (testWidth > maxWidth && currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) {
                    lines.push(currentLine);
                }
                return lines.length > 0 ? lines : [''];
            };

            // Helper to wrap code text (character-count based for monospace fonts)
            const wrapCodeText = (text: string, maxChars: number): string[] => {
                const lines: string[] = [];
                let remaining = text;

                while (remaining.length > 0) {
                    if (remaining.length <= maxChars) {
                        lines.push(remaining);
                        break;
                    }
                    lines.push(remaining.substring(0, maxChars));
                    remaining = remaining.substring(maxChars);
                }
                return lines.length > 0 ? lines : [''];
            };

            // Helper to sanitize text for PDF (remove problematic characters)
            const sanitizeForPdf = (text: string): string => {
                let result = text;
                // Replace common emoji with text equivalents
                result = result.replace(/✓|✔|☑/g, '[x]');
                result = result.replace(/✗|✘|☐/g, '[ ]');
                result = result.replace(/↶/g, '<-');
                result = result.replace(/↷/g, '->');
                // Remove emoji and other problematic unicode characters
                // Keep basic ASCII (32-126) plus common accented chars
                let cleaned = '';
                for (let i = 0; i < result.length; i++) {
                    const code = result.charCodeAt(i);
                    // Keep printable ASCII
                    if (code >= 32 && code <= 126) {
                        cleaned += result[i];
                    }
                    // Keep common Latin extended characters (accented letters)
                    else if (code >= 192 && code <= 255) {
                        cleaned += result[i];
                    }
                    // Keep newlines and tabs
                    else if (code === 10 || code === 13 || code === 9) {
                        cleaned += result[i];
                    }
                    // Skip everything else (emoji, special unicode, etc.)
                }
                return cleaned;
            };

            // Helper to render a table with proper column widths
            const renderTable = (rows: string[][]) => {
                if (rows.length === 0) return;

                const colCount = rows[0].length;
                const fontSize = 8;
                const cellPadding = 2;
                const rowHeight = 5;

                pdf.setFontSize(fontSize);

                // Calculate column widths based on content
                const colWidths: number[] = [];
                for (let col = 0; col < colCount; col++) {
                    let maxWidth = 15; // Minimum column width
                    for (const row of rows) {
                        if (row[col]) {
                            pdf.setFont('helvetica', 'normal');
                            const textWidth = pdf.getTextWidth(row[col]) + (cellPadding * 2);
                            maxWidth = Math.max(maxWidth, textWidth);
                        }
                    }
                    colWidths.push(maxWidth);
                }

                // Scale columns to fit content width if needed
                const totalWidth = colWidths.reduce((a, b) => a + b, 0);
                if (totalWidth > contentWidth) {
                    const scale = contentWidth / totalWidth;
                    for (let i = 0; i < colWidths.length; i++) {
                        colWidths[i] *= scale;
                    }
                }

                // Render each row
                for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
                    checkPageBreak(rowHeight + 2);
                    const row = rows[rowIdx];
                    const isHeader = rowIdx === 0;

                    let cellX = marginX;
                    for (let colIdx = 0; colIdx < row.length; colIdx++) {
                        const colWidth = colWidths[colIdx] || 20;

                        // Draw cell background for header
                        if (isHeader) {
                            pdf.setFillColor(240, 240, 240);
                            pdf.rect(cellX, currentY - 3.5, colWidth, rowHeight, 'F');
                        }

                        // Draw cell border
                        pdf.setDrawColor(200, 200, 200);
                        pdf.rect(cellX, currentY - 3.5, colWidth, rowHeight);

                        // Draw cell text (truncate if needed)
                        pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
                        pdf.setFontSize(fontSize);
                        pdf.setTextColor(51, 51, 51);

                        const cellText = row[colIdx] || '';
                        const maxTextWidth = colWidth - (cellPadding * 2);
                        let displayText = cellText;

                        // Truncate with ellipsis if too long
                        while (pdf.getTextWidth(displayText) > maxTextWidth && displayText.length > 3) {
                            displayText = displayText.substring(0, displayText.length - 4) + '...';
                        }

                        pdf.text(displayText, cellX + cellPadding, currentY);
                        cellX += colWidth;
                    }
                    currentY += rowHeight;
                }
                currentY += 3;
            };

            // Parse markdown and render to PDF
            const markdown = currentMarkdownRef.current;
            const rawLines = markdown.split('\n');
            let inCodeBlock = false;
            let codeBlockContent: string[] = [];
            let inTable = false;
            const tableRows: string[][] = [];

            for (const rawLine of rawLines) {
                const line = rawLine;

                // Handle code blocks
                if (line.trim().startsWith('```')) {
                    if (inCodeBlock) {
                        // End code block - render it with proper wrapping
                        if (codeBlockContent.length > 0) {
                            // Calculate wrapped lines first (95 chars fits well at 8pt courier)
                            const wrappedCodeLines: string[] = [];
                            const maxCodeChars = 95;

                            for (const codeLine of codeBlockContent) {
                                const wrapped = wrapCodeText(codeLine, maxCodeChars);
                                wrappedCodeLines.push(...wrapped);
                            }

                            const codeLineHeight = 3.5;
                            const totalCodeHeight = wrappedCodeLines.length * codeLineHeight + 6;

                            checkPageBreak(Math.min(totalCodeHeight, 50));

                            // Draw background
                            pdf.setFillColor(245, 245, 245);
                            const bgHeight = Math.min(totalCodeHeight, pageHeight - currentY - marginY);
                            pdf.rect(marginX, currentY - 2, contentWidth, bgHeight, 'F');

                            pdf.setFont('courier', 'normal');
                            pdf.setFontSize(8);
                            pdf.setTextColor(51, 51, 51);
                            currentY += 2;

                            for (const wline of wrappedCodeLines) {
                                if (checkPageBreak(codeLineHeight)) {
                                    // Draw new background on new page
                                    pdf.setFillColor(245, 245, 245);
                                    pdf.rect(marginX, currentY - 2, contentWidth, 20, 'F');
                                }
                                pdf.text(wline, marginX + 3, currentY);
                                currentY += codeLineHeight;
                            }
                            currentY += 4;
                        }
                        codeBlockContent = [];
                        inCodeBlock = false;
                    } else {
                        inCodeBlock = true;
                    }
                    continue;
                }

                if (inCodeBlock) {
                    codeBlockContent.push(line);
                    continue;
                }

                // Handle tables
                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                    // Check if it's a separator row
                    if (line.match(/^\|[\s\-:|]+\|$/)) {
                        continue; // Skip separator rows
                    }
                    inTable = true;
                    const cells = line.split('|').slice(1, -1).map(c => stripMarkdown(c.trim()));
                    tableRows.push(cells);
                    continue;
                } else if (inTable) {
                    // End of table - render it
                    renderTable(tableRows);
                    tableRows.length = 0;
                    inTable = false;
                }

                // Skip empty lines but add spacing
                if (!line.trim()) {
                    currentY += 2;
                    continue;
                }

                // Skip image-only lines (but mention them)
                if (line.match(/^!\[.*\]\(.*\)$/)) {
                    checkPageBreak(lineHeight);
                    pdf.setFont('helvetica', 'italic');
                    pdf.setFontSize(9);
                    pdf.setTextColor(128, 128, 128);
                    const altMatch = line.match(/!\[([^\]]*)\]/);
                    const altText = altMatch ? altMatch[1] : 'image';
                    pdf.text(`[Image: ${altText}]`, marginX, currentY);
                    currentY += lineHeight;
                    continue;
                }

                // Headers
                if (line.startsWith('#### ')) {
                    checkPageBreak(8);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(12);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(5)));
                    const wrapped = wrapText(text, 12, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 6;
                    }
                    currentY += 2;
                } else if (line.startsWith('### ')) {
                    checkPageBreak(8);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(14);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(4)));
                    const wrapped = wrapText(text, 14, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 7;
                    }
                    currentY += 2;
                } else if (line.startsWith('## ')) {
                    checkPageBreak(10);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(16);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(3)));
                    const wrapped = wrapText(text, 16, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 8;
                    }
                    currentY += 3;
                } else if (line.startsWith('# ')) {
                    checkPageBreak(12);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(20);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(2)));
                    const wrapped = wrapText(text, 20, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 9;
                    }
                    currentY += 4;
                }
                // Blockquotes
                else if (line.startsWith('> ')) {
                    checkPageBreak(lineHeight);
                    pdf.setDrawColor(0, 120, 212);
                    pdf.setLineWidth(0.8);
                    const quoteText = sanitizeForPdf(stripMarkdown(line.substring(2)));
                    const wrapped = wrapText(quoteText, 10, contentWidth - 10);
                    const quoteHeight = wrapped.length * lineHeight;
                    pdf.line(marginX, currentY - 3, marginX, currentY + quoteHeight - 3);
                    pdf.setFont('helvetica', 'italic');
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 100, 100);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX + 5, currentY);
                        currentY += lineHeight;
                    }
                }
                // Task lists
                else if (line.match(/^\s*-\s*\[[ xX]\]/)) {
                    checkPageBreak(lineHeight);
                    const checked = line.includes('[x]') || line.includes('[X]');
                    const text = sanitizeForPdf(stripMarkdown(line.replace(/^\s*-\s*\[[ xX]\]\s*/, '')));
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.setTextColor(51, 51, 51);
                    pdf.setDrawColor(150, 150, 150);
                    pdf.rect(marginX, currentY - 3, 3, 3);
                    if (checked) {
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('x', marginX + 0.7, currentY - 0.3);
                        pdf.setFont('helvetica', 'normal');
                    }
                    const wrapped = wrapText(text, 10, contentWidth - 8);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX + 6, currentY);
                        currentY += lineHeight;
                    }
                }
                // Bullet lists
                else if (line.match(/^\s*[-*+]\s/)) {
                    checkPageBreak(lineHeight);
                    const indent = Math.floor((line.match(/^\s*/)?.[0].length || 0) / 2);
                    const text = sanitizeForPdf(stripMarkdown(line.replace(/^\s*[-*+]\s/, '')));
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.setTextColor(51, 51, 51);
                    const bulletX = marginX + (indent * 4);
                    pdf.text('-', bulletX, currentY);
                    const wrapped = wrapText(text, 10, contentWidth - 6 - (indent * 4));
                    for (const wline of wrapped) {
                        pdf.text(wline, bulletX + 4, currentY);
                        currentY += lineHeight;
                    }
                }
                // Numbered lists
                else if (line.match(/^\s*\d+\.\s/)) {
                    checkPageBreak(lineHeight);
                    const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
                    if (match) {
                        const indent = Math.floor((match[1].length || 0) / 2);
                        const num = match[2];
                        const text = sanitizeForPdf(stripMarkdown(match[3]));
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(10);
                        pdf.setTextColor(51, 51, 51);
                        const numX = marginX + (indent * 4);
                        pdf.text(`${num}.`, numX, currentY);
                        const wrapped = wrapText(text, 10, contentWidth - 8 - (indent * 4));
                        for (const wline of wrapped) {
                            pdf.text(wline, numX + 6, currentY);
                            currentY += lineHeight;
                        }
                    }
                }
                // Horizontal rule
                else if (line.match(/^[-*_]{3,}$/)) {
                    checkPageBreak(8);
                    currentY += 3;
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.3);
                    pdf.line(marginX, currentY, marginX + contentWidth, currentY);
                    currentY += 5;
                }
                // Regular paragraph
                else {
                    checkPageBreak(lineHeight);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line));
                    const wrapped = wrapText(text, 10, contentWidth);
                    for (const wline of wrapped) {
                        checkPageBreak(lineHeight);
                        pdf.text(wline, marginX, currentY);
                        currentY += lineHeight;
                    }
                }
            }

            // Handle any remaining table
            if (tableRows.length > 0) {
                renderTable(tableRows);
            }

            pdf.save(`${filename}.pdf`);
        } catch {
            // Silently handle errors
        }
    };

    // Export to PDF as image (preserves exact visual appearance)
    const exportToPdfImage = async (filename: string) => {
        const editorElement = containerRef.current?.querySelector('.milkdown') as HTMLElement;
        if (!editorElement) return;

        try {
            // Create a temporary container for PDF rendering at a fixed width
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `position: absolute; left: -9999px; top: 0; width: 700px; padding: 20px; background: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6;`;
            tempDiv.innerHTML = editorElement.innerHTML;
            document.body.appendChild(tempDiv);

            // Apply print-friendly styles
            const style = document.createElement('style');
            style.textContent = `
                * { box-sizing: border-box; }
                h1 { font-size: 28px; margin: 20px 0 10px 0; color: #333; font-weight: bold; }
                h2 { font-size: 22px; margin: 18px 0 8px 0; color: #333; font-weight: bold; }
                h3 { font-size: 18px; margin: 14px 0 6px 0; color: #333; font-weight: bold; }
                p { margin: 8px 0; line-height: 1.6; font-size: 14px; }
                code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: Consolas, monospace; font-size: 13px; }
                pre { background: #f8f8f8; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 10px 0; font-size: 13px; }
                pre code { background: none; padding: 0; }
                blockquote { border-left: 4px solid #0078d4; padding-left: 16px; margin: 10px 0; color: #555; font-style: italic; }
                table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
                th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
                th { background: #f0f0f0; font-weight: bold; }
                ul, ol { margin: 8px 0; padding-left: 24px; }
                li { margin: 4px 0; font-size: 14px; }
                a { color: #0078d4; text-decoration: none; }
                img { max-width: 100%; height: auto; max-height: 300px; }
            `;
            tempDiv.appendChild(style);

            // Render to canvas at 1.5x scale (good quality but smaller file)
            const canvas = await html2canvas(tempDiv, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Clean up temp element
            document.body.removeChild(tempDiv);

            // Create PDF in mm units (A4 = 210mm x 297mm)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const marginX = 15; // 15mm margins
            const marginY = 15;
            const contentWidth = pageWidth - (marginX * 2); // 180mm
            const contentHeight = pageHeight - (marginY * 2); // 267mm

            // Calculate the scaled dimensions
            // Canvas is at 1.5x scale
            const scaleFactor = 1.5;
            const imgPixelWidth = canvas.width / scaleFactor;
            const imgPixelHeight = canvas.height / scaleFactor;

            // Scale to fit content width
            const ratio = contentWidth / imgPixelWidth;
            const scaledImgHeight = imgPixelHeight * ratio;

            // Use JPEG for smaller file size (0.85 quality)
            const getImageData = (c: HTMLCanvasElement) => c.toDataURL('image/jpeg', 0.85);

            // If content fits on one page
            if (scaledImgHeight <= contentHeight) {
                pdf.addImage(
                    getImageData(canvas),
                    'JPEG',
                    marginX,
                    marginY,
                    contentWidth,
                    scaledImgHeight
                );
            } else {
                // Multi-page: slice the canvas into page-sized chunks
                const pageHeightInPixels = contentHeight / ratio;
                const totalPages = Math.ceil(imgPixelHeight / pageHeightInPixels);

                for (let page = 0; page < totalPages; page++) {
                    if (page > 0) {
                        pdf.addPage();
                    }

                    // Create a canvas for this page's portion
                    const pageCanvas = document.createElement('canvas');
                    const ctx = pageCanvas.getContext('2d');
                    if (!ctx) continue;

                    const sourceY = page * pageHeightInPixels * scaleFactor;
                    const sourceHeight = Math.min(pageHeightInPixels * scaleFactor, canvas.height - sourceY);

                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sourceHeight;

                    // White background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

                    ctx.drawImage(
                        canvas,
                        0, sourceY, // source x, y
                        canvas.width, sourceHeight, // source width, height
                        0, 0, // dest x, y
                        canvas.width, sourceHeight // dest width, height
                    );

                    const pageImgHeight = (sourceHeight / scaleFactor) * ratio;

                    pdf.addImage(
                        getImageData(pageCanvas),
                        'JPEG',
                        marginX,
                        marginY,
                        contentWidth,
                        pageImgHeight
                    );
                }
            }

            // Download
            pdf.save(`${filename}.pdf`);
        } catch {
            // Silently handle errors
        }
    };

    // Insert template
    const insertTemplate = (template: typeof MARKDOWN_TEMPLATES[0]) => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            const parser = editor.ctx.get(parserCtx);

            if (view && parser) {
                const { state, dispatch } = view;
                // Parse the markdown template into a ProseMirror document
                const doc = parser(template.content);

                if (doc) {
                    // Replace all content or insert at cursor
                    if (currentMarkdownRef.current.trim() === '') {
                        // Replace entire document
                        const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
                        dispatch(tr);
                    } else {
                        // Insert at current position
                        const tr = state.tr.replaceSelectionWith(doc);
                        dispatch(tr);
                    }
                }
            }
            setShowTemplates(false);
        } catch {
            // Silently handle errors
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowTemplates(false);
            }
        };
        if (showTemplates) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showTemplates]);

    // Helper function to detect if text looks like markdown
    const looksLikeMarkdown = (text: string): boolean => {
        // Check for common markdown patterns
        const markdownPatterns = [
            /^#{1,6}\s+/m,           // Headers: # Header
            /\*\*[^*]+\*\*/,         // Bold: **text**
            /\*[^*]+\*/,             // Italic: *text*
            /^\s*[-*+]\s+/m,         // Unordered lists: - item
            /^\s*\d+\.\s+/m,         // Ordered lists: 1. item
            /\[.+\]\(.+\)/,          // Links: [text](url)
            /!\[.*\]\(.+\)/,         // Images: ![alt](url)
            /```[\s\S]*```/,         // Code blocks: ```code```
            /`[^`]+`/,               // Inline code: `code`
            /^\|.+\|$/m,             // Tables: | cell |
            /^>\s+/m,                // Blockquotes: > quote
            /^---$/m,                // Horizontal rules
            /~~[^~]+~~/,             // Strikethrough: ~~text~~
            /^\s*-\s*\[[ x]\]/m,     // Task lists: - [ ] or - [x]
        ];

        // Count how many patterns match
        let matchCount = 0;
        for (const pattern of markdownPatterns) {
            if (pattern.test(text)) {
                matchCount++;
            }
        }

        // Consider it markdown if at least 2 patterns match, or if it has headers/code blocks
        return matchCount >= 2 || /^#{1,6}\s+/m.test(text) || /```[\s\S]*```/.test(text);
    };

    // Handle paste events for images and markdown
    const handlePaste = useCallback((e: Event) => {
        const clipboardEvent = e as ClipboardEvent;
        const items = clipboardEvent.clipboardData?.items;
        if (!items) return;

        const itemsArray = Array.from(items);

        // First, check for images
        for (const item of itemsArray) {
            if (item.type.startsWith('image/')) {
                // Stop the event completely to prevent double paste
                e.preventDefault();
                e.stopPropagation();

                const file = item.getAsFile();
                if (!file) continue;

                try {
                    // Convert image to base64 data URL
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        if (dataUrl) {
                            // Insert the image into the editor
                            executeCommand(insertImageCommand.key, {
                                src: dataUrl,
                                alt: file.name || 'pasted-image'
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                } catch {
                    // Silently handle errors
                }
                return; // Image handled, exit
            }
        }

        // Check for text that looks like markdown
        const textData = clipboardEvent.clipboardData?.getData('text/plain');
        if (textData && looksLikeMarkdown(textData)) {
            e.preventDefault();

            try {
                const editor = get?.();
                if (!editor) return;

                const view = editor.ctx.get(editorViewCtx);
                const parser = editor.ctx.get(parserCtx);

                if (view && parser) {
                    const { state, dispatch } = view;

                    // Check if editor is empty or nearly empty
                    const currentContent = currentMarkdownRef.current.trim();
                    const isEmptyOrMinimal = currentContent === '' || currentContent.length < 10;

                    // Parse the markdown into a ProseMirror document
                    const doc = parser(textData);

                    if (doc) {
                        if (isEmptyOrMinimal) {
                            // Replace entire document content for empty editors
                            const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
                            dispatch(tr);
                        } else {
                            // For non-empty editors, try to insert at cursor
                            // First, check if we're at the start of a block
                            const { $from } = state.selection;
                            const atBlockStart = $from.parentOffset === 0;

                            if (atBlockStart && doc.content.childCount > 0) {
                                // Insert block content properly
                                const { from, to } = state.selection;
                                const tr = state.tr.replaceWith(from, to, doc.content);
                                dispatch(tr);
                            } else {
                                // Insert as text slice with proper handling
                                const { from, to } = state.selection;
                                const tr = state.tr.replaceWith(from, to, doc.content);
                                dispatch(tr);
                            }
                        }
                    }
                }
            } catch {
                // If parsing fails, let default paste behavior handle it
            }
        }
    }, [executeCommand, get]);

    // Attach paste handler to editor (capture phase to intercept before ProseMirror)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Use capture phase to handle paste before ProseMirror does
        container.addEventListener('paste', handlePaste, true);
        return () => container.removeEventListener('paste', handlePaste, true);
    }, [handlePaste]);

    // Determine responsive class based on width
    const getResponsiveClass = () => {
        if (!width) return '';
        if (width < 400) return 'very-compact';
        if (width < 600) return 'compact';
        return '';
    };

    return (
        <div
            ref={containerRef}
            className={`markdown-editor-container ${effectiveTheme} ${readOnly ? 'read-only' : ''} ${getResponsiveClass()}`}
            style={height ? { height: `${height}px` } : undefined}
        >
            {showToolbar && !readOnly && (
                <div className={`markdown-toolbar ${effectiveTheme}`}>
                    <button
                        className="toolbar-button"
                        onClick={handleUndo}
                        title="Undo (Ctrl+Z)"
                        aria-label="Undo"
                    >
                        ↶
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={handleRedo}
                        title="Redo (Ctrl+Y)"
                        aria-label="Redo"
                    >
                        ↷
                    </button>

                    <div className="toolbar-divider" />

                    <button
                        className="toolbar-button"
                        onClick={() => insertHeading(1)}
                        title="Heading 1 (Ctrl+Alt+1)"
                        aria-label="Insert Heading 1"
                    >
                        H1
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={() => insertHeading(2)}
                        title="Heading 2 (Ctrl+Alt+2)"
                        aria-label="Insert Heading 2"
                    >
                        H2
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={() => insertHeading(3)}
                        title="Heading 3 (Ctrl+Alt+3)"
                        aria-label="Insert Heading 3"
                    >
                        H3
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={clearHeading}
                        title="Paragraph (Ctrl+Alt+0)"
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
                    <button
                        className="toolbar-button"
                        onClick={toggleStrikethrough}
                        title="Strikethrough (Ctrl+Shift+S)"
                        aria-label="Toggle Strikethrough"
                    >
                        <s>S</s>
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
                        onClick={insertBulletList}
                        title="Bullet List"
                        aria-label="Insert Bullet List"
                    >
                        • List
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={insertOrderedList}
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
                    <button
                        className="toolbar-button"
                        onClick={deleteTable}
                        title="Delete Table (click inside table first)"
                        aria-label="Delete Table"
                    >
                        ⊟ Del Table
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={insertBlockquote}
                        title="Blockquote"
                        aria-label="Insert Blockquote"
                    >
                        ❝
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={insertHorizontalRule}
                        title="Horizontal Rule"
                        aria-label="Insert Horizontal Rule"
                    >
                        ―
                    </button>

                    <div className="toolbar-divider" />

                    <button
                        className={`toolbar-button ${copyStatus === 'copied' ? 'copy-success' : ''}`}
                        onClick={copyToClipboard}
                        title="Copy to Clipboard"
                        aria-label="Copy markdown to clipboard"
                    >
                        {copyStatus === 'copied' ? '✓' : '📋'}
                    </button>
                    <button
                        className={`toolbar-button ${showFindReplace ? 'active' : ''}`}
                        onClick={toggleFindReplace}
                        title="Find & Replace (Ctrl+F)"
                        aria-label="Find and Replace"
                    >
                        🔍
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={exportToHtml}
                        title="Export to HTML"
                        aria-label="Export to HTML"
                    >
                        ⬇ HTML
                    </button>
                    <button
                        className="toolbar-button"
                        onClick={exportToPdf}
                        title="Export to PDF"
                        aria-label="Export to PDF"
                    >
                        ⬇ PDF
                    </button>

                    <div className="toolbar-divider" />

                    <div className="toolbar-dropdown-container">
                        <button
                            className={`toolbar-button ${showTemplates ? 'active' : ''}`}
                            onClick={() => setShowTemplates(!showTemplates)}
                            title="Insert Template"
                            aria-label="Insert Template"
                        >
                            📄 Templates
                        </button>
                        {showTemplates && (
                            <div className={`toolbar-dropdown ${effectiveTheme}`}>
                                {MARKDOWN_TEMPLATES.map((template, index) => (
                                    <button
                                        key={index}
                                        className="dropdown-item"
                                        onClick={() => insertTemplate(template)}
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* Find & Replace Panel */}
            {showFindReplace && (
                <div className={`find-replace-panel ${effectiveTheme}`}>
                    <div className="find-replace-row">
                        <input
                            ref={findInputRef}
                            type="text"
                            placeholder="Find..."
                            value={findText}
                            onChange={(e) => setFindText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (e.shiftKey) {
                                        findPrevious();
                                    } else {
                                        findNext();
                                    }
                                }
                            }}
                            className="find-input"
                        />
                        <button
                            className="find-nav-button"
                            onClick={findPrevious}
                            disabled={findResults.count === 0}
                            title="Previous match (Shift+Enter)"
                        >
                            ▲
                        </button>
                        <button
                            className="find-nav-button"
                            onClick={findNext}
                            disabled={findResults.count === 0}
                            title="Next match (Enter)"
                        >
                            ▼
                        </button>
                        <span className="find-results">
                            {findResults.count > 0 ? `${findResults.current} of ${findResults.count}` : 'No results'}
                        </span>
                    </div>
                    <div className="find-replace-row">
                        <input
                            type="text"
                            placeholder="Replace with..."
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            className="find-input"
                        />
                        <button className="find-button" onClick={handleReplace} disabled={findResults.count === 0}>
                            Replace
                        </button>
                        <button className="find-button" onClick={handleReplaceAll} disabled={findResults.count === 0}>
                            Replace All
                        </button>
                    </div>
                    <button className="find-close" onClick={() => setShowFindReplace(false)}>×</button>
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
                    <span className={`save-status save-status-${saveStatus}`}>
                        {saveStatus === 'saved' && '✓ Saved'}
                        {saveStatus === 'saving' && '⟳ Saving...'}
                        {saveStatus === 'unsaved' && '● Unsaved'}
                    </span>
                </div>
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
                width={props.width}
            />
        </MilkdownProvider>
    );
};
