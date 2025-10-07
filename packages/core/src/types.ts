export interface StoryMetadata {
  id: string;
  title: string;
  categories?: string[];
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

export interface TemplatePropSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  default?: any;
  options?: any[];
  validator?: (_value: any) => boolean;
  required?: boolean;
  description?: string;
  min?: number;
  max?: number;
}

export interface TemplateSchema {
  name: string;
  props: TemplatePropSchema[];
  usesStoryContent: boolean;
  description?: string;
  category?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
