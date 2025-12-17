# Changelog

All notable changes to the Markdown Editor PCF Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.9] - 2025-12-17

### Fixed
- **Zero-lag typing performance**: Completely eliminated typing lag by deferring all processing to after typing stops

### Technical
- Keystroke handler now only sets a timeout (~0.002ms of work)
- All expensive operations (serialization, DOM updates, stats) happen 150ms after typing pauses
- Removed synchronous doc traversal, DOM queries, and React state changes from keystroke path

---

## [1.5.7] - 2025-12-16

### Added
- **Horizontal scrolling for wide tables**: Tables wider than the container now scroll horizontally

### Changed
- Table cells use `white-space: nowrap` for predictable sizing
- ProseMirror content area has `overflow-x: auto` for scroll support

---

## [1.5.6] - 2025-12-16

### Added
- **Theme toggle button**: Sun/moon icon in toolbar to switch between light and dark mode
- **Performance optimizations**: Word/character counts use refs + direct DOM updates (no React re-renders)
- **Improved Dataverse sync**: Better handling of external updates vs user edits

### Fixed
- **Bundle size issue**: Replaced Fluent Weather icons with inline SVGs to avoid pulling in extra icon chunks
- **Production builds**: Must use `npm run build -- --buildMode production` for optimized output

### Technical
- Component wrapped in React.memo with custom prop comparison
- Added `_hasUserEdited` flag to prevent external updates overwriting user content
- Solution zip size: ~477KB (same as v1.5.5)

---

## [1.5.1] - 2025-12-15

### Fixed
- **Editor not loading Dataverse content on first open**: Added useEffect to sync external value changes to the editor when data loads after the editor initializes. This fixes the issue where users had to refresh the record to see the markdown content.

### Technical
- Editor now watches for `initialValue` prop changes and updates the Milkdown editor content when data arrives from Dataverse after initial render
- Uses ProseMirror parser to convert incoming markdown and replace document content

---

## [1.5.0] - 2025-12-15

### Added
- **Fluent 2.0 Visual Redesign**: Complete visual overhaul using Microsoft Fluent 2.0 design language
- **Fluent UI Icons**: All toolbar icons replaced with crisp SVG icons from @fluentui/react-icons
- **Glassmorphism Effects**: Subtle backdrop blur on toolbar, dropdowns, and panels
- **Enhanced Shadows**: Multi-layered shadows for depth and professional appearance
- **Gradient Accents**: Subtle gradients on active buttons, toolbar, and status bar
- **Grouped Toolbar**: Buttons organized into logical visual groups (History, Headings, Formatting, etc.)
- **CSS Design Tokens**: Full token-based theming system for consistent styling

### Changed
- Toolbar icons increased from 18px to 20px for better visibility
- Icon color changed from muted gray to full contrast for clarity
- Added `shape-rendering: geometricPrecision` for sharper SVG rendering
- Dropdown z-index increased to prevent clipping behind editor
- Find & Replace panel right-padded to prevent close button overlap
- Close button reduced from 28px to 24px for better proportions

### Fixed
- Dropdowns no longer appear behind editor content (z-index stacking fix)
- Container overflow changed from hidden to visible for proper dropdown display
- Find navigation buttons now work immediately (no longer requires multiple clicks)
- Screen shake eliminated when navigating find results (instant scroll vs smooth)
- Table display no longer broken by `display: block` CSS rule

### Technical
- Added @fluentui/react-icons dependency (v2.0.315)
- Bundle size increased from ~4.5 MiB to ~7.0 MiB (Fluent icons library)
- Dark theme tokens updated for glassmorphism effects
- Solution renamed from "Solution" to "RSMMarkdownEditor"

---

## [1.4.3] - 2025-12-11

### Fixed
- Rows property now always controls height (no longer overridden by allocatedHeight)
- Increased row height from 24px to 28px to match standard textarea behavior

### Technical
- Height formula: `rows × 28px + 80px` (e.g., 22 rows = 696px)

---

## [1.4.2] - 2025-12-11

### Added
- **Rows property**: Configurable number of rows to control editor height
- Default: 10 rows (~360px with toolbar)
- Visible in Power Apps control configuration

### Technical
- Added `rows` input property to ControlManifest
- Height calculated as `rows × 24px + 80px`

---

## [1.4.1] - 2025-12-10

### Added
- **Solution project**: Added Solution folder for Power Apps deployment
- Publisher: RSM (prefix: `rsm`)
- Control name: `rsm_ModernMarkdownEditor.MarkdownEditorControl`

### Fixed
- Fixed `callCommand` import path from `@milkdown/utils` to `@milkdown/kit/utils` for Milkdown v7 compatibility
- Removed unused `@milkdown/plugin-table@5.3.1` dependency that caused version conflicts
- Cleaned up dependency tree (removed 82 redundant packages)

### Technical
- Single version of `@milkdown/utils` (7.17.1) now in dependency tree
- Build now works reliably with fresh `npm install`

---

## [1.4.0] - 2025-12-05

### Added
- **Expanded Templates**: 20+ professional templates organized by category:
  - Meetings: Meeting Notes, Weekly Status Report, 1:1 Meeting
  - Development: Bug Report, Code Review Checklist, Feature Request, Technical Spec
  - Project: README, API Documentation, User Guide
  - Process: Changelog, Release Notes, Decision Record
  - Quick: Simple Note, Checklist, Comparison Table
- **Visual Table Picker**: Interactive 6×6 grid for selecting table dimensions
- **Table Row/Column Management**: Add Row Below, Add Column Right, Delete Row, Delete Column
- **Minimum Table Rows**: Tables enforce minimum 2 rows (header + data)
- **Category-grouped Templates**: Templates dropdown now shows organized categories with headers

### Changed
- Table dropdown now includes all table operations in one menu
- Templates dropdown scrollable with max-height for better UX
- Improved table cell creation with proper paragraph content structure

### Fixed
- Find & Replace navigation now correctly cycles through all matches
- Search highlights persist on all matches (not just current)
- Replace All no longer breaks markdown rendering
- Scroll for find matches stays within editor container
- Highlights clear when closing find panel via X button

### Technical
- Added ProseMirror Node type imports for type safety
- Improved table manipulation using proper schema node types
- Added CSS styles for table picker grid and category headers

---

## [1.3.0] - 2025-11-26

### Added
- Debounced updates for improved typing performance (150ms for parent, 250ms for stats)
- Link insertion now prompts for custom display text
- Filename prompts for HTML and PDF exports

### Changed
- Link insertion uses proper ProseMirror marks for instant rendering
- HTML export improved with better table handling (thead/tbody structure)
- HTML export now properly wraps paragraphs and handles block elements
- Optimized PCF lifecycle with bound handleChange in constructor
- Proper maxLength state management in index.ts

### Fixed
- Table spacing in HTML export reduced
- Block element detection improved for HTML export
- Removed console.log statements for production

### Documentation
- Complete README.md rewrite with all current features
- Comprehensive DATAVERSE_INTEGRATION.md guide
- Updated all docs to reflect v1.3.0 features

---

## [1.2.0] - 2025-01-20

### Added
- **PDF Export** - Two modes: text-based (searchable) and image-based (exact visual)
- **Image Paste** - Paste images from clipboard (Ctrl+V), converts to embedded base64
- **Responsive Design** - Adapts toolbar and layout for narrow widths
- Compact and very-compact CSS modes for different screen sizes
- Mobile-friendly touch targets

### Changed
- Improved Find & Replace navigation with useCallback optimization
- Better word wrapping in PDF text export (character-count based)
- Dynamic table column widths in PDF export
- Unicode/emoji sanitization for PDF compatibility

### Fixed
- Find Next/Previous navigation using functional state updates
- PDF text overflow issues with code blocks
- Table column truncation in PDF export

---

## [1.1.0] - 2025-01-19

### Added
- **Find & Replace (Ctrl+F)** - Search with match count, navigate between matches, replace single or all
- **Markdown Templates** - 5 pre-built templates:
  - Meeting Notes
  - Bug Report
  - Project README
  - Documentation Page
  - Changelog
- **Table Editing** - Insert tables with custom dimensions, delete tables
- **Export to HTML** - Download formatted HTML document

### Changed
- Improved toolbar organization
- Better keyboard shortcut support

---

## [1.0.0] - 2025-01-18

### Added
- Initial production release of Markdown Editor PCF Control
- **Full Dataverse integration** - loads and saves markdown from bound text fields
- Full GitHub Flavored Markdown (GFM) support
  - Tables with alignment
  - Strikethrough text
  - Task lists (checkboxes)
  - Autolinks
- Interactive formatting toolbar
  - Headings (H1, H2, H3)
  - Text formatting (Bold, Italic, Strikethrough)
  - Links and images
  - Lists (Bulleted, Numbered, Task)
  - Table insertion
  - Blockquotes
  - Horizontal rules
- WYSIWYG markdown editing with Milkdown v7
- Dynamic height and width control
- Theme support (Light, Dark, Auto, High Contrast)
- Editor features
  - Two-way data binding
  - Word and character count
  - Spell check toggle
  - Read-only mode
  - Max length validation
  - Auto-save indicator
- Built with React 19 and TypeScript
- Nord theme styling

### Technical Details
- PCF Framework integration
- React 19.2.0 with createRoot API
- Milkdown 7.17.1 editor
- Bundle size: ~4.5 MiB
- TypeScript 5.8.3
- Webpack 5 bundling

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.5.1 | 2025-12-15 | Fixed editor not loading Dataverse content on first open |
| 1.5.0 | 2025-12-15 | Fluent 2.0 visual redesign, Fluent UI icons, glassmorphism, enhanced UX |
| 1.4.3 | 2025-12-11 | Fixed rows height calculation to match standard textarea |
| 1.4.2 | 2025-12-11 | Added rows property for configurable height |
| 1.4.1 | 2025-12-10 | Added Solution project, fixed Milkdown imports |
| 1.4.0 | 2025-12-05 | 20+ templates, visual table picker, table row/column management, Find & Replace fixes |
| 1.3.0 | 2025-11-26 | Performance optimizations, improved link insertion, HTML export fixes |
| 1.2.0 | 2025-01-20 | PDF export, image paste, responsive design |
| 1.1.0 | 2025-01-19 | Find & Replace, templates, table editing |
| 1.0.0 | 2025-01-18 | Initial release with Dataverse integration |

---

[1.5.1]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.5.1
[1.5.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.5.0
[1.4.3]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.4.3
[1.4.2]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.4.2
[1.4.1]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.4.1
[1.4.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.4.0
[1.3.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.3.0
[1.2.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.2.0
[1.1.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.1.0
[1.0.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.0.0
