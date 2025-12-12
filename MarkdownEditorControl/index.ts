import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { MarkdownEditor } from "./components/MarkdownEditor";

export class MarkdownEditorControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _notifyOutputChanged: () => void;
    private _currentValue: string;
    private _wordCount: number;
    private _characterCount: number;
    private _isValid: boolean;
    private _maxLength: number;
    private _root: Root | null;
    private _boundHandleChange: (value: string) => void;

    constructor() {
        this._currentValue = "";
        this._wordCount = 0;
        this._characterCount = 0;
        this._isValid = true;
        this._maxLength = 100000;
        this._root = null;
        // Bind handleChange once in constructor for better performance
        this._boundHandleChange = this.handleChange.bind(this);
    }

    /**
     * Initializes the control instance.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        _state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;

        // Load initial value from bound Dataverse field
        this._currentValue = context.parameters.value?.raw || "";
        this._maxLength = context.parameters.maxLength?.raw || 100000;

        // Register for container resize events
        context.mode.trackContainerResize(true);

        // Render the React component
        this.renderComponent(context);
    }

    /**
     * Called when any value in the property bag has changed.
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // Read the current value from the bound Dataverse field
        const newValue = context.parameters.value?.raw || "";

        // Only update if value changed from external source
        if (newValue !== this._currentValue) {
            this._currentValue = newValue;
        }

        // Update maxLength if changed
        const newMaxLength = context.parameters.maxLength?.raw || 100000;
        if (newMaxLength !== this._maxLength) {
            this._maxLength = newMaxLength;
        }

        // Re-render component with updated props
        this.renderComponent(context);
    }

    /**
     * Renders the React component
     */
    private renderComponent(context: ComponentFramework.Context<IInputs>): void {
        const readOnly = context.parameters.readOnly?.raw === true || context.mode.isControlDisabled;
        const themeValue = context.parameters.theme?.raw || "light";
        const theme = ["light", "dark", "auto", "high-contrast"].includes(themeValue)
            ? (themeValue as "light" | "dark" | "auto" | "high-contrast")
            : "light";
        const showToolbar = context.parameters.showToolbar?.raw !== false;
        const enableSpellCheck = context.parameters.enableSpellCheck?.raw !== false;
        const rowsParam = context.parameters.rows?.raw;
        const rows = rowsParam || 10;

        // Get allocated dimensions from context
        const allocatedWidth = context.mode.allocatedWidth;

        // Calculate height from rows setting
        // Each row is approximately 54px (calibrated to match Power Apps web resource at 22 rows)
        const height = rows * 54 + 50;
        const width = allocatedWidth > 0 ? allocatedWidth : undefined;

        // Create root if it doesn't exist
        if (!this._root) {
            this._root = createRoot(this._container);
        }

        // Render the component
        this._root.render(
            React.createElement(MarkdownEditor, {
                value: this._currentValue,
                onChange: this._boundHandleChange,
                readOnly: readOnly,
                theme: theme,
                showToolbar: showToolbar,
                enableSpellCheck: enableSpellCheck,
                maxLength: this._maxLength,
                height: height,
                width: width
            })
        );
    }

    /**
     * Handles markdown content change from the editor
     */
    private handleChange(value: string): void {
        this._currentValue = value;

        // Update statistics
        const words = value.trim().split(/\s+/).filter(w => w.length > 0).length;
        this._wordCount = words;
        this._characterCount = value.length;

        // Validate against max length
        this._isValid = this._characterCount <= this._maxLength;

        // Notify Power Apps that the value has changed
        this._notifyOutputChanged();
    }

    /**
     * Returns current output values
     */
    public getOutputs(): IOutputs {
        return {
            value: this._currentValue,
            wordCount: this._wordCount,
            characterCount: this._characterCount,
            isValid: this._isValid
        };
    }

    /**
     * Cleanup when control is removed
     */
    public destroy(): void {
        if (this._root) {
            this._root.unmount();
            this._root = null;
        }
    }
}
