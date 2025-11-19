const fs = require('fs');
const path = require('path');

// Read the markdown file
const mdPath = path.join(__dirname, 'AB100_Study_Guide.md');
const markdown = fs.readFileSync(mdPath, 'utf8');

// Escape backticks and dollar signs for template literal
const escaped = markdown.replace(/`/g, '\\`').replace(/\$/g, '\\$');

// Create TypeScript module content
const tsContent = `// TEMPORARY: Test markdown content for demonstration
// This file contains the full AB100 Study Guide for testing the Milkdown editor
export const TEST_MARKDOWN = \`${escaped}\`;
`;

// Write to testMarkdown.ts
const outputPath = path.join(__dirname, 'MarkdownEditorControl', 'testMarkdown.ts');
fs.writeFileSync(outputPath, tsContent, 'utf8');

console.log(`✓ Copied ${markdown.length} characters to testMarkdown.ts`);
