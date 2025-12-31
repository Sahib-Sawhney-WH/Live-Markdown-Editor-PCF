# Markdown Editor PCF Control

A feature-rich Markdown editor built as a Power Apps Component Framework (PCF) control using React and Milkdown, featuring Microsoft Fluent 2.0 design language.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.6.0-blue.svg)
![PCF](https://img.shields.io/badge/PCF-1.0-green.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![Milkdown](https://img.shields.io/badge/Milkdown-7.17.1-ff6188.svg)
![Fluent UI](https://img.shields.io/badge/Fluent_UI-2.0-0078d4.svg)

## Features

### Rich Markdown Support
- **GitHub Flavored Markdown (GFM)**: Full support for tables, strikethrough, task lists, and autolinks
- **CommonMark**: Standard markdown syntax for headings, lists, links, images, code blocks, and more
- **WYSIWYG Editing**: Visual editing without needing to know markdown syntax
- **Live Rendering**: Content is formatted in real-time as you type

### Fluent 2.0 Design (New in v1.5.0)
- **Fluent UI Icons**: Crisp, modern SVG icons throughout the interface
- **Glassmorphism Effects**: Subtle backdrop blur on toolbar and dropdowns
- **Enhanced Shadows**: Multi-layered shadows for depth and elevation
- **Gradient Accents**: Subtle gradients on active buttons and toolbars
- **Smooth Animations**: 150ms transitions for polished interactions
- **Grouped Toolbar**: Logically organized button groups with visual containers

### Interactive Toolbar
- **Undo/Redo**: Full history support with keyboard shortcuts
- **Headings**: H1, H2, H3, and Paragraph formatting buttons
- **Text Formatting**: Bold, Italic, Strikethrough
- **Links**: Insert links with custom display text or show the URL directly
- **Images**: Insert images via URL or paste from clipboard
- **Lists**: Bulleted and Numbered lists
- **Code Blocks**: Syntax highlighted code insertion
- **Tables**: Visual grid picker for table creation (2-6 rows/columns), with add/delete row/column options
- **Blockquotes**: Quote block insertion
- **Horizontal Rules**: Section dividers
- **Keyboard Shortcuts**: Tooltips showing shortcuts (Ctrl+B, Ctrl+I, etc.)

### Advanced Features
- **Find and Replace (Ctrl+F)**: Search with match count, navigate between matches, replace single or all occurrences
- **Export to HTML**: Download formatted HTML document with custom filename
- **Export to PDF**: Choose between text-based (searchable) or image-based PDF export
- **Image Paste**: Paste images directly from clipboard (Ctrl+V), automatically converts to embedded base64
- **Markdown Paste**: Paste markdown content and it renders immediately
- **Markdown Templates**: 20+ pre-built templates organized by category:
  - Meetings: Meeting Notes, Weekly Status, 1:1 Meeting
  - Development: Bug Report, Code Review, Feature Request, Technical Spec
  - Project: README, API Documentation, User Guide
  - Process: Changelog, Release Notes, Decision Record
  - Quick: Simple Note, Checklist, Comparison Table
- **Table Editing**: Visual grid picker for insertion, add/delete rows and columns, delete entire table
- **Copy to Clipboard**: One-click markdown copy with visual feedback
- **Auto-save Indicator**: Shows Saved/Saving/Unsaved status in real-time

### Editor Features
- **Two-way Data Binding**: Full integration with Power Apps and Dataverse
- **Dynamic Sizing**: Automatically adjusts to container height and width
- **Responsive Design**: Adapts toolbar and layout for narrow widths
- **Theme Support**: Light, Dark, Auto (system preference), and High Contrast modes
- **Theme Toggle**: Click sun/moon icon to switch between light and dark mode
- **Spell Check**: Configurable spell checking
- **Read-only Mode**: Display markdown without editing capability
- **Character/Word Count**: Live statistics in status bar
- **Max Length Validation**: Configurable character limit with validation feedback
- **Zero-lag Typing**: All processing deferred until typing stops - buttery smooth at any speed
- **Scrollable Tables**: Wide tables scroll horizontally instead of being cut off

## Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm
- Power Apps CLI (`pac`)
- Power Platform environment with Dataverse

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF.git
   cd markdown_editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the control**
   ```bash
   npm run build
   ```

4. **Run in test harness** (for development)
   ```bash
   npm start watch
   ```
   Open http://localhost:8181 in your browser.

## Development

### Project Structure

```
markdown_editor/
├── MarkdownEditorControl/
│   ├── components/
│   │   └── MarkdownEditor.tsx      # Main React/Milkdown editor component
│   ├── css/
│   │   └── MarkdownEditor.css      # Component styles with responsive design
│   ├── generated/                  # Auto-generated manifest types
│   ├── index.ts                    # PCF control lifecycle
│   └── ControlManifest.Input.xml   # Control configuration
├── package.json
├── tsconfig.json
├── DATAVERSE_INTEGRATION.md        # Detailed Dataverse setup guide
└── README.md
```

### Key Files

**index.ts** - PCF control class implementing the component lifecycle:
- `init()`: Initializes the control and registers for resize events
- `updateView()`: Called when properties change or container resizes
- `getOutputs()`: Returns current markdown value and statistics
- `destroy()`: Cleanup when control is removed

**MarkdownEditor.tsx** - React component with:
- Milkdown editor integration with GFM support
- Complete toolbar implementation
- Find and Replace functionality
- Export to HTML and PDF
- Template insertion
- Debounced updates for performance

### Available Scripts

```bash
# Build the control
npm run build

# Start watch server with hot reload
npm start watch

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Clean build artifacts
npm run clean

# Rebuild from scratch
npm run rebuild
```

### Configuration

The control accepts the following input parameters (defined in `ControlManifest.Input.xml`):

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | Multiple Lines of Text | "" | The markdown content (bound property) |
| `rows` | Whole.None | 10 | Number of rows (controls height: rows × 28px + 80px) |
| `readOnly` | Two Options | false | Whether the editor is read-only |
| `theme` | SingleLine.Text | "light" | Theme: light, dark, auto, high-contrast |
| `showToolbar` | Two Options | true | Show/hide the formatting toolbar |
| `enableSpellCheck` | Two Options | true | Enable spell checking |
| `maxLength` | Whole.None | 100000 | Maximum character length |

Output parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | Multiple Lines of Text | The current markdown content |
| `wordCount` | Whole.None | Number of words in the content |
| `characterCount` | Whole.None | Number of characters in the content |
| `isValid` | Two Options | Whether content is within max length |

## Usage in Power Apps

### 1. Deploy the Control

1. Build the control: `npm run build`
2. Create a solution in your Power Platform environment
3. Add the control to your solution:
   ```bash
   pac solution add-reference --path ../markdown_editor
   ```
4. Build and import the solution to your environment

### 2. Add to a Model-driven App Form

1. Open your Power Apps form editor
2. Add a new field or use an existing "Multiple Lines of Text" field
3. Select the field and click "Change control"
4. Choose "Markdown Editor" from the list
5. Configure the control properties in the right panel

### 3. Add to a Canvas App

1. Import the component into your Canvas app
2. Insert the Markdown Editor control
3. Set the `value` property to your data source field
4. Configure additional properties as needed

### 4. Bind to Dataverse

The control works with any "Multiple Lines of Text" field in Dataverse:

1. Create or use a table with a text column
2. Set the column format to "Text" with sufficient max length
3. Bind the control to this column in your form

Recommended Dataverse column settings:
- Data type: Text
- Format: Text Area
- Max length: 100000 (or your preferred limit)

### 5. Programmatic Access (Canvas Apps)

```javascript
// Read the current markdown:
MarkdownEditor1.value

// Get statistics:
MarkdownEditor1.wordCount
MarkdownEditor1.characterCount
MarkdownEditor1.isValid
```

For detailed Dataverse setup instructions, see [DATAVERSE_INTEGRATION.md](DATAVERSE_INTEGRATION.md)

## Technical Details

### Technology Stack

- **PCF Framework**: Power Apps Component Framework
- **React 19.2.0**: UI library with hooks
- **Milkdown 7.17.1**: WYSIWYG markdown editor built on ProseMirror
- **@fluentui/react-icons 2.0.315**: Microsoft Fluent UI icon library
- **@milkdown/preset-commonmark**: CommonMark markdown support
- **@milkdown/preset-gfm**: GitHub Flavored Markdown support
- **@milkdown/theme-nord**: Nord theme for editor styling
- **@milkdown/plugin-history**: Undo/redo functionality
- **jsPDF 3.0.4**: PDF generation for text-based export
- **html2canvas 1.4.1**: Screenshot capture for image-based PDF export
- **TypeScript 5.8**: Type-safe development
- **Webpack**: Module bundling (via pcf-scripts)

### Bundle Size

- Production bundle: ~7.0 MiB
- Includes React, Milkdown, Fluent UI Icons, jsPDF, html2canvas, and dependencies

### Browser Support

- Microsoft Edge (Chromium)
- Google Chrome
- Firefox
- Safari

### Performance Optimizations

- Debounced parent updates (150ms) to reduce re-renders during typing
- Debounced statistics updates (250ms) for smooth word/character counts
- Immediate internal state updates for responsive feel
- React 19 with concurrent features

## Troubleshooting

### Build Errors

TypeScript compilation errors:
```bash
# Clear caches and rebuild
rm -rf .pcf node_modules/.cache
npm run rebuild
```

ESLint errors:
```bash
# Auto-fix ESLint issues
npm run lint:fix
```

### Runtime Issues

**Editor not rendering:**
- Check browser console for JavaScript errors
- Verify React 19 is properly bundled
- Ensure the control is bound to a text field

**Height not adjusting:**
- Verify `trackContainerResize(true)` is called in `init()`
- Check that the form/container has a defined height
- Ensure CSS doesn't have conflicting height values

**Toolbar buttons not working:**
- Check Milkdown editor initialization completed
- Verify the editor has focus
- Check browser console for errors

**Slow typing performance:**
- This is optimized with debouncing; if still slow, check for other controls on the form
- Consider reducing maxLength if working with very large documents

**Links not rendering immediately:**
- Links now use proper ProseMirror marks and should render instantly
- If using older version, rebuild the control

## Contributing

### Code Style

- Follow TypeScript best practices
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small
- Use ESLint and fix all warnings

### Testing Checklist

Before submitting changes:
- [ ] Build succeeds without errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Control loads in test harness
- [ ] All toolbar buttons work correctly
- [ ] Height/width sliders work in test harness
- [ ] Markdown renders correctly
- [ ] Two-way binding works with Dataverse
- [ ] Find and Replace works
- [ ] Export to HTML works
- [ ] Export to PDF works (both text and image modes)
- [ ] No console errors

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Milkdown](https://milkdown.dev/) - Plugin-driven markdown editor framework
- [ProseMirror](https://prosemirror.net/) - Underlying editor engine
- [React](https://react.dev/) - UI framework
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation
- [Power Apps](https://powerapps.microsoft.com/) - Platform

## Support

For issues, questions, or contributions:
- Open an issue on [GitHub](https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/issues)
- Check existing issues for solutions
- Review the documentation for detailed guides

---

Version: 1.5.1
Last Updated: December 2025
