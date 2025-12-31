# Quick Start Guide

Get the Markdown Editor PCF Control up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Power Apps CLI (`pac`) installed
- Power Platform environment access

## Installation

```bash
# 1. Clone or download the repository
git clone https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF.git

# 2. Navigate to the project
cd markdown_editor

# 3. Install dependencies
npm install

# 4. Build the control (use production mode for deployment)
npm run build -- --buildMode production
```

## Local Development

```bash
# Start the test harness with hot reload
npm start watch

# Open browser to:
# http://localhost:8181
```

The test harness allows you to:
- Test the editor with sample markdown
- Adjust height/width with sliders
- Toggle control properties (theme, toolbar, etc.)
- See changes instantly with hot reload

## Deploy to Power Apps

### Option 1: Using Power Apps CLI

```bash
# From the markdown_editor directory
pac pcf push --publisher-prefix dev
```

### Option 2: Via Solution

1. Create a solution in Power Platform
2. Add the control:
   ```bash
   pac solution init --publisher-name YourOrg --publisher-prefix yourprefix
   pac solution add-reference --path .
   ```
3. Build and import the solution

## Add to a Form

1. Open Power Apps maker portal
2. Navigate to your table
3. Edit the form
4. Add a "Multiple Lines of Text" field
5. Click the field, then select "Change control"
6. Select "Markdown Editor"
7. Configure properties in right panel
8. Save and publish

## First Steps

### Create Your First Markdown Field

1. **Create a text column:**
   - Name: "Description" (or your choice)
   - Type: Text
   - Format: Text Area
   - Max length: 10,000+

2. **Bind the control:**
   - Add field to form
   - Change control to "Markdown Editor"
   - Set max length to match column

3. **Test editing:**
   - Create a new record
   - Type some markdown
   - Save the record
   - Verify it persists

## Common Configurations

### Documentation System
```
Theme: Light
Show Toolbar: Yes
Spell Check: Yes
Max Length: 100,000
Read Only: No
```

### Read-Only Display
```
Theme: Auto
Show Toolbar: No
Read Only: Yes
```

### Note-Taking
```
Theme: Auto
Show Toolbar: Yes
Spell Check: Yes
Max Length: 50,000
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+F | Find & Replace |

## Features at a Glance

- **Formatting**: Bold, italic, strikethrough, headings
- **Lists**: Bulleted, numbered, task lists
- **Tables**: Insert and delete tables
- **Links**: Insert with custom display text
- **Images**: Paste from clipboard (Ctrl+V)
- **Export**: HTML and PDF (text or image)
- **Templates**: 20+ pre-built templates
- **Find & Replace**: Search and replace text

## Troubleshooting

### "Control not found"
- Rebuild: `npm run build`
- Clear browser cache
- Verify solution imported correctly

### "Height not working"
- Check form container has defined height
- Try adjusting in test harness first
- Review browser console for errors

### "Markdown not rendering"
- Check browser console
- Verify Milkdown loaded (check network tab)
- Try simple markdown first (# Heading)

### "Slow typing"
- v1.5.9+ has zero-lag typing (all processing deferred until typing stops)
- If still slow, check browser extensions or try incognito mode

## Next Steps

1. **Connect to Dataverse** - See [DATAVERSE_INTEGRATION.md](../DATAVERSE_INTEGRATION.md)
2. **Deploy to production** - See [DEPLOYMENT.md](DEPLOYMENT.md)
3. **Customize themes** - Modify CSS in `MarkdownEditor.css`
4. **Review changelog** - See [CHANGELOG.md](CHANGELOG.md)

## Learn More

- **Full Documentation:** [README.md](../README.md)
- **Dataverse Integration:** [DATAVERSE_INTEGRATION.md](../DATAVERSE_INTEGRATION.md)
- **Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Change Log:** [CHANGELOG.md](CHANGELOG.md)

## Getting Help

- Check existing documentation files
- Review browser console for errors
- Test in the local harness first
- Open an issue on [GitHub](https://github.com/Sahib-Sawhney-WH/Live-Markdown-Editor-PCF/issues)

---

**You're all set!** Start editing markdown in your Power Apps forms.

Version: 1.6.0
