# Deployment Guide

This guide explains how to deploy the Markdown Editor PCF Control to your Power Platform environment.

## Prerequisites

- Power Platform environment with Dataverse
- Power Apps CLI installed (`pac`)
- Administrator or System Customizer role
- Control built successfully (`npm run build`)

## Deployment Methods

### Method 1: Power Apps CLI (Recommended)

The fastest way to deploy for testing:

```bash
# Navigate to the control directory
cd markdown_editor

# Build the control (IMPORTANT: use production mode!)
npm run build -- --buildMode production

# Push to your environment
pac pcf push --publisher-prefix dev
```

**Pros:**
- Fast deployment
- Good for testing and development
- No solution required

**Cons:**
- Not suitable for production
- Harder to manage updates
- Not transportable between environments

### Method 2: Solution Package (Production)

Recommended for production deployments:

#### Step 1: Create Solution

```bash
# Create a new solution folder
mkdir ../MarkdownEditorSolution
cd ../MarkdownEditorSolution

# Initialize solution
pac solution init --publisher-name "Your Organization" --publisher-prefix "yourprefix"

# Add the control reference
pac solution add-reference --path ../markdown_editor
```

#### Step 2: Build Solution

```bash
# Build the solution
msbuild /t:build /restore

# This creates a .zip file in bin/Debug or bin/Release
```

#### Step 3: Import to Environment

1. Open https://make.powerapps.com
2. Select your target environment
3. Go to **Solutions**
4. Click **Import solution**
5. Browse to the .zip file
6. Click **Next** and **Import**

**Pros:**
- Production-ready
- Version control
- Transportable between environments
- Supports ALM (Application Lifecycle Management)

**Cons:**
- More setup required
- Slower deployment process

### Method 3: Manual Import

For one-time deployments or testing:

1. Build the control: `npm run build`
2. Navigate to Power Apps maker portal
3. Solutions → New solution
4. Add existing → Control → Upload files from `out/controls/MarkdownEditorControl`

## Post-Deployment Steps

### 1. Verify Installation

1. Open Power Apps maker portal
2. Go to **Apps** → **All**
3. Create or edit a model-driven app
4. Add a form with a text field
5. Change the field control to "Markdown Editor"
6. If you see it in the list, installation succeeded!

### 2. Create Test Table

Create a simple table to test the control:

1. **Create table:** "Test Documents"
2. **Add column:**
   - Name: "Content"
   - Type: Text
   - Max length: 100,000
3. **Create form** and add the "Content" field
4. **Change control** to "Markdown Editor"
5. **Save and publish**

### 3. Test Functionality

1. Create a new record
2. Type markdown in the editor
3. Use toolbar buttons
4. Save the record
5. Refresh and verify content persists
6. Test dynamic height by resizing the form

## Updating the Control

### For pac pcf push deployments:

```bash
# Make your changes
# Rebuild (always use production mode!)
npm run build -- --buildMode production

# Push update
pac pcf push --publisher-prefix dev
```

Forms using the control will automatically use the new version after refresh.

### For solution deployments:

1. Increment version in `ControlManifest.Input.xml`
2. Rebuild solution
3. Import as upgrade in target environment
4. Apply the upgrade

## Troubleshooting Deployment

### "Control not found" error

**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+F5)
- Verify control shows in the controls list
- Check solution imported successfully

### "Unable to load control" error

**Solution:**
- Verify build succeeded without errors
- Check bundle.js is present in out/controls
- Review browser console for errors
- Ensure all dependencies are bundled

### Control appears but doesn't work

**Solution:**
- Check field is bound correctly
- Verify field type is "Text" with sufficient max length
- Review browser console for JavaScript errors
- Test with a new record (not existing data)

### Changes don't appear after update

**Solution:**
- Increment version number in manifest
- Clear browser cache completely
- Close and reopen the form editor
- For solutions: apply as upgrade, not just import

## Environment Considerations

### Development Environment

- Use `pac pcf push` for fast iteration
- Enable debugging in browser
- Test with sample data
- Keep test tables separate

### Test/QA Environment

- Use solution packages
- Test with production-like data
- Verify all features work
- Performance testing with large markdown

### Production Environment

- Always use solution packages
- Test in pre-prod first
- Schedule deployment window
- Have rollback plan ready
- Monitor for errors after deployment

## Security Considerations

- Review Dataverse security roles
- Test with different user permissions
- Consider field-level security
- Enable auditing on markdown fields
- Review data classification

## Performance Tips

1. **Bundle size:** Production build is ~1.5 MiB, solution zip is ~477KB
2. **IMPORTANT:** Always use `--buildMode production` for deployments (dev builds are ~7 MiB!)
3. **Lazy loading:** Control only loads when form opens
4. **Caching:** Browser caches the bundle after first load
5. **Zero-lag typing:** v1.5.9+ defers all processing until typing stops

## Rollback Procedure

If deployment causes issues:

### For pac pcf push:
1. Revert code changes
2. Rebuild: `npm run build`
3. Push again: `pac pcf push --publisher-prefix dev`

### For solutions:
1. Delete the solution from environment
2. Import previous version
3. Or restore from backup

## Next Steps After Deployment

1. Train users on markdown syntax
2. Create documentation/help articles
3. Set up markdown templates
4. Monitor usage and feedback
5. Plan feature enhancements

## Support

For deployment issues:
- Check Power Platform admin center for errors
- Review solution import logs
- Enable PCF debug mode in settings
- Check browser console (F12)

---

**Deployment Checklist:**

- [ ] Control builds successfully
- [ ] Tests pass in local harness
- [ ] Solution created and built
- [ ] Imported to dev environment
- [ ] Tested with real data
- [ ] Deployed to test environment
- [ ] UAT completed
- [ ] Deployed to production
- [ ] Users notified and trained
- [ ] Monitoring in place
