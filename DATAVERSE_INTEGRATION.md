# Dataverse Integration Guide

This guide explains how to integrate the Markdown Editor PCF control with Microsoft Dataverse.

## Prerequisites

- A Power Platform environment with Dataverse
- A Model-driven app or Canvas app
- The Markdown Editor control deployed to your environment

## Setting Up the Dataverse Column

### 1. Create a Text Column

1. Navigate to your Dataverse table in Power Apps (make.powerapps.com)
2. Select the table where you want to store markdown content
3. Click "Add column" and configure:
   - **Display name**: Markdown Content (or your preferred name)
   - **Data type**: Text
   - **Format**: Text Area
   - **Max length**: 100000 (adjust based on your needs)

### 2. Column Size Recommendations

| Use Case | Recommended Max Length |
|----------|----------------------|
| Short notes/descriptions | 10,000 - 20,000 |
| Standard documents | 50,000 - 100,000 |
| Large documents with images | 100,000+ |

Note: Embedded base64 images (from paste) can significantly increase content size. A single image can add 50KB-500KB depending on resolution.

## Adding the Control to a Form

### Model-driven Apps

1. Open the form editor for your table
2. Add the text field to the form (or select an existing one)
3. Click on the field, then select "Change control"
4. Choose "Markdown Editor" from the list
5. Configure the control properties:

| Property | Description | Recommendation |
|----------|-------------|----------------|
| `value` | Bind to your text column | Required |
| `theme` | light, dark, auto, high-contrast | Use "auto" for system preference |
| `showToolbar` | Enable/disable formatting toolbar | true for editing, false for display |
| `enableSpellCheck` | Enable spell checking | true |
| `readOnly` | Prevent editing | Bind to form mode or security |
| `maxLength` | Character limit | Match your Dataverse column |

6. Save and publish the form

### Canvas Apps

1. Open your Canvas app in the editor
2. Import the Markdown Editor component
3. Insert the control onto your screen
4. Configure properties:

```
// Basic setup
MarkdownEditor1.value: DataSource.MarkdownField
MarkdownEditor1.theme: "light"
MarkdownEditor1.showToolbar: true
MarkdownEditor1.maxLength: 100000

// For edit scenarios
MarkdownEditor1.readOnly: false

// For display-only scenarios
MarkdownEditor1.readOnly: true
MarkdownEditor1.showToolbar: false
```

## Data Binding

The control uses two-way data binding with automatic synchronization.

### How It Works

1. **Loading**: When the form loads, the control reads from `context.parameters.value.raw`
2. **Editing**: Changes are debounced (150ms) before notifying Power Apps
3. **Saving**: When the form saves, `getOutputs()` returns the current value
4. **External Updates**: If the Dataverse value changes externally, `updateView()` syncs it

### Reading Data

```javascript
// The control automatically displays the markdown content
// from the bound Dataverse field when the form/record loads
```

### Writing Data

```javascript
// Changes made in the editor are automatically synced
// to the bound field with a 150ms debounce for performance
// Final save occurs when the form is saved
```

### Programmatic Access (Canvas Apps)

```javascript
// Read the current markdown:
MarkdownEditor1.value

// Read statistics:
MarkdownEditor1.wordCount        // Number of words
MarkdownEditor1.characterCount   // Number of characters
MarkdownEditor1.isValid          // true if within maxLength

// Example: Show character count
Label1.Text: MarkdownEditor1.characterCount & " / " & MarkdownEditor1.maxLength

// Example: Validate before save
If(MarkdownEditor1.isValid, SubmitForm(Form1), Notify("Content too long"))
```

## Best Practices

### Performance

- **Appropriate max length**: Set limits that match your actual needs
- **Debouncing**: The control debounces updates (150ms) to prevent excessive re-renders
- **Large documents**: For documents over 50KB, consider:
  - Storing images externally and using URLs instead of base64
  - Breaking content into multiple records
  - Using lazy loading patterns

### Data Validation

- **Match limits**: Set the control's `maxLength` to match your Dataverse column limit
- **Monitor validity**: Use the `isValid` output to validate before form submission
- **User feedback**: Display word/character counts to help users manage content size

### Security

- **Form security**: The control respects form-level security settings
- **Read-only mode**: Use `readOnly` property for display-only scenarios
- **Row-level security**: Dataverse row-level security applies to the underlying data
- **Field security**: Field-level security profiles are respected

### Content Guidelines

- **Images**: Pasted images are stored as base64 in the text field
- **Links**: External links work but are not validated
- **Tables**: Markdown tables render correctly and export properly
- **Code blocks**: Support syntax highlighting in the editor

## Troubleshooting

### Content Not Saving

1. Verify the control is properly bound to a text column
2. Check that the column has sufficient max length
3. Ensure the user has write permissions on the table
4. Check browser console for JavaScript errors
5. Verify the form is not in read-only mode

### Control Not Displaying

1. Confirm the control is properly deployed to your environment
2. Check browser console for JavaScript errors
3. Verify the form is published after adding the control
4. Clear browser cache and refresh
5. Check that the solution containing the control is active

### Performance Issues

1. Reduce max length if storing very large documents
2. Check network latency if working with remote Dataverse instances
3. Consider using the control only where markdown editing is needed
4. Avoid having multiple Markdown Editor controls on the same form

### Height/Width Issues

1. Ensure the form section has a defined height
2. Check that the control's row span is set appropriately
3. The control uses `trackContainerResize(true)` for dynamic sizing
4. Avoid CSS conflicts with other customizations

### Export Issues

**HTML Export**:
- Tables should render with proper borders
- Code blocks preserve formatting
- Images are embedded (if base64) or linked

**PDF Export**:
- Text-based PDF: Searchable but may have layout differences
- Image-based PDF: Exact visual appearance but not searchable
- Large documents may span multiple pages

## Version Compatibility

| Control Version | Power Apps | Dataverse | Notes |
|----------------|------------|-----------|-------|
| 1.3.0 | Current | Current | Recommended |
| 1.2.0 | Current | Current | PDF export, image paste |
| 1.1.0 | Current | Current | Find/Replace, templates |
| 1.0.0 | Current | Current | Initial release |

## Migration Notes

### Upgrading from 1.2.x to 1.3.x

- No breaking changes
- New debouncing improves typing performance
- Link insertion now uses proper ProseMirror marks
- HTML export improved with better table handling

### Upgrading from 1.1.x to 1.2.x

- No breaking changes
- New PDF export feature
- Image paste support added
- Responsive design improvements

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.3.0 | November 2025 | Debounced updates, improved link insertion, HTML export fixes |
| 1.2.0 | January 2025 | PDF export, image paste, responsive design |
| 1.1.0 | January 2025 | Find and Replace, templates, table editing |
| 1.0.0 | January 2025 | Initial release with basic markdown editing |
