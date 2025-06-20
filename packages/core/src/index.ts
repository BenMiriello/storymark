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

export interface ParsedStory {
  metadata: StoryMetadata;
  content: string;
  sections: StorySection[];
  errors: ParseError[];
}

import { parse as parseYAML } from 'yaml';

export function parseStory(content: string): ParsedStory {
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
      message: 'Invalid story format: missing frontmatter'
    });
    return { metadata: {} as StoryMetadata, content: '', sections: [], errors };
  }
  
  const [, frontmatterText, contentText] = frontmatterMatch;

  // Parse YAML frontmatter
  let metadata: StoryMetadata;
  try {
    metadata = parseYAML(frontmatterText) as StoryMetadata;
  } catch (error) {
    errors.push({
      type: 'parsing',
      message: `YAML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return { metadata: {} as StoryMetadata, content: '', sections: [], errors };
  }

  // Validate required fields
  if (!metadata.id) {
    errors.push({
      type: 'validation',
      message: 'Missing required field: id'
    });
  }

  // Split content into sections
  const sectionTexts = contentText.split(/\n---\n/).filter(section => section.trim());

  const sections: StorySection[] = sectionTexts.map(sectionText => {
    const directives: StoryDirective[] = [];

    // Parse all @directive patterns generically
    const directiveMatches = sectionText.matchAll(/@(\w+):\s*([^\r\n]+)/g);
    for (const match of directiveMatches) {
      const type = match[1];
      const fullValue = match[2].trim();
      const raw = match[0];
      
      // Special handling for image directives with quoted captions
      if (type === 'image') {
        const imageMatch = fullValue.match(/^([^\s]+)(?:\s+"([^"]*)")?$/);
        if (imageMatch) {
          directives.push({
            type: 'image',
            value: imageMatch[1],
            params: imageMatch[2] ? [imageMatch[2]] : undefined,
            raw
          });
        }
      } else {
        // Generic directive parsing
        const parts = fullValue.split(/\s+/);
        directives.push({
          type,
          value: parts[0],
          params: parts.length > 1 ? parts.slice(1) : undefined,
          raw
        });
      }
    }

    // Remove all directive lines from text
    const cleanText = sectionText
      .replace(/@\w+:.*$/gm, '')
      .trim();

    return {
      text: cleanText,
      directives
    };
  });

  // Clean content by removing section separators
  const cleanContent = contentText.replace(/\n---\n/g, '\n\n').trim();

  return {
    metadata,
    content: cleanContent,
    sections,
    errors
  };
}
