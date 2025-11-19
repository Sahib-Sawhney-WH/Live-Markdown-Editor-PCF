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
    private _root: Root | null;

    /**
     * Empty constructor.
     */
    constructor() {
        this._currentValue = "";
        this._wordCount = 0;
        this._characterCount = 0;
        this._isValid = true;
        this._root = null;
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;

        // Load initial value from bound Dataverse field
        const inputValue = context.parameters.value?.raw || "";
        this._currentValue = inputValue;
        console.log("Loaded markdown from Dataverse, length:", this._currentValue.length);

        // Register for container resize events
        context.mode.trackContainerResize(true);

        // Render the React component
        this.renderComponent(context);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        console.log("updateView called");
        console.log("allocatedHeight:", context.mode.allocatedHeight);
        console.log("allocatedWidth:", context.mode.allocatedWidth);

        // Read the current value from the bound Dataverse field
        const newValue = context.parameters.value?.raw || "";

        // Only update if value changed from external source (not from our own onChange)
        if (newValue !== this._currentValue) {
            this._currentValue = newValue;
            console.log("Markdown updated from Dataverse, length:", this._currentValue.length);
        }

        // Re-render component with updated props
        this.renderComponent(context);
    }

    /**
     * Renders the React component
     * @param context The context object
     */
    private renderComponent(context: ComponentFramework.Context<IInputs>): void {
        const readOnly = context.parameters.readOnly?.raw === true || context.mode.isControlDisabled;
        const themeValue = context.parameters.theme?.raw || "light";
        const theme = ["light", "dark", "auto", "high-contrast"].includes(themeValue)
            ? (themeValue as "light" | "dark" | "auto" | "high-contrast")
            : "light";
        const showToolbar = context.parameters.showToolbar?.raw !== false;
        const enableSpellCheck = context.parameters.enableSpellCheck?.raw !== false;
        const maxLength = context.parameters.maxLength?.raw || 100000;

        // Get allocated height from context (use explicit height if provided by framework)
        const allocatedHeight = context.mode.allocatedHeight;
        const height = allocatedHeight > 0 ? allocatedHeight : undefined;

        // Create root if it doesn't exist
        if (!this._root) {
            this._root = createRoot(this._container);
        }

        // Render the component with explicit height if available
        this._root.render(
            React.createElement(MarkdownEditor, {
                value: this._currentValue,
                onChange: this.handleChange.bind(this),
                readOnly: readOnly,
                theme: theme,
                showToolbar: showToolbar,
                enableSpellCheck: enableSpellCheck,
                maxLength: maxLength,
                height: height
            })
        );
    }

    /**
     * Handles markdown content change
     * @param value The new markdown value
     */
    private handleChange(value: string): void {
        this._currentValue = value;

        // Update statistics
        const words = value.trim().split(/\s+/).filter(w => w.length > 0).length;
        this._wordCount = words;
        this._characterCount = value.length;

        // Basic validation (check if within max length)
        const maxLength = this._container ? 100000 : 100000; // TODO: Get from props
        this._isValid = this._characterCount <= maxLength;

        // Notify Power Apps that the value has changed
        this._notifyOutputChanged();
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
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
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Unmount React component
        if (this._root) {
            this._root.unmount();
            this._root = null;
        }
    }
}
