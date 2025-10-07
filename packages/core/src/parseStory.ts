import { parse as parseYAML } from 'yaml';
import { resolve, dirname, isAbsolute } from 'path';
import type {
  StoryMetadata,
  StoryDirective,
  StorySection,
  ParseError,
  ParseOptions,
  ParsedStory,
} from './types.js';

interface MediaPathResolution {
  resolvedPath: string;
  pathType: 'relative' | 'absolute' | 'url' | 'history';
}

function findPreviousMedia(
  completedSections: StorySection[],
  currentDirectives: StoryDirective[],
  historyDepth: number
): string | null {
  let mediaCount = 0;

  // First check current section's already processed directives (backwards)
  for (let dirIdx = currentDirectives.length - 1; dirIdx >= 0; dirIdx--) {
    const directive = currentDirectives[dirIdx];

    if (
      ['image', 'video', 'audio'].includes(directive.type) &&
      directive.pathType !== 'history'
    ) {
      if (mediaCount === historyDepth) {
        return directive.resolvedPath || directive.value;
      }
      mediaCount++;
    }
  }

  // Then look backwards through completed sections
  for (
    let sectionIdx = completedSections.length - 1;
    sectionIdx >= 0;
    sectionIdx--
  ) {
    const section = completedSections[sectionIdx];

    // Look backwards through directives in this section
    for (let dirIdx = section.directives.length - 1; dirIdx >= 0; dirIdx--) {
      const directive = section.directives[dirIdx];

      if (
        ['image', 'video', 'audio'].includes(directive.type) &&
        directive.pathType !== 'history'
      ) {
        if (mediaCount === historyDepth) {
          return directive.resolvedPath || directive.value;
        }
        mediaCount++;
      }
    }
  }

  return null;
}

function resolveMediaPath(
  originalPath: string,
  completedSections: StorySection[],
  currentDirectives: StoryDirective[],
  options: ParseOptions
): MediaPathResolution {
  // Handle history shorthand (., .., ...)
  if (/^\.+$/.test(originalPath)) {
    const historyDepth = originalPath.length - 1;
    const previousMediaPath = findPreviousMedia(
      completedSections,
      currentDirectives,
      historyDepth
    );

    if (previousMediaPath) {
      return {
        resolvedPath: previousMediaPath,
        pathType: 'history',
      };
    } else {
      // Return original if history index is out of bounds
      return {
        resolvedPath: originalPath,
        pathType: 'relative',
      };
    }
  }

  // Handle URLs
  if (originalPath.match(/^https?:\/\//)) {
    return {
      resolvedPath: originalPath,
      pathType: 'url',
    };
  }

  // Handle absolute paths
  if (isAbsolute(originalPath)) {
    return {
      resolvedPath: originalPath,
      pathType: 'absolute',
    };
  }

  // Handle home directory expansion
  if (originalPath.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return {
      resolvedPath: resolve(homeDir, originalPath.slice(2)),
      pathType: 'absolute',
    };
  }

  // Handle relative paths
  const baseDir = options.storyFilePath
    ? dirname(options.storyFilePath)
    : options.baseDir || process.cwd();

  return {
    resolvedPath: resolve(baseDir, originalPath),
    pathType: 'relative',
  };
}

export function parseStory(
  content: string,
  options: ParseOptions = {}
): ParsedStory {
  const errors: ParseError[] = [];

  // Split frontmatter from content - handle both formats (with and without opening ---)
  let frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    // Try format without opening ---
    frontmatterMatch = content.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);
  }

  if (!frontmatterMatch) {
    errors.push({
      type: 'parsing',
      message: 'Invalid story format: missing frontmatter',
    });
    return {
      metadata: {} as StoryMetadata,
      content: '',
      sections: [],
      errors,
    };
  }

  const [, frontmatterText, contentText] = frontmatterMatch;

  // Parse YAML frontmatter
  let metadata: StoryMetadata;
  try {
    const rawMetadata = parseYAML(frontmatterText) as any;

    // Handle categories field conversion
    if (rawMetadata.categories && typeof rawMetadata.categories === 'string') {
      // Convert comma-separated string to array
      rawMetadata.categories = rawMetadata.categories
        .split(',')
        .map((cat: string) => cat.trim())
        .filter((cat: string) => cat.length > 0);
    }

    // Handle legacy 'category' field -> 'categories' array conversion
    if (rawMetadata.category && !rawMetadata.categories) {
      if (typeof rawMetadata.category === 'string') {
        // Convert single category to array
        rawMetadata.categories = [rawMetadata.category.trim()];
      }
      // Keep the old field for backward compatibility
    }

    metadata = rawMetadata as StoryMetadata;
  } catch (error) {
    errors.push({
      type: 'parsing',
      message: `YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return {
      metadata: {} as StoryMetadata,
      content: '',
      sections: [],
      errors,
    };
  }

  // Validate required fields
  if (!metadata.id) {
    errors.push({
      type: 'validation',
      message: 'Missing required field: id',
    });
  }

  // Split content into sections, handling trailing --- for blank pages
  let processedContent = contentText;

  // If content ends with \n---, add a newline to create a blank page
  if (/\n---\s*$/.test(processedContent)) {
    processedContent += '\n';
  }

  const sectionTexts = processedContent.split(/\n---\n/).filter(section => {
    // Keep non-empty sections always
    if (section.trim()) return true;

    // Keep all empty sections for blank page support (not just the last one)
    return true;
  });

  const sections: StorySection[] = [];

  for (
    let sectionIndex = 0;
    sectionIndex < sectionTexts.length;
    sectionIndex++
  ) {
    const sectionText = sectionTexts[sectionIndex];
    const directives: StoryDirective[] = [];

    // Parse all @directive patterns generically
    const directiveMatches = sectionText.matchAll(/@(\w+):\s*([^\r\n]+)/g);
    for (const match of directiveMatches) {
      const type = match[1];
      const fullValue = match[2].trim();
      const raw = match[0];

      // Check if this is a media directive that needs path resolution
      const isMediaDirective = ['image', 'video', 'audio'].includes(type);

      if (isMediaDirective) {
        const mediaMatch = fullValue.match(/^([^\s]+)(?:\s+"([^"]*)")?$/);
        if (mediaMatch) {
          const originalPath = mediaMatch[1];
          const resolvedDirective = resolveMediaPath(
            originalPath,
            sections,
            directives,
            options
          );

          directives.push({
            type,
            value: originalPath,
            params: mediaMatch[2] ? [mediaMatch[2]] : undefined,
            raw,
            resolvedPath: resolvedDirective.resolvedPath,
            pathType: resolvedDirective.pathType,
            originalPath,
          });
        }
      } else if (type === 'template') {
        // Special handling for template directives with key=value props
        const templateMatch = fullValue.match(/^(\w+)(?:\s+(.+))?$/);
        if (templateMatch) {
          const templateName = templateMatch[1];
          const propsString = templateMatch[2];

          let params: string[] | undefined;
          if (propsString) {
            // Parse key=value pairs
            params = propsString.split(/\s+/).filter(Boolean);
          }

          directives.push({
            type,
            value: templateName,
            params,
            raw,
          });
        }
      } else {
        // Generic directive parsing
        const parts = fullValue.split(/\s+/);
        directives.push({
          type,
          value: parts[0],
          params: parts.length > 1 ? parts.slice(1) : undefined,
          raw,
        });
      }
    }

    // Remove all directive lines from text
    const cleanText = sectionText.replace(/@\w+:.*$/gm, '').trim();

    sections.push({
      text: cleanText,
      directives,
    });
  }

  // Clean content by removing section separators
  const cleanContent = contentText.replace(/\n---\n/g, '\n\n').trim();

  return {
    metadata,
    content: cleanContent,
    sections,
    errors,
  };
}

// Universal section detection utilities
export function detectSectionCreation(
  oldContent: string,
  newContent: string
): boolean {
  // Use the same parsing logic as the actual parser
  const getValidSections = (content: string) => {
    // Extract content after frontmatter, consistent with parser
    const frontmatterMatch =
      content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ||
      content.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);

    if (!frontmatterMatch) return [];

    let contentText = frontmatterMatch[2];

    // Handle trailing --- for blank pages (same as parser logic)
    if (/\n---\s*$/.test(contentText)) {
      contentText += '\n';
    }

    return contentText.split(/\n---\n/).filter(section => {
      // Keep non-empty sections always
      if (section.trim()) return true;

      // Keep all empty sections for blank page support
      return true;
    });
  };

  // Also detect if we've added significant structure (like new --- separators)
  // Count actual --- separators in content text (after frontmatter)
  const getContentText = (content: string) => {
    const match =
      content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ||
      content.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);
    return match ? match[2] : '';
  };

  const oldSections = getValidSections(oldContent);
  const newSections = getValidSections(newContent);
  const oldContentText = getContentText(oldContent);
  const newContentText = getContentText(newContent);
  const oldSeparators = (oldContentText.match(/\n---/g) || []).length;
  const newSeparators = (newContentText.match(/\n---/g) || []).length;

  // Focused debug logging
  const result =
    newSections.length > oldSections.length || newSeparators > oldSeparators;
  console.log('🔍 DETECT:', { old: oldSeparators, new: newSeparators, result });

  // Detect section creation by checking both count increase AND significant content changes
  return (
    newSections.length > oldSections.length || newSeparators > oldSeparators
  );
}

export function getLastNonEmptySection(content: string): number {
  // Use the same parsing logic as the actual parser
  const frontmatterMatch =
    content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ||
    content.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) return 0;

  let contentText = frontmatterMatch[2];

  // Handle trailing --- for blank pages (same as parser logic)
  if (/\n---\s*$/.test(contentText)) {
    contentText += '\n';
  }

  const sections = contentText.split(/\n---\n/).filter(section => {
    // Keep non-empty sections always
    if (section.trim()) return true;

    // Keep all empty sections for blank page support
    return true;
  });

  if (sections.length <= 1) return 0; // Only first section

  // Find the last non-empty section
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]?.trim();
    if (section && section.length > 0) {
      return i; // Return 0-based page index
    }
  }
  return 0;
}

export function getSectionCount(content: string): number {
  // Use the same parsing logic as the actual parser
  const frontmatterMatch =
    content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ||
    content.match(/^([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) return 1;

  let contentText = frontmatterMatch[2];

  // Handle trailing --- for blank pages (same as parser logic)
  if (/\n---\s*$/.test(contentText)) {
    contentText += '\n';
  }

  const sections = contentText.split(/\n---\n/).filter(section => {
    // Keep non-empty sections always
    if (section.trim()) return true;

    // Keep all empty sections for blank page support
    return true;
  });

  return Math.max(sections.length, 1); // Always at least 1 page
}
