# Markdown Editor PCF Control

A powerful, feature-rich Markdown editor built as a Power Apps Component Framework (PCF) control using React and Milkdown.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PCF](https://img.shields.io/badge/PCF-1.0-green.svg)
![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)
![Milkdown](https://img.shields.io/badge/Milkdown-7.17.1-ff6188.svg)

## Features

### Rich Markdown Support
- **GitHub Flavored Markdown (GFM)** - Full support for tables, strikethrough, task lists, and autolinks
- **CommonMark** - Standard markdown syntax for headings, lists, links, images, code blocks, etc.
- **WYSIWYG Editing** - Visual feedback while editing markdown
- **Live Preview** - See your markdown rendered in real-time

### Interactive Toolbar
- **Headings** - H1, H2, H3 quick insert buttons
- **Text Formatting** - Bold, Italic, Strikethrough
- **Links & Images** - Easy insertion with prompts
- **Lists** - Bulleted, Numbered, and Task lists
- **Tables** - One-click 3x3 table insertion

### Editor Features
- **Two-way Data Binding** - Seamlessly integrates with Power Apps forms
- **Dynamic Sizing** - Automatically adjusts to container height and width
- **Theme Support** - Light, Dark, Auto (system preference), and High Contrast modes
- **Spell Check** - Toggle spell checking on/off
- **Read-only Mode** - Display markdown without editing
- **Character/Word Count** - Live statistics in status bar
- **Max Length Validation** - Configurable character limit
- **Scrollable Content** - Proper scrolling when content exceeds container

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Power Apps CLI (`pac`)
- Power Platform environment

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
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
   Then open http://localhost:8181 in your browser.

## Development

### Project Structure

```
markdown_editor/
├── MarkdownEditorControl/
│   ├── components/
│   │   ├── MarkdownEditor.tsx      # Main Milkdown editor component
│   │   └── SimpleMarkdownEditor.tsx # Fallback simple editor
│   ├── css/
│   │   └── MarkdownEditor.css      # Component styles
│   ├── index.ts                     # PCF control lifecycle
│   ├── ControlManifest.Input.xml   # Control configuration
│   └── testMarkdown.ts              # Test content (temporary)
├── package.json
├── tsconfig.json
└── README.md
```

### Key Files

#### `index.ts`
Main PCF control class implementing the component lifecycle:
- `init()` - Initializes the control and registers for resize events
- `updateView()` - Called when properties change or container resizes
- `getOutputs()` - Returns current markdown value and statistics
- `destroy()` - Cleanup when control is removed

#### `MarkdownEditor.tsx`
React component wrapping Milkdown editor with:
- Toolbar implementation
- GFM plugin integration
- Theme management
- Event handling for markdown changes

### Available Scripts

```bash
# Build the control
npm run build

# Start watch server with hot reload
npm start watch

# Run ESLint
npm run lint

# Clean build artifacts
npm run clean
```

### Configuration

The control accepts the following input parameters (defined in `ControlManifest.Input.xml`):

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | Multiple Lines of Text | "" | The markdown content |
| `readOnly` | Two Options | false | Whether the editor is read-only |
| `theme` | Enum | "light" | Theme: light, dark, auto, high-contrast |
| `showToolbar` | Two Options | true | Show/hide the formatting toolbar |
| `enableSpellCheck` | Two Options | true | Enable spell checking |
| `maxLength` | Whole.None | 100000 | Maximum character length |

Output parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | Multiple Lines of Text | The current markdown content |
| `wordCount` | Whole.None | Number of words |
| `characterCount` | Whole.None | Number of characters |
| `isValid` | Two Options | Whether content is within max length |

## Usage in Power Apps

### 1. Import the Control

1. Build the control: `npm run build`
2. Create a solution in your Power Platform environment
3. Add the control to your solution:
   ```bash
   pac solution add-reference --path ../markdown_editor
   ```
4. Deploy the solution to your environment

### 2. Add to a Form

1. Open your Power Apps form editor
2. Add a new field or use an existing "Multiple Lines of Text" field
3. Change the control to "Markdown Editor"
4. Configure the control properties in the right panel

### 3. Bind to Dataverse

The control works with any "Multiple Lines of Text" field in Dataverse:

1. Create or use a table with a text column
2. Set the column format to "Text" with sufficient max length
3. Bind the control to this column in your form

**Example Dataverse column settings:**
- **Data type:** Text
- **Format:** Text Area
- **Max length:** 100000 (or your preferred limit)

### 4. Reading/Writing Markdown

```javascript
// In Power Apps Canvas App, read the markdown:
MarkdownEditor1.value

// Set markdown programmatically:
Set(MyMarkdown, MarkdownEditor1.value)

// Get statistics:
MarkdownEditor1.wordCount
MarkdownEditor1.characterCount
```

## Dataverse Integration

✅ **Complete** - The control is fully integrated with Dataverse and ready to use!

The control automatically:
- Loads markdown from the bound Dataverse text field
- Saves changes back to Dataverse via two-way binding
- Syncs updates when the field value changes externally
- Handles empty values gracefully (shows empty editor)

**To use with Dataverse:**
1. Create or use a "Multiple Lines of Text" field in your table
2. Add the control to your form
3. Bind the control to the text field
4. That's it! The control handles all the data synchronization

For detailed setup instructions, see [DATAVERSE_INTEGRATION.md](DATAVERSE_INTEGRATION.md)

## Technical Details

### Technology Stack

- **PCF Framework** - Power Apps Component Framework
- **React 19.2.0** - UI library
- **Milkdown 7.17.1** - WYSIWYG markdown editor built on ProseMirror
- **@milkdown/preset-gfm** - GitHub Flavored Markdown support
- **@milkdown/theme-nord** - Nord theme for styling
- **TypeScript** - Type-safe development
- **Webpack** - Module bundling

### Bundle Size

- **Production bundle:** 2.64 MiB
- Includes React, Milkdown, GFM plugins, and all dependencies
- Optimized for production deployment

### Browser Support

- Microsoft Edge (Chromium)
- Google Chrome
- Firefox
- Safari (limited testing)

## Troubleshooting

### Build Errors

**TypeScript compilation errors:**
```bash
# Clear caches and rebuild
rm -rf .pcf node_modules/.cache
npm run build
```

**Import errors with Milkdown:**
- Ensure using `@milkdown/kit` paths for v7
- Example: `import { gfm } from '@milkdown/kit/preset/gfm'`

### Runtime Issues

**Editor not rendering:**
- Check browser console for errors
- Verify React 19 is properly bundled
- Ensure `createRoot` API is used (not legacy `render`)

**Height not adjusting:**
- Verify `trackContainerResize(true)` is called in `init()`
- Check that `allocatedHeight` is being read from context
- Ensure CSS doesn't have hardcoded height values

**Toolbar buttons not working:**
- Check Milkdown editor initialization completed
- Verify `get()` calls succeed without throwing
- Ensure markdown schema includes the requested node types

## Contributing

### Code Style

- Follow TypeScript best practices
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

### Testing Checklist

Before submitting changes:
- [ ] Build succeeds without errors
- [ ] Control loads in test harness
- [ ] All toolbar buttons work
- [ ] Height/width sliders work
- [ ] Markdown renders correctly
- [ ] Two-way binding works
- [ ] No console errors

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Milkdown](https://milkdown.dev/) - Excellent markdown editor framework
- [ProseMirror](https://prosemirror.net/) - Underlying editor engine
- [React](https://react.dev/) - UI framework
- [Power Apps](https://powerapps.microsoft.com/) - Platform

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the CLAUDE.md file for development history

---

**Version:** 1.0.0
**Last Updated:** January 18, 2025
**Status:** ✅ Production Ready - Fully integrated with Dataverse
