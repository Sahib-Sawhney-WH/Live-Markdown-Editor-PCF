# Changelog

All notable changes to the Markdown Editor PCF Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
| 1.3.0 | 2025-11-26 | Performance optimizations, improved link insertion, HTML export fixes |
| 1.2.0 | 2025-01-20 | PDF export, image paste, responsive design |
| 1.1.0 | 2025-01-19 | Find & Replace, templates, table editing |
| 1.0.0 | 2025-01-18 | Initial release with Dataverse integration |

---

[1.3.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.3.0
[1.2.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.2.0
[1.1.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.1.0
[1.0.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.0.0
