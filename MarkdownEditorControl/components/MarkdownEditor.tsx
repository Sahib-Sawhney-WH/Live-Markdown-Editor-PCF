import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { commonmark } from '@milkdown/preset-commonmark';
import { gfm } from '@milkdown/preset-gfm';
import { nord } from '@milkdown/theme-nord';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core';
import { callCommand } from '@milkdown/kit/utils';
import {
    toggleStrongCommand,
    toggleEmphasisCommand,
    wrapInHeadingCommand,
    wrapInBulletListCommand,
    wrapInOrderedListCommand,
    insertImageCommand,
    wrapInBlockquoteCommand,
    insertHrCommand
} from '@milkdown/preset-commonmark';
import { insertTableCommand, toggleStrikethroughCommand } from '@milkdown/preset-gfm';
import { redoCommand, undoCommand } from '@milkdown/plugin-history';
import { history } from '@milkdown/plugin-history';
import '@milkdown/theme-nord/style.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TextSelection } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { Node as ProseMirrorNode } from '@milkdown/prose/model';

// Fluent UI Icons
import {
    ArrowUndoRegular,
    ArrowRedoRegular,
    TextBoldRegular,
    TextItalicRegular,
    TextStrikethroughRegular,
    TextHeader1Regular,
    TextHeader2Regular,
    TextHeader3Regular,
    TextParagraphRegular,
    LinkRegular,
    ImageRegular,
    TextBulletListLtrRegular,
    TextNumberListLtrRegular,
    CodeRegular,
    TableRegular,
    TextQuoteRegular,
    LineHorizontal1Regular,
    CopyRegular,
    CheckmarkRegular,
    SearchRegular,
    ArrowDownloadRegular,
    DocumentPdfRegular,
    DocumentRegular,
    ChevronDownRegular,
    ChevronUpRegular,
    DismissRegular,
    AddRegular,
    SubtractRegular,
    DeleteRegular,
    CheckmarkCircleRegular,
    ArrowSyncRegular,
    CircleRegular,
} from '@fluentui/react-icons';

// Inline SVG icons for theme toggle (avoids pulling in extra icon chunks)
const SunIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 12a4 4 0 100-8 4 4 0 000 8zm0-1.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zm7.25-2.75a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zm-13 0a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zm12.02-4.72a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zm-11.44 9.44a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zm11.44 0l-1.06-1.06a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06zM4.83 5.9a.75.75 0 000-1.07l-1.06-1.06a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06 0zM10 15.25a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V16a.75.75 0 01.75-.75z"/>
    </svg>
);

const MoonIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7.78 2.04a.75.75 0 00-.99.86 5.5 5.5 0 007.32 6.08.75.75 0 01.98.83 7.5 7.5 0 11-8.17-8.76.75.75 0 01.86.99z"/>
    </svg>
);

// Module-level regex constants (compiled once)
const ESCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;
const WORD_MATCH_REGEX = /\S+/g;

export interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
    theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
    showToolbar?: boolean;
    enableSpellCheck?: boolean;
    maxLength?: number;
    height?: number; // Height in pixels for the editor container
    width?: number; // Width in pixels for responsive behavior
}

type SaveStatus = 'saved' | 'saving' | 'unsaved';

// Markdown templates - organized by category
const MARKDOWN_TEMPLATES: { name: string; category: string; content: string }[] = [
    // Meeting & Collaboration
    {
        name: 'Meeting Notes',
        category: 'Meetings',
        content: `# Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Time:**
**Location/Call Link:**
**Facilitator:**
**Note Taker:**

## Attendees
| Name | Role | Present |
|------|------|:-------:|
|  |  | ☐ |
|  |  | ☐ |

## Agenda
1.
2.
3.

## Discussion Points

### Topic 1
**Discussion:**

**Decision:**

### Topic 2
**Discussion:**

**Decision:**

## Action Items
| Task | Owner | Due Date | Status |
|------|-------|----------|--------|
|  |  |  | ☐ Pending |
|  |  |  | ☐ Pending |

## Next Meeting
**Date:**
**Topics to Cover:**
-

`
    },
    {
        name: 'Weekly Status Report',
        category: 'Meetings',
        content: `# Weekly Status Report

**Week of:** ${new Date().toLocaleDateString()}
**Team/Project:**
**Prepared by:**

## Summary
Brief overview of the week's progress.

## Accomplishments
- ✅
- ✅
- ✅

## In Progress
| Task | Progress | ETA | Blockers |
|------|----------|-----|----------|
|  | 0% |  | None |
|  | 0% |  | None |

## Upcoming (Next Week)
- [ ]
- [ ]
- [ ]

## Risks & Blockers
| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
|  | High/Med/Low |  |

## Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
|  |  |  | 🟢/🟡/🔴 |

## Notes & Comments

`
    },
    {
        name: '1:1 Meeting',
        category: 'Meetings',
        content: `# 1:1 Meeting Notes

**Date:** ${new Date().toLocaleDateString()}
**Participants:**

---

## Check-in
*How are things going?*


## Updates Since Last Meeting
-
-

## Discussion Topics

### Topic 1


### Topic 2


## Feedback
**What's going well:**


**Areas for improvement:**


## Action Items
- [ ]
- [ ]

## Goals for Next Period
1.
2.

## Next Meeting
**Date:**
**Topics to prep:**

`
    },
    // Development & Technical
    {
        name: 'Bug Report',
        category: 'Development',
        content: `# Bug Report

**ID:** BUG-
**Reported by:**
**Date:** ${new Date().toLocaleDateString()}
**Priority:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
**Status:** Open / In Progress / Resolved / Closed

## Summary
Brief, clear description of the bug.

## Environment
| Property | Value |
|----------|-------|
| Application Version |  |
| Browser/Client |  |
| Operating System |  |
| Device |  |
| User Role/Permissions |  |

## Steps to Reproduce
1.
2.
3.
4.

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Error Messages
\`\`\`
Paste any error messages here
\`\`\`

## Screenshots/Videos
<!-- Attach or link to visual evidence -->

## Logs
<details>
<summary>Click to expand logs</summary>

\`\`\`
Paste relevant logs here
\`\`\`

</details>

## Workaround
Is there a temporary workaround? Describe it here.

## Additional Context
Any other relevant information.

## Root Cause (for developers)


## Fix Applied


`
    },
    {
        name: 'Feature Request',
        category: 'Development',
        content: `# Feature Request

**Title:**
**Requested by:**
**Date:** ${new Date().toLocaleDateString()}
**Priority:** High / Medium / Low

## Problem Statement
*What problem does this feature solve?*


## Proposed Solution
*Describe the desired feature*


## User Stories
As a [type of user], I want [goal] so that [benefit].

## Acceptance Criteria
- [ ]
- [ ]
- [ ]

## Mockups / Wireframes
<!-- Attach or describe the UI -->

## Technical Considerations
*Any technical constraints or considerations*


## Dependencies
*What does this depend on?*
-

## Alternatives Considered
| Alternative | Pros | Cons |
|-------------|------|------|
|  |  |  |

## Estimated Effort
- **T-Shirt Size:** XS / S / M / L / XL
- **Story Points:**

## Business Value
*Why is this important?*


`
    },
    {
        name: 'Technical Specification',
        category: 'Development',
        content: `# Technical Specification

**Document Title:**
**Author:**
**Date:** ${new Date().toLocaleDateString()}
**Version:** 1.0
**Status:** Draft / In Review / Approved

## Overview
Brief description of what this specification covers.

## Goals
-
-

## Non-Goals
-
-

## Background
Context and motivation for this work.

## Architecture

### System Diagram
\`\`\`
[Component A] --> [Component B] --> [Component C]
\`\`\`

### Components
| Component | Responsibility | Technology |
|-----------|----------------|------------|
|  |  |  |

## Data Model

### Entities
\`\`\`
Entity Name {
  id: string
  field1: type
  field2: type
}
\`\`\`

### Database Schema
| Table | Column | Type | Constraints |
|-------|--------|------|-------------|
|  |  |  |  |

## API Design

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/resource | Description |
| POST | /api/resource | Description |

### Request/Response Examples
\`\`\`json
{
  "example": "payload"
}
\`\`\`

## Security Considerations
-

## Performance Considerations
-

## Testing Strategy
- Unit Tests:
- Integration Tests:
- E2E Tests:

## Rollout Plan
1.
2.
3.

## Monitoring & Alerts
-

## Open Questions
- [ ]

## References
-

`
    },
    {
        name: 'Code Review',
        category: 'Development',
        content: `# Code Review

**PR/MR:** #
**Author:**
**Reviewer:**
**Date:** ${new Date().toLocaleDateString()}

## Summary of Changes
Brief description of what this PR does.

## Review Checklist
### Code Quality
- [ ] Code follows project style guidelines
- [ ] No unnecessary complexity
- [ ] Functions/methods are appropriately sized
- [ ] Variable and function names are clear

### Functionality
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate

### Testing
- [ ] Unit tests added/updated
- [ ] Tests pass locally
- [ ] Test coverage is adequate

### Security
- [ ] No sensitive data exposed
- [ ] Input validation present
- [ ] No SQL injection/XSS vulnerabilities

### Documentation
- [ ] Code comments where needed
- [ ] README updated if needed
- [ ] API docs updated if needed

## Feedback

### Must Fix 🔴
| Location | Issue | Suggestion |
|----------|-------|------------|
|  |  |  |

### Should Fix 🟡
| Location | Issue | Suggestion |
|----------|-------|------------|
|  |  |  |

### Nice to Have 🟢
| Location | Suggestion |
|----------|------------|
|  |  |

### Praise 👏
-

## Questions
-

## Overall Assessment
- [ ] Approved
- [ ] Approved with minor changes
- [ ] Request changes

`
    },
    {
        name: 'Release Notes',
        category: 'Development',
        content: `# Release Notes

**Version:** v
**Release Date:** ${new Date().toLocaleDateString()}
**Release Type:** Major / Minor / Patch / Hotfix

## Highlights
Key features and improvements in this release.

## New Features ✨
- **Feature Name:** Description
- **Feature Name:** Description

## Improvements 📈
- Improved X for better Y
- Enhanced performance of Z

## Bug Fixes 🐛
- Fixed issue where... (#123)
- Resolved bug that caused... (#456)

## Breaking Changes ⚠️
- **Change:** Description of breaking change
  - **Migration:** How to update

## Deprecations 📋
- \`oldMethod()\` is deprecated, use \`newMethod()\` instead

## Known Issues
- Issue description (tracking in #789)

## Dependencies Updated
| Package | Old Version | New Version |
|---------|-------------|-------------|
|  |  |  |

## Upgrade Instructions
1.
2.
3.

## Contributors
Thanks to everyone who contributed to this release!
- @contributor1
- @contributor2

`
    },
    // Project Management
    {
        name: 'Project README',
        category: 'Project',
        content: `# Project Name

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

Brief description of what this project does and why it exists.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## Features
- ✅ Feature 1 - Description
- ✅ Feature 2 - Description
- ✅ Feature 3 - Description

## Prerequisites
- Node.js >= 16.0
- npm >= 8.0
- Other requirement

## Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/username/project.git

# Navigate to project directory
cd project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
\`\`\`

## Usage

\`\`\`bash
# Development
npm run dev

# Production build
npm run build

# Run tests
npm test
\`\`\`

### Basic Example
\`\`\`javascript
import { Example } from 'project';

const result = Example.doSomething();
\`\`\`

## Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| \`API_KEY\` | Your API key | - | Yes |
| \`DEBUG\` | Enable debug mode | \`false\` | No |

## API Reference
See [API Documentation](./docs/api.md) for detailed reference.

## Project Structure
\`\`\`
project/
├── src/
│   ├── components/
│   ├── utils/
│   └── index.ts
├── tests/
├── docs/
└── package.json
\`\`\`

## Contributing
1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing\`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Thanks to X for Y
- Inspired by Z

`
    },
    {
        name: 'Project Proposal',
        category: 'Project',
        content: `# Project Proposal

**Project Name:**
**Proposed by:**
**Date:** ${new Date().toLocaleDateString()}
**Version:** 1.0

---

## Executive Summary
Brief overview of the project (2-3 sentences).

## Problem Statement
What problem are we solving?

## Objectives
1.
2.
3.

## Scope

### In Scope
-
-

### Out of Scope
-
-

## Proposed Solution
Describe the solution approach.

## Success Criteria
| Criterion | Target | Measurement |
|-----------|--------|-------------|
|  |  |  |

## Timeline
| Phase | Description | Duration | Start | End |
|-------|-------------|----------|-------|-----|
| Phase 1 |  |  |  |  |
| Phase 2 |  |  |  |  |

## Resource Requirements
### Team
| Role | Name | Allocation |
|------|------|------------|
|  |  | % |

### Budget
| Item | Cost |
|------|------|
|  | $ |
| **Total** | **$** |

## Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
|  | High/Med/Low | High/Med/Low |  |

## Stakeholders
| Name | Role | Interest |
|------|------|----------|
|  |  |  |

## Approval
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Sponsor |  |  |  |
| Lead |  |  |  |

`
    },
    {
        name: 'Decision Log',
        category: 'Project',
        content: `# Decision Log

**Project:**
**Last Updated:** ${new Date().toLocaleDateString()}

---

## Decision Record Template

### DEC-001: [Decision Title]
**Date:** ${new Date().toLocaleDateString()}
**Status:** Proposed / Accepted / Deprecated / Superseded
**Deciders:**

#### Context
What is the issue or situation that requires a decision?

#### Decision
What is the decision that was made?

#### Options Considered
| Option | Pros | Cons |
|--------|------|------|
| Option A |  |  |
| Option B |  |  |
| Option C |  |  |

#### Rationale
Why was this decision made?

#### Consequences
What are the results of this decision?
- Positive:
- Negative:
- Neutral:

#### Related Decisions
- DEC-XXX

---

## Decision Index
| ID | Decision | Date | Status |
|----|----------|------|--------|
| DEC-001 |  |  | Accepted |

`
    },
    // Documentation
    {
        name: 'API Documentation',
        category: 'Documentation',
        content: `# API Documentation

**Base URL:** \`https://api.example.com/v1\`
**Version:** 1.0
**Last Updated:** ${new Date().toLocaleDateString()}

## Authentication
All API requests require authentication using an API key.

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Rate Limiting
| Plan | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |

## Endpoints

### Resource Name

#### Get All Resources
\`\`\`http
GET /resources
\`\`\`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |

**Response:**
\`\`\`json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
\`\`\`

#### Get Single Resource
\`\`\`http
GET /resources/:id
\`\`\`

#### Create Resource
\`\`\`http
POST /resources
\`\`\`

**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string"
}
\`\`\`

#### Update Resource
\`\`\`http
PUT /resources/:id
\`\`\`

#### Delete Resource
\`\`\`http
DELETE /resources/:id
\`\`\`

## Error Codes
| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

## SDKs & Libraries
- JavaScript: \`npm install example-sdk\`
- Python: \`pip install example-sdk\`

`
    },
    {
        name: 'User Guide',
        category: 'Documentation',
        content: `# User Guide

**Product:**
**Version:**
**Last Updated:** ${new Date().toLocaleDateString()}

---

## Getting Started

### System Requirements
- Requirement 1
- Requirement 2

### Installation
Step-by-step installation instructions.

### First-Time Setup
1.
2.
3.

## Features Overview

### Feature 1
**What it does:** Description

**How to use:**
1. Step 1
2. Step 2

> 💡 **Tip:** Helpful tip about this feature

### Feature 2
**What it does:** Description

**How to use:**
1. Step 1
2. Step 2

> ⚠️ **Warning:** Important warning

## Common Tasks

### Task 1: [Task Name]
1.
2.
3.

### Task 2: [Task Name]
1.
2.
3.

## Keyboard Shortcuts
| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Save | Ctrl+S | ⌘+S |
| Undo | Ctrl+Z | ⌘+Z |
| Redo | Ctrl+Y | ⌘+Shift+Z |

## Troubleshooting

### Issue: [Problem Description]
**Solution:** How to fix it

### Issue: [Problem Description]
**Solution:** How to fix it

## FAQ

**Q: Question here?**
A: Answer here.

**Q: Another question?**
A: Answer here.

## Getting Help
- Documentation: [link]
- Support Email: support@example.com
- Community Forum: [link]

`
    },
    {
        name: 'Changelog',
        category: 'Documentation',
        content: `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
-

### Changed
-

### Deprecated
-

### Removed
-

### Fixed
-

### Security
-

---

## [1.0.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release
- Feature 1: Description
- Feature 2: Description

### Changed
-

### Fixed
-

---

## [0.1.0] - YYYY-MM-DD

### Added
- Initial beta release

`
    },
    // Process & Workflow
    {
        name: 'Process Documentation',
        category: 'Process',
        content: `# Process: [Process Name]

**Owner:**
**Last Updated:** ${new Date().toLocaleDateString()}
**Review Frequency:** Quarterly

## Purpose
Why does this process exist?

## Scope
What does this process cover and not cover?

## Roles & Responsibilities
| Role | Responsibilities |
|------|------------------|
|  |  |

## Process Flow

\`\`\`
[Start] → [Step 1] → [Decision?] → Yes → [Step 2] → [End]
                         ↓
                        No → [Step 3] → [End]
\`\`\`

## Detailed Steps

### Step 1: [Step Name]
**Owner:**
**Inputs:**
**Outputs:**

1. Action 1
2. Action 2
3. Action 3

### Step 2: [Step Name]
**Owner:**
**Inputs:**
**Outputs:**

1. Action 1
2. Action 2

## Templates & Tools
- Template 1: [link]
- Tool 1: [link]

## Metrics
| Metric | Target | Current |
|--------|--------|---------|
| Processing Time |  |  |
| Error Rate |  |  |

## Exception Handling
How to handle edge cases or exceptions.

## Related Processes
- Process A
- Process B

## Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | ${new Date().toISOString().split('T')[0]} |  | Initial version |

`
    },
    {
        name: 'Runbook / Playbook',
        category: 'Process',
        content: `# Runbook: [Service/System Name]

**Last Updated:** ${new Date().toLocaleDateString()}
**On-Call Contact:**
**Escalation Path:**

---

## Service Overview
Brief description of the service.

## Architecture
\`\`\`
[Component A] → [Component B] → [Database]
\`\`\`

## Health Checks
| Check | URL/Command | Expected Result |
|-------|-------------|-----------------|
| API Health | \`GET /health\` | 200 OK |
| DB Connection |  | Connected |

## Common Alerts

### Alert: [Alert Name]
**Severity:** Critical / Warning / Info
**Meaning:** What this alert indicates

**Diagnosis:**
1. Check X
2. Verify Y
3. Review logs: \`command\`

**Resolution:**
1. Step 1
2. Step 2
3. Step 3

**Escalation:** When to escalate and to whom

---

### Alert: [Alert Name]
**Severity:** Critical / Warning / Info
**Meaning:** What this alert indicates

**Diagnosis:**
1.

**Resolution:**
1.

---

## Common Procedures

### Restart Service
\`\`\`bash
# Commands to restart
\`\`\`

### Check Logs
\`\`\`bash
# Commands to view logs
\`\`\`

### Rollback Deployment
\`\`\`bash
# Commands to rollback
\`\`\`

## Useful Commands
| Purpose | Command |
|---------|---------|
| Check status | \`\` |
| View logs | \`\` |
| Restart | \`\` |

## Contacts
| Role | Name | Contact |
|------|------|---------|
| Primary On-Call |  |  |
| Secondary |  |  |
| Engineering Lead |  |  |

## Post-Incident
After resolving an incident:
1. [ ] Update status page
2. [ ] Notify stakeholders
3. [ ] Create incident report
4. [ ] Schedule post-mortem if needed

`
    },
    // Simple/Quick Templates
    {
        name: 'Quick Note',
        category: 'Quick',
        content: `# Note:

**Date:** ${new Date().toLocaleDateString()}

## Summary


## Details


## Action Items
- [ ]
- [ ]

`
    },
    {
        name: 'Simple Table',
        category: 'Quick',
        content: `# Table Title

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data | Data | Data |
| Data | Data | Data |
| Data | Data | Data |

`
    },
    {
        name: 'Checklist',
        category: 'Quick',
        content: `# Checklist:

**Date:** ${new Date().toLocaleDateString()}

## Items
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3
- [ ] Item 4
- [ ] Item 5

## Notes


`
    }
];

const EditorComponent: React.FC<Omit<MarkdownEditorProps, 'value' | 'onChange'> & {
    onUpdate: (markdown: string) => void;
    initialValue: string;
}> = ({
    initialValue,
    onUpdate,
    readOnly = false,
    theme = 'light',
    showToolbar = true,
    maxLength = 100000,
    height,
    width
}) => {
    // Use refs instead of state for stats to avoid re-renders on every keystroke
    const wordCountRef = useRef(0);
    const charCountRef = useRef(0);
    const [editorError, setEditorError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [showFindReplace, setShowFindReplace] = useState(false);
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [findResults, setFindResults] = useState<{ count: number; current: number }>({ count: 0, current: 0 });
    const [showTemplates, setShowTemplates] = useState(false);
    const [showTablePicker, setShowTablePicker] = useState(false);
    const [tableSize, setTableSize] = useState<{ rows: number; cols: number }>({ rows: 3, cols: 3 });
    const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
    const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const currentMarkdownRef = useRef<string>(initialValue);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const serializeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const statsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingSerializeRef = useRef<boolean>(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const findInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const showFindReplaceRef = useRef(showFindReplace); // Track state in ref for keyboard listener
    const findDataRef = useRef<{ positions: number[]; searchLength: number }>({ positions: [], searchLength: 0 });
    const getEditorRef = useRef<(() => Editor | undefined) | undefined>(undefined);
    const lastSaveStatusRef = useRef<SaveStatus>('saved');

    // Determine effective theme (local override takes precedence)
    const baseTheme = theme === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
    const effectiveTheme = themeOverride ?? baseTheme;

    // Toggle between light and dark mode
    const toggleTheme = useCallback(() => {
        setThemeOverride(prev => {
            if (prev === null) return effectiveTheme === 'light' ? 'dark' : 'light';
            return prev === 'light' ? 'dark' : 'light';
        });
    }, [effectiveTheme]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (serializeTimeoutRef.current) clearTimeout(serializeTimeoutRef.current);
            if (statsTimeoutRef.current) clearTimeout(statsTimeoutRef.current);
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    // Keep showFindReplaceRef in sync with state (for keyboard listener)
    useEffect(() => {
        showFindReplaceRef.current = showFindReplace;
    }, [showFindReplace]);

    // Calculate statistics (optimized - uses refs + direct DOM updates to avoid re-renders)
    const updateStats = useCallback((text: string) => {
        const chars = text.length;
        const wordMatches = text.match(WORD_MATCH_REGEX);
        const words = wordMatches ? wordMatches.length : 0;

        // Update refs (no re-render)
        wordCountRef.current = words;
        charCountRef.current = chars;

        // Update DOM directly for instant feedback without re-render
        const wordEl = document.getElementById('md-word-count');
        const charEl = document.getElementById('md-char-count');
        if (wordEl) wordEl.textContent = `Words: ${words}`;
        if (charEl) charEl.textContent = `Characters: ${chars} / ${maxLength}`;
    }, [maxLength]);

    // Initialize Milkdown editor using React hooks following v7 pattern
    const { loading, get } = useEditor((root) => {
        try {
            const editor = Editor
                .make()
                .config(nord)
                .config((ctx) => {
                    ctx.set(rootCtx, root);
                    ctx.set(defaultValueCtx, initialValue);
                })
                .config((ctx) => {
                    const listenerPlugin = ctx.get(listenerCtx);
                    // Use 'updated' callback - fires immediately without serialization (FAST)
                    // Then debounce the expensive markdown serialization ourselves
                    listenerPlugin.updated((_ctx, doc) => {
                        // Mark that we need to serialize (but don't do it yet)
                        pendingSerializeRef.current = true;

                        // Get character count directly from ProseMirror doc (INSTANT - no serialization)
                        const charCount = doc.textContent.length;
                        charCountRef.current = charCount;

                        // Update char count in DOM immediately for responsive feedback
                        const charEl = document.getElementById('md-char-count');
                        if (charEl) charEl.textContent = `Characters: ${charCount} / ${maxLength}`;

                        // Show unsaved status immediately (only if not already showing)
                        if (lastSaveStatusRef.current !== 'unsaved') {
                            lastSaveStatusRef.current = 'unsaved';
                            setSaveStatus('unsaved');
                        }

                        // Debounce the expensive markdown serialization (300ms)
                        if (serializeTimeoutRef.current) {
                            clearTimeout(serializeTimeoutRef.current);
                        }
                        serializeTimeoutRef.current = setTimeout(() => {
                            if (!pendingSerializeRef.current) return;
                            pendingSerializeRef.current = false;

                            try {
                                // Now serialize to markdown (expensive but debounced)
                                const serializer = ctx.get(serializerCtx);
                                const markdown = serializer(doc);
                                currentMarkdownRef.current = markdown;

                                // Update parent with serialized markdown
                                onUpdate(markdown);

                                // Update word count (requires the markdown string)
                                const wordMatches = markdown.match(WORD_MATCH_REGEX);
                                const words = wordMatches ? wordMatches.length : 0;
                                wordCountRef.current = words;
                                const wordEl = document.getElementById('md-word-count');
                                if (wordEl) wordEl.textContent = `Words: ${words}`;

                                // Mark as saved after a short delay
                                if (saveTimeoutRef.current) {
                                    clearTimeout(saveTimeoutRef.current);
                                }
                                saveTimeoutRef.current = setTimeout(() => {
                                    if (lastSaveStatusRef.current !== 'saved') {
                                        lastSaveStatusRef.current = 'saved';
                                        setSaveStatus('saved');
                                    }
                                }, 200);
                            } catch {
                                // Silently handle serialization errors
                            }
                        }, 300);
                    });
                })
                .use(commonmark)
                .use(gfm)
                .use(history)
                .use(listener);

            editorRef.current = editor;
            return editor;
        } catch (error) {
            setEditorError(error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }, []);

    // Update stats when value changes
    useEffect(() => {
        updateStats(initialValue);
    }, [initialValue, updateStats]);

    // Sync stable editor reference for use in callbacks
    useEffect(() => {
        getEditorRef.current = get;
    }, [get]);

    // Sync editor content when initialValue prop changes (handles late-arriving Dataverse data)
    // Only updates if editor is empty and new value has content
    useEffect(() => {
        const editor = get?.();
        if (!editor || !initialValue) return;

        // Only sync if editor is currently empty but props have content
        const currentContent = currentMarkdownRef.current;
        if (currentContent && currentContent.trim() !== '') return; // Don't overwrite existing content

        try {
            const view = editor.ctx.get(editorViewCtx);
            const parser = editor.ctx.get(parserCtx);

            if (view && parser) {
                const doc = parser(initialValue);
                if (doc) {
                    const { state, dispatch } = view;
                    const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
                    dispatch(tr);
                    currentMarkdownRef.current = initialValue;
                }
            }
        } catch {
            // Silently handle errors
        }
    }, [initialValue, get]);

    // Centralized focus helper to prevent race conditions
    const scheduleFocus = useCallback((element: HTMLElement | null, delay = 0) => {
        if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current);
        if (!element) return;

        const doFocus = () => {
            requestAnimationFrame(() => {
                if (document.body.contains(element)) element.focus();
            });
        };

        if (delay > 0) {
            focusTimeoutRef.current = setTimeout(doFocus, delay);
        } else {
            doFocus();
        }
    }, []);

    // Toolbar actions - simplified with error handling
    const executeCommand = useCallback((command: Parameters<typeof callCommand>[0], payload?: unknown) => {
        if (!get) return;
        try {
            get()?.action(callCommand(command, payload));
        } catch {
            // Silently handle command errors
        }
    }, [get]);

    const insertHeading = (level: number) => executeCommand(wrapInHeadingCommand.key, level);
    const clearHeading = () => executeCommand(wrapInHeadingCommand.key, 0);
    const toggleBold = () => executeCommand(toggleStrongCommand.key);
    const toggleItalic = () => executeCommand(toggleEmphasisCommand.key);
    const handleUndo = () => executeCommand(undoCommand.key);
    const handleRedo = () => executeCommand(redoCommand.key);
    const insertBlockquote = () => executeCommand(wrapInBlockquoteCommand.key);
    const insertHorizontalRule = () => executeCommand(insertHrCommand.key);
    const toggleStrikethrough = () => executeCommand(toggleStrikethroughCommand.key);
    const insertBulletList = () => executeCommand(wrapInBulletListCommand.key);
    const insertOrderedList = () => executeCommand(wrapInOrderedListCommand.key);

    const insertLink = () => {
        if (!get) return;

        try {
            const view = get()?.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const selectedText = state.doc.textBetween(selection.from, selection.to);

            // Ask for URL
            const url = window.prompt('Enter URL:', 'https://');
            if (!url) return;

            // Ask for link text (pre-fill with selected text or URL)
            const defaultText = selectedText || url;
            const linkText = window.prompt('Enter link text (or leave empty to show URL):', defaultText);
            if (linkText === null) return; // User cancelled

            const displayText = linkText.trim() || url;

            // Use ProseMirror's link mark for proper rendering
            const linkMark = state.schema.marks.link;
            if (linkMark) {
                const mark = linkMark.create({ href: url, title: '' });
                const textNode = state.schema.text(displayText, [mark]);

                let tr;
                if (selectedText) {
                    // Replace selected text with linked version
                    tr = state.tr.replaceSelectionWith(textNode, false);
                } else {
                    // Insert new link at cursor
                    tr = state.tr.replaceSelectionWith(textNode, false);
                }
                dispatch(tr);

                // Focus back on editor
                view.focus();
            }
        } catch {
            // Silently handle errors
        }
    };

    const insertImage = () => {
        if (!get) return;
        const url = window.prompt('Enter image URL:', 'https://');
        if (!url) return;
        const alt = window.prompt('Enter alt text:', 'image') || 'image';
        executeCommand(insertImageCommand.key, { src: url, alt });
    };

    const insertCode = () => {
        if (!get) return;
        try {
            const view = get()?.ctx.get(editorViewCtx);
            if (view) {
                const { state, dispatch } = view;
                const codeBlockType = state.schema.nodes.code_block;
                if (codeBlockType) {
                    // Create a proper code block node with placeholder text
                    const codeBlock = codeBlockType.create(
                        { language: '' },
                        state.schema.text('// code here')
                    );
                    const tr = state.tr.replaceSelectionWith(codeBlock);
                    dispatch(tr);
                }
            }
        } catch {
            // Silently handle errors
        }
    };

    // Toggle table picker visibility
    const toggleTablePicker = () => {
        setShowTablePicker(!showTablePicker);
        setHoveredCell({ row: 0, col: 0 });
    };

    // Insert table with specified dimensions (minimum 2 rows to have header + data)
    const insertTableWithSize = (rows: number, cols: number) => {
        if (!get) return;
        // Enforce minimum 2 rows (1 header + 1 data row)
        const actualRows = Math.max(2, rows);
        if (actualRows > 0 && cols > 0) {
            executeCommand(insertTableCommand.key, { row: actualRows, col: cols });
        }
        setShowTablePicker(false);
        setHoveredCell({ row: 0, col: 0 });
    };

    // Helper to create an empty cell with proper content structure
    const createEmptyCell = (state: { schema: { nodes: Record<string, { create: (attrs: null, content?: ProseMirrorNode | ProseMirrorNode[]) => ProseMirrorNode } | undefined> } }, cellTypeName: string): ProseMirrorNode | null => {
        const cellType = state.schema.nodes[cellTypeName];
        const paragraphType = state.schema.nodes.paragraph;
        if (!cellType) return null;

        // Create cell with empty paragraph inside (required structure for table cells)
        if (paragraphType) {
            const emptyParagraph = paragraphType.create(null);
            return cellType.create(null, emptyParagraph);
        }
        return cellType.create(null);
    };

    // Add row to existing table at cursor position
    const addTableRow = () => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const $from = selection.$from;

            // Find table position by walking up the document tree
            let tableDepth = -1;
            let tableNode: ProseMirrorNode | null = null;
            let rowIndex = -1;

            for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === 'table') {
                    tableDepth = depth;
                    tableNode = node;
                    // Find which row we're in
                    for (let d = $from.depth; d > depth; d--) {
                        const n = $from.node(d);
                        if (n.type.name === 'table_row') {
                            rowIndex = $from.index(d - 1);
                            break;
                        }
                    }
                    break;
                }
            }

            if (tableDepth === -1 || !tableNode || rowIndex === -1) {
                alert('Place your cursor inside a table to add a row.');
                return;
            }

            // Get the number of columns from the first row
            const firstRow = tableNode.firstChild;
            if (!firstRow) return;
            const numCols = firstRow.childCount;

            // Create new row with empty cells
            const cells: ProseMirrorNode[] = [];
            for (let i = 0; i < numCols; i++) {
                const newCell = createEmptyCell(state, 'table_cell');
                if (newCell) cells.push(newCell);
            }

            if (cells.length === 0) return;

            const tableRowType = state.schema.nodes.table_row;
            if (!tableRowType) return;

            const newRow = tableRowType.create(null, cells);

            // Insert after current row
            const tableStart = $from.before(tableDepth);
            let insertPos = tableStart + 1; // Start after table open tag

            // Calculate position after the target row
            for (let i = 0; i <= rowIndex; i++) {
                const row = tableNode.child(i);
                insertPos += row.nodeSize;
            }

            const tr = state.tr.insert(insertPos, newRow);
            dispatch(tr);
            setShowTablePicker(false);
        } catch (e) {
            console.error('Error adding row:', e);
        }
    };

    // Add column to existing table
    const addTableColumn = () => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const $from = selection.$from;

            // Find table and current column
            let tableDepth = -1;
            let tableNode: ProseMirrorNode | null = null;
            let colIndex = 0;

            for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === 'table') {
                    tableDepth = depth;
                    tableNode = node;
                    break;
                }
                if (node.type.name === 'table_cell' || node.type.name === 'table_header') {
                    // Get the index within the row
                    colIndex = $from.index(depth - 1);
                }
            }

            if (tableDepth === -1 || !tableNode) {
                alert('Place your cursor inside a table to add a column.');
                return;
            }

            const tableStart = $from.before(tableDepth);
            const tableRowType = state.schema.nodes.table_row;
            const tableType = state.schema.nodes.table;
            if (!tableRowType || !tableType) return;

            // Build new table with extra column
            const newRows: ProseMirrorNode[] = [];
            let isFirstRow = true;

            tableNode.forEach((row) => {
                const newCells: ProseMirrorNode[] = [];
                let cellIdx = 0;

                row.forEach((cell) => {
                    // Copy existing cell
                    newCells.push(cell.copy(cell.content));

                    // Insert new cell after current column
                    if (cellIdx === colIndex) {
                        const cellTypeName = isFirstRow ? 'table_header' : 'table_cell';
                        // Try table_header first, fall back to table_cell if not available
                        let newCell = createEmptyCell(state, cellTypeName);
                        if (!newCell) {
                            newCell = createEmptyCell(state, 'table_cell');
                        }
                        if (newCell) newCells.push(newCell);
                    }
                    cellIdx++;
                });

                const newRow = tableRowType.create(null, newCells);
                newRows.push(newRow);
                isFirstRow = false;
            });

            const newTable = tableType.create(tableNode.attrs, newRows);
            const tableEnd = $from.after(tableDepth);
            const tr = state.tr.replaceWith(tableStart, tableEnd, newTable);
            dispatch(tr);
            setShowTablePicker(false);
        } catch (e) {
            console.error('Error adding column:', e);
        }
    };

    // Delete current row from table
    const deleteTableRow = () => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const $from = selection.$from;

            // Find the table to check row count
            let tableNode: ProseMirrorNode | null = null;
            for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === 'table') {
                    tableNode = node;
                    break;
                }
            }

            // Check if deleting would leave only header row (need at least 2 rows)
            if (tableNode && tableNode.childCount <= 2) {
                alert('Cannot delete row - tables need at least 2 rows (header + data). Delete the table instead.');
                setShowTablePicker(false);
                return;
            }

            for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === 'table_row') {
                    const start = $from.before(depth);
                    const end = $from.after(depth);
                    const tr = state.tr.delete(start, end);
                    dispatch(tr);
                    setShowTablePicker(false);
                    return;
                }
            }
            alert('Place your cursor inside a table row to delete it.');
        } catch (e) {
            console.error('Error deleting row:', e);
        }
        setShowTablePicker(false);
    };

    // Delete current column from table
    const deleteTableColumn = () => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const $from = selection.$from;

            // Find the table and current column index
            let tableDepth = -1;
            let tableNode: ProseMirrorNode | null = null;
            let currentColIndex = 0;

            for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === 'table') {
                    tableDepth = depth;
                    tableNode = node;
                    break;
                }
                if (node.type.name === 'table_cell' || node.type.name === 'table_header') {
                    currentColIndex = $from.index(depth - 1);
                }
            }

            if (tableDepth === -1 || !tableNode) {
                alert('Place your cursor inside a table to delete a column.');
                setShowTablePicker(false);
                return;
            }

            const tableStart = $from.before(tableDepth);

            // Check if table would be empty
            const firstRow = tableNode.firstChild;
            if (firstRow && firstRow.childCount <= 1) {
                alert('Cannot delete the last column. Delete the table instead.');
                setShowTablePicker(false);
                return;
            }

            const tableRowType = state.schema.nodes.table_row;
            const tableType = state.schema.nodes.table;
            if (!tableRowType || !tableType) return;

            // Build new table without the column
            const newRows: ProseMirrorNode[] = [];
            tableNode.forEach((row) => {
                const newCells: ProseMirrorNode[] = [];
                let cellIdx = 0;
                row.forEach((cell) => {
                    if (cellIdx !== currentColIndex) {
                        newCells.push(cell.copy(cell.content));
                    }
                    cellIdx++;
                });
                const newRow = tableRowType.create(null, newCells);
                newRows.push(newRow);
            });

            const newTable = tableType.create(tableNode.attrs, newRows);
            const tableEnd = $from.after(tableDepth);
            const tr = state.tr.replaceWith(tableStart, tableEnd, newTable);
            dispatch(tr);
            setShowTablePicker(false);
        } catch (e) {
            console.error('Error deleting column:', e);
        }
    };

    const deleteTable = () => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const { selection } = state;
            const pos = selection.$from;

            // Walk up from current position to find a table node
            for (let depth = pos.depth; depth >= 0; depth--) {
                const node = pos.node(depth);
                if (node.type.name === 'table') {
                    // Found a table - delete it
                    const start = pos.before(depth);
                    const end = pos.after(depth);
                    const tr = state.tr.delete(start, end);
                    dispatch(tr);
                    setShowTablePicker(false);
                    return;
                }
            }
            // No table found at cursor position
            alert('Place your cursor inside a table to delete it.');
        } catch (e) {
            console.error('Error deleting table:', e);
        }
        setShowTablePicker(false);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(currentMarkdownRef.current);
            setCopyStatus('copied');
            setTimeout(() => setCopyStatus('idle'), 2000);
        } catch {
            // Silently handle clipboard errors
        }
    };

    // Find & Replace functions
    const toggleFindReplace = () => {
        const willShow = !showFindReplace;
        setShowFindReplace(willShow);
        if (willShow) {
            scheduleFocus(findInputRef.current, 100);
        } else {
            // Clear highlights when closing the panel
            clearSearchHighlights();
        }
    };

    // Apply highlight decorations to all matches
    const applySearchHighlights = useCallback((positions: number[], searchLength: number, currentIndex: number) => {
        const currentGet = getEditorRef.current;
        if (!currentGet) return;

        try {
            const editor = currentGet();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            // Create decorations for all matches
            const decorations: Decoration[] = [];
            positions.forEach((pos, idx) => {
                const from = pos;
                const to = pos + searchLength;
                // Current match gets a different class
                const className = idx === currentIndex ? 'search-highlight-current' : 'search-highlight';
                decorations.push(
                    Decoration.inline(from, to, { class: className })
                );
            });

            // Create decoration set and apply via setProps
            const decorationSet = decorations.length > 0
                ? DecorationSet.create(view.state.doc, decorations)
                : DecorationSet.empty;

            // Apply decorations to the view
            view.setProps({
                decorations: () => decorationSet
            });
        } catch {
            // Silently handle errors
        }
    }, []);

    // Clear all search highlights
    const clearSearchHighlights = useCallback(() => {
        const currentGet = getEditorRef.current;
        if (!currentGet) return;

        try {
            const editor = currentGet();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            view.setProps({
                decorations: () => DecorationSet.empty
            });
        } catch {
            // Silently handle errors
        }
    }, []);

    // Select and highlight a match in the editor (defined before handleFind to avoid hoisting issues)
    const selectMatchAtIndex = useCallback((index: number) => {
        const { positions, searchLength } = findDataRef.current;
        if (positions.length === 0 || index < 0 || index >= positions.length) return;

        const currentGet = getEditorRef.current;
        if (!currentGet) return;

        try {
            const editor = currentGet();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state, dispatch } = view;
            const from = positions[index];
            const to = from + searchLength; // Use stored length, not current findText.length

            // Update highlights to show current match differently
            applySearchHighlights(positions, searchLength, index);

            // Create a selection at the match position
            const selection = TextSelection.create(state.doc, from, to);
            const tr = state.tr.setSelection(selection);
            dispatch(tr);

            // Scroll to match if needed (instant, no animation to prevent shake)
            try {
                const wrapper = containerRef.current?.querySelector('.markdown-editor-wrapper') as HTMLElement;
                if (wrapper) {
                    const coords = view.coordsAtPos(from);
                    if (coords) {
                        const wrapperRect = wrapper.getBoundingClientRect();
                        const relativeTop = coords.top - wrapperRect.top;
                        const wrapperHeight = wrapper.clientHeight;

                        // Check if the match is outside the visible area
                        if (relativeTop < 0 || relativeTop > wrapperHeight - 50) {
                            // Instant scroll to center the match
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
    }, [applySearchHighlights]);

    const handleFind = useCallback((autoSelect = false) => {
        if (!findText) {
            findDataRef.current = { positions: [], searchLength: 0 };
            setFindResults({ count: 0, current: 0 });
            clearSearchHighlights();
            return;
        }

        const currentGet = getEditorRef.current;
        if (!currentGet) return;

        try {
            const editor = currentGet();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            if (!view) return;

            const { state } = view;
            const searchText = findText.toLowerCase();
            const positions: number[] = [];

            // Search through the document
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

            // Store positions and search length in ref for navigation functions
            findDataRef.current = { positions, searchLength: findText.length };
            setFindResults({
                count: positions.length,
                current: positions.length > 0 ? 1 : 0
            });

            // Apply highlights to all matches (first match is current by default)
            if (positions.length > 0) {
                applySearchHighlights(positions, findText.length, 0);
            } else {
                clearSearchHighlights();
            }

            // Only select match if explicitly requested (e.g., pressing Enter)
            if (autoSelect && positions.length > 0) {
                selectMatchAtIndex(0);
            }
        } catch {
            // Fallback to simple text search
            const content = currentMarkdownRef.current;
            const regex = new RegExp(findText.replace(ESCAPE_REGEX, '\\$&'), 'gi');
            const matches = content.match(regex);
            findDataRef.current = { positions: [], searchLength: findText.length };
            setFindResults({ count: matches?.length || 0, current: matches?.length ? 1 : 0 });
            clearSearchHighlights();
        }
    }, [findText, selectMatchAtIndex, applySearchHighlights, clearSearchHighlights]);

    // Navigate to next match
    const findNext = useCallback(() => {
        // If search hasn't run yet but we have text, run it now
        if (findDataRef.current.positions.length === 0 && findText) {
            handleFind(true); // true = auto-select first match
            return;
        }

        const { positions } = findDataRef.current;
        if (positions.length === 0) return;

        setFindResults(prev => {
            if (prev.count === 0) return prev;

            // Calculate next index (1-based for display)
            const nextIndex = prev.current >= prev.count ? 1 : prev.current + 1;

            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => selectMatchAtIndex(nextIndex - 1));

            return { ...prev, current: nextIndex };
        });
    }, [selectMatchAtIndex, findText, handleFind]);

    // Navigate to previous match
    const findPrevious = useCallback(() => {
        // If search hasn't run yet but we have text, run it now
        if (findDataRef.current.positions.length === 0 && findText) {
            handleFind(true); // true = auto-select first match
            return;
        }

        const { positions } = findDataRef.current;
        if (positions.length === 0) return;

        setFindResults(prev => {
            if (prev.count === 0) return prev;

            // Calculate previous index (1-based for display)
            const prevIndex = prev.current <= 1 ? prev.count : prev.current - 1;

            // Use requestAnimationFrame for better timing
            requestAnimationFrame(() => selectMatchAtIndex(prevIndex - 1));

            return { ...prev, current: prevIndex };
        });
    }, [selectMatchAtIndex, findText, handleFind]);

    const handleReplace = () => {
        const currentGet = getEditorRef.current;
        if (!findText || !currentGet) return;

        try {
            const editor = currentGet();
            if (!editor) return;

            const content = currentMarkdownRef.current;
            const newContent = content.replace(findText, replaceText);

            if (newContent !== content) {
                const view = editor.ctx.get(editorViewCtx);
                const parser = editor.ctx.get(parserCtx);

                if (view && parser) {
                    // Parse the new markdown content to preserve formatting
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
    };

    const handleReplaceAll = () => {
        const currentGet = getEditorRef.current;
        if (!findText || !currentGet) return;

        try {
            const editor = currentGet();
            if (!editor) return;

            const content = currentMarkdownRef.current;
            const regex = new RegExp(findText.replace(ESCAPE_REGEX, '\\$&'), 'g');
            const newContent = content.replace(regex, replaceText);

            if (newContent !== content) {
                const view = editor.ctx.get(editorViewCtx);
                const parser = editor.ctx.get(parserCtx);

                if (view && parser) {
                    // Parse the new markdown content to preserve formatting
                    const newDoc = parser(newContent);
                    if (newDoc) {
                        const { state, dispatch } = view;
                        const tr = state.tr.replaceWith(0, state.doc.content.size, newDoc.content);
                        dispatch(tr);
                    }
                }

                findDataRef.current = { positions: [], searchLength: 0 };
                setFindResults({ count: 0, current: 0 });
                clearSearchHighlights();
            }
        } catch {
            // Silently handle errors
        }
    };

    // Keyboard shortcuts - uses ref to avoid re-registering on state changes
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                toggleFindReplace();
            }
            // Use ref to check state without causing effect re-registration
            if (e.key === 'Escape' && showFindReplaceRef.current) {
                setShowFindReplace(false);
                clearSearchHighlights();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []); // Empty deps - registers once, uses refs for state checks

    // Debounced search - 100ms delay for balanced performance
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!findText) {
            findDataRef.current = { positions: [], searchLength: 0 };
            setFindResults({ count: 0, current: 0 });
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            handleFind(false);
        }, 100);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [findText, handleFind]);

    // Export to HTML
    const exportToHtml = () => {
        // Ask for filename
        const filename = window.prompt('Enter filename for HTML:', 'document');
        if (filename === null) return; // User cancelled

        const safeFilename = (filename.trim() || 'document').replace(/[<>:"/\\|?*]/g, '_');

        const markdown = currentMarkdownRef.current;

        // Process tables first (multi-line)
        const processTable = (tableText: string): string => {
            const lines = tableText.trim().split('\n');
            if (lines.length < 2) return tableText;

            let html = '<table>\n<thead>\n';
            let isHeader = true;
            let inBody = false;

            for (const line of lines) {
                // Skip separator lines but mark transition to body
                if (line.match(/^\|[\s\-:|]+\|$/)) {
                    if (isHeader) {
                        html += '</thead>\n<tbody>\n';
                        isHeader = false;
                        inBody = true;
                    }
                    continue;
                }

                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                    const cells = line.split('|').slice(1, -1).map(c => c.trim());
                    const tag = isHeader ? 'th' : 'td';
                    html += '  <tr>\n';
                    for (const cell of cells) {
                        // Process inline markdown in cells
                        const cellHtml = cell
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/`([^`]+)`/g, '<code>$1</code>');
                        html += `    <${tag}>${cellHtml}</${tag}>\n`;
                    }
                    html += '  </tr>\n';
                }
            }

            if (inBody) {
                html += '</tbody>\n';
            }
            html += '</table>';
            return html;
        };

        // Find and replace tables first
        let html = markdown;
        const tableRegex = /(\|[^\n]+\|\n)+/g;
        html = html.replace(tableRegex, (match) => processTable(match));

        // Process code blocks before other replacements (to protect content)
        const codeBlocks: string[] = [];
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
            const index = codeBlocks.length;
            codeBlocks.push(`<pre><code class="language-${lang}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`);
            return `%%CODEBLOCK_${index}%%`;
        });

        // Process inline code (protect from other replacements)
        const inlineCodes: string[] = [];
        html = html.replace(/`([^`]+)`/g, (_match, code) => {
            const index = inlineCodes.length;
            inlineCodes.push(`<code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`);
            return `%%INLINECODE_${index}%%`;
        });

        // Process the rest of the markdown
        html = html
            // Headers (order matters - longest first)
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold and italic (order matters)
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // Links and images
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" />')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
            // Task lists (before regular lists)
            .replace(/^- \[x\] (.*$)/gim, '<li class="task-done"><input type="checkbox" checked disabled /> $1</li>')
            .replace(/^- \[ \] (.*$)/gim, '<li class="task"><input type="checkbox" disabled /> $1</li>')
            // Unordered lists
            .replace(/^[-*+] (.*$)/gim, '<li>$1</li>')
            // Ordered lists
            .replace(/^\d+\. (.*$)/gim, '<li class="ordered">$1</li>')
            // Blockquotes (handle multi-line)
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            // Horizontal rule
            .replace(/^---$/gim, '<hr />')
            .replace(/^\*\*\*$/gim, '<hr />')
            .replace(/^___$/gim, '<hr />');

        // Wrap consecutive unordered <li> items in <ul> tags
        html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>\n$1</ul>\n');
        // Wrap consecutive ordered <li> items in <ol> tags
        html = html.replace(/((?:<li class="ordered">.*?<\/li>\n?)+)/g, (match) => {
            return '<ol>\n' + match.replace(/<li class="ordered">/g, '<li>') + '</ol>\n';
        });
        // Wrap task list items properly
        html = html.replace(/((?:<li class="task(?:-done)?">.*?<\/li>\n?)+)/g, '<ul class="task-list">\n$1</ul>\n');

        // Clean up consecutive blockquotes
        html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

        // Restore code blocks and inline code
        for (let i = 0; i < codeBlocks.length; i++) {
            html = html.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i]);
        }
        for (let i = 0; i < inlineCodes.length; i++) {
            html = html.replace(`%%INLINECODE_${i}%%`, inlineCodes[i]);
        }

        // Convert content to paragraphs, but not block elements
        const lines = html.split('\n');
        const processedLines: string[] = [];
        let inParagraph = false;
        let inBlockElement = false;

        // Block element tags that should not be wrapped in paragraphs
        const isBlockStart = (s: string) => {
            return s.startsWith('<table') || s.startsWith('<thead') || s.startsWith('<tbody') ||
                   s.startsWith('<tr') || s.startsWith('<pre') || s.startsWith('<ul') ||
                   s.startsWith('<ol') || s.startsWith('<blockquote') || s.startsWith('<h1') ||
                   s.startsWith('<h2') || s.startsWith('<h3') || s.startsWith('<h4') ||
                   s.startsWith('<hr');
        };

        const isBlockEnd = (s: string) => {
            return s.startsWith('</table') || s.startsWith('</thead') || s.startsWith('</tbody') ||
                   s.startsWith('</tr') || s.startsWith('</pre') || s.startsWith('</ul') ||
                   s.startsWith('</ol') || s.startsWith('</blockquote') || s.startsWith('</h1') ||
                   s.startsWith('</h2') || s.startsWith('</h3') || s.startsWith('</h4');
        };

        const isInsideBlock = (s: string) => {
            return s.startsWith('<th') || s.startsWith('</th') ||
                   s.startsWith('<td') || s.startsWith('</td') ||
                   s.startsWith('<code') || s.startsWith('</code') ||
                   s.startsWith('<li') || s.startsWith('</li');
        };

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines but close any open paragraph
            if (!trimmed) {
                if (inParagraph) {
                    processedLines.push('</p>');
                    inParagraph = false;
                }
                continue;
            }

            // Track block element nesting
            if (isBlockStart(trimmed)) {
                if (inParagraph) {
                    processedLines.push('</p>');
                    inParagraph = false;
                }
                inBlockElement = true;
                processedLines.push(line);
            } else if (isBlockEnd(trimmed)) {
                processedLines.push(line);
                // Only exit block mode on table/list end, not sub-elements
                if (trimmed.startsWith('</table') || trimmed.startsWith('</ul') ||
                    trimmed.startsWith('</ol') || trimmed.startsWith('</pre')) {
                    inBlockElement = false;
                }
            } else if (inBlockElement || isInsideBlock(trimmed)) {
                // Inside a block element, don't wrap in paragraphs
                processedLines.push(line);
            } else {
                // Regular text - wrap in paragraphs
                if (!inParagraph) {
                    processedLines.push('<p>' + trimmed);
                    inParagraph = true;
                } else {
                    processedLines.push('<br />' + trimmed);
                }
            }
        }
        if (inParagraph) {
            processedLines.push('</p>');
        }

        html = processedLines.join('\n');

        // Wrap in HTML structure with improved styles
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeFilename}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.7;
            color: #333;
            background: #fff;
        }
        h1 { font-size: 2em; margin: 1em 0 0.5em 0; color: #222; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; margin: 1em 0 0.5em 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
        h3 { font-size: 1.25em; margin: 1em 0 0.5em 0; color: #444; }
        h4 { font-size: 1em; margin: 1em 0 0.5em 0; color: #555; font-weight: 600; }
        p { margin: 0.8em 0; }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
        }
        pre {
            background: #f8f8f8;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            border: 1px solid #e1e4e8;
            margin: 1em 0;
        }
        pre code {
            background: none;
            padding: 0;
            font-size: 0.85em;
            line-height: 1.5;
        }
        blockquote {
            border-left: 4px solid #0078d4;
            padding: 0.5em 1em;
            margin: 1em 0;
            color: #555;
            background: #f9f9f9;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 0.5em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px 14px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
            font-weight: 600;
        }
        tr:nth-child(even) td {
            background: #fafafa;
        }
        ul, ol {
            margin: 0.8em 0;
            padding-left: 2em;
        }
        li {
            margin: 0.3em 0;
        }
        ul.task-list {
            list-style: none;
            padding-left: 0;
        }
        ul.task-list li {
            padding-left: 1.5em;
            position: relative;
        }
        ul.task-list input[type="checkbox"] {
            position: absolute;
            left: 0;
            top: 0.3em;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }
        a {
            color: #0078d4;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        hr {
            border: none;
            border-top: 1px solid #e1e4e8;
            margin: 2em 0;
        }
        del {
            color: #888;
        }
    </style>
</head>
<body>
${html}
</body>
</html>`;

        // Download the file
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeFilename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Export to PDF - with option for editable (text) or image-based
    const exportToPdf = async () => {
        // Ask for filename
        const filename = window.prompt('Enter filename for PDF:', 'document');
        if (filename === null) return; // User cancelled

        const safeFilename = (filename.trim() || 'document').replace(/[<>:"/\\|?*]/g, '_');

        // Ask user which type of PDF they want
        const choice = window.confirm(
            'PDF Export Options:\n\n' +
            'Click OK for EDITABLE PDF (selectable/searchable text, smaller file)\n\n' +
            'Click Cancel for IMAGE PDF (exact visual appearance, includes images)'
        );

        if (choice) {
            await exportToPdfText(safeFilename);
        } else {
            await exportToPdfImage(safeFilename);
        }
    };

    // Helper to strip markdown formatting from text
    const stripMarkdown = (text: string): string => {
        return text
            // Images: ![alt](url) -> [Image: alt]
            .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[Image: $1]')
            // Links: [text](url) -> text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Bold: **text** or __text__
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            // Italic: *text* or _text_
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            // Strikethrough: ~~text~~
            .replace(/~~([^~]+)~~/g, '$1')
            // Inline code: `code`
            .replace(/`([^`]+)`/g, '$1')
            // HTML tags
            .replace(/<[^>]+>/g, '');
    };

    // Export to PDF with actual text (editable/selectable)
    const exportToPdfText = async (filename: string) => {
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = 210;
            const pageHeight = 297;
            const marginX = 15;
            const marginY = 15;
            const contentWidth = pageWidth - (marginX * 2);
            const lineHeight = 5;
            let currentY = marginY;

            // Helper to add a new page if needed
            const checkPageBreak = (neededHeight: number) => {
                if (currentY + neededHeight > pageHeight - marginY) {
                    pdf.addPage();
                    currentY = marginY;
                    return true;
                }
                return false;
            };

            // Helper to wrap text to fit width (word-based)
            const wrapText = (text: string, fontSize: number, maxWidth: number): string[] => {
                pdf.setFontSize(fontSize);
                const words = text.split(' ');
                const lines: string[] = [];
                let currentLine = '';

                for (const word of words) {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    const testWidth = pdf.getTextWidth(testLine);
                    if (testWidth > maxWidth && currentLine) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine) {
                    lines.push(currentLine);
                }
                return lines.length > 0 ? lines : [''];
            };

            // Helper to wrap code text (character-count based for monospace fonts)
            const wrapCodeText = (text: string, maxChars: number): string[] => {
                const lines: string[] = [];
                let remaining = text;

                while (remaining.length > 0) {
                    if (remaining.length <= maxChars) {
                        lines.push(remaining);
                        break;
                    }
                    lines.push(remaining.substring(0, maxChars));
                    remaining = remaining.substring(maxChars);
                }
                return lines.length > 0 ? lines : [''];
            };

            // Helper to sanitize text for PDF (remove problematic characters)
            const sanitizeForPdf = (text: string): string => {
                let result = text;
                // Replace common emoji with text equivalents
                result = result.replace(/✓|✔|☑/g, '[x]');
                result = result.replace(/✗|✘|☐/g, '[ ]');
                result = result.replace(/↶/g, '<-');
                result = result.replace(/↷/g, '->');
                // Remove emoji and other problematic unicode characters
                // Keep basic ASCII (32-126) plus common accented chars
                let cleaned = '';
                for (let i = 0; i < result.length; i++) {
                    const code = result.charCodeAt(i);
                    // Keep printable ASCII
                    if (code >= 32 && code <= 126) {
                        cleaned += result[i];
                    }
                    // Keep common Latin extended characters (accented letters)
                    else if (code >= 192 && code <= 255) {
                        cleaned += result[i];
                    }
                    // Keep newlines and tabs
                    else if (code === 10 || code === 13 || code === 9) {
                        cleaned += result[i];
                    }
                    // Skip everything else (emoji, special unicode, etc.)
                }
                return cleaned;
            };

            // Helper to render a table with proper column widths
            const renderTable = (rows: string[][]) => {
                if (rows.length === 0) return;

                const colCount = rows[0].length;
                const fontSize = 8;
                const cellPadding = 2;
                const rowHeight = 5;

                pdf.setFontSize(fontSize);

                // Calculate column widths based on content
                const colWidths: number[] = [];
                for (let col = 0; col < colCount; col++) {
                    let maxWidth = 15; // Minimum column width
                    for (const row of rows) {
                        if (row[col]) {
                            pdf.setFont('helvetica', 'normal');
                            const textWidth = pdf.getTextWidth(row[col]) + (cellPadding * 2);
                            maxWidth = Math.max(maxWidth, textWidth);
                        }
                    }
                    colWidths.push(maxWidth);
                }

                // Scale columns to fit content width if needed
                const totalWidth = colWidths.reduce((a, b) => a + b, 0);
                if (totalWidth > contentWidth) {
                    const scale = contentWidth / totalWidth;
                    for (let i = 0; i < colWidths.length; i++) {
                        colWidths[i] *= scale;
                    }
                }

                // Render each row
                for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
                    checkPageBreak(rowHeight + 2);
                    const row = rows[rowIdx];
                    const isHeader = rowIdx === 0;

                    let cellX = marginX;
                    for (let colIdx = 0; colIdx < row.length; colIdx++) {
                        const colWidth = colWidths[colIdx] || 20;

                        // Draw cell background for header
                        if (isHeader) {
                            pdf.setFillColor(240, 240, 240);
                            pdf.rect(cellX, currentY - 3.5, colWidth, rowHeight, 'F');
                        }

                        // Draw cell border
                        pdf.setDrawColor(200, 200, 200);
                        pdf.rect(cellX, currentY - 3.5, colWidth, rowHeight);

                        // Draw cell text (truncate if needed)
                        pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
                        pdf.setFontSize(fontSize);
                        pdf.setTextColor(51, 51, 51);

                        const cellText = row[colIdx] || '';
                        const maxTextWidth = colWidth - (cellPadding * 2);
                        let displayText = cellText;

                        // Truncate with ellipsis if too long
                        while (pdf.getTextWidth(displayText) > maxTextWidth && displayText.length > 3) {
                            displayText = displayText.substring(0, displayText.length - 4) + '...';
                        }

                        pdf.text(displayText, cellX + cellPadding, currentY);
                        cellX += colWidth;
                    }
                    currentY += rowHeight;
                }
                currentY += 3;
            };

            // Parse markdown and render to PDF
            const markdown = currentMarkdownRef.current;
            const rawLines = markdown.split('\n');
            let inCodeBlock = false;
            let codeBlockContent: string[] = [];
            let inTable = false;
            const tableRows: string[][] = [];

            for (const rawLine of rawLines) {
                const line = rawLine;

                // Handle code blocks
                if (line.trim().startsWith('```')) {
                    if (inCodeBlock) {
                        // End code block - render it with proper wrapping
                        if (codeBlockContent.length > 0) {
                            // Calculate wrapped lines first (95 chars fits well at 8pt courier)
                            const wrappedCodeLines: string[] = [];
                            const maxCodeChars = 95;

                            for (const codeLine of codeBlockContent) {
                                const wrapped = wrapCodeText(codeLine, maxCodeChars);
                                wrappedCodeLines.push(...wrapped);
                            }

                            const codeLineHeight = 3.5;
                            const totalCodeHeight = wrappedCodeLines.length * codeLineHeight + 6;

                            checkPageBreak(Math.min(totalCodeHeight, 50));

                            // Draw background
                            pdf.setFillColor(245, 245, 245);
                            const bgHeight = Math.min(totalCodeHeight, pageHeight - currentY - marginY);
                            pdf.rect(marginX, currentY - 2, contentWidth, bgHeight, 'F');

                            pdf.setFont('courier', 'normal');
                            pdf.setFontSize(8);
                            pdf.setTextColor(51, 51, 51);
                            currentY += 2;

                            for (const wline of wrappedCodeLines) {
                                if (checkPageBreak(codeLineHeight)) {
                                    // Draw new background on new page
                                    pdf.setFillColor(245, 245, 245);
                                    pdf.rect(marginX, currentY - 2, contentWidth, 20, 'F');
                                }
                                pdf.text(wline, marginX + 3, currentY);
                                currentY += codeLineHeight;
                            }
                            currentY += 4;
                        }
                        codeBlockContent = [];
                        inCodeBlock = false;
                    } else {
                        inCodeBlock = true;
                    }
                    continue;
                }

                if (inCodeBlock) {
                    codeBlockContent.push(line);
                    continue;
                }

                // Handle tables
                if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                    // Check if it's a separator row
                    if (line.match(/^\|[\s\-:|]+\|$/)) {
                        continue; // Skip separator rows
                    }
                    inTable = true;
                    const cells = line.split('|').slice(1, -1).map(c => stripMarkdown(c.trim()));
                    tableRows.push(cells);
                    continue;
                } else if (inTable) {
                    // End of table - render it
                    renderTable(tableRows);
                    tableRows.length = 0;
                    inTable = false;
                }

                // Skip empty lines but add spacing
                if (!line.trim()) {
                    currentY += 2;
                    continue;
                }

                // Skip image-only lines (but mention them)
                if (line.match(/^!\[.*\]\(.*\)$/)) {
                    checkPageBreak(lineHeight);
                    pdf.setFont('helvetica', 'italic');
                    pdf.setFontSize(9);
                    pdf.setTextColor(128, 128, 128);
                    const altMatch = line.match(/!\[([^\]]*)\]/);
                    const altText = altMatch ? altMatch[1] : 'image';
                    pdf.text(`[Image: ${altText}]`, marginX, currentY);
                    currentY += lineHeight;
                    continue;
                }

                // Headers
                if (line.startsWith('#### ')) {
                    checkPageBreak(8);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(12);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(5)));
                    const wrapped = wrapText(text, 12, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 6;
                    }
                    currentY += 2;
                } else if (line.startsWith('### ')) {
                    checkPageBreak(8);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(14);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(4)));
                    const wrapped = wrapText(text, 14, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 7;
                    }
                    currentY += 2;
                } else if (line.startsWith('## ')) {
                    checkPageBreak(10);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(16);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(3)));
                    const wrapped = wrapText(text, 16, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 8;
                    }
                    currentY += 3;
                } else if (line.startsWith('# ')) {
                    checkPageBreak(12);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(20);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line.substring(2)));
                    const wrapped = wrapText(text, 20, contentWidth);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX, currentY);
                        currentY += 9;
                    }
                    currentY += 4;
                }
                // Blockquotes
                else if (line.startsWith('> ')) {
                    checkPageBreak(lineHeight);
                    pdf.setDrawColor(0, 120, 212);
                    pdf.setLineWidth(0.8);
                    const quoteText = sanitizeForPdf(stripMarkdown(line.substring(2)));
                    const wrapped = wrapText(quoteText, 10, contentWidth - 10);
                    const quoteHeight = wrapped.length * lineHeight;
                    pdf.line(marginX, currentY - 3, marginX, currentY + quoteHeight - 3);
                    pdf.setFont('helvetica', 'italic');
                    pdf.setFontSize(10);
                    pdf.setTextColor(100, 100, 100);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX + 5, currentY);
                        currentY += lineHeight;
                    }
                }
                // Task lists
                else if (line.match(/^\s*-\s*\[[ xX]\]/)) {
                    checkPageBreak(lineHeight);
                    const checked = line.includes('[x]') || line.includes('[X]');
                    const text = sanitizeForPdf(stripMarkdown(line.replace(/^\s*-\s*\[[ xX]\]\s*/, '')));
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.setTextColor(51, 51, 51);
                    pdf.setDrawColor(150, 150, 150);
                    pdf.rect(marginX, currentY - 3, 3, 3);
                    if (checked) {
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('x', marginX + 0.7, currentY - 0.3);
                        pdf.setFont('helvetica', 'normal');
                    }
                    const wrapped = wrapText(text, 10, contentWidth - 8);
                    for (const wline of wrapped) {
                        pdf.text(wline, marginX + 6, currentY);
                        currentY += lineHeight;
                    }
                }
                // Bullet lists
                else if (line.match(/^\s*[-*+]\s/)) {
                    checkPageBreak(lineHeight);
                    const indent = Math.floor((line.match(/^\s*/)?.[0].length || 0) / 2);
                    const text = sanitizeForPdf(stripMarkdown(line.replace(/^\s*[-*+]\s/, '')));
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.setTextColor(51, 51, 51);
                    const bulletX = marginX + (indent * 4);
                    pdf.text('-', bulletX, currentY);
                    const wrapped = wrapText(text, 10, contentWidth - 6 - (indent * 4));
                    for (const wline of wrapped) {
                        pdf.text(wline, bulletX + 4, currentY);
                        currentY += lineHeight;
                    }
                }
                // Numbered lists
                else if (line.match(/^\s*\d+\.\s/)) {
                    checkPageBreak(lineHeight);
                    const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
                    if (match) {
                        const indent = Math.floor((match[1].length || 0) / 2);
                        const num = match[2];
                        const text = sanitizeForPdf(stripMarkdown(match[3]));
                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(10);
                        pdf.setTextColor(51, 51, 51);
                        const numX = marginX + (indent * 4);
                        pdf.text(`${num}.`, numX, currentY);
                        const wrapped = wrapText(text, 10, contentWidth - 8 - (indent * 4));
                        for (const wline of wrapped) {
                            pdf.text(wline, numX + 6, currentY);
                            currentY += lineHeight;
                        }
                    }
                }
                // Horizontal rule
                else if (line.match(/^[-*_]{3,}$/)) {
                    checkPageBreak(8);
                    currentY += 3;
                    pdf.setDrawColor(200, 200, 200);
                    pdf.setLineWidth(0.3);
                    pdf.line(marginX, currentY, marginX + contentWidth, currentY);
                    currentY += 5;
                }
                // Regular paragraph
                else {
                    checkPageBreak(lineHeight);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    pdf.setTextColor(51, 51, 51);
                    const text = sanitizeForPdf(stripMarkdown(line));
                    const wrapped = wrapText(text, 10, contentWidth);
                    for (const wline of wrapped) {
                        checkPageBreak(lineHeight);
                        pdf.text(wline, marginX, currentY);
                        currentY += lineHeight;
                    }
                }
            }

            // Handle any remaining table
            if (tableRows.length > 0) {
                renderTable(tableRows);
            }

            pdf.save(`${filename}.pdf`);
        } catch {
            // Silently handle errors
        }
    };

    // Export to PDF as image (preserves exact visual appearance)
    const exportToPdfImage = async (filename: string) => {
        const editorElement = containerRef.current?.querySelector('.milkdown') as HTMLElement;
        if (!editorElement) return;

        try {
            // Create a temporary container for PDF rendering at a fixed width
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `position: absolute; left: -9999px; top: 0; width: 700px; padding: 20px; background: white; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; line-height: 1.6;`;
            tempDiv.innerHTML = editorElement.innerHTML;
            document.body.appendChild(tempDiv);

            // Apply print-friendly styles
            const style = document.createElement('style');
            style.textContent = `
                * { box-sizing: border-box; }
                h1 { font-size: 28px; margin: 20px 0 10px 0; color: #333; font-weight: bold; }
                h2 { font-size: 22px; margin: 18px 0 8px 0; color: #333; font-weight: bold; }
                h3 { font-size: 18px; margin: 14px 0 6px 0; color: #333; font-weight: bold; }
                p { margin: 8px 0; line-height: 1.6; font-size: 14px; }
                code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: Consolas, monospace; font-size: 13px; }
                pre { background: #f8f8f8; padding: 12px; border-radius: 4px; overflow-x: auto; margin: 10px 0; font-size: 13px; }
                pre code { background: none; padding: 0; }
                blockquote { border-left: 4px solid #0078d4; padding-left: 16px; margin: 10px 0; color: #555; font-style: italic; }
                table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
                th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
                th { background: #f0f0f0; font-weight: bold; }
                ul, ol { margin: 8px 0; padding-left: 24px; }
                li { margin: 4px 0; font-size: 14px; }
                a { color: #0078d4; text-decoration: none; }
                img { max-width: 100%; height: auto; max-height: 300px; }
            `;
            tempDiv.appendChild(style);

            // Render to canvas at 1.5x scale (good quality but smaller file)
            const canvas = await html2canvas(tempDiv, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Clean up temp element
            document.body.removeChild(tempDiv);

            // Create PDF in mm units (A4 = 210mm x 297mm)
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const marginX = 15; // 15mm margins
            const marginY = 15;
            const contentWidth = pageWidth - (marginX * 2); // 180mm
            const contentHeight = pageHeight - (marginY * 2); // 267mm

            // Calculate the scaled dimensions
            // Canvas is at 1.5x scale
            const scaleFactor = 1.5;
            const imgPixelWidth = canvas.width / scaleFactor;
            const imgPixelHeight = canvas.height / scaleFactor;

            // Scale to fit content width
            const ratio = contentWidth / imgPixelWidth;
            const scaledImgHeight = imgPixelHeight * ratio;

            // Use JPEG for smaller file size (0.85 quality)
            const getImageData = (c: HTMLCanvasElement) => c.toDataURL('image/jpeg', 0.85);

            // If content fits on one page
            if (scaledImgHeight <= contentHeight) {
                pdf.addImage(
                    getImageData(canvas),
                    'JPEG',
                    marginX,
                    marginY,
                    contentWidth,
                    scaledImgHeight
                );
            } else {
                // Multi-page: slice the canvas into page-sized chunks
                const pageHeightInPixels = contentHeight / ratio;
                const totalPages = Math.ceil(imgPixelHeight / pageHeightInPixels);

                for (let page = 0; page < totalPages; page++) {
                    if (page > 0) {
                        pdf.addPage();
                    }

                    // Create a canvas for this page's portion
                    const pageCanvas = document.createElement('canvas');
                    const ctx = pageCanvas.getContext('2d');
                    if (!ctx) continue;

                    const sourceY = page * pageHeightInPixels * scaleFactor;
                    const sourceHeight = Math.min(pageHeightInPixels * scaleFactor, canvas.height - sourceY);

                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sourceHeight;

                    // White background
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

                    ctx.drawImage(
                        canvas,
                        0, sourceY, // source x, y
                        canvas.width, sourceHeight, // source width, height
                        0, 0, // dest x, y
                        canvas.width, sourceHeight // dest width, height
                    );

                    const pageImgHeight = (sourceHeight / scaleFactor) * ratio;

                    pdf.addImage(
                        getImageData(pageCanvas),
                        'JPEG',
                        marginX,
                        marginY,
                        contentWidth,
                        pageImgHeight
                    );
                }
            }

            // Download
            pdf.save(`${filename}.pdf`);
        } catch {
            // Silently handle errors
        }
    };

    // Insert template
    const insertTemplate = (template: typeof MARKDOWN_TEMPLATES[0]) => {
        if (!get) return;
        try {
            const editor = get();
            if (!editor) return;

            const view = editor.ctx.get(editorViewCtx);
            const parser = editor.ctx.get(parserCtx);

            if (view && parser) {
                const { state, dispatch } = view;
                // Parse the markdown template into a ProseMirror document
                const doc = parser(template.content);

                if (doc) {
                    // Replace all content or insert at cursor
                    if (currentMarkdownRef.current.trim() === '') {
                        // Replace entire document
                        const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
                        dispatch(tr);
                    } else {
                        // Insert at current position
                        const tr = state.tr.replaceSelectionWith(doc);
                        dispatch(tr);
                    }
                }
            }
            setShowTemplates(false);
        } catch {
            // Silently handle errors
        }
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowTemplates(false);
                setShowTablePicker(false);
            }
        };
        if (showTemplates || showTablePicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showTemplates, showTablePicker]);

    // Helper function to detect if text looks like markdown
    const looksLikeMarkdown = (text: string): boolean => {
        // Check for common markdown patterns
        const markdownPatterns = [
            /^#{1,6}\s+/m,           // Headers: # Header
            /\*\*[^*]+\*\*/,         // Bold: **text**
            /\*[^*]+\*/,             // Italic: *text*
            /^\s*[-*+]\s+/m,         // Unordered lists: - item
            /^\s*\d+\.\s+/m,         // Ordered lists: 1. item
            /\[.+\]\(.+\)/,          // Links: [text](url)
            /!\[.*\]\(.+\)/,         // Images: ![alt](url)
            /```[\s\S]*```/,         // Code blocks: ```code```
            /`[^`]+`/,               // Inline code: `code`
            /^\|.+\|$/m,             // Tables: | cell |
            /^>\s+/m,                // Blockquotes: > quote
            /^---$/m,                // Horizontal rules
            /~~[^~]+~~/,             // Strikethrough: ~~text~~
            /^\s*-\s*\[[ x]\]/m,     // Task lists: - [ ] or - [x]
        ];

        // Count how many patterns match
        let matchCount = 0;
        for (const pattern of markdownPatterns) {
            if (pattern.test(text)) {
                matchCount++;
            }
        }

        // Consider it markdown if at least 2 patterns match, or if it has headers/code blocks
        return matchCount >= 2 || /^#{1,6}\s+/m.test(text) || /```[\s\S]*```/.test(text);
    };

    // Handle paste events for images and markdown
    const handlePaste = useCallback((e: Event) => {
        const clipboardEvent = e as ClipboardEvent;
        const items = clipboardEvent.clipboardData?.items;
        if (!items) return;

        const itemsArray = Array.from(items);

        // First, check for images
        for (const item of itemsArray) {
            if (item.type.startsWith('image/')) {
                // Stop the event completely to prevent double paste
                e.preventDefault();
                e.stopPropagation();

                const file = item.getAsFile();
                if (!file) continue;

                try {
                    // Convert image to base64 data URL
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        if (dataUrl) {
                            // Insert the image into the editor
                            executeCommand(insertImageCommand.key, {
                                src: dataUrl,
                                alt: file.name || 'pasted-image'
                            });
                        }
                    };
                    reader.readAsDataURL(file);
                } catch {
                    // Silently handle errors
                }
                return; // Image handled, exit
            }
        }

        // Check for text that looks like markdown
        const textData = clipboardEvent.clipboardData?.getData('text/plain');
        if (textData && looksLikeMarkdown(textData)) {
            e.preventDefault();

            try {
                const editor = get?.();
                if (!editor) return;

                const view = editor.ctx.get(editorViewCtx);
                const parser = editor.ctx.get(parserCtx);

                if (view && parser) {
                    const { state, dispatch } = view;

                    // Check if editor is empty or nearly empty
                    const currentContent = currentMarkdownRef.current.trim();
                    const isEmptyOrMinimal = currentContent === '' || currentContent.length < 10;

                    // Parse the markdown into a ProseMirror document
                    const doc = parser(textData);

                    if (doc) {
                        if (isEmptyOrMinimal) {
                            // Replace entire document content for empty editors
                            const tr = state.tr.replaceWith(0, state.doc.content.size, doc.content);
                            dispatch(tr);
                        } else {
                            // For non-empty editors, try to insert at cursor
                            // First, check if we're at the start of a block
                            const { $from } = state.selection;
                            const atBlockStart = $from.parentOffset === 0;

                            if (atBlockStart && doc.content.childCount > 0) {
                                // Insert block content properly
                                const { from, to } = state.selection;
                                const tr = state.tr.replaceWith(from, to, doc.content);
                                dispatch(tr);
                            } else {
                                // Insert as text slice with proper handling
                                const { from, to } = state.selection;
                                const tr = state.tr.replaceWith(from, to, doc.content);
                                dispatch(tr);
                            }
                        }
                    }
                }
            } catch {
                // If parsing fails, let default paste behavior handle it
            }
        }
    }, [executeCommand, get]);

    // Attach paste handler to editor (capture phase to intercept before ProseMirror)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Use capture phase to handle paste before ProseMirror does
        container.addEventListener('paste', handlePaste, true);
        return () => container.removeEventListener('paste', handlePaste, true);
    }, [handlePaste]);

    // Determine responsive class based on width
    const getResponsiveClass = () => {
        if (!width) return '';
        if (width < 400) return 'very-compact';
        if (width < 600) return 'compact';
        return '';
    };

    return (
        <div
            ref={containerRef}
            className={`markdown-editor-container ${effectiveTheme} ${readOnly ? 'read-only' : ''} ${getResponsiveClass()}`}
            style={height ? { height: `${height}px`, minHeight: `${height}px`, maxHeight: `${height}px` } : undefined}
        >
            {showToolbar && !readOnly && (
                <div className={`markdown-toolbar ${effectiveTheme}`}>
                    {/* History Group */}
                    <div className="toolbar-group" aria-label="History">
                        <button
                            className="toolbar-button"
                            onClick={handleUndo}
                            title="Undo (Ctrl+Z)"
                            aria-label="Undo"
                        >
                            <span className="toolbar-button-icon"><ArrowUndoRegular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={handleRedo}
                            title="Redo (Ctrl+Y)"
                            aria-label="Redo"
                        >
                            <span className="toolbar-button-icon"><ArrowRedoRegular /></span>
                        </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Headings Group */}
                    <div className="toolbar-group" aria-label="Headings">
                        <button
                            className="toolbar-button"
                            onClick={() => insertHeading(1)}
                            title="Heading 1 (Ctrl+Alt+1)"
                            aria-label="Insert Heading 1"
                        >
                            <span className="toolbar-button-icon"><TextHeader1Regular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={() => insertHeading(2)}
                            title="Heading 2 (Ctrl+Alt+2)"
                            aria-label="Insert Heading 2"
                        >
                            <span className="toolbar-button-icon"><TextHeader2Regular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={() => insertHeading(3)}
                            title="Heading 3 (Ctrl+Alt+3)"
                            aria-label="Insert Heading 3"
                        >
                            <span className="toolbar-button-icon"><TextHeader3Regular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={clearHeading}
                            title="Paragraph (Ctrl+Alt+0)"
                            aria-label="Clear Heading Formatting"
                        >
                            <span className="toolbar-button-icon"><TextParagraphRegular /></span>
                        </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Text Formatting Group */}
                    <div className="toolbar-group" aria-label="Text Formatting">
                        <button
                            className="toolbar-button"
                            onClick={toggleBold}
                            title="Bold (Ctrl+B)"
                            aria-label="Toggle Bold"
                        >
                            <span className="toolbar-button-icon"><TextBoldRegular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={toggleItalic}
                            title="Italic (Ctrl+I)"
                            aria-label="Toggle Italic"
                        >
                            <span className="toolbar-button-icon"><TextItalicRegular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={toggleStrikethrough}
                            title="Strikethrough (Ctrl+Shift+S)"
                            aria-label="Toggle Strikethrough"
                        >
                            <span className="toolbar-button-icon"><TextStrikethroughRegular /></span>
                        </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Insert Group */}
                    <div className="toolbar-group" aria-label="Insert">
                        <button
                            className="toolbar-button"
                            onClick={insertLink}
                            title="Insert Link (Ctrl+K)"
                            aria-label="Insert Link"
                        >
                            <span className="toolbar-button-icon"><LinkRegular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={insertImage}
                            title="Insert Image"
                            aria-label="Insert Image"
                        >
                            <span className="toolbar-button-icon"><ImageRegular /></span>
                        </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Lists Group */}
                    <div className="toolbar-group" aria-label="Lists">
                        <button
                            className="toolbar-button"
                            onClick={insertBulletList}
                            title="Bullet List"
                            aria-label="Insert Bullet List"
                        >
                            <span className="toolbar-button-icon"><TextBulletListLtrRegular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={insertOrderedList}
                            title="Numbered List"
                            aria-label="Insert Numbered List"
                        >
                            <span className="toolbar-button-icon"><TextNumberListLtrRegular /></span>
                        </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Blocks Group */}
                    <div className="toolbar-group" aria-label="Blocks">
                        <button
                            className="toolbar-button"
                            onClick={insertCode}
                            title="Code Block"
                            aria-label="Insert Code Block"
                        >
                            <span className="toolbar-button-icon"><CodeRegular /></span>
                        </button>
                        <div className="toolbar-dropdown-container">
                            <button
                                className={`toolbar-button toolbar-dropdown-trigger ${showTablePicker ? 'active' : ''}`}
                                onClick={toggleTablePicker}
                                title="Table Options"
                                aria-label="Table Options"
                                aria-expanded={showTablePicker}
                            >
                                <span className="toolbar-button-icon"><TableRegular /></span>
                                <span className="toolbar-button-icon dropdown-chevron"><ChevronDownRegular /></span>
                            </button>
                            {showTablePicker && (
                                <div className={`toolbar-dropdown table-dropdown ${effectiveTheme}`}>
                                    <div className="dropdown-section-header">Insert New Table</div>
                                    <div className="table-size-picker">
                                        <div className="table-grid">
                                            {Array.from({ length: 6 }).map((_, rowIndex) => (
                                                <div key={rowIndex} className="table-grid-row">
                                                    {Array.from({ length: 6 }).map((_, colIndex) => (
                                                        <div
                                                            key={colIndex}
                                                            className={`table-grid-cell ${
                                                                rowIndex <= hoveredCell.row && colIndex <= hoveredCell.col
                                                                    ? 'highlighted'
                                                                    : ''
                                                            }`}
                                                            onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                                                            onClick={() => insertTableWithSize(rowIndex + 1, colIndex + 1)}
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="table-size-label">
                                            {Math.max(2, hoveredCell.row + 1)} × {hoveredCell.col + 1} (min 2 rows)
                                        </div>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <div className="dropdown-section-header">Edit Existing Table</div>
                                    <button className="dropdown-item" onClick={addTableRow}>
                                        <span className="dropdown-icon"><AddRegular /></span>
                                        <span>Add Row Below</span>
                                    </button>
                                    <button className="dropdown-item" onClick={addTableColumn}>
                                        <span className="dropdown-icon"><AddRegular /></span>
                                        <span>Add Column Right</span>
                                    </button>
                                    <button className="dropdown-item" onClick={deleteTableRow}>
                                        <span className="dropdown-icon"><SubtractRegular /></span>
                                        <span>Delete Row</span>
                                    </button>
                                    <button className="dropdown-item" onClick={deleteTableColumn}>
                                        <span className="dropdown-icon"><SubtractRegular /></span>
                                        <span>Delete Column</span>
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button className="dropdown-item dropdown-item-danger" onClick={deleteTable}>
                                        <span className="dropdown-icon"><DeleteRegular /></span>
                                        <span>Delete Entire Table</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            className="toolbar-button"
                            onClick={insertBlockquote}
                            title="Blockquote"
                            aria-label="Insert Blockquote"
                        >
                            <span className="toolbar-button-icon"><TextQuoteRegular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={insertHorizontalRule}
                            title="Horizontal Rule"
                            aria-label="Insert Horizontal Rule"
                        >
                            <span className="toolbar-button-icon"><LineHorizontal1Regular /></span>
                        </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Actions Group */}
                    <div className="toolbar-group" aria-label="Actions">
                        <button
                            className={`toolbar-button ${copyStatus === 'copied' ? 'copy-success' : ''}`}
                            onClick={copyToClipboard}
                            title="Copy to Clipboard"
                            aria-label="Copy markdown to clipboard"
                        >
                            <span className="toolbar-button-icon">
                                {copyStatus === 'copied' ? <CheckmarkRegular /> : <CopyRegular />}
                            </span>
                        </button>
                        <button
                            className={`toolbar-button ${showFindReplace ? 'active' : ''}`}
                            onClick={toggleFindReplace}
                            title="Find & Replace (Ctrl+F)"
                            aria-label="Find and Replace"
                        >
                            <span className="toolbar-button-icon"><SearchRegular /></span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={exportToHtml}
                            title="Export to HTML"
                            aria-label="Export to HTML"
                        >
                            <span className="toolbar-button-icon"><ArrowDownloadRegular /></span>
                            <span className="toolbar-button-label">HTML</span>
                        </button>
                        <button
                            className="toolbar-button"
                            onClick={exportToPdf}
                            title="Export to PDF"
                            aria-label="Export to PDF"
                        >
                            <span className="toolbar-button-icon"><DocumentPdfRegular /></span>
                            <span className="toolbar-button-label">PDF</span>
                        </button>
                    </div>

                    <div className="toolbar-divider" />

                    {/* Templates Dropdown */}
                    <div className="toolbar-dropdown-container">
                        <button
                            className={`toolbar-button toolbar-dropdown-trigger ${showTemplates ? 'active' : ''}`}
                            onClick={() => setShowTemplates(!showTemplates)}
                            title="Insert Template"
                            aria-label="Insert Template"
                            aria-expanded={showTemplates}
                        >
                            <span className="toolbar-button-icon"><DocumentRegular /></span>
                            <span className="toolbar-button-label">Templates</span>
                            <span className="toolbar-button-icon dropdown-chevron"><ChevronDownRegular /></span>
                        </button>
                        {showTemplates && (
                            <div className={`toolbar-dropdown templates-dropdown ${effectiveTheme}`}>
                                {/* Group templates by category */}
                                {Array.from(new Set(MARKDOWN_TEMPLATES.map(t => t.category))).map((category, catIndex) => (
                                    <div key={category} className="dropdown-category">
                                        {catIndex > 0 && <div className="dropdown-divider" />}
                                        <div className="dropdown-section-header">{category}</div>
                                        {MARKDOWN_TEMPLATES
                                            .filter(t => t.category === category)
                                            .map((template, index) => (
                                                <button
                                                    key={`${category}-${index}`}
                                                    className="dropdown-item"
                                                    onClick={() => insertTemplate(template)}
                                                >
                                                    {template.name}
                                                </button>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="toolbar-divider" />

                    {/* Theme Toggle */}
                    <button
                        className="toolbar-button"
                        onClick={toggleTheme}
                        title={effectiveTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label={effectiveTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        <span className="toolbar-button-icon">
                            {effectiveTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </span>
                    </button>
                </div>
            )}

            {/* Find & Replace Panel */}
            {showFindReplace && (
                <div className={`find-replace-panel ${effectiveTheme}`}>
                    <div className="find-replace-row">
                        <div className="find-input-wrapper">
                            <span className="find-input-icon"><SearchRegular /></span>
                            <input
                                ref={findInputRef}
                                type="text"
                                placeholder="Find..."
                                value={findText}
                                onChange={(e) => setFindText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (e.shiftKey) {
                                            findPrevious();
                                        } else {
                                            findNext();
                                        }
                                    }
                                }}
                                className="find-input with-icon"
                            />
                        </div>
                        <button
                            className="find-nav-button"
                            onClick={findPrevious}
                            disabled={findResults.count === 0}
                            title="Previous match (Shift+Enter)"
                        >
                            <ChevronUpRegular />
                        </button>
                        <button
                            className="find-nav-button"
                            onClick={findNext}
                            disabled={findResults.count === 0}
                            title="Next match (Enter)"
                        >
                            <ChevronDownRegular />
                        </button>
                        <span className="find-results">
                            {findResults.count > 0 ? `${findResults.current} of ${findResults.count}` : 'No results'}
                        </span>
                    </div>
                    <div className="find-replace-row">
                        <input
                            type="text"
                            placeholder="Replace with..."
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            className="find-input"
                        />
                        <button className="find-button" onClick={handleReplace} disabled={findResults.count === 0}>
                            Replace
                        </button>
                        <button className="find-button find-button-secondary" onClick={handleReplaceAll} disabled={findResults.count === 0}>
                            Replace All
                        </button>
                    </div>
                    <button className="find-close" onClick={() => { setShowFindReplace(false); clearSearchHighlights(); }}>
                        <DismissRegular />
                    </button>
                </div>
            )}

            <div className="markdown-editor-wrapper">
                {editorError ? (
                    <div className="markdown-editor-error">
                        <h3>Editor Error</h3>
                        <p>{editorError}</p>
                        <p>Check the browser console for more details.</p>
                    </div>
                ) : (
                    <>
                        {loading && (
                            <div className="markdown-editor-loading" style={{ position: 'absolute', zIndex: 10, background: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '4px' }}>
                                <p>Loading Milkdown editor...</p>
                                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
                                    Initializing... Check console if this persists.
                                </p>
                            </div>
                        )}
                        <Milkdown />
                    </>
                )}
            </div>

            <div className={`markdown-status-bar ${effectiveTheme}`}>
                <div className="status-item save-status-container">
                    {saveStatus === 'saved' && (
                        <>
                            <span className="status-icon status-icon-saved"><CheckmarkCircleRegular /></span>
                            <span className="save-status save-status-saved">Saved</span>
                        </>
                    )}
                    {saveStatus === 'saving' && (
                        <>
                            <span className="status-icon status-icon-saving spinning"><ArrowSyncRegular /></span>
                            <span className="save-status save-status-saving">Saving...</span>
                        </>
                    )}
                    {saveStatus === 'unsaved' && (
                        <>
                            <span className="status-icon status-icon-unsaved"><CircleRegular /></span>
                            <span className="save-status save-status-unsaved">Unsaved</span>
                        </>
                    )}
                </div>
                <div className="status-item">
                    <span id="md-word-count" className="status-metric">Words: {wordCountRef.current}</span>
                    <span className="status-separator">|</span>
                    <span id="md-char-count" className="status-metric">Characters: {charCountRef.current} / {maxLength}</span>
                </div>
                {readOnly && (
                    <div className="status-item status-readonly">
                        <span>Read Only</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Memoized wrapper to prevent unnecessary re-renders when parent re-renders with same props
export const MarkdownEditor: React.FC<MarkdownEditorProps> = React.memo((props) => {
    return (
        <MilkdownProvider>
            <EditorComponent
                initialValue={props.value}
                onUpdate={props.onChange}
                readOnly={props.readOnly}
                theme={props.theme}
                showToolbar={props.showToolbar}
                enableSpellCheck={props.enableSpellCheck}
                maxLength={props.maxLength}
                height={props.height}
                width={props.width}
            />
        </MilkdownProvider>
    );
}, (prev, next) => {
    // Custom comparison - only re-render when these props actually change
    return (
        prev.value === next.value &&
        prev.readOnly === next.readOnly &&
        prev.theme === next.theme &&
        prev.showToolbar === next.showToolbar &&
        prev.enableSpellCheck === next.enableSpellCheck &&
        prev.maxLength === next.maxLength &&
        prev.height === next.height &&
        prev.width === next.width
        // onChange is bound once in PCF constructor, always same reference
    );
});
