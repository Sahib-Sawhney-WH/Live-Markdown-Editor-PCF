/**
 * PDF Export Utilities
 * Lazy-loaded to reduce initial bundle size
 */

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

/**
 * Export markdown content to PDF with actual text (editable/selectable)
 * Uses jsPDF for text-based PDF generation
 */
export async function exportToPdfText(markdown: string, filename: string): Promise<void> {
    // Lazy load jsPDF
    const { default: jsPDF } = await import('jspdf');

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
}

/**
 * Export editor content to PDF as image (preserves exact visual appearance)
 * Uses html2canvas and jsPDF
 */
export async function exportToPdfImage(editorElement: HTMLElement, filename: string): Promise<void> {
    // Lazy load both libraries in parallel
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
    ]);

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
}

/**
 * Main export function - prompts user for options and calls appropriate export
 */
export async function exportToPdf(
    markdown: string,
    editorElement: HTMLElement | null,
    defaultFilename = 'document'
): Promise<void> {
    // Ask for filename
    const filename = window.prompt('Enter filename for PDF:', defaultFilename);
    if (filename === null) return; // User cancelled

    const safeFilename = (filename.trim() || 'document').replace(/[<>:"/\\|?*]/g, '_');

    // Ask user which type of PDF they want
    const choice = window.confirm(
        'PDF Export Options:\n\n' +
        'Click OK for EDITABLE PDF (selectable/searchable text, smaller file)\n\n' +
        'Click Cancel for IMAGE PDF (exact visual appearance, includes images)'
    );

    if (choice) {
        await exportToPdfText(markdown, safeFilename);
    } else if (editorElement) {
        await exportToPdfImage(editorElement, safeFilename);
    }
}
