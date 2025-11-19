# Changelog

All notable changes to the Markdown Editor PCF Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
  - Table insertion (3x3)
- WYSIWYG markdown editing with Milkdown v7
- Dynamic height and width control
  - Responds to container resize
  - Works with Power Apps form sliders
- Theme support
  - Light theme
  - Dark theme
  - Auto (system preference)
  - High contrast mode
- Editor features
  - Two-way data binding
  - Word and character count
  - Spell check toggle
  - Read-only mode
  - Max length validation
  - Scrollable content area
- Built with React 19 and TypeScript
- Nord theme styling
- Comprehensive documentation

### Technical Details
- PCF Framework integration
- React 19.2.0 with createRoot API
- Milkdown 7.17.1 editor
- Bundle size: 2.64 MiB (optimized)
- TypeScript 5.8.3
- Webpack 5 bundling

### Known Issues
- No markdown validation (markdownlint integration pending)

### Next Release (Planned)
- Markdown validation with markdownlint
- Export to PDF/HTML
- Markdown templates
- Version history support
- Image upload to Dataverse

---

## [Unreleased]

### To Be Added
- Markdown linting and validation
- Custom toolbar button configuration
- Image upload and management
- Export functionality (PDF, HTML, Word)
- Markdown templates library
- Document version history
- Search and replace
- Markdown shortcuts documentation
- Accessibility improvements (WCAG 2.1 AA)
- Internationalization (i18n)
- Plugin system for custom extensions

### Under Consideration
- Collaborative editing (real-time)
- Markdown diff viewer
- Auto-save drafts
- Offline support
- Mobile-optimized interface
- Voice-to-markdown dictation
- AI-powered markdown suggestions

---

## Version History

- **1.0.0** (2025-01-18) - Production release with Dataverse integration, GFM support, and dynamic sizing
- **0.3.0** (2025-01-18) - Dynamic height control implemented
- **0.2.0** (2025-01-18) - Milkdown TypeScript errors fixed, GFM added
- **0.1.0** (2025-01-18) - Initial PCF project setup

---

[1.0.0]: https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/releases/tag/v1.0.0
