import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor, editorViewCtx, parserCtx } from '@milkdown/core';
import { TextSelection } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import type { FindResults, FindData } from '../types/editor.types';

const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

export interface UseFindReplaceProps {
    getEditor: () => Editor | undefined;
    currentMarkdown: React.MutableRefObject<string>;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface FindReplaceActions {
    isOpen: boolean;
    findText: string;
    replaceText: string;
    results: FindResults;
    findInputRef: React.RefObject<HTMLInputElement | null>;
    setFindText: (text: string) => void;
    setReplaceText: (text: string) => void;
    toggle: () => void;
    close: () => void;
    findNext: () => void;
    findPrevious: () => void;
    handleReplace: () => void;
    handleReplaceAll: () => void;
}

export function useFindReplace({
    getEditor,
    currentMarkdown,
    containerRef
}: UseFindReplaceProps): FindReplaceActions {
    const [isOpen, setIsOpen] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [results, setResults] = useState<FindResults>({ count: 0, current: 0 });

    const findInputRef = useRef<HTMLInputElement>(null);
    const findDataRef = useRef<FindData>({ positions: [], searchLength: 0 });
    const isOpenRef = useRef(isOpen);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    // Apply highlight decorations to all matches
    const applySearchHighlights = useCallback((positions: number[], searchLength: number, currentIndex: number) => {
        const editor = getEditor();
        if (!editor) return;

        try {
            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const decorations: Decoration[] = [];
            positions.forEach((pos, idx) => {
                const from = pos;
                const to = pos + searchLength;
                const className = idx === currentIndex ? 'search-highlight-current' : 'search-highlight';
                decorations.push(Decoration.inline(from, to, { class: className }));
            });

            const decorationSet = decorations.length > 0
                ? DecorationSet.create(view.state.doc, decorations)
                : DecorationSet.empty;

            view.setProps({ decorations: () => decorationSet });
        } catch {
            // Silently handle errors
        }
    }, [getEditor]);

    // Clear all search highlights
    const clearSearchHighlights = useCallback(() => {
        const editor = getEditor();
        if (!editor) return;

        try {
            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            view.setProps({ decorations: () => DecorationSet.empty });
        } catch {
            // Silently handle errors
        }
    }, [getEditor]);

    // Select and highlight a match
    const selectMatchAtIndex = useCallback((index: number) => {
        const { positions, searchLength } = findDataRef.current;
        if (positions.length === 0 || index < 0 || index >= positions.length) return;

        const editor = getEditor();
        if (!editor) return;

        try {
            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const from = positions[index];
            const to = from + searchLength;

            applySearchHighlights(positions, searchLength, index);

            const selection = TextSelection.create(state.doc, from, to);
            const tr = state.tr.setSelection(selection);
            dispatch(tr);

            // Scroll to match
            try {
                const wrapper = containerRef.current?.querySelector('.markdown-editor-wrapper') as HTMLElement;
                if (wrapper) {
                    const coords = view.coordsAtPos(from);
                    if (coords) {
                        const wrapperRect = wrapper.getBoundingClientRect();
                        const relativeTop = coords.top - wrapperRect.top;
                        const wrapperHeight = wrapper.clientHeight;

                        if (relativeTop < 0 || relativeTop > wrapperHeight - 50) {
                            wrapper.scrollTop = wrapper.scrollTop + relativeTop - wrapperHeight / 2;
                        }
                    }
                }
            } catch {
                // Silently handle scroll errors
            }
        } catch {
            // Silently handle errors
        }
    }, [getEditor, applySearchHighlights, containerRef]);

    // Handle find
    const handleFind = useCallback((autoSelect = false) => {
        if (!findText) {
            findDataRef.current = { positions: [], searchLength: 0 };
            setResults({ count: 0, current: 0 });
            clearSearchHighlights();
            return;
        }

        const editor = getEditor();
        if (!editor) return;

        try {
            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state } = view;
            const searchText = findText.toLowerCase();
            const positions: number[] = [];

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

            findDataRef.current = { positions, searchLength: findText.length };
            setResults({
                count: positions.length,
                current: positions.length > 0 ? 1 : 0
            });

            if (positions.length > 0) {
                applySearchHighlights(positions, findText.length, 0);
            } else {
                clearSearchHighlights();
            }

            if (autoSelect && positions.length > 0) {
                selectMatchAtIndex(0);
            }
        } catch {
            const content = currentMarkdown.current;
            const regex = new RegExp(findText.replace(ESCAPE_REGEX, '\\$&'), 'gi');
            const matches = content.match(regex);
            findDataRef.current = { positions: [], searchLength: findText.length };
            setResults({ count: matches?.length || 0, current: matches?.length ? 1 : 0 });
            clearSearchHighlights();
        }
    }, [findText, getEditor, selectMatchAtIndex, applySearchHighlights, clearSearchHighlights, currentMarkdown]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!findText) {
            findDataRef.current = { positions: [], searchLength: 0 };
            setResults({ count: 0, current: 0 });
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            handleFind(false);
        }, 100);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [findText, handleFind]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpenRef.current) {
                setIsOpen(false);
                clearSearchHighlights();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [clearSearchHighlights]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && findInputRef.current) {
            requestAnimationFrame(() => {
                findInputRef.current?.focus();
            });
        }
    }, [isOpen]);

    const toggle = useCallback(() => {
        setIsOpen(prev => {
            if (prev) clearSearchHighlights();
            return !prev;
        });
    }, [clearSearchHighlights]);

    const close = useCallback(() => {
        setIsOpen(false);
        clearSearchHighlights();
    }, [clearSearchHighlights]);

    const findNext = useCallback(() => {
        if (findDataRef.current.positions.length === 0 && findText) {
            handleFind(true);
            return;
        }

        const { positions } = findDataRef.current;
        if (positions.length === 0) return;

        setResults(prev => {
            if (prev.count === 0) return prev;
            const nextIndex = prev.current >= prev.count ? 1 : prev.current + 1;
            requestAnimationFrame(() => selectMatchAtIndex(nextIndex - 1));
            return { ...prev, current: nextIndex };
        });
    }, [selectMatchAtIndex, findText, handleFind]);

    const findPrevious = useCallback(() => {
        if (findDataRef.current.positions.length === 0 && findText) {
            handleFind(true);
            return;
        }

        const { positions } = findDataRef.current;
        if (positions.length === 0) return;

        setResults(prev => {
            if (prev.count === 0) return prev;
            const prevIndex = prev.current <= 1 ? prev.count : prev.current - 1;
            requestAnimationFrame(() => selectMatchAtIndex(prevIndex - 1));
            return { ...prev, current: prevIndex };
        });
    }, [selectMatchAtIndex, findText, handleFind]);

    const handleReplace = useCallback(() => {
        const editor = getEditor();
        if (!findText || !editor) return;

        try {
            const content = currentMarkdown.current;
            const newContent = content.replace(findText, replaceText);

            if (newContent !== content) {
                const view = editor.ctx.get(editorViewCtx);
                const parser = editor.ctx.get(parserCtx);

                if (view && parser) {
                    const newDoc = parser(newContent);
                    if (newDoc) {
                        const { state, dispatch } = view;
                        const tr = state.tr.replaceWith(0, state.doc.content.size, newDoc.content);
                        dispatch(tr);
                    }
                }
                handleFind();
            }
        } catch {
            // Silently handle errors
        }
    }, [findText, replaceText, getEditor, currentMarkdown, handleFind]);

    const handleReplaceAll = useCallback(() => {
        const editor = getEditor();
        if (!findText || !editor) return;

        try {
            const content = currentMarkdown.current;
            const regex = new RegExp(findText.replace(ESCAPE_REGEX, '\\$&'), 'g');
            const newContent = content.replace(regex, replaceText);

            if (newContent !== content) {
                const view = editor.ctx.get(editorViewCtx);
                const parser = editor.ctx.get(parserCtx);

                if (view && parser) {
                    const newDoc = parser(newContent);
                    if (newDoc) {
                        const { state, dispatch } = view;
                        const tr = state.tr.replaceWith(0, state.doc.content.size, newDoc.content);
                        dispatch(tr);
                    }
                }

                findDataRef.current = { positions: [], searchLength: 0 };
                setResults({ count: 0, current: 0 });
                clearSearchHighlights();
            }
        } catch {
            // Silently handle errors
        }
    }, [findText, replaceText, getEditor, currentMarkdown, clearSearchHighlights]);

    return {
        isOpen,
        findText,
        replaceText,
        results,
        findInputRef,
        setFindText,
        setReplaceText,
        toggle,
        close,
        findNext,
        findPrevious,
        handleReplace,
        handleReplaceAll
    };
}
