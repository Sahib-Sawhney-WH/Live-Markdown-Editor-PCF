# Quick Start Guide

Get the Markdown Editor PCF Control up and running in 5 minutes.

## Prerequisites

- Node.js 14+ installed
- Power Apps CLI (`pac`) installed
- Power Platform environment access

## Installation

```bash
# 1. Navigate to the project
cd markdown_editor

# 2. Install dependencies
npm install

# 3. Build the control
npm run build
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
5. Click the field → "Change control"
6. Select "Markdown Editor"
7. Configure properties in right panel
8. Save and publish

## First Steps

### Test with Sample Data

The control comes with built-in test markdown showing all features:
- Headings and text formatting
- Lists and task lists
- Tables
- Links and images
- Code blocks

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
- Theme: Light
- Show Toolbar: Yes
- Spell Check: Yes
- Max Length: 100,000
- Read Only: No
```

### Read-Only Display
```
- Theme: Auto
- Show Toolbar: No
- Read Only: Yes
```

### Note-Taking
```
- Theme: Auto
- Show Toolbar: Yes
- Spell Check: Yes
- Max Length: 50,000
```

## Keyboard Shortcuts

- **Bold:** Ctrl+B
- **Italic:** Ctrl+I
- **Undo:** Ctrl+Z
- **Redo:** Ctrl+Y
- Use toolbar buttons for other formatting

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

## Next Steps

1. **Connect to Dataverse** - See [DATAVERSE_INTEGRATION.md](DATAVERSE_INTEGRATION.md)
2. **Customize themes** - Modify CSS in `MarkdownEditor.css`
3. **Add validation** - Implement markdownlint integration
4. **Deploy to production** - Test thoroughly in dev first

## Learn More

- **Full Documentation:** [README.md](README.md)
- **Dataverse Integration:** [DATAVERSE_INTEGRATION.md](DATAVERSE_INTEGRATION.md)
- **Change Log:** [CHANGELOG.md](CHANGELOG.md)
- **Development History:** [CLAUDE.md](../CLAUDE.md)

## Getting Help

- Check existing documentation files
- Review browser console for errors
- Test in the local harness first
- Open an issue on GitHub

---

**You're all set!** Start editing markdown in your Power Apps forms.
