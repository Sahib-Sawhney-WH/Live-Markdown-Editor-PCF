import * as React from 'react';
import { useState, useEffect } from 'react';

export interface SimpleMarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
    height?: number;
}

export const SimpleMarkdownEditor: React.FC<SimpleMarkdownEditorProps> = ({
    value,
    onChange,
    readOnly = false,
    theme = 'light',
    height
}) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange(newValue);
    };

    const effectiveTheme = theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            padding: '16px',
            backgroundColor: effectiveTheme === 'dark' ? '#1e1e1e' : '#ffffff',
            border: '1px solid #d1d1d1',
            borderRadius: '4px'
        }}>
            <h3 style={{ margin: '0 0 12px 0', color: effectiveTheme === 'dark' ? '#e0e0e0' : '#323130' }}>
                Simple Markdown Editor (Testing)
            </h3>
            <textarea
                value={localValue}
                onChange={handleChange}
                readOnly={readOnly}
                style={{
                    width: '100%',
                    height: '300px',
                    padding: '12px',
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    border: '1px solid #d1d1d1',
                    borderRadius: '4px',
                    backgroundColor: effectiveTheme === 'dark' ? '#2d2d2d' : '#ffffff',
                    color: effectiveTheme === 'dark' ? '#e0e0e0' : '#323130',
                    resize: 'vertical'
                }}
                placeholder="Enter markdown here..."
            />
            <div style={{
                marginTop: '8px',
                fontSize: '12px',
                color: effectiveTheme === 'dark' ? '#b4b4b4' : '#605e5c'
            }}>
                Characters: {localValue.length} | Words: {localValue.trim().split(/\s+/).filter(w => w.length > 0).length}
            </div>
            <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: effectiveTheme === 'dark' ? '#2d2d2d' : '#f5f5f5',
                border: '1px solid #d1d1d1',
                borderRadius: '4px',
                color: effectiveTheme === 'dark' ? '#e0e0e0' : '#323130'
            }}>
                <strong>React is working!</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                    Value from props: "{value.substring(0, 50)}{value.length > 50 ? '...' : ''}"
                </p>
            </div>
        </div>
    );
};
