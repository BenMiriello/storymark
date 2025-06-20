export interface StoryMetadata {
  id: string;
  title: string;
  category: string;
  template: string;
  duration?: string;
  [key: string]: any;
}

export interface StoryDirective {
  type: 'image' | 'template' | 'justify' | 'delay' | 'fade';
  // Image directive props
  src?: string;
  caption?: string;
  // Template directive props
  template?: string;
  // Justify directive props
  alignment?: 'left' | 'center' | 'right' | 'justify';
  // Delay directive props
  duration?: number; // in milliseconds
  unit?: 's' | 'ms';
  // Fade directive props
  effect?: 'in' | 'out' | 'slow' | 'fast';
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
    
    // Parse @template directives
    const templateMatches = sectionText.matchAll(/@template:\s*(\w+)/g);
    for (const match of templateMatches) {
      directives.push({
        type: 'template',
        template: match[1]
      });
    }
    
    // Parse @justify directives
    const justifyMatches = sectionText.matchAll(/@justify:\s*(left|center|right|justify)/g);
    for (const match of justifyMatches) {
      directives.push({
        type: 'justify',
        alignment: match[1] as 'left' | 'center' | 'right' | 'justify'
      });
    }
    
    // Parse @delay directives
    const delayMatches = sectionText.matchAll(/@delay:\s*(\d+(?:\.\d+)?)(s|ms)?/g);
    for (const match of delayMatches) {
      const value = parseFloat(match[1]);
      const unit = (match[2] || 's') as 's' | 'ms';
      directives.push({
        type: 'delay',
        duration: unit === 'ms' ? value : value * 1000, // Convert to milliseconds
        unit
      });
    }
    
    // Parse @fade directives
    const fadeMatches = sectionText.matchAll(/@fade:\s*(in|out|slow|fast)/g);
    for (const match of fadeMatches) {
      directives.push({
        type: 'fade',
        effect: match[1] as 'in' | 'out' | 'slow' | 'fast'
      });
    }

    // Remove directive lines from text
    const cleanText = sectionText
      .replace(/@image:.*$/gm, '')
      .replace(/@template:.*$/gm, '')
      .replace(/@justify:.*$/gm, '')
      .replace(/@delay:.*$/gm, '')
      .replace(/@fade:.*$/gm, '')
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