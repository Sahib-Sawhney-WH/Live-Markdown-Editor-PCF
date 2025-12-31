/**
 * Markdown Templates
 * Organized by category for the template picker dropdown
 */

export interface MarkdownTemplate {
    name: string;
    category: string;
    content: string;
}

// Helper to get current date in localized format
const getCurrentDate = () => new Date().toLocaleDateString();
const getCurrentDateISO = () => new Date().toISOString().split('T')[0];

export const MARKDOWN_TEMPLATES: MarkdownTemplate[] = [
    // Meeting & Collaboration
    {
        name: 'Meeting Notes',
        category: 'Meetings',
        content: `# Meeting Notes

**Date:** ${getCurrentDate()}
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

**Week of:** ${getCurrentDate()}
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

**Date:** ${getCurrentDate()}
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
**Date:** ${getCurrentDate()}
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
**Date:** ${getCurrentDate()}
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
**Date:** ${getCurrentDate()}
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
**Date:** ${getCurrentDate()}

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
**Release Date:** ${getCurrentDate()}
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
**Date:** ${getCurrentDate()}
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
**Last Updated:** ${getCurrentDate()}

---

## Decision Record Template

### DEC-001: [Decision Title]
**Date:** ${getCurrentDate()}
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
**Last Updated:** ${getCurrentDate()}

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
**Last Updated:** ${getCurrentDate()}

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

## [1.0.0] - ${getCurrentDateISO()}

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
**Last Updated:** ${getCurrentDate()}
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
| 1.0 | ${getCurrentDateISO()} |  | Initial version |

`
    },
    {
        name: 'Runbook / Playbook',
        category: 'Process',
        content: `# Runbook: [Service/System Name]

**Last Updated:** ${getCurrentDate()}
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

**Date:** ${getCurrentDate()}

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

**Date:** ${getCurrentDate()}

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

/**
 * Get unique template categories
 */
export const getTemplateCategories = (): string[] => {
    return [...new Set(MARKDOWN_TEMPLATES.map(t => t.category))];
};
