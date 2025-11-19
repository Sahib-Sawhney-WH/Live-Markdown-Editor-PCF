# Dataverse Integration Guide

✅ **Integration Complete** - This control is already fully integrated with Dataverse!

This guide provides reference information for using the control with Dataverse tables and troubleshooting common issues.

## Current State

The control is **production ready** and connects directly to Dataverse:
- ✅ Loads markdown from bound Dataverse text fields
- ✅ Saves changes via two-way binding
- ✅ Syncs updates from external sources
- ✅ No test data - uses real field values

## How to Use with Dataverse

The control is already configured to work with Dataverse. Simply follow these steps:

### 1. Create Dataverse Table and Column

1. **Create or use an existing table** in your Dataverse environment

2. **Add a text column** with these settings:
   - **Display name:** Markdown Content (or your preferred name)
   - **Name:** new_markdowncontent (auto-generated)
   - **Data type:** Text
   - **Format:** Text Area
   - **Max length:** 100000 (or your preferred limit)
   - **Required:** Optional (or Required based on your needs)

### 2. Add Control to Form

1. Open the form editor for your table
2. Add the "Markdown Content" field to the form
3. Select the field and click "Change control"
4. Choose "Markdown Editor" from the list
5. Configure the control properties:
   - **Show Toolbar:** Yes/No
   - **Theme:** Light/Dark/Auto/High Contrast
   - **Enable Spell Check:** Yes/No
   - **Read Only:** Yes/No (can be bound to a formula)
   - **Max Length:** Match your column's max length

### 3. Test the Integration

1. Save and publish the form
2. Open a record in the form
3. Test editing markdown in the control
4. Save the record
5. Refresh or reopen the record
6. Verify the markdown persisted correctly

## Dataverse Column Recommendations

### Column Settings

**Minimum Configuration:**
- Data type: Text
- Max length: 10,000 characters (for short documents)

**Recommended Configuration:**
- Data type: Text
- Max length: 100,000 characters (for medium documents)
- Format: Text Area
- Enable auditing: Yes (to track changes)

**Maximum Configuration:**
- Data type: Text
- Max length: 1,048,576 characters (Dataverse maximum)
- Format: Text Area
- Enable auditing: Yes
- Enable change tracking: Yes

### Indexing

If you plan to search markdown content:
- Enable full-text indexing on the column (if available)
- Consider storing a plain-text version in a separate column for search

## Example Dataverse Schema

Here's a complete example table schema for a markdown document system:

```xml
Table: "Document"
├── Primary Column: "Title" (Text, 200)
├── "Markdown Content" (Text, 100000) <- Bind to Markdown Editor
├── "Plain Text Content" (Text, 100000) <- For search
├── "Word Count" (Whole Number) <- Bind to control output
├── "Character Count" (Whole Number) <- Bind to control output
├── "Last Modified" (Date/Time) <- Auto-populated
├── "Author" (Lookup to User)
└── "Category" (Choice: Documentation, Notes, Article, etc.)
```

## Advanced: Two-Way Binding

The control supports full two-way binding:

**From Dataverse to Control:**
- When record loads, markdown is displayed in editor
- When another user updates the record, changes appear (after refresh)

**From Control to Dataverse:**
- As user types, `onChange` fires
- Control updates internal state
- When form is saved, value is written to Dataverse

**Additional Outputs:**
- Word count
- Character count
- Validation status (is within max length)

## Troubleshooting

### Issue: Markdown doesn't persist

**Solution:**
- Verify the field is bound to a Dataverse column
- Check the column max length is sufficient
- Ensure the form has proper save permissions

### Issue: Long markdown gets truncated

**Solution:**
- Increase the column max length in Dataverse
- Update the control's `maxLength` property to match
- Dataverse maximum is 1,048,576 characters

### Issue: Special characters corrupted

**Solution:**
- Dataverse stores text as UTF-8
- Ensure no custom encoding/decoding in the control
- Check for any middleware that might modify the text

### Issue: Performance slow with large markdown

**Solution:**
- Consider pagination for very large documents
- Use `readOnly` mode for display-only scenarios
- Implement lazy loading for document lists

## Security Considerations

### XSS Prevention

The control uses DOMPurify to sanitize HTML output, but:
- Markdown can contain HTML tags
- Always sanitize user input on the server side
- Consider disabling raw HTML in markdown for untrusted users

### Data Access

- Use Dataverse security roles to control who can read/write
- Consider field-level security for sensitive markdown content
- Audit changes to track modifications

## Performance Tips

1. **Column Size:** Use appropriate max length (don't default to maximum)
2. **Indexing:** Don't index very large text columns
3. **Caching:** Dataverse caches data at the form level
4. **Lazy Loading:** Only load markdown when needed, not in grid views

## Next Steps

After integrating with Dataverse:
1. Test with real user data
2. Monitor performance with large documents
3. Gather user feedback on the editor experience
4. Consider adding version history
5. Implement markdown templates
6. Add export/import functionality (PDF, HTML, etc.)

---

**Note:** After making these changes, thoroughly test in a development environment before deploying to production.
