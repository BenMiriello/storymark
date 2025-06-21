export interface StoryMetadata {
  id: string;
  title: string;
  category: string;
  template: string;
  duration?: string;
  [key: string]: any;
}

export interface StoryDirective {
  type: string;
  value: string;
  params?: string[];
  raw: string;
  resolvedPath?: string;
  pathType?: 'relative' | 'absolute' | 'url' | 'history';
  originalPath?: string;
}

export interface StorySection {
  text: string;
  directives: StoryDirective[];
}

export interface ParseError {
  type: 'validation' | 'parsing';
  message: string;
  line?: number;
}

export interface ParseOptions {
  storyFilePath?: string;
  baseDir?: string;
}

export interface ParsedStory {
  metadata: StoryMetadata;
  content: string;
  sections: StorySection[];
  errors: ParseError[];
}

import { parse as parseYAML } from 'yaml';
import { resolve, dirname, isAbsolute } from 'path';

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
    metadata = parseYAML(frontmatterText) as StoryMetadata;
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

  // Split content into sections
  const sectionTexts = contentText
    .split(/\n---\n/)
    .filter(section => section.trim());

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
