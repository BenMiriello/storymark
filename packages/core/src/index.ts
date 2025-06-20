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
  src?: string;
  caption?: string;
  [key: string]: any;
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

    // Parse @image directives
    const imageMatches = sectionText.matchAll(/@image:\s*([^\s]+)(?:\s+"([^"]*)")?/g);
    for (const match of imageMatches) {
      directives.push({
        type: 'image',
        src: match[1],
        caption: match[2] || ''
      });
    }

    // Remove directive lines from text
    const cleanText = sectionText.replace(/@image:.*$/gm, '').trim();

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