// Editor-specific utilities for content analysis and page targeting

/**
 * Determines which page content is being added to during editing
 * @param content - The full story content
 * @param allowBlankPages - Whether to allow '---\n---' to create blank pages
 * @returns 0-based page index where content is being added
 */
export function findTargetPageForEdit(
  content: string,
  allowBlankPages: boolean = true
): number {
  // Use the same parsing logic as the actual parser
  const frontmatterMatch =
    content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ||
    content.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) return 0;

  let contentText = frontmatterMatch[2];

  // Handle trailing --- for blank pages (same as parser logic)
  if (allowBlankPages && /\n---\s*$/.test(contentText)) {
    contentText += '\n';
  }

  const sections = contentText.split(/\n---\n/).filter(section => {
    // Keep non-empty sections always
    if (section.trim()) return true;

    // Keep all empty sections when blank pages are allowed
    return allowBlankPages;
  });

  if (sections.length <= 1) return 0; // Only first section

  // For new content with more sections than currently parsed, target the new last page
  const result = Math.max(0, sections.length - 1);
  console.log('🎯 TARGET:', {
    sections: sections.length,
    targetPage: result,
    contentEnd: contentText.slice(-15),
  });
  return result;
}

/**
 * Detects if the user just typed '---' to create a new section
 * @param oldContent - Content before the change
 * @param newContent - Content after the change
 * @returns true if a new section separator was just added
 */
export function detectSectionSeparatorAdded(
  oldContent: string,
  newContent: string
): boolean {
  // Use the same parsing logic as the actual parser
  const getValidSeparators = (content: string) => {
    const frontmatterMatch =
      content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ||
      content.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontmatterMatch) return 0;

    const contentText = frontmatterMatch[2];
    return (contentText.match(/\n---\n/g) || []).length;
  };

  const oldSeparators = getValidSeparators(oldContent);
  const newSeparators = getValidSeparators(newContent);

  return newSeparators > oldSeparators;
}

/**
 * Detects if the user is likely at the end of a section separator line
 * @param content - Full story content
 * @param cursorPosition - Current cursor position in the content
 * @returns true if cursor is at end of a '---' line
 */
export function isCursorAtSectionSeparator(
  content: string,
  cursorPosition: number
): boolean {
  const lines = content.slice(0, cursorPosition).split('\n');
  const currentLine = lines[lines.length - 1];
  return currentLine.trim() === '---';
}
